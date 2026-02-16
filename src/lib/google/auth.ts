import { google } from "googleapis";
import { loadSettings } from "../settings";

let cachedAuth: InstanceType<typeof google.auth.JWT> | null = null;

export function clearAuthCache() {
  cachedAuth = null;
}

export function getAuth() {
  if (cachedAuth) return cachedAuth;

  const settings = loadSettings();
  const email = settings.googleServiceAccountEmail;
  const key = settings.googleServiceAccountPrivateKey?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Missing Google service account credentials. Configure them in Settings or .env.local"
    );
  }

  cachedAuth = new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });

  return cachedAuth;
}
