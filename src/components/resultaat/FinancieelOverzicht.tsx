"use client";

import type { CalcResult, ScenarioResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import { berekenCumulatieveTvt } from "@/lib/helpers";

interface Props {
  result: CalcResult;
}

function ScenarioRow({
  label,
  badge,
  badgeCls,
  sc,
  investering,
}: {
  label: string;
  badge: string;
  badgeCls: string;
  sc: ScenarioResult;
  investering: number;
}) {
  const nettoColor = sc.nettoWinst >= 0 ? "var(--sv-groen)" : "var(--sv-rood)";
  const isReal = badgeCls === "bs-r";
  const tvt = berekenCumulatieveTvt(sc, investering);

  return (
    <tr>
      <td>
        {label} <span className={`bs ${badgeCls}`}>{badge}</span>
      </td>
      <td className={`v${isReal ? " hl" : ""}`}>&euro;{fmt(Math.round(sc.total15 / 15))}</td>
      <td className={`v${isReal ? " hl" : ""}`}>
        {tvt < 30 ? `${tvt.toFixed(1)} jaar` : "> 25 jr"}
      </td>
      <td className={`v${isReal ? " hl" : ""}`}>&euro;{fmt(sc.total15)}</td>
      <td className="v" style={{ color: nettoColor, fontSize: isReal ? "18px" : undefined }}>
        {sc.nettoWinst >= 0 ? "+" : ""}&euro;{fmt(sc.nettoWinst)}
      </td>
    </tr>
  );
}

const SC_SUB: Record<string, string> = {
  vast: "Scenario\u2019s vari\u00ebren op degradatie en na contractverlenging.",
  variabel: "Besparing stijgt mee met tarief.",
  dynamisch: "Afhankelijk van EPEX-spread en slim laadgedrag.",
};

export default function FinancieelOverzicht({ result: c }: Props) {
  const nw = c.real.nettoWinst;
  const n = c.real.perJaar.length;

  // Gemiddelde per component over alle jaren
  const gem = {
    zelf: Math.round(c.real.perJaar.reduce((s, j) => s + j.zelf, 0) / n),
    arb: Math.round(c.real.perJaar.reduce((s, j) => s + j.arb, 0) / n),
    ev: Math.round(c.real.perJaar.reduce((s, j) => s + j.ev, 0) / n),
    wp: Math.round(c.real.perJaar.reduce((s, j) => s + j.wp, 0) / n),
    peak: Math.round(c.real.perJaar.reduce((s, j) => s + j.peak, 0) / n),
    totaal: Math.round(c.real.total15 / n),
  };

  // Breakdown rows
  const bdRows: { l: string; v: string; total?: boolean; color?: string; spacer?: boolean }[] = [];
  if (gem.zelf > 0) bdRows.push({ l: "Zelfconsumptie-besparing", v: `\u20AC${fmt(gem.zelf)} /jaar` });
  if (gem.arb > 0) bdRows.push({ l: "Dynamisch tarief arbitrage", v: `\u20AC${fmt(gem.arb)} /jaar` });
  if (gem.ev > 0) bdRows.push({ l: "EV slim laden (dalprijs)", v: `\u20AC${fmt(gem.ev)} /jaar` });
  if (gem.wp > 0) bdRows.push({ l: "Warmtepomp buffering", v: `\u20AC${fmt(gem.wp)} /jaar` });
  if (gem.peak > 0) bdRows.push({ l: "Peak shaving", v: `\u20AC${fmt(gem.peak)} /jaar` });
  bdRows.push({ l: "Gem. jaarlijkse besparing", v: `\u20AC${fmt(gem.totaal)} /jaar`, total: true });
  bdRows.push({ l: "", v: "", spacer: true });
  bdRows.push({ l: "Totale besparing over 15 jaar (realistisch)", v: `\u20AC${fmt(c.real.total15)}` });
  bdRows.push({ l: "Investering", v: `\u2212\u20AC${fmt(c.investering)}` });
  bdRows.push({
    l: "Netto winst na 15 jaar",
    v: `${nw >= 0 ? "+" : ""}\u20AC${fmt(nw)}`,
    total: true,
    color: nw >= 0 ? "var(--sv-groen)" : "var(--sv-rood)",
  });

  return (
    <>
      {/* Scenario tabel */}
      <div className="sc-card">
        <div className="sc-header">Terugverdienscenario&apos;s</div>
        <div className="sc-sub">{SC_SUB[c.contract]}</div>
        <div className="sc-scroll">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Gem. besparing / jaar</th>
                <th>Terugverdientijd</th>
                <th>Totale besparing 15 jr</th>
                <th>Netto winst</th>
              </tr>
            </thead>
            <tbody>
              <ScenarioRow label="Conservatief" badge="voorzichtig" badgeCls="bs-c" sc={c.cons} investering={c.investering} />
              <ScenarioRow label="Realistisch" badge="verwacht" badgeCls="bs-r" sc={c.real} investering={c.investering} />
              <ScenarioRow label="Optimistisch" badge="gunstig" badgeCls="bs-o" sc={c.opti} investering={c.investering} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bdown">
        <div className="bdown-title">Besparingsopbouw &amp; netto rendement</div>
        {bdRows.map((r, i) => {
          if (r.spacer) return <div key={i} style={{ height: 8 }} />;
          return (
            <div key={i} className={`bdown-row${r.total ? " total" : ""}`}>
              <span className="l">{r.l}</span>
              <span className="v" style={r.color ? { color: r.color } : undefined}>
                {r.v}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
