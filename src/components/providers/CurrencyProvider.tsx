"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CurrencyMode } from "@/types";

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  mode: CurrencyMode;
  setMode: (m: CurrencyMode) => void;
  currencies: string[];
  wallet: string;
  setWallet: (w: string) => void;
  wallets: string[];
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("");
  const [mode, setMode] = useState<CurrencyMode>("filter");
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [wallet, setWallet] = useState("");
  const [wallets, setWallets] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/expenses?limit=0")
      .then((r) => r.json())
      .then((d) => {
        if (d.currencies?.length) setCurrencies(d.currencies);
        if (d.wallets?.length) setWallets(d.wallets);
      });
  }, []);

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, mode, setMode, currencies, wallet, setWallet, wallets }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
