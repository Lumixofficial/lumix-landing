import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "./SmoothScroll";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Lumix | Trading on Stellar",
  description:
    "Trade options, perpetuals, and spot or supply liquidity through pools with Lumix on Stellar. Join the private demo.",
  applicationName: "Lumix",
  openGraph: {
    title: "Lumix | Trading on Stellar",
    description: "Options, perpetuals, spot, and liquidity pools together on Stellar.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body>{children}<SmoothScroll /></body>
    </html>
  );
}
