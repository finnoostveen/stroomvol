"use client";

import type { CalcResult } from "@/lib/calc";
import { PROFIEL_UURVERDELING } from "@/components/formulier/StapVerbruik";

interface Props {
  result: CalcResult;
}

const SOLAR_UUR_JUNI = [0,0,0,0,0,0.02,0.05,0.08,0.10,0.12,0.13,0.13,0.12,0.11,0.08,0.04,0.02,0,0,0,0,0,0,0];

const PROFIEL_BESCHRIJVING: Record<string, string> = {
  standaard: "Standaard huishouden: verbruik verdeeld over de dag met pieken in de ochtend (ontbijt, douche) en avond (koken, TV, wasmachine). Overdag lager verbruik door werk buitenshuis.",
  "avond-zwaar": "Avondprofiel: het grootste deel van het verbruik valt na 17:00. Typisch voor huishoudens waar iedereen overdag buitenshuis is en \u2019s avonds tegelijk thuiskomt, kookt en apparaten draait.",
  overdag: "Overdagprofiel: verbruik verspreid over de hele dag, ook tussen 9:00 en 17:00. Typisch voor thuiswerkers of gepensioneerden die overdag thuis zijn.",
  "ev-nacht": "Nachtprofiel met EV: vergelijkbaar met standaard maar met een flinke nachtelijke piek door het laden van een elektrische auto (meestal 23:00\u201306:00).",
};

export { PROFIEL_BESCHRIJVING };

function profielInsight(profiel: string, zelfPctZonder: number, zelfPctMet: number): string {
  const verbetering = zelfPctMet - zelfPctZonder;
  switch (profiel) {
    case "avond-zwaar":
      return `Jouw avondprofiel matcht minimaal met de zonne-opbrengst — slechts ${zelfPctZonder}% wordt direct benut. De batterij tilt dit naar ${zelfPctMet}%, een verbetering van ${verbetering} procentpunt. Juist bij jouw profiel heeft de batterij het meeste impact.`;
    case "overdag":
      return `Je verbruikt al ${zelfPctZonder}% direct van je zonnestroom — meer dan gemiddeld. De batterij verhoogt dit naar ${zelfPctMet}%. Het effect is kleiner dan bij een avondprofiel, maar de business case is nog steeds positief.`;
    case "ev-nacht":
      return `Door het nachtelijk laden van je EV is je verbruiksprofiel verschoven. De batterij slaat overdag zonnestroom op en levert dit 's nachts aan je auto. Zelfconsumptie stijgt van ${zelfPctZonder}% naar ${zelfPctMet}%.`;
    default:
      return `Bij jouw verbruiksprofiel wordt ${zelfPctZonder}% van de zonnestroom direct benut. Met de batterij stijgt dit naar ${zelfPctMet}% — een verbetering van ${verbetering} procentpunt.`;
  }
}

function OverlapChart({ result }: Props) {
  const m = 5; // juni
  const dagSolar = result.solarKwhMaand[m] / 30;
  const dagVerbruik = result.verbruikMaand[m] / 30;

  const solarFracties = SOLAR_UUR_JUNI;
  const solarSum = solarFracties.reduce((a, b) => a + b, 0);
  const solarUur = solarFracties.map((f) => (f / solarSum) * dagSolar);

  const verbruikFracties = PROFIEL_UURVERDELING[result.profiel];
  const verbruikSum = verbruikFracties.reduce((a, b) => a + b, 0);
  const verbruikUur = verbruikFracties.map((v) => (v / verbruikSum) * dagVerbruik);

  const W = 600;
  const H = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...solarUur, ...verbruikUur, 0.01);
  const yMax = Math.ceil(maxVal * 10) / 10; // round up to 0.1

  const x = (h: number) => pad.left + (h / 23) * plotW;
  const y = (v: number) => pad.top + plotH - (v / yMax) * plotH;
  const baseY = pad.top + plotH;

  // Build paths
  const solarPoints = solarUur.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const verbruikPoints = verbruikUur.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);

  const solarArea = `M${solarPoints.join(" L")} L${x(23).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;
  const verbruikArea = `M${verbruikPoints.join(" L")} L${x(23).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;

  // Overlap area = min(solar, verbruik)
  const overlapUur = solarUur.map((s, i) => Math.min(s, verbruikUur[i]));
  const overlapPoints = overlapUur.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const overlapArea = `M${overlapPoints.join(" L")} L${x(23).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => (yMax / ySteps) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="pv-chart">
      {/* Grid lines */}
      {yLabels.map((v) => (
        <g key={v}>
          <line x1={pad.left} y1={y(v)} x2={W - pad.right} y2={y(v)} stroke="var(--sv-border)" strokeWidth="0.5" />
          <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--sv-text-muted)">
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Solar area (yellow) */}
      <path d={solarArea} fill="rgba(255,220,60,0.25)" />
      <path d={`M${solarPoints.join(" L")}`} fill="none" stroke="#FFDC3C" strokeWidth="1.5" />

      {/* Verbruik area (grey) */}
      <path d={verbruikArea} fill="rgba(142,142,147,0.15)" />
      <path d={`M${verbruikPoints.join(" L")}`} fill="none" stroke="var(--sv-grijs-donker)" strokeWidth="1.5" />

      {/* Overlap area (green) */}
      <path d={overlapArea} fill="rgba(52,199,89,0.35)" />

      {/* X-axis labels */}
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
        <text key={h} x={x(h)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--sv-text-muted)">
          {h}:00
        </text>
      ))}

      {/* Y-axis unit */}
      <text x={pad.left - 6} y={pad.top - 4} textAnchor="end" fontSize="8" fill="var(--sv-text-muted)">kWh</text>
    </svg>
  );
}

export default function ProfielVisualisatie({ result }: Props) {
  if (!result.hasSolar) return null;

  const battPct = result.zelfPctMet - result.zelfPctZonder;
  const netPct = 100 - result.zelfPctMet;

  const profielNamen: Record<string, string> = {
    standaard: "Standaard",
    "avond-zwaar": "Avondzwaar",
    overdag: "Overdag thuis",
    "ev-nacht": "EV nachtladen",
  };

  return (
    <div className="card pv-wrap">
      <div className="card-header">
        <div className="card-icon">📊</div>
        <div>
          <div className="card-title">Jouw verbruiksprofiel</div>
          <div className="card-subtitle">Hoe jouw verbruik samenwerkt met de zon — voorbeeld junidag</div>
        </div>
      </div>

      <p className="pv-beschrijving">{PROFIEL_BESCHRIJVING[result.profiel]}</p>

      <OverlapChart result={result} />

      {/* Legenda */}
      <div className="pv-legenda">
        <span className="pv-leg"><span className="pv-leg-dot" style={{ background: "#FFDC3C" }} /> Zonne-opbrengst</span>
        <span className="pv-leg"><span className="pv-leg-dot" style={{ background: "var(--sv-grijs-donker)" }} /> Verbruik</span>
        <span className="pv-leg"><span className="pv-leg-dot" style={{ background: "#34C759" }} /> Direct verbruikt</span>
        <span className="pv-leg"><span className="pv-leg-dot" style={{ background: "rgba(255,220,60,0.5)" }} /> Overschot → batterij</span>
      </div>

      {/* Metrics */}
      <div className="pv-metrics">
        <div className="pv-metric">
          <div className="pv-metric-val">{result.zelfPctZonder}%</div>
          <div className="pv-metric-label">Direct verbruik</div>
          <div className="pv-metric-sub">van zonnestroom direct benut</div>
        </div>
        <div className="pv-metric">
          <div className="pv-metric-val pv-metric-val--groen">{battPct}%</div>
          <div className="pv-metric-label">Naar batterij</div>
          <div className="pv-metric-sub">opgeslagen voor later</div>
        </div>
        <div className="pv-metric">
          <div className="pv-metric-val pv-metric-val--grijs">{netPct}%</div>
          <div className="pv-metric-label">Van het net</div>
          <div className="pv-metric-sub">aanvullend van het net</div>
        </div>
      </div>

      {/* Insight */}
      <p className="pv-insight">
        {profielInsight(result.profiel, result.zelfPctZonder, result.zelfPctMet)}
      </p>
    </div>
  );
}
