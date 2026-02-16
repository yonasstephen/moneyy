const SYMBOLS: Record<string, string> = {
  GBP: "£",
  SGD: "S$",
  USD: "$",
  EUR: "€",
};

// Static exchange rates (to GBP)
const RATES_TO_GBP: Record<string, number> = {
  GBP: 1,
  SGD: 0.58,
  USD: 0.79,
  EUR: 0.86,
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = SYMBOLS[currency] ?? currency + " ";
  const formatted = Math.abs(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${symbol}${formatted}`;
}

export function convertToBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string = process.env.BASE_CURRENCY ?? "GBP"
): number {
  if (fromCurrency === baseCurrency) return amount;

  const fromRate = RATES_TO_GBP[fromCurrency] ?? 1;
  const toRate = RATES_TO_GBP[baseCurrency] ?? 1;

  return (amount * fromRate) / toRate;
}

export function formatNumber(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getCurrencySymbol(currency: string): string {
  return SYMBOLS[currency] ?? currency;
}
