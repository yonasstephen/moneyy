import fs from "fs";
import path from "path";

export interface AppSettings {
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  googleDriveFolderId: string;
  baseCurrency: string;
}

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export function loadSettings(): AppSettings {
  let fileSettings: Partial<AppSettings> = {};

  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    fileSettings = JSON.parse(raw);
  } catch {
    // File doesn't exist or is invalid — fall through to env vars
  }

  return {
    googleServiceAccountEmail:
      fileSettings.googleServiceAccountEmail ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      "",
    googleServiceAccountPrivateKey:
      fileSettings.googleServiceAccountPrivateKey ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      "",
    googleDriveFolderId:
      fileSettings.googleDriveFolderId ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      "",
    baseCurrency: fileSettings.baseCurrency || "GBP",
  };
}

export function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");

  // Clear auth cache so new credentials take effect
  // Dynamic import to avoid circular dependency at module level
  import("./google/auth").then(({ clearAuthCache }) => clearAuthCache());
}

export function maskPrivateKey(key: string): string {
  if (!key) return "";
  const last4 = key.slice(-4);
  return `****${last4}`;
}
