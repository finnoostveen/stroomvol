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
  src: "/fonts/Syne-ExtraBold.woff",
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
  fonts: [
    { src: "/fonts/DMSans-Regular.woff", fontWeight: 400 },
    { src: "/fonts/DMSans-Medium.woff", fontWeight: 500 },
    { src: "/fonts/DMSans-Bold.woff", fontWeight: 700 },
  ],
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
   PAGINA 1: COVER + KERNGETALLEN + ADVIES
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
  metricTvt: { fontFamily: "Lexend", fontWeight: 700, fontSize: 18, color: K.groen },
  metricGroen: { fontFamily: "Lexend", fontWeight: 700, fontSize: 18, color: K.groen },

  // Adviesblok
  adviesBlok: {
    marginTop: 16,
    flexDirection: "row",
    backgroundColor: K.krijt,
    borderRadius: 6,
    overflow: "hidden",
  },
  adviesBar: { width: 4, backgroundColor: K.groen },
  adviesContent: { flex: 1, padding: 14 },
  adviesTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 11, color: K.zwart, marginBottom: 6 },
  adviesText: { fontSize: 9, color: K.grafiet, lineHeight: 1.6 },
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
          <Text style={c1.metricTvt}>{formatTvt(tvt)}</Text>
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

      {/* D. Ons advies */}
      <View style={c1.adviesBlok}>
        <View style={c1.adviesBar} />
        <View style={c1.adviesContent}>
          <Text style={c1.adviesTitle}>Ons advies</Text>
          <Text style={c1.adviesText}>
            Met een thuisbatterij van {r.aanbevolenKwh} kWh benut je {r.hasSolar ? `${r.zelfPctMet}% van je eigen zonnestroom en verdien` : "verdien"} je de investering terug in {formatTvt(tvt)}.
            Na de terugverdientijd is elke besparing pure winst.
          </Text>
          <Text style={[c1.adviesText, { marginTop: 8 }]}>
            In het realistisch scenario levert de batterij over 15 jaar {"\u20AC"}{fmt(r.real.nettoWinst)} netto op.
          </Text>
        </View>
      </View>
    </BrandedPage>
  );
}

/* ============================================================
   PAGINA 3: DOELEN + ONAFHANKELIJKHEID + SPAARREKENING
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
  onafhRij: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  onafhDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  onafhLabel: { fontSize: 10, color: K.grafiet },
  onafhFooter: { fontSize: 9, color: K.grijsDonker, marginTop: 12 },

  // Verbruiksprofiel
  profielBlok: {
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
  },
});

interface DoelRij {
  naam: string;
  status: string;
  statusKleur: "groen" | "volt" | "amber" | "grijs";
  resultaat: string;
}

function profielNaam(p: string): string {
  const namen: Record<string, string> = { standaard: "Standaard", "avond-zwaar": "Avondzwaar", overdag: "Overdag thuis", "ev-nacht": "EV nachtladen" };
  return namen[p] || "Standaard";
}

function profielInsightPdf(profiel: string, zonder: number, met: number): string {
  const v = met - zonder;
  switch (profiel) {
    case "avond-zwaar":
      return `Jouw avondprofiel matcht minimaal met de zonne-opbrengst \u2014 slechts ${zonder}% wordt direct benut. De batterij tilt dit naar ${met}%, een verbetering van ${v} procentpunt.`;
    case "overdag":
      return `Je verbruikt al ${zonder}% direct van je zonnestroom \u2014 meer dan gemiddeld. De batterij verhoogt dit naar ${met}%.`;
    case "ev-nacht":
      return `Door het nachtelijk laden van je EV slaat de batterij overdag zonnestroom op en levert dit \u2019s nachts. Zelfconsumptie stijgt van ${zonder}% naar ${met}%.`;
    default:
      return `Bij jouw verbruiksprofiel wordt ${zonder}% van de zonnestroom direct benut. Met de batterij stijgt dit naar ${met}% \u2014 een verbetering van ${v} procentpunt.`;
  }
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

      {/* B. Verbruiksprofiel */}
      {r.hasSolar && (
        <View style={c2.profielBlok}>
          <Text style={[c2.sectionTitle, { marginTop: 20, marginBottom: 4 }]}>
            Jouw verbruiksprofiel: {profielNaam(r.profiel)}
          </Text>
          <Text style={{ fontSize: 9, color: K.grafiet, lineHeight: 1.5, marginBottom: 8 }}>
            {profielInsightPdf(r.profiel, r.zelfPctZonder, r.zelfPctMet)}
          </Text>
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text style={{ fontSize: 9, color: K.zwart }}>
              Direct verbruikt: <Text style={{ fontWeight: 700 }}>{r.zelfPctZonder}%</Text>
            </Text>
            <Text style={{ fontSize: 9, color: K.groen }}>
              Met batterij: <Text style={{ fontWeight: 700 }}>{r.zelfPctMet}%</Text>
            </Text>
          </View>
        </View>
      )}

      {/* C. Onafhankelijkheid */}
      {r.hasSolar && (
        <>
          <Text style={[c2.sectionTitle, { marginTop: 28 }]}>Energie-onafhankelijkheid</Text>
          <View style={c2.onafhWrap}>
            {/* Percentage groot */}
            <Text style={{ fontFamily: "Lexend", fontWeight: 700, fontSize: 32, color: K.zwart, marginRight: 20 }}>{pctOnafhankelijk}%</Text>

            {/* Gestapelde balk + legenda */}
            <View style={{ flex: 1 }}>
              {/* Horizontale balk */}
              <View style={{ flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
                {pctDirectZon > 0 && (
                  <View style={{ width: `${pctDirectZon}%`, backgroundColor: K.groen }} />
                )}
                {pctBatterij > 0 && (
                  <View style={{ width: `${pctBatterij}%`, backgroundColor: K.groenDonker }} />
                )}
                {pctNet > 0 && (
                  <View style={{ width: `${pctNet}%`, backgroundColor: K.grijs }} />
                )}
              </View>

              {/* Legenda */}
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

      {/* C. Batterij vs. spaarrekening */}
      <SpaarVergelijking calc={r} />
    </BrandedPage>
  );
}

function SpaarVergelijking({ calc: r }: { calc: CalcResult }) {
  const spaarRente = 0.02;
  const batterijTotaal = r.real.total15;
  const spaarTotaal = Math.round(r.investering * Math.pow(1 + spaarRente, 15));
  const verschil = batterijTotaal - spaarTotaal;

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={cSpaar.sectionTitle}>Batterij vs. spaarrekening</Text>
      <View style={cSpaar.spaarGrid}>
        <View style={cSpaar.spaarCardGroen}>
          <Text style={cSpaar.spaarTitle}>Totale besparing batterij</Text>
          <Text style={cSpaar.spaarLabel}>Cumulatieve besparing 15 jaar</Text>
          <Text style={cSpaar.spaarVal}>{"\u20AC"}{fmt(batterijTotaal)}</Text>
        </View>
        <View style={cSpaar.spaarCard}>
          <Text style={cSpaar.spaarTitle}>Eindsaldo spaarrekening</Text>
          <Text style={cSpaar.spaarLabel}>{"\u20AC"}{fmt(r.investering)} × 1,02^15</Text>
          <Text style={cSpaar.spaarVal}>{"\u20AC"}{fmt(spaarTotaal)}</Text>
        </View>
      </View>
      {verschil > 0 && (
        <Text style={cSpaar.spaarFooter}>
          {"\u20AC"}{fmt(verschil)} meer rendement met de batterij
        </Text>
      )}
    </View>
  );
}

/* ============================================================
   PAGINA 2: FINANCIEEL + SCENARIO'S
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

  // Scenario uitleg
  scenarioUitleg: {
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  scenarioUitlegText: { fontFamily: "DM Sans", fontSize: 9, color: K.grafiet, lineHeight: 1.5 },
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

      {/* C. Terugverdienscenario's */}
      <Text style={[c3.sectionTitle, { marginTop: 4 }]}>Terugverdienscenario{"\u2019"}s</Text>

      {/* Uitleg */}
      <View style={c3.scenarioUitleg}>
        <Text style={c3.scenarioUitlegText}>
          De drie scenario{"\u2019"}s verschillen in aannames over energieprijsstijging en batterijdegradatie. Conservatief rekent met lagere prijsstijging en snellere degradatie — het worst case. Realistisch is ons basisadvies op basis van huidige markttrends. Optimistisch rekent met hogere prijsstijging, wat waarschijnlijker wordt naarmate elektrificatie toeneemt.
        </Text>
      </View>

      <ScenarioTabel calc={r} />
    </BrandedPage>
  );
}

/* ============================================================
   SCENARIO TABEL (herbruikbaar)
   ============================================================ */

const ct = StyleSheet.create({
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
});

function ScenarioTabel({ calc: r }: { calc: CalcResult }) {
  const tvtCons = berekenCumulatieveTvt(r.cons, r.investering);
  const tvtReal = berekenCumulatieveTvt(r.real, r.investering);
  const tvtOpti = berekenCumulatieveTvt(r.opti, r.investering);

  const rows = [
    { label: "Conservatief", sc: r.cons, tvt: tvtCons, hl: false },
    { label: "Realistisch", sc: r.real, tvt: tvtReal, hl: true },
    { label: "Optimistisch", sc: r.opti, tvt: tvtOpti, hl: false },
  ];

  return (
    <View>
      <View style={ct.tableHeader}>
        <Text style={[ct.tableHeaderCell, ct.cellScenario]}>Scenario</Text>
        <Text style={[ct.tableHeaderCell, ct.cellBesp]}>Besp./jaar</Text>
        <Text style={[ct.tableHeaderCell, ct.cellTvt]}>TVT</Text>
        <Text style={[ct.tableHeaderCell, ct.cellTotaal]}>Totaal 15 jr</Text>
        <Text style={[ct.tableHeaderCell, ct.cellNetto]}>Netto winst</Text>
      </View>

      {rows.map((row) => (
        <View key={row.label} style={row.hl ? ct.tableRowHl : ct.tableRow}>
          <Text style={[row.hl ? ct.cellTextBold : ct.cellText, ct.cellScenario]}>{row.label}</Text>
          <Text style={[row.hl ? ct.cellTextBold : ct.cellText, ct.cellBesp]}>
            {"\u20AC"}{fmt(Math.round(row.sc.total15 / 15))}
          </Text>
          <Text style={[row.hl ? ct.cellTextBold : ct.cellText, ct.cellTvt, { color: K.groen }]}>
            {formatTvt(row.tvt)}
          </Text>
          <Text style={[row.hl ? ct.cellTextBold : ct.cellText, ct.cellTotaal]}>
            {"\u20AC"}{fmt(row.sc.total15)}
          </Text>
          <Text style={[row.hl ? ct.cellTextBold : ct.cellText, ct.cellNetto, { color: row.sc.nettoWinst >= 0 ? K.groen : "#FF3B30" }]}>
            {row.sc.nettoWinst >= 0 ? "+" : ""}{"\u20AC"}{fmt(row.sc.nettoWinst)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ============================================================
   PAGINA 3: DOELEN + ONAFHANKELIJKHEID + SPAARREKENING
   (DoelenPage already defined above — spaarrekening added below)
   ============================================================ */

const cSpaar = StyleSheet.create({
  sectionTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14, color: K.zwart, marginBottom: 12 },
  spaarGrid: { flexDirection: "row", gap: 12, marginTop: 8 },
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
  spaarFooter: {
    marginTop: 10,
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 10,
    fontSize: 10,
    color: K.grafiet,
    textAlign: "center",
    fontWeight: 700,
  },
});

/* ============================================================
   PAGINA 4: VOLGENDE STAPPEN + NOTITIES + DISCLAIMER
   ============================================================ */

const c4 = StyleSheet.create({
  sectionTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 14, color: K.zwart, marginBottom: 12 },

  // Volgende stappen
  stappenWrap: { marginBottom: 24 },
  stappenTitle: { fontFamily: "Lexend", fontWeight: 700, fontSize: 12, color: K.zwart, marginBottom: 10 },
  stapRow: { flexDirection: "row", marginBottom: 6, gap: 8 },
  stapNr: { fontFamily: "Lexend", fontWeight: 700, fontSize: 10, color: K.volt, width: 16 },
  stapText: { fontSize: 10, color: K.grafiet, flex: 1 },
});

function SlotPage({ notities, calc: r }: { notities: string; calc: CalcResult }) {
  const aannames: string[] = [
    `Installatiekosten: \u20AC${r.cpk}/kWh`,
    `Depth of Discharge (DoD): ${r.dod}%`,
    `Roundtrip efficiency: ${r.eff}%`,
    `Degradatie: ${(r.degradatiePerJaarPct).toFixed(2)}%/jaar (${Math.round(r.cycliPerJaar)} cycli/jaar)`,
    `Energieprijsstijging: ${r.stijgPct}%/jaar`,
    `Teruglevertarief: \u20AC${r.terug.toFixed(2)}/kWh`,
  ];
  if (r.contract === "dynamisch") {
    aannames.push(`Dynamisch dal: \u20AC${r.dynDal.toFixed(2)}/kWh`);
    aannames.push(`Dynamisch piek: \u20AC${r.dynPiek.toFixed(2)}/kWh`);
    aannames.push(`Dynamisch gemiddeld: \u20AC${r.dynGem.toFixed(2)}/kWh`);
  }

  return (
    <BrandedPage>
      {/* A. Volgende stappen */}
      <View style={c4.stappenWrap}>
        <Text style={c4.sectionTitle}>Volgende stappen</Text>
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

      {/* B. Adviseur notities */}
      {notities.trim() !== "" && (
        <View style={c5.notitiesWrap}>
          <Text style={c5.notitiesTitle}>Notities adviseur</Text>
          <Text style={c5.notitiesText}>{notities}</Text>
          <View style={[c5.divider, { marginTop: 12 }]} />
        </View>
      )}

      {/* C. Disclaimer */}
      <View style={c5.disclaimerWrap}>
        <Text style={c5.disclaimerTitle}>Disclaimer</Text>
        <Text style={c5.disclaimerText}>{DISCLAIMER_TEKST}</Text>
      </View>

      {/* D. Aannames */}
      <View style={c5.aannamesTonWrap}>
        <Text style={c5.aannamesTonTitle}>Aannames</Text>
        <Text style={c5.aannamesTonText}>{aannames.join("  ·  ")}</Text>
      </View>
    </BrandedPage>
  );
}

/* ============================================================
   SHARED STYLES: NOTITIES + DISCLAIMER
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
  aannamesTonWrap: {
    backgroundColor: K.krijt,
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  aannamesTonTitle: { fontFamily: "DM Sans", fontWeight: 700, fontSize: 9, color: K.grijsDonker, marginBottom: 4 },
  aannamesTonText: { fontFamily: "DM Sans", fontSize: 8, color: K.grijsDonker, lineHeight: 1.6 },
});

const DISCLAIMER_TEKST =
  "Dit adviesrapport is een indicatieve berekening op basis van de ingevoerde gegevens en aannames over energieprijzen, verbruikspatronen en batterijprestaties. Werkelijke resultaten kunnen afwijken door veranderingen in energieprijzen, verbruik, weer en marktomstandigheden. Dit rapport vormt geen garantie op besparing of terugverdientijd. Stroomvol is niet aansprakelijk voor afwijkingen tussen de berekende en daadwerkelijke opbrengsten. Raadpleeg altijd een gekwalificeerd installateur voor een definitieve offerte.";


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
      <FinancieelPage calc={calc} />
      <DoelenPage calc={calc} />
      <SlotPage notities={klant.notities} calc={calc} />
    </Document>
  );
}

