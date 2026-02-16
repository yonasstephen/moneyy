# Moneyy

Personal expense tracker that syncs data from Google Sheets. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** — spending trends, top categories, recent transactions
- **Trends** — time series charts, category/tag/wallet breakdowns, currency split
- **Reports** — monthly pivot tables, category detail, CSV export
- **Missing Detection** — flags gaps in regular expense patterns
- **Multi-currency** — filter by currency or convert using exchange rates
- **Multi-wallet** — global wallet filter across all pages
- **Hashtag tagging** — tag expenses with `#hashtags` in notes for grouping

## Tech Stack

- [Next.js](https://nextjs.org) 15 (App Router, Turbopack)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org) 5
- [Tailwind CSS](https://tailwindcss.com) 4
- [Recharts](https://recharts.org) 3 for charts
- [date-fns](https://date-fns.org) for date utilities
- [Google APIs](https://github.com/googleapis/google-api-nodejs-client) for Sheets/Drive integration

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc` for version)
- A Google Cloud project with Drive and Sheets APIs enabled
- A service account with access to your expense spreadsheets folder

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000/settings](http://localhost:3000/settings) and configure your Google service account credentials and Drive folder ID.

4. Click **Sync** on the dashboard to load expenses from Google Sheets.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API routes
│   ├── api/              # REST endpoints (expenses, summary, sync, settings, missing)
│   ├── missing/          # Missing expense detection page
│   ├── reports/          # Monthly reports page
│   ├── settings/         # Settings page
│   ├── trends/           # Trends & charts page
│   └── page.tsx          # Dashboard
├── components/
│   ├── charts/           # Recharts-based chart components
│   ├── layout/           # Navbar, PageShell
│   ├── providers/        # Currency context provider
│   ├── reports/          # Report table components
│   └── ui/               # Shared UI components (FilterBar, Select, Modal, etc.)
├── lib/
│   ├── analysis/         # Missing expense detector
│   ├── data/             # Store, aggregator, parser
│   ├── google/           # Google Auth, Drive, Sheets clients
│   ├── currency.ts       # Currency formatting
│   ├── exchangeRates.ts  # Exchange rate fetching & conversion
│   └── settings.ts       # Settings persistence
└── types/                # TypeScript interfaces
```

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start dev server with Turbopack      |
| `npm run build` | Production build                     |
| `npm start`     | Start production server              |
| `npm run lint`  | Run ESLint                           |
