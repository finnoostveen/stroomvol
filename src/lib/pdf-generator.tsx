"use client";

import {
  Document,
  Page,
  View,
  Text,
  Font,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

/* ============================================================
   FONT REGISTRATION
   ============================================================ */

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

Font.registerHyphenationCallback((word) => [word]);

/* ============================================================
   KLEUREN
   ============================================================ */

export const K = {
  zwart: "#0A0A0A",
  volt: "#FFDC3C",
  grafiet: "#4A4A4A",
  krijt: "#F5F5F0",
  groen: "#34C759",
  groenDonker: "#2DA44E",
  amber: "#FF9500",
  grijs: "#E5E5EA",
  grijsDonker: "#8E8E93",
  wit: "#FFFFFF",
} as const;

/* ============================================================
   BRANDED PAGE TEMPLATE
   ============================================================ */

const ps = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingLeft: 40,
    paddingRight: 32,
    fontFamily: "DM Sans",
    fontSize: 10,
    color: K.zwart,
  },
  sideBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: K.volt,
  },
  header: {
    position: "absolute",
    top: 16,
    left: 40,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: K.grijs,
  },
  headerLogoWrap: {
    flexDirection: "row",
  },
  headerLogoStroom: {
    fontFamily: "Syne",
    fontWeight: 800,
    fontSize: 14,
    color: K.zwart,
  },
  headerLogoVol: {
    fontFamily: "Syne",
    fontWeight: 800,
    fontSize: 14,
    color: K.volt,
  },
  headerTagline: {
    fontSize: 9,
    color: K.grijsDonker,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: K.grijs,
  },
  footerText: {
    fontSize: 8,
    color: K.grijsDonker,
  },
});

function BrandedPage({ children }: { children: ReactNode }) {
  return (
    <Page size="A4" style={ps.page}>
      {/* Gele zijbalk */}
      <View style={ps.sideBar} fixed />

      {/* Header */}
      <View style={ps.header} fixed>
        <View style={ps.headerLogoWrap}>
          <Text style={ps.headerLogoStroom}>STROOM</Text>
          <Text style={ps.headerLogoVol}>VOL</Text>
        </View>
        <Text style={ps.headerTagline}>Batterijadvies op maat</Text>
      </View>

      {/* Content */}
      {children}

      {/* Footer */}
      <View style={ps.footer} fixed>
        <Text style={ps.footerText}>Stroomvol · stroomvol.nl</Text>
        <Text
          style={ps.footerText}
          render={({ pageNumber, totalPages }) =>
            `Pagina ${pageNumber} van ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

/* ============================================================
   DOCUMENT WRAPPER (placeholder — pages added in next tasks)
   ============================================================ */

export interface PdfData {
  klantNaam: string;
  klantAdres: string;
  klantPlaats: string;
  datum: string;
  adviseur: string;
  notities: string;
}

export function AdviesRapport({ klant }: { klant: PdfData }) {
  return (
    <Document
      title={`Stroomvol Advies - ${klant.klantNaam}`}
      author="Stroomvol"
    >
      <BrandedPage>
        <Text>Placeholder — pagina&apos;s volgen</Text>
      </BrandedPage>
    </Document>
  );
}

export { BrandedPage };
