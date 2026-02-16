"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

interface SettingsForm {
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  googleDriveFolderId: string;
  baseCurrency: string;
}

interface TestResult {
  ok: boolean;
  fileCount?: number;
  error?: string;
}

const CURRENCIES = ["GBP", "SGD", "USD", "EUR"];

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    googleServiceAccountEmail: "",
    googleServiceAccountPrivateKey: "",
    googleDriveFolderId: "",
    baseCurrency: "GBP",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          googleServiceAccountEmail: data.googleServiceAccountEmail || "",
          googleServiceAccountPrivateKey:
            data.googleServiceAccountPrivateKey || "",
          googleDriveFolderId: data.googleDriveFolderId || "",
          baseCurrency: data.baseCurrency || "GBP",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(field: keyof SettingsForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveMessage("");
    setTestResult(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: form }),
      });
      if (res.ok) {
        setSaveMessage("Settings saved.");
      } else {
        setSaveMessage("Failed to save settings.");
      }
    } catch {
      setSaveMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setSaveMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: form, test: true }),
      });
      const data = await res.json();
      if (data.testResult) {
        setTestResult(data.testResult);
      }
      if (data.success) {
        setSaveMessage("Settings saved.");
      }
    } catch {
      setTestResult({ ok: false, error: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Settings">
        <div className="py-12 text-center text-muted">Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Setup Guide */}
        <div className="rounded-lg border border-border bg-card">
          <button
            onClick={() => setGuideOpen(!guideOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
          >
            <span>Google Service Account Setup Guide</span>
            <span className="text-muted">{guideOpen ? "−" : "+"}</span>
          </button>
          {guideOpen && (
            <div className="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted">
              <ol className="list-inside list-decimal space-y-3">
                <li>
                  Go to the{" "}
                  <strong>Google Cloud Console</strong> and create a new project
                  (or select an existing one).
                </li>
                <li>
                  Enable the <strong>Google Drive API</strong> and{" "}
                  <strong>Google Sheets API</strong> for the project.
                </li>
                <li>
                  Navigate to <strong>IAM &amp; Admin → Service Accounts</strong>{" "}
                  and click <strong>Create Service Account</strong>. Give it a
                  name and finish.
                </li>
                <li>
                  Click on the new service account, go to the{" "}
                  <strong>Keys</strong> tab, and create a new{" "}
                  <strong>JSON key</strong>. Download the file.
                </li>
                <li>
                  Open the JSON key file and copy the{" "}
                  <code className="rounded bg-muted/20 px-1">client_email</code>{" "}
                  and{" "}
                  <code className="rounded bg-muted/20 px-1">private_key</code>{" "}
                  fields into the form below.
                </li>
                <li>
                  In Google Drive, create or open a folder for your expense
                  spreadsheets. <strong>Share</strong> the folder with the service
                  account email (Viewer access).
                </li>
                <li>
                  Copy the <strong>folder ID</strong> from the Drive URL:{" "}
                  <code className="rounded bg-muted/20 px-1">
                    drive.google.com/drive/folders/<strong>&lt;FOLDER_ID&gt;</strong>
                  </code>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Configuration Form */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Service Account Email
              </label>
              <input
                type="text"
                value={form.googleServiceAccountEmail}
                onChange={(e) => update("googleServiceAccountEmail", e.target.value)}
                placeholder="name@project.iam.gserviceaccount.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Private Key</label>
              <textarea
                value={form.googleServiceAccountPrivateKey}
                onChange={(e) =>
                  update("googleServiceAccountPrivateKey", e.target.value)
                }
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs focus:border-foreground focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Paste the full private_key value from the JSON key file.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Drive Folder ID
              </label>
              <input
                type="text"
                value={form.googleDriveFolderId}
                onChange={(e) => update("googleDriveFolderId", e.target.value)}
                placeholder="e.g. 1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Base Currency
              </label>
              <select
                value={form.baseCurrency}
                onChange={(e) => update("baseCurrency", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:opacity-80 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent-light disabled:opacity-50"
            >
              {testing ? "Testing..." : "Save & Test Connection"}
            </button>
          </div>

          {/* Status */}
          {saveMessage && (
            <p className="mt-3 text-sm text-muted">{saveMessage}</p>
          )}
          {testResult && (
            <div
              className={`mt-3 rounded-md border px-4 py-3 text-sm ${
                testResult.ok
                  ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                  : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {testResult.ok
                ? `Connection successful — found ${testResult.fileCount} spreadsheet${testResult.fileCount === 1 ? "" : "s"} in the folder.`
                : `Connection failed: ${testResult.error}`}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
