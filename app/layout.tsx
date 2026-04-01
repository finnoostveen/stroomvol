import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stroomvol Batterij Adviseurstool",
  description:
    "Bereken het rendement van een thuisbatterij voor uw klant — Stroomvol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
