import { google } from "googleapis";
import { getAuth } from "./auth";

export interface SheetFile {
  id: string;
  name: string;
}

export async function listSpreadsheets(): Promise<SheetFile[]> {
  const { loadSettings } = await import("../settings");
  const settings = loadSettings();
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = settings.googleDriveFolderId;

  if (!folderId) {
    throw new Error(
      "Missing Google Drive folder ID. Configure it in Settings or .env.local"
    );
  }

  const files: SheetFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: "nextPageToken, files(id, name)",
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const f of res.data.files ?? []) {
      if (f.id && f.name) {
        files.push({ id: f.id, name: f.name });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}
