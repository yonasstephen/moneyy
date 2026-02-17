"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { useCurrency } from "@/components/providers/CurrencyProvider";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/trends", label: "Trends" },
  { href: "/reports", label: "Reports" },
  { href: "/missing", label: "Missing" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const { currency, setCurrency, mode, setMode, currencies, wallet, setWallet, wallets } = useCurrency();

  const currencyOptions = [
    { value: "", label: "All currencies" },
    ...currencies.map((c) => ({ value: c, label: c })),
  ];

  const walletOptions = [
    { value: "", label: "All wallets" },
    ...wallets.map((w) => ({ value: w, label: w })),
  ];

  return (
    <nav className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link
            href="/"
            className="font-display text-base font-semibold tracking-tight text-foreground"
          >
            moneyy
          </Link>
          <div className="flex gap-0.5">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-accent-light text-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={wallet}
              onChange={setWallet}
              options={walletOptions}
              placeholder="All wallets"
              className="w-40"
            />
            <Select
              value={currency}
              onChange={setCurrency}
              options={currencyOptions}
              placeholder="All currencies"
              className="w-36"
            />
            <div className="flex rounded-md border border-border text-[13px]">
              <button
                onClick={() => setMode("filter")}
                className={`px-2.5 py-1.5 rounded-l-md transition-colors ${
                  mode === "filter"
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Filter
              </button>
              <button
                onClick={() => setMode("convert")}
                className={`px-2.5 py-1.5 rounded-r-md transition-colors ${
                  mode === "convert"
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
