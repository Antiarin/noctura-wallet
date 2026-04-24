import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noctura — Midnight Signal",
  description:
    "Add your ticket to Apple Wallet or Google Wallet. Noctura Presents: Midnight Signal. Warehouse 42, Brooklyn. 13 Dec 2025.",
  openGraph: {
    title: "Noctura — Midnight Signal",
    description: "Your ticket to Midnight Signal.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
