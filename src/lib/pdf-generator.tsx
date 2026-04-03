"use client";

import {
  Document,
  Page,
  View,
  Text,
  Font,
  StyleSheet,
  Svg,
  Circle,
  G,
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
   PAGINA 2: DOELEN + ONAFHANKELIJKHEID
   ============================================================ */

const c2 = StyleSheet.create({
  sectionTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14, color: K.zwart, marginBottom: 4 },
  sectionSub: { fontSize: 9, color: K.grijsDonker, marginBottom: 14 },

  // Doelen tabel
  doelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: K.grijs,
  },
  doelNaam: { width: "40%", fontSize: 10, fontWeight: 500 },
  doelBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 8,
    fontWeight: 700,
    width: "18%",
    textAlign: "center",
  },
  badgeGroen: { backgroundColor: "#E8F9ED", color: K.groen },
  badgeVolt: { backgroundColor: "#FFF8DC", color: "#B8860B" },
  badgeAmber: { backgroundColor: "#FFF3E0", color: K.amber },
  badgeGrijs: { backgroundColor: K.krijt, color: K.grijsDonker },
  doelResultaat: { width: "42%", fontSize: 10, color: K.grafiet, textAlign: "right" },

  // Onafhankelijkheid
  onafhWrap: { flexDirection: "row", alignItems: "center", marginTop: 24, gap: 20 },
  onafhRechts: { flex: 1 },
  onafhRij: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  onafhDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  onafhLabel: { fontSize: 10, color: K.grafiet },
  onafhFooter: { fontSize: 9, color: K.grijsDonker, marginTop: 12 },
});

interface DoelRij {
  naam: string;
  status: string;
  statusKleur: "groen" | "volt" | "amber" | "grijs";
  resultaat: string;
}

function DoelenPage({ calc: r }: { calc: CalcResult }) {
  const y1 = r.real.perJaar[0];
  const doelen: DoelRij[] = [];

  if (r.doel.has("zelf") && r.hasSolar) {
    doelen.push({
      naam: "Zelfconsumptie",
      status: r.zelfPctMet >= 70 ? "Sterk" : "Verbeterd",
      statusKleur: r.zelfPctMet >= 70 ? "groen" : "volt",
      resultaat: `${r.zelfPctMet}% (was ${r.zelfPctZonder}% zonder batterij)`,
    });
  }
  if (r.doel.has("handel")) {
    const actief = r.contract === "dynamisch";
    doelen.push({
      naam: "Slim handelen",
      status: actief ? "Actief" : "Niet beschikbaar",
      statusKleur: actief ? "groen" : "grijs",
      resultaat: actief ? `\u20AC${fmt(y1.arb)}/jaar arbitrage` : "Vereist dynamisch contract",
    });
  }
  doelen.push({
    naam: "Batterijlevensduur",
    status: r.jarenTot80Pct >= 20 ? "Uitstekend" : r.jarenTot80Pct >= 12 ? "Goed" : "Intensief",
    statusKleur: r.jarenTot80Pct >= 12 ? "groen" : "amber",
    resultaat: `~${r.jarenTot80Pct} jaar tot 80% capaciteit`,
  });
  if (r.doel.has("nood")) {
    doelen.push({
      naam: "Noodstroom",
      status: "Actief",
      statusKleur: r.noodstroomUren >= 8 ? "groen" : "volt",
      resultaat: `${r.noodstroomUren} uur bij stroomuitval`,
    });
  }
  if (r.doel.has("peak")) {
    doelen.push({
      naam: "Piekverbruik beperken",
      status: `\u2212${r.peakReductieKw.toFixed(1)} kW`,
      statusKleur: "groen",
      resultaat: `\u20AC${fmt(y1.peak)}/jaar besparing`,
    });
  }
  if (r.hasSolar && r.curtailmentJaar > 0) {
    doelen.push({
      naam: "Curtailment opvangen",
      status: r.curtailmentPct <= 5 ? "Minimaal" : "Matig",
      statusKleur: r.curtailmentPct <= 5 ? "groen" : "amber",
      resultaat: `${r.curtailmentPct}% verlies (${fmt(r.curtailmentJaar)} kWh/jr)`,
    });
  }

  const badgeStyle = (k: DoelRij["statusKleur"]) => {
    switch (k) {
      case "groen": return c2.badgeGroen;
      case "volt": return c2.badgeVolt;
      case "amber": return c2.badgeAmber;
      default: return c2.badgeGrijs;
    }
  };

  // Onafhankelijkheid berekening
  const pctOnafhankelijk = r.hasSolar ? r.zelfPctMet : 0;
  // Schatting: direct zon ~ zelfPctZonder, batterij = verschil
  const pctDirectZon = r.hasSolar ? r.zelfPctZonder : 0;
  const pctBatterij = r.hasSolar ? r.zelfPctMet - r.zelfPctZonder : 0;
  const pctNet = 100 - pctOnafhankelijk;
  const circumference = 2 * Math.PI * 40; // ~251

  return (
    <BrandedPage>
      {/* A. Doelen */}
      <Text style={c2.sectionTitle}>Jouw doelen — wat de batterij bereikt</Text>
      <Text style={c2.sectionSub}>Per doel laten we zien wat de batterij oplevert.</Text>

      {/* Header row */}
      <View style={[c2.doelRow, { borderBottomWidth: 1 }]}>
        <Text style={[c2.doelNaam, { fontSize: 8, color: K.grijsDonker, textTransform: "uppercase", letterSpacing: 1 }]}>Doel</Text>
        <Text style={[c2.doelBadge, { fontSize: 8, color: K.grijsDonker, textTransform: "uppercase", letterSpacing: 1, backgroundColor: "transparent" }]}>Status</Text>
        <Text style={[c2.doelResultaat, { fontSize: 8, color: K.grijsDonker, textTransform: "uppercase", letterSpacing: 1 }]}>Resultaat</Text>
      </View>

      {doelen.map((d) => (
        <View key={d.naam} style={c2.doelRow}>
          <Text style={c2.doelNaam}>{d.naam}</Text>
          <Text style={[c2.doelBadge, badgeStyle(d.statusKleur)]}>{d.status}</Text>
          <Text style={c2.doelResultaat}>{d.resultaat}</Text>
        </View>
      ))}

      {/* B. Onafhankelijkheid */}
      {r.hasSolar && (
        <>
          <Text style={[c2.sectionTitle, { marginTop: 28 }]}>Energie-onafhankelijkheid</Text>
          <View style={c2.onafhWrap}>
            {/* SVG cirkel */}
            <Svg viewBox="0 0 100 100" width={80} height={80}>
              {/* Achtergrond cirkel */}
              <Circle cx={50} cy={50} r={40} stroke={K.grijs} strokeWidth={8} fill="none" />
              {/* Groene boog: direct zon */}
              <G transform="rotate(-90 50 50)">
                <Circle
                  cx={50} cy={50} r={40}
                  stroke={K.groen} strokeWidth={8} fill="none"
                  strokeDasharray={`${(pctDirectZon / 100) * circumference} ${circumference}`}
                />
              </G>
              {/* Donkergroene boog: batterij (rotated past direct zon) */}
              <G transform={`rotate(${-90 + (pctDirectZon / 100) * 360} 50 50)`}>
                <Circle
                  cx={50} cy={50} r={40}
                  stroke={K.groenDonker} strokeWidth={8} fill="none"
                  strokeDasharray={`${(pctBatterij / 100) * circumference} ${circumference}`}
                />
              </G>
            </Svg>

            {/* Rechts: breakdown */}
            <View style={c2.onafhRechts}>
              <Text style={{ fontFamily: "Lexend", fontWeight: 700, fontSize: 24, color: K.zwart, marginBottom: 8 }}>{pctOnafhankelijk}%</Text>
              <View style={c2.onafhRij}>
                <View style={[c2.onafhDot, { backgroundColor: K.groen }]} />
                <Text style={c2.onafhLabel}>Direct zonneverbruik: {pctDirectZon}%</Text>
              </View>
              <View style={c2.onafhRij}>
                <View style={[c2.onafhDot, { backgroundColor: K.groenDonker }]} />
                <Text style={c2.onafhLabel}>Uit batterij: {pctBatterij}%</Text>
              </View>
              <View style={c2.onafhRij}>
                <View style={[c2.onafhDot, { backgroundColor: K.grijs }]} />
                <Text style={c2.onafhLabel}>Van het net: {pctNet}%</Text>
              </View>
            </View>
          </View>
          <Text style={c2.onafhFooter}>
            {pctOnafhankelijk}% van je verbruik komt uit eigen opwek (was {r.zelfPctZonder}% zonder batterij)
          </Text>
        </>
      )}
    </BrandedPage>
  );
}

/* ============================================================
   PAGINA 3: FINANCIEEL OVERZICHT
   ============================================================ */

const c3 = StyleSheet.create({
  sectionTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14, color: K.zwart, marginBottom: 12 },
  // Besparingsopbouw
  bdownRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  bdownLabel: { width: "42%", fontSize: 10, color: K.grafiet },
  bdownBarWrap: { width: "36%", height: 10, backgroundColor: K.krijt, borderRadius: 3, overflow: "hidden" },
  bdownBar: { height: 10, backgroundColor: K.groen, borderRadius: 3 },
  bdownVal: { width: "22%", fontSize: 10, fontWeight: 700, color: K.zwart, textAlign: "right" },
  bdownTotal: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: K.grijs,
  },
  bdownTotalLabel: { width: "42%", fontFamily: "Lexend", fontWeight: 700, fontSize: 10, color: K.zwart },
  bdownTotalVal: { width: "58%", fontFamily: "Lexend", fontWeight: 700, fontSize: 12, color: K.zwart, textAlign: "right" },

  // 15-jaar overzicht
  overzichtWrap: { marginTop: 20, marginBottom: 20 },
  overzichtRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  overzichtLabel: { fontSize: 10, color: K.grafiet },
  overzichtVal: { fontSize: 10, fontWeight: 700, color: K.zwart },
  overzichtTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: K.zwart,
  },
  overzichtTotalLabel: { fontFamily: "Lexend", fontWeight: 700, fontSize: 11, color: K.zwart },
  overzichtTotalVal: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14 },

  // Spaarrekening vergelijking
  spaarGrid: { flexDirection: "row", gap: 12, marginTop: 16 },
  spaarCard: {
    flex: 1,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: K.grijs,
  },
  spaarCardGroen: {
    flex: 1,
    borderRadius: 6,
    padding: 14,
    borderWidth: 2,
    borderColor: K.groen,
  },
  spaarTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 10, color: K.zwart, marginBottom: 8 },
  spaarLabel: { fontSize: 8, color: K.grijsDonker, marginBottom: 2 },
  spaarVal: { fontFamily: "Lexend", fontWeight: 700, fontSize: 16, color: K.zwart, marginBottom: 4 },
  spaarSub: { fontSize: 8, color: K.grijsDonker },
  spaarFooter: { fontSize: 9, color: K.grafiet, marginTop: 12 },
});

function FinancieelPage({ calc: r }: { calc: CalcResult }) {
  const n = r.real.perJaar.length;
  const gem = {
    zelf: Math.round(r.real.perJaar.reduce((s, j) => s + j.zelf, 0) / n),
    arb: Math.round(r.real.perJaar.reduce((s, j) => s + j.arb, 0) / n),
    ev: Math.round(r.real.perJaar.reduce((s, j) => s + j.ev, 0) / n),
    wp: Math.round(r.real.perJaar.reduce((s, j) => s + j.wp, 0) / n),
    peak: Math.round(r.real.perJaar.reduce((s, j) => s + j.peak, 0) / n),
    totaal: Math.round(r.real.total15 / n),
  };

  const componenten: { label: string; val: number }[] = [];
  if (gem.zelf > 0) componenten.push({ label: "Zelfconsumptie", val: gem.zelf });
  if (gem.arb > 0) componenten.push({ label: "Dynamisch tarief arbitrage", val: gem.arb });
  if (gem.ev > 0) componenten.push({ label: "EV slim laden", val: gem.ev });
  if (gem.wp > 0) componenten.push({ label: "Warmtepomp buffering", val: gem.wp });
  if (gem.peak > 0) componenten.push({ label: "Peak shaving", val: gem.peak });
  const maxComp = Math.max(...componenten.map((c) => c.val), 1);

  const nw = r.real.nettoWinst;

  // Spaarrekening vergelijking
  const spaarRente = 0.02;
  const spaarWaarde = Math.round(r.investering * Math.pow(1 + spaarRente, 15));
  const battRendement = r.investering > 0 ? Math.round(((r.real.total15 / r.investering) - 1) / 15 * 100) : 0;
  const verschil = r.real.total15 - spaarWaarde;
  const factorBeter = spaarWaarde > 0 ? (r.real.total15 / spaarWaarde).toFixed(1) : "0";

  return (
    <BrandedPage>
      {/* A. Besparingsopbouw */}
      <Text style={c3.sectionTitle}>Waar komt je besparing vandaan?</Text>

      {componenten.map((c) => (
        <View key={c.label} style={c3.bdownRow}>
          <Text style={c3.bdownLabel}>{c.label}</Text>
          <View style={c3.bdownBarWrap}>
            <View style={[c3.bdownBar, { width: `${(c.val / maxComp) * 100}%` }]} />
          </View>
          <Text style={c3.bdownVal}>{"\u20AC"}{fmt(c.val)}/jaar</Text>
        </View>
      ))}

      <View style={c3.bdownTotal}>
        <Text style={c3.bdownTotalLabel}>Gem. jaarlijkse besparing</Text>
        <Text style={c3.bdownTotalVal}>{"\u20AC"}{fmt(gem.totaal)}/jaar</Text>
      </View>

      {/* B. 15-jaar overzicht */}
      <View style={c3.overzichtWrap}>
        <Text style={[c3.sectionTitle, { marginBottom: 8 }]}>15-jaar overzicht</Text>
        <View style={c3.overzichtRow}>
          <Text style={c3.overzichtLabel}>Totale besparing (15 jaar, realistisch)</Text>
          <Text style={c3.overzichtVal}>{"\u20AC"}{fmt(r.real.total15)}</Text>
        </View>
        <View style={c3.overzichtRow}>
          <Text style={c3.overzichtLabel}>Investering</Text>
          <Text style={c3.overzichtVal}>{"\u2212\u20AC"}{fmt(r.investering)}</Text>
        </View>
        <View style={c3.overzichtTotalRow}>
          <Text style={c3.overzichtTotalLabel}>Netto winst na 15 jaar</Text>
          <Text style={[c3.overzichtTotalVal, { color: nw >= 0 ? K.groen : "#FF3B30" }]}>
            {nw >= 0 ? "+" : ""}{"\u20AC"}{fmt(nw)}
          </Text>
        </View>
      </View>

      {/* C. Batterij vs. Spaarrekening */}
      <Text style={c3.sectionTitle}>Batterij vs. spaarrekening</Text>
      <View style={c3.spaarGrid}>
        <View style={c3.spaarCardGroen}>
          <Text style={c3.spaarTitle}>Batterij investering</Text>
          <Text style={c3.spaarLabel}>Totale waarde 15 jaar</Text>
          <Text style={c3.spaarVal}>{"\u20AC"}{fmt(r.real.total15)}</Text>
          <Text style={c3.spaarSub}>~{battRendement}% rendement/jaar</Text>
        </View>
        <View style={c3.spaarCard}>
          <Text style={c3.spaarTitle}>Spaarrekening (2%)</Text>
          <Text style={c3.spaarLabel}>Totale waarde 15 jaar</Text>
          <Text style={c3.spaarVal}>{"\u20AC"}{fmt(spaarWaarde)}</Text>
          <Text style={c3.spaarSub}>2% rente/jaar</Text>
        </View>
      </View>
      <Text style={c3.spaarFooter}>
        De batterij levert {"\u20AC"}{fmt(verschil)} meer op dan sparen — {factorBeter}x meer rendement.
      </Text>
    </BrandedPage>
  );
}

/* ============================================================
   PAGINA 4: SCENARIO'S + ADVIES
   ============================================================ */

const c4 = StyleSheet.create({
  sectionTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14, color: K.zwart, marginBottom: 12 },

  // Scenario tabel
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: K.zwart,
  },
  tableHeaderCell: { fontSize: 8, color: K.grijsDonker, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: K.grijs },
  tableRowHl: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: K.grijs, backgroundColor: K.krijt },
  cellScenario: { width: "22%" },
  cellBesp: { width: "20%", textAlign: "right" },
  cellTvt: { width: "22%", textAlign: "right" },
  cellTotaal: { width: "20%", textAlign: "right" },
  cellNetto: { width: "16%", textAlign: "right" },
  cellText: { fontSize: 10 },
  cellTextBold: { fontSize: 10, fontWeight: 700 },

  // Advies blok
  adviesBlok: {
    marginTop: 24,
    flexDirection: "row",
    backgroundColor: K.krijt,
    borderRadius: 6,
    overflow: "hidden",
  },
  adviesBar: { width: 4, backgroundColor: K.groen },
  adviesContent: { flex: 1, padding: 16 },
  adviesTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 12, color: K.zwart, marginBottom: 8 },
  adviesText: { fontSize: 10, color: K.grafiet, lineHeight: 1.6 },

  // Volgende stappen
  stappenWrap: { marginTop: 24 },
  stappenTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 12, color: K.zwart, marginBottom: 10 },
  stapRow: { flexDirection: "row", marginBottom: 6, gap: 8 },
  stapNr: { fontFamily: "Lexend", fontWeight: 700, fontSize: 10, color: K.volt, width: 16 },
  stapText: { fontSize: 10, color: K.grafiet, flex: 1 },
});

function ScenarioPage({ calc: r }: { calc: CalcResult }) {
  const tvtCons = berekenCumulatieveTvt(r.cons, r.investering);
  const tvtReal = berekenCumulatieveTvt(r.real, r.investering);
  const tvtOpti = berekenCumulatieveTvt(r.opti, r.investering);

  const rows = [
    { label: "Conservatief", sc: r.cons, tvt: tvtCons, hl: false },
    { label: "Realistisch", sc: r.real, tvt: tvtReal, hl: true },
    { label: "Optimistisch", sc: r.opti, tvt: tvtOpti, hl: false },
  ];

  const nw = r.real.nettoWinst;

  return (
    <BrandedPage>
      {/* A. Scenariotabel */}
      <Text style={c4.sectionTitle}>Terugverdienscenario{"\u2019"}s</Text>

      <View style={c4.tableHeader}>
        <Text style={[c4.tableHeaderCell, c4.cellScenario]}>Scenario</Text>
        <Text style={[c4.tableHeaderCell, c4.cellBesp]}>Besp./jaar</Text>
        <Text style={[c4.tableHeaderCell, c4.cellTvt]}>TVT</Text>
        <Text style={[c4.tableHeaderCell, c4.cellTotaal]}>Totaal 15 jr</Text>
        <Text style={[c4.tableHeaderCell, c4.cellNetto]}>Netto winst</Text>
      </View>

      {rows.map((row) => (
        <View key={row.label} style={row.hl ? c4.tableRowHl : c4.tableRow}>
          <Text style={[row.hl ? c4.cellTextBold : c4.cellText, c4.cellScenario]}>{row.label}</Text>
          <Text style={[row.hl ? c4.cellTextBold : c4.cellText, c4.cellBesp]}>
            {"\u20AC"}{fmt(Math.round(row.sc.total15 / 15))}
          </Text>
          <Text style={[row.hl ? c4.cellTextBold : c4.cellText, c4.cellTvt]}>
            {formatTvt(row.tvt)}
          </Text>
          <Text style={[row.hl ? c4.cellTextBold : c4.cellText, c4.cellTotaal]}>
            {"\u20AC"}{fmt(row.sc.total15)}
          </Text>
          <Text style={[row.hl ? c4.cellTextBold : c4.cellText, c4.cellNetto, { color: row.sc.nettoWinst >= 0 ? K.groen : "#FF3B30" }]}>
            {row.sc.nettoWinst >= 0 ? "+" : ""}{"\u20AC"}{fmt(row.sc.nettoWinst)}
          </Text>
        </View>
      ))}

      {/* B. Positief advies-blok */}
      <View style={c4.adviesBlok}>
        <View style={c4.adviesBar} />
        <View style={c4.adviesContent}>
          <Text style={c4.adviesTitle}>Ons advies</Text>
          <Text style={c4.adviesText}>
            Met een thuisbatterij van {r.aanbevolenKwh} kWh benut je {r.hasSolar ? `${r.zelfPctMet}% van je eigen zonnestroom en verdien` : "verdien"} je de investering terug in {formatTvt(tvtReal)}.
            Na de terugverdientijd is elke besparing pure winst.
          </Text>
          <Text style={[c4.adviesText, { marginTop: 8 }]}>
            In het realistisch scenario levert de batterij over 15 jaar {"\u20AC"}{fmt(nw)} netto op.
          </Text>
        </View>
      </View>

      {/* C. Volgende stappen */}
      <View style={c4.stappenWrap}>
        <Text style={c4.stappenTitle}>Volgende stappen</Text>
        <View style={c4.stapRow}>
          <Text style={c4.stapNr}>1.</Text>
          <Text style={c4.stapText}>Heb je vragen? Neem contact op met je adviseur.</Text>
        </View>
        <View style={c4.stapRow}>
          <Text style={c4.stapNr}>2.</Text>
          <Text style={c4.stapText}>Klaar om te starten? Vraag een vrijblijvende offerte aan.</Text>
        </View>
        <View style={c4.stapRow}>
          <Text style={c4.stapNr}>3.</Text>
          <Text style={c4.stapText}>Na akkoord plannen we de installatie op een moment dat jou uitkomt.</Text>
        </View>
      </View>
    </BrandedPage>
  );
}

/* ============================================================
   PAGINA 5: DISCLAIMER + NOTITIES
   ============================================================ */

const c5 = StyleSheet.create({
  notitiesWrap: { marginBottom: 16 },
  notitiesTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 11, color: K.zwart, marginBottom: 6 },
  notitiesText: { fontSize: 9, color: K.grafiet, lineHeight: 1.6 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: K.grijs, marginBottom: 12 },
  disclaimerWrap: {
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 12,
  },
  disclaimerTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 9, color: K.grijsDonker, marginBottom: 4 },
  disclaimerText: { fontSize: 8, color: K.grijsDonker, lineHeight: 1.6 },
});

const DISCLAIMER_TEKST =
  "Dit adviesrapport is een indicatieve berekening op basis van de ingevoerde gegevens en aannames over energieprijzen, verbruikspatronen en batterijprestaties. Werkelijke resultaten kunnen afwijken door veranderingen in energieprijzen, verbruik, weer en marktomstandigheden. Dit rapport vormt geen garantie op besparing of terugverdientijd. Stroomvol is niet aansprakelijk voor afwijkingen tussen de berekende en daadwerkelijke opbrengsten. Raadpleeg altijd een gekwalificeerd installateur voor een definitieve offerte.";

function DisclaimerPage({ notities }: { notities: string }) {
  return (
    <BrandedPage>
      {/* Adviseur notities */}
      {notities.trim() !== "" && (
        <View style={c5.notitiesWrap}>
          <Text style={c5.notitiesTitle}>Notities adviseur</Text>
          <Text style={c5.notitiesText}>{notities}</Text>
          <View style={[c5.divider, { marginTop: 12 }]} />
        </View>
      )}

      {/* Disclaimer */}
      <View style={c5.disclaimerWrap}>
        <Text style={c5.disclaimerTitle}>Disclaimer</Text>
        <Text style={c5.disclaimerText}>{DISCLAIMER_TEKST}</Text>
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
      <DoelenPage calc={calc} />
      <FinancieelPage calc={calc} />
      <ScenarioPage calc={calc} />
      <DisclaimerPage notities={klant.notities} />
    </Document>
  );
}

export { BrandedPage };
