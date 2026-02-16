import { Expense, FilterParams, SyncResult } from "@/types";
import { listSpreadsheets } from "@/lib/google/drive";
import { readSheetRows } from "@/lib/google/sheets";
import { parseRows } from "./parser";

interface StoreState {
  expenses: Expense[];
  lastSynced: Date | null;
  syncing: boolean;
}

// Hot-reload guard for dev mode
const globalStore = globalThis as unknown as { __moneyy_store?: StoreState };

function getState(): StoreState {
  if (!globalStore.__moneyy_store) {
    globalStore.__moneyy_store = {
      expenses: [],
      lastSynced: null,
      syncing: false,
    };
  }
  return globalStore.__moneyy_store;
}

export async function syncData(): Promise<SyncResult> {
  const state = getState();
  if (state.syncing) {
    return {
      filesScanned: 0,
      totalExpenses: state.expenses.length,
      lastSynced: state.lastSynced?.toISOString() ?? "",
    };
  }

  state.syncing = true;
  try {
    const files = await listSpreadsheets();
    const allExpenses: Expense[] = [];

    for (const file of files) {
      const rows = await readSheetRows(file.id);
      const parsed = parseRows(rows, file.name);
      allExpenses.push(...parsed);
    }

    // Sort by date descending
    allExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());

    state.expenses = allExpenses;
    state.lastSynced = new Date();

    return {
      filesScanned: files.length,
      totalExpenses: allExpenses.length,
      lastSynced: state.lastSynced.toISOString(),
    };
  } finally {
    state.syncing = false;
  }
}

export function getExpenses(filters?: FilterParams): Expense[] {
  const state = getState();
  let result = state.expenses;

  if (!filters) return result;

  if (filters.startDate) {
    const start = new Date(filters.startDate);
    result = result.filter((e) => e.date >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((e) => e.date <= end);
  }
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }
  if (filters.wallet) {
    result = result.filter((e) => e.wallet === filters.wallet);
  }
  if (filters.currency) {
    result = result.filter((e) => e.currency === filters.currency);
  }
  if (filters.tag) {
    const t = filters.tag.startsWith("#") ? filters.tag : `#${filters.tag}`;
    result = result.filter((e) => e.tags.includes(t.toLowerCase()));
  }

  return result;
}

const SYNC_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function ensureSynced(): Promise<void> {
  const state = getState();
  if (
    state.expenses.length === 0 ||
    !state.lastSynced ||
    Date.now() - state.lastSynced.getTime() > SYNC_TTL_MS
  ) {
    await syncData();
  }
}

export function getLastSynced(): Date | null {
  return getState().lastSynced;
}

export function getCategories(): string[] {
  return [...new Set(getState().expenses.map((e) => e.category))].sort();
}

export function getWallets(): string[] {
  return [...new Set(getState().expenses.map((e) => e.wallet))].sort();
}

export function getCurrencies(): string[] {
  return [...new Set(getState().expenses.map((e) => e.currency))].sort();
}

export function getTags(): string[] {
  const tags = new Set<string>();
  for (const e of getState().expenses) {
    for (const t of e.tags) tags.add(t);
  }
  return [...tags].sort();
}
