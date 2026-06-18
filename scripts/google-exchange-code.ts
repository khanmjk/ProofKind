import { loadLocalEnv } from "@/lib/env/loadLocalEnv";
import {
  exchangeGoogleAuthCode,
  getGoogleOAuthConfigFromEnv,
  writeGoogleTokenFile
} from "@/lib/connectors/google/oauth";

loadLocalEnv();

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const code = argValue("--code");

  if (!code) {
    throw new Error("Missing --code from Google OAuth callback URL.");
  }

  const config = getGoogleOAuthConfigFromEnv();
  const token = await exchangeGoogleAuthCode(config, code);
  await writeGoogleTokenFile(token, config.tokenPath);

  console.log(`Stored Google OAuth token at ${config.tokenPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
