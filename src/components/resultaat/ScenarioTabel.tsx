"use client";

import type { CalcResult, ScenarioResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";
import InfoTip from "./InfoTip";

interface Props {
  result: CalcResult;
}

function ScenarioRow({
  label,
  badge,
  badgeCls,
  sc,
  investering,
  tip,
}: {
  label: string;
  badge: string;
  badgeCls: string;
  sc: ScenarioResult;
  investering: number;
  tip?: string;
}) {
  const nettoColor = sc.nettoWinst >= 0 ? "var(--sv-groen)" : "var(--sv-rood)";
  const isReal = badgeCls === "bs-r";
  const tvt = berekenCumulatieveTvt(sc, investering);

  return (
    <tr>
      <td>
        {label} <span className={`bs ${badgeCls}`}>{badge}</span>
        {tip && <InfoTip tekst={tip} />}
      </td>
      <td className={`v${isReal ? " hl" : ""}`}>&euro;{fmt(Math.round(sc.total15 / 15))}</td>
      <td className={`v${isReal ? " hl" : ""}`}>
        {formatTvt(tvt)}
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

export default function ScenarioTabel({ result: c }: Props) {
  return (
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
            <ScenarioRow label="Conservatief" badge="voorzichtig" badgeCls="bs-c" sc={c.cons} investering={c.investering}
              tip="Hogere degradatie, geen prijsstijging, lagere opbrengst. Worst-case indicatie." />
            <ScenarioRow label="Realistisch" badge="verwacht" badgeCls="bs-r" sc={c.real} investering={c.investering}
              tip="Verwachte degradatie (~2%/jr), gematigde prijsstijging en gemiddelde opbrengst." />
            <ScenarioRow label="Optimistisch" badge="gunstig" badgeCls="bs-o" sc={c.opti} investering={c.investering}
              tip="Lage degradatie, hogere prijsstijging en gunstige marktomstandigheden." />
          </tbody>
        </table>
      </div>
    </div>
  );
}
