import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const GOOGLE_DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const BLOGGER_READONLY_SCOPE = "https://www.googleapis.com/auth/blogger.readonly";
export const DEFAULT_GOOGLE_REDIRECT_URI = "http://127.0.0.1:8787/oauth2callback";
export const DEFAULT_GOOGLE_TOKEN_PATH = ".proofkind/google-oauth-token.json";

export type GoogleTokenSet = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  expires_in?: number;
};

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenPath: string;
};

export function getGoogleOAuthConfigFromEnv(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET before using Google OAuth.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? DEFAULT_GOOGLE_REDIRECT_URI,
    tokenPath: process.env.PROOFKIND_GOOGLE_TOKEN_PATH ?? DEFAULT_GOOGLE_TOKEN_PATH
  };
}

export function buildGoogleAuthUrl(config: GoogleOAuthConfig, scopes: string[]) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function postTokenRequest(body: URLSearchParams): Promise<GoogleTokenSet> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`Google OAuth token request failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as GoogleTokenSet;
  const now = Date.now();

  return {
    ...payload,
    expiry_date: payload.expires_in ? now + payload.expires_in * 1000 : payload.expiry_date
  };
}

export async function exchangeGoogleAuthCode(config: GoogleOAuthConfig, code: string) {
  return postTokenRequest(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code
    })
  );
}

export async function refreshGoogleAccessToken(config: GoogleOAuthConfig, refreshToken: string) {
  return postTokenRequest(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  );
}

export async function readGoogleTokenFile(tokenPath = DEFAULT_GOOGLE_TOKEN_PATH): Promise<GoogleTokenSet | null> {
  try {
    return JSON.parse(await readFile(resolve(tokenPath), "utf8")) as GoogleTokenSet;
  } catch {
    return null;
  }
}

export async function writeGoogleTokenFile(token: GoogleTokenSet, tokenPath = DEFAULT_GOOGLE_TOKEN_PATH) {
  const absolutePath = resolve(tokenPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(token, null, 2)}\n`, { mode: 0o600 });
}

function accessTokenStillValid(token: GoogleTokenSet) {
  return Boolean(token.access_token && token.expiry_date && token.expiry_date > Date.now() + 60_000);
}

export async function getGoogleAccessToken(scopes: string[]) {
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) {
    return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  }

  const config = getGoogleOAuthConfigFromEnv();
  const tokenPath = config.tokenPath;
  const existing = await readGoogleTokenFile(tokenPath);
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? existing?.refresh_token;

  if (existing && accessTokenStillValid(existing)) {
    return existing.access_token as string;
  }

  if (!refreshToken) {
    throw new Error(
      `No Google refresh token found. Run npm run google:auth-url, approve scopes, then npm run google:exchange-code -- --code <code>. Required scopes: ${scopes.join(" ")}`
    );
  }

  const refreshed = await refreshGoogleAccessToken(config, refreshToken);
  const merged = {
    ...existing,
    ...refreshed,
    refresh_token: refreshToken,
    scope: refreshed.scope ?? existing?.scope
  };

  await writeGoogleTokenFile(merged, tokenPath);
  return merged.access_token as string;
}
