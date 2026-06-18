import {
  BLOGGER_READONLY_SCOPE,
  buildGoogleAuthUrl,
  getGoogleOAuthConfigFromEnv,
  GOOGLE_DRIVE_READONLY_SCOPE
} from "@/lib/connectors/google/oauth";

const scopes = [GOOGLE_DRIVE_READONLY_SCOPE, BLOGGER_READONLY_SCOPE];
const url = buildGoogleAuthUrl(getGoogleOAuthConfigFromEnv(), scopes);

console.log(url);
