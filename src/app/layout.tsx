import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const syne = localFont({
  src: "../fonts/Syne-Variable.ttf",
  variable: "--sv-font-logo",
  display: "swap",
  weight: "400 800",
});

const lexend = localFont({
  src: "../fonts/Lexend-Variable.woff2",
  variable: "--sv-font-heading",
  display: "swap",
  weight: "100 900",
});

const dmSans = localFont({
  src: "../fonts/DMSans-Variable.ttf",
  variable: "--sv-font-body",
  display: "swap",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: "Stroomvol Batterij Adviseurstool",
  description:
    "Bereken het rendement van een thuisbatterij voor uw klant — Stroomvol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${syne.variable} ${lexend.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
