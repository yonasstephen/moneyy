export interface Expense {
  id: number;
  date: Date;
  dateString: string;
  category: string;
  amount: number;
  currency: string;
  wallet: string;
  note: string;
  tags: string[];
  with?: string;
  event?: string;
  members?: string;
  sourceFile: string;
}

export type CurrencyMode = "filter" | "convert";
export type MonthKey = string; // "YYYY-MM"
export type GroupBy = "day" | "month" | "year";

export interface MissingExpenseAlert {
  tag: string;
  category: string;
  wallet: string;
  currency: string;
  expectedMonths: MonthKey[];
  missingMonths: MonthKey[];
  averageAmount: number;
  confidence: number;
}

export interface MonthlySummary {
  month: MonthKey;
  totalByCurrency: Record<string, number>;
  incomeByCurrency: Record<string, number>;
  byCategory: Record<string, Record<string, number>>;
  transactionCount: number;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  wallet?: string;
  currency?: string;
  tag?: string;
}

export interface SyncResult {
  filesScanned: number;
  totalExpenses: number;
  lastSynced: string;
}

export interface TimeSeriesPoint {
  period: string;
  [key: string]: string | number;
}

export interface ConversionContext {
  targetCurrency: string;
  rates: Record<string, number>;
  ratesBase: string;
}
