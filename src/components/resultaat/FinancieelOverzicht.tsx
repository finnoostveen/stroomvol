"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

export default function FinancieelOverzicht({ result: c }: Props) {
  const nw = c.real.nettoWinst;
  const n = c.real.perJaar.length;

  const gem = {
    zelf: Math.round(c.real.perJaar.reduce((s, j) => s + j.zelf, 0) / n),
    arb: Math.round(c.real.perJaar.reduce((s, j) => s + j.arb, 0) / n),
    ev: Math.round(c.real.perJaar.reduce((s, j) => s + j.ev, 0) / n),
    wp: Math.round(c.real.perJaar.reduce((s, j) => s + j.wp, 0) / n),
    peak: Math.round(c.real.perJaar.reduce((s, j) => s + j.peak, 0) / n),
    totaal: Math.round(c.real.total15 / n),
  };

  const bdRows: { l: string; v: string; total?: boolean; color?: string; spacer?: boolean }[] = [];
  if (gem.zelf > 0) bdRows.push({ l: "Zelfconsumptie-besparing", v: `\u20AC${fmt(gem.zelf)} /jaar` });
  if (gem.arb > 0) bdRows.push({ l: c.contract === "dynamisch" ? "Dynamisch tarief arbitrage" : "Slim laden (dal/piek)", v: `\u20AC${fmt(gem.arb)} /jaar` });
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
    <div className="bdown">
      <div className="bdown-title">Financieel overzicht &amp; besparingsopbouw</div>
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
  );
}
