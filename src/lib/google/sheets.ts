import { google } from "googleapis";
import { getAuth } from "./auth";

export async function readSheetRows(
  spreadsheetId: string
): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Get the first sheet name
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetName = meta.data.sheets?.[0]?.properties?.title ?? "Sheet1";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });

  const rows = res.data.values ?? [];
  // Skip header row
  return rows.slice(1);
}
