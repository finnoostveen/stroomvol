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
import type { CalcResult } from "./calc";
import { fmt } from "./calc";
import { berekenCumulatieveTvt, formatTvt } from "./helpers";

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
      <View style={ps.sideBar} fixed />
      <View style={ps.header} fixed>
        <View style={ps.headerLogoWrap}>
          <Text style={ps.headerLogoStroom}>STROOM</Text>
          <Text style={ps.headerLogoVol}>VOL</Text>
        </View>
        <Text style={ps.headerTagline}>Batterijadvies op maat</Text>
      </View>
      {children}
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
   HELPERS
   ============================================================ */

function formatDatum(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

/* ============================================================
   PAGINA 1: COVER + KERNGETALLEN
   ============================================================ */

const c1 = StyleSheet.create({
  // Klantgegevens
  label: { fontFamily: "Lexend", fontWeight: 700, fontSize: 12, color: K.grijsDonker, marginBottom: 4 },
  naam: { fontFamily: "Lexend", fontWeight: 700, fontSize: 22, color: K.zwart, marginBottom: 2 },
  adres: { fontSize: 10, color: K.grafiet, marginBottom: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meta: { fontSize: 9, color: K.grijsDonker },

  // Capaciteitsblok
  capBlock: {
    backgroundColor: K.zwart,
    borderRadius: 8,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  capLabel: { fontSize: 8, letterSpacing: 2, color: K.grijsDonker, marginBottom: 8, textTransform: "uppercase" },
  capRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  capKwh: { fontFamily: "Syne", fontWeight: 800, fontSize: 36, color: K.wit },
  capUnit: { fontSize: 14, color: K.grijsDonker, marginLeft: 6, marginBottom: 4 },
  badgeRow: { flexDirection: "row", gap: 6 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    fontSize: 8,
    color: "rgba(255,255,255,0.6)",
  },

  // Kernmetrics grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metricCard: {
    width: "48%",
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 12,
  },
  metricLabel: { fontSize: 8, color: K.grijsDonker, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  metricValue: { fontFamily: "Lexend", fontWeight: 700, fontSize: 18, color: K.zwart },
  metricVolt: { fontFamily: "Lexend", fontWeight: 700, fontSize: 18, color: K.volt },
  metricGroen: { fontFamily: "Lexend", fontWeight: 700, fontSize: 18, color: K.groen },
});

function CoverPage({ calc: r, klant }: { calc: CalcResult; klant: PdfData }) {
  const tvt = berekenCumulatieveTvt(r.real, r.investering);
  const gemBesparing = Math.round(r.real.total15 / 15);

  const badges: string[] = [];
  badges.push(r.contract === "dynamisch" ? "Dynamisch" : r.contract === "variabel" ? "Variabel" : "Vast");
  if (r.hasSolar) badges.push(`${r.nPanelen} panelen`);
  if (r.heeftEv) badges.push("EV");
  if (r.heeftWp || r.heeftHwp) badges.push("Warmtepomp");

  return (
    <BrandedPage>
      {/* A. Klantgegevens */}
      <Text style={c1.label}>Adviesrapport</Text>
      <Text style={c1.naam}>{klant.klantNaam || "Klant"}</Text>
      {klant.klantAdres ? <Text style={c1.adres}>{klant.klantAdres}</Text> : null}
      {klant.klantPlaats ? <Text style={c1.adres}>{klant.klantPlaats}</Text> : null}
      <View style={c1.metaRow}>
        <Text style={c1.meta}>Datum: {formatDatum(klant.datum)}</Text>
        {klant.adviseur ? <Text style={c1.meta}>Adviseur: {klant.adviseur}</Text> : null}
      </View>

      {/* B. Capaciteitsadvies */}
      <View style={c1.capBlock}>
        <Text style={c1.capLabel}>CAPACITEITSADVIES</Text>
        <View style={c1.capRow}>
          <Text style={c1.capKwh}>{r.aanbevolenKwh}</Text>
          <Text style={c1.capUnit}>kWh</Text>
        </View>
        <View style={c1.badgeRow}>
          {badges.map((b) => (
            <Text key={b} style={c1.badge}>{b}</Text>
          ))}
        </View>
      </View>

      {/* C. Kernmetrics 2x2 */}
      <View style={c1.grid}>
        <View style={c1.metricCard}>
          <Text style={c1.metricLabel}>INVESTERING</Text>
          <Text style={c1.metricValue}>{"\u20AC"}{fmt(r.investering)}</Text>
        </View>
        <View style={c1.metricCard}>
          <Text style={c1.metricLabel}>TERUGVERDIENTIJD</Text>
          <Text style={c1.metricVolt}>{formatTvt(tvt)}</Text>
        </View>
        <View style={c1.metricCard}>
          <Text style={c1.metricLabel}>BESPARING PER JAAR</Text>
          <Text style={c1.metricValue}>{"\u20AC"}{fmt(gemBesparing)}</Text>
        </View>
        <View style={c1.metricCard}>
          <Text style={c1.metricLabel}>ONAFHANKELIJKHEID</Text>
          <Text style={c1.metricGroen}>{r.hasSolar ? `${r.zelfPctMet}%` : "n.v.t."}</Text>
        </View>
      </View>
    </BrandedPage>
  );
}

/* ============================================================
   DOCUMENT
   ============================================================ */

export interface PdfData {
  klantNaam: string;
  klantAdres: string;
  klantPlaats: string;
  datum: string;
  adviseur: string;
  notities: string;
}

export function AdviesRapport({ calc, klant }: { calc: CalcResult; klant: PdfData }) {
  return (
    <Document
      title={`Stroomvol Advies - ${klant.klantNaam}`}
      author="Stroomvol"
    >
      <CoverPage calc={calc} klant={klant} />
    </Document>
  );
}

export { BrandedPage };
