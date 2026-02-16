import type { ConversionContext } from "@/types";

interface CachedRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

// globalThis cache (same pattern as store.ts)
const globalRates = globalThis as unknown as {
  __moneyy_rates?: Map<string, CachedRates>;
};

function getCache(): Map<string, CachedRates> {
  if (!globalRates.__moneyy_rates) {
    globalRates.__moneyy_rates = new Map();
  }
  return globalRates.__moneyy_rates;
}

/** Milliseconds until midnight UTC */
function msUntilMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.getTime() - now.getTime();
}

// Hardcoded fallback rates (base: USD)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  SGD: 1.35,
  EUR: 0.92,
  JPY: 149.5,
  AUD: 1.55,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  HKD: 7.82,
  INR: 83.1,
  MYR: 4.72,
  NZD: 1.68,
  THB: 35.7,
  KRW: 1330,
  IDR: 15650,
  PHP: 56.2,
  TWD: 31.5,
  VND: 24500,
};

export async function fetchRates(base: string): Promise<CachedRates> {
  const cache = getCache();
  const cached = cache.get(base);

  // Return cached if still fresh (before midnight UTC)
  if (cached && Date.now() - cached.fetchedAt < msUntilMidnightUTC()) {
    return cached;
  }

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== "success") throw new Error("API error");

    const entry: CachedRates = {
      base,
      rates: data.rates,
      fetchedAt: Date.now(),
    };
    cache.set(base, entry);
    return entry;
  } catch (err) {
    console.warn(`Exchange rate fetch failed for ${base}, using fallback:`, err);
    // Build fallback rates relative to requested base
    const baseRate = FALLBACK_RATES[base] ?? 1;
    const rates: Record<string, number> = {};
    for (const [cur, rate] of Object.entries(FALLBACK_RATES)) {
      rates[cur] = rate / baseRate;
    }
    rates[base] = 1;

    const entry: CachedRates = {
      base,
      rates,
      fetchedAt: Date.now(),
    };
    cache.set(base, entry);
    return entry;
  }
}

/** Convert an amount from one currency to the target using provided rates */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  conversion: ConversionContext
): number {
  if (fromCurrency === conversion.targetCurrency) return amount;

  // rates are relative to ratesBase
  const fromRate = conversion.rates[fromCurrency];
  const toRate = conversion.rates[conversion.targetCurrency];

  if (!fromRate || !toRate) return amount; // unknown currency, return as-is

  return (amount / fromRate) * toRate;
}

/** Build a ConversionContext for a target currency */
export async function buildConversionContext(
  targetCurrency: string
): Promise<ConversionContext> {
  const cached = await fetchRates(targetCurrency);
  return {
    targetCurrency,
    rates: cached.rates,
    ratesBase: cached.base,
  };
}
