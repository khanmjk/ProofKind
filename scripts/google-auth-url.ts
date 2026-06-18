import { loadLocalEnv } from "@/lib/env/loadLocalEnv";
import {
  BLOGGER_READONLY_SCOPE,
  buildGoogleAuthUrl,
  getGoogleOAuthConfigFromEnv,
  GOOGLE_DRIVE_READONLY_SCOPE
} from "@/lib/connectors/google/oauth";

loadLocalEnv();

const scopes = [GOOGLE_DRIVE_READONLY_SCOPE, BLOGGER_READONLY_SCOPE];
const url = buildGoogleAuthUrl(getGoogleOAuthConfigFromEnv(), scopes);

console.log(url);
