"use client";

import type { CalcResult, ScenarioResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

function ScenarioRow({
  label,
  badge,
  badgeCls,
  sc,
}: {
  label: string;
  badge: string;
  badgeCls: string;
  sc: ScenarioResult;
}) {
  const nettoColor = sc.nettoWinst >= 0 ? "var(--sv-groen)" : "var(--sv-rood)";
  const isReal = badgeCls === "bs-r";

  return (
    <tr>
      <td>
        {label} <span className={`bs ${badgeCls}`}>{badge}</span>
      </td>
      <td className={`v${isReal ? " hl" : ""}`}>&euro;{fmt(sc.savingY1)}</td>
      <td className={`v${isReal ? " hl" : ""}`}>
        {sc.tvt < 30 ? `${sc.tvt.toFixed(1)} jaar` : "> 25 jr"}
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
  const y1 = c.real.perJaar[0];
  const nw = c.real.nettoWinst;

  // Breakdown rows
  const bdRows: { l: string; v: string; total?: boolean; color?: string; spacer?: boolean }[] = [];
  if (y1.zelf > 0) bdRows.push({ l: "Zelfconsumptie-besparing", v: `\u20AC${fmt(y1.zelf)} /jaar` });
  if (y1.arb > 0) bdRows.push({ l: "Dynamisch tarief arbitrage", v: `\u20AC${fmt(y1.arb)} /jaar` });
  if (y1.ev > 0) bdRows.push({ l: "EV slim laden (dalprijs)", v: `\u20AC${fmt(y1.ev)} /jaar` });
  if (y1.wp > 0) bdRows.push({ l: "Warmtepomp buffering", v: `\u20AC${fmt(y1.wp)} /jaar` });
  if (y1.peak > 0) bdRows.push({ l: "Peak shaving", v: `\u20AC${fmt(y1.peak)} /jaar` });
  bdRows.push({ l: "Totale jaarlijkse besparing", v: `\u20AC${fmt(y1.totaal)} /jaar`, total: true });
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
                <th>Besparing / jaar</th>
                <th>Terugverdientijd</th>
                <th>Totale besparing 15 jr</th>
                <th>Netto winst</th>
              </tr>
            </thead>
            <tbody>
              <ScenarioRow label="Conservatief" badge="voorzichtig" badgeCls="bs-c" sc={c.cons} />
              <ScenarioRow label="Realistisch" badge="verwacht" badgeCls="bs-r" sc={c.real} />
              <ScenarioRow label="Optimistisch" badge="gunstig" badgeCls="bs-o" sc={c.opti} />
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
