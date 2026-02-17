import { NextResponse } from "next/server";
import { loadSettings, saveSettings, maskPrivateKey } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json({
      ...settings,
      googleServiceAccountPrivateKey: maskPrivateKey(
        settings.googleServiceAccountPrivateKey
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings, test } = body as {
      settings: AppSettings;
      test?: boolean;
    };

    // If the private key is masked, keep the existing one
    if (settings.googleServiceAccountPrivateKey.startsWith("****")) {
      const existing = loadSettings();
      settings.googleServiceAccountPrivateKey =
        existing.googleServiceAccountPrivateKey;
    }

    saveSettings(settings);

    let testResult: { ok: boolean; fileCount?: number; error?: string } | undefined;

    if (test) {
      try {
        const { listSpreadsheets } = await import("@/lib/google/drive");
        const files = await listSpreadsheets();
        testResult = { ok: true, fileCount: files.length };
      } catch (err) {
        testResult = {
          ok: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({ success: true, testResult });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
