"use client";

import { Font } from "@react-pdf/renderer";

/*
 * Font registration for PDF generation.
 * Files served from public/fonts/.
 * Syne: variable TTF (logo).
 * Lexend: static woff 400/700 (headings).
 * DM Sans: variable TTF (body).
 */
Font.register({
  family: "Syne",
  src: "/fonts/Syne-Variable.ttf",
  fontWeight: 800,
});

Font.register({
  family: "Lexend",
  fonts: [
    { src: "/fonts/Lexend-Regular.woff", fontWeight: 400 },
    { src: "/fonts/Lexend-Bold.woff", fontWeight: 700 },
  ],
});

Font.register({
  family: "DM Sans",
  src: "/fonts/DMSans-Variable.ttf",
  fontWeight: 400,
});

// Disable hyphenation
Font.registerHyphenationCallback((word) => [word]);

export const PDF_FONTS = {
  logo: "Syne",
  heading: "Lexend",
  body: "DM Sans",
} as const;
