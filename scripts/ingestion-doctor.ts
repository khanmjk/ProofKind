import { access } from "node:fs/promises";
import { DEFAULT_GOOGLE_TOKEN_PATH } from "@/lib/connectors/google/oauth";
import { loadLocalEnv } from "@/lib/env/loadLocalEnv";

loadLocalEnv();

function isSet(name: string) {
  return Boolean(process.env[name]?.trim());
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function status(label: string, ok: boolean, detail: string) {
  return `${ok ? "OK" : "MISSING"} ${label}: ${detail}`;
}

async function main() {
  const tokenPath = process.env.PROOFKIND_GOOGLE_TOKEN_PATH ?? DEFAULT_GOOGLE_TOKEN_PATH;
  const tokenPresent = await fileExists(tokenPath);
  const driveFolderId = process.env.PROOFKIND_DRIVE_FOLDER_ID;
  const bloggerUrl = process.env.PROOFKIND_BLOGGER_URL;

  console.log("ProofKind ingestion readiness");
  console.log(status("Firebase project", true, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "proofkind-mvp (default)"));
  console.log(status("Google OAuth client ID", isSet("GOOGLE_OAUTH_CLIENT_ID"), isSet("GOOGLE_OAUTH_CLIENT_ID") ? "set" : "not set"));
  console.log(status("Google OAuth client secret", isSet("GOOGLE_OAUTH_CLIENT_SECRET"), isSet("GOOGLE_OAUTH_CLIENT_SECRET") ? "set" : "not set"));
  console.log(status("Google token file", tokenPresent, tokenPresent ? tokenPath : `not found at ${tokenPath}`));
  console.log(status("Gemini API key", isSet("GEMINI_API_KEY"), isSet("GEMINI_API_KEY") ? "set" : "not set; synthesis will use fallback"));
  console.log(status("Approved Drive folder ID", Boolean(driveFolderId), driveFolderId ? "set" : "not set"));
  console.log(status("Approved Blogger URL", Boolean(bloggerUrl), bloggerUrl ? "set" : "not set"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
