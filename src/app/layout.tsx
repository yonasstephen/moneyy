import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Moneyy - Expense Analysis",
  description: "Personal expense analysis dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <CurrencyProvider>
          <Navbar />
          <main>{children}</main>
        </CurrencyProvider>
      </body>
    </html>
  );
}
