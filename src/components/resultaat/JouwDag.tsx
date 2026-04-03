"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

type DagType = "zomer" | "winter" | "stress";

const DAG_LABELS: { id: DagType; label: string }[] = [
  { id: "zomer", label: "Zomerse werkdag" },
  { id: "winter", label: "Winterse werkdag" },
  { id: "stress", label: "Bewolkte winterdag" },
];

const SOLAR_PROFIEL: Record<DagType, number[]> = {
  zomer:  [0,0,0,0,0,0.02,0.05,0.08,0.10,0.12,0.13,0.13,0.12,0.11,0.08,0.04,0.02,0,0,0,0,0,0,0],
  winter: [0,0,0,0,0,0,0,0,0.04,0.08,0.12,0.15,0.16,0.15,0.12,0.08,0.06,0.04,0,0,0,0,0,0],
  stress: [0,0,0,0,0,0,0,0,0.02,0.04,0.05,0.06,0.06,0.05,0.04,0.02,0.01,0,0,0,0,0,0,0],
};

const VERBRUIK_PROFIEL = [0.02,0.02,0.02,0.02,0.02,0.02,0.04,0.06,0.05,0.04,0.03,0.03,0.04,0.04,0.03,0.03,0.04,0.06,0.08,0.07,0.06,0.05,0.04,0.03];

interface UurData {
  uur: number;
  solar: number;
  verbruik: number;
  directZon: number;
  batterijLaad: number;
  batterijOntlaad: number;
  vanNet: number;
  naarNet: number;
  soc: number;
}

function simuleerDag(c: CalcResult, dagType: DagType): UurData[] {
  const maandIdx = dagType === "zomer" ? 5 : 11;
  const dagSolar = c.solarKwhMaand[maandIdx] / 30;
  const dagVerbruik = c.verbruikMaand[maandIdx] / 30;
  const stressFactor = dagType === "stress" ? 1.3 : 1.0;
  const usable = c.usableKwh;

  let soc = 0.3;
  return Array.from({ length: 24 }, (_, h) => {
    const solar = dagSolar * SOLAR_PROFIEL[dagType][h];
    const verbruik = dagVerbruik * VERBRUIK_PROFIEL[h] * stressFactor;
    const directZon = Math.min(solar, verbruik);
    let surplus = solar - directZon;
    let tekort = verbruik - directZon;
    let batterijLaad = 0;
    let batterijOntlaad = 0;
    let naarNet = 0;

    if (surplus > 0 && soc < 0.95) {
      const ruimte = (0.95 - soc) * usable;
      batterijLaad = Math.min(surplus, ruimte);
      surplus -= batterijLaad;
      soc += batterijLaad / usable;
    }
    naarNet = surplus;

    if (tekort > 0 && soc > 0.10) {
      const beschikbaar = (soc - 0.10) * usable;
      batterijOntlaad = Math.min(tekort, beschikbaar);
      tekort -= batterijOntlaad;
      soc -= batterijOntlaad / usable;
    }
    const vanNet = tekort;

    return { uur: h, solar, verbruik, directZon, batterijLaad, batterijOntlaad, vanNet, naarNet, soc };
  });
}

function beschrijfUur(d: UurData): string {
  const parts: string[] = [];
  if (d.solar > 0.01) parts.push(`Panelen produceren ${d.solar.toFixed(1)} kWh`);
  parts.push(`Huis verbruikt ${d.verbruik.toFixed(1)} kWh`);
  if (d.batterijLaad > 0.01) parts.push(`Batterij laadt ${d.batterijLaad.toFixed(1)} kWh`);
  if (d.batterijOntlaad > 0.01) parts.push(`Batterij levert ${d.batterijOntlaad.toFixed(1)} kWh`);
  if (d.vanNet > 0.01) parts.push(`${d.vanNet.toFixed(1)} kWh van het net`);
  if (d.naarNet > 0.01) parts.push(`${d.naarNet.toFixed(1)} kWh naar het net`);
  return `${String(d.uur).padStart(2, "0")}:00 — ${parts.join(". ")}.`;
}

export default function JouwDag({ result }: Props) {
  const [dagType, setDagType] = useState<DagType>("zomer");
  const [currentHour, setCurrentHour] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const data = simuleerDag(result, dagType);

  const stopPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    stopPlay();
    setCurrentHour(0);
    setPlaying(true);
    let h = 0;
    intervalRef.current = setInterval(() => {
      h += 1;
      if (h >= 23) {
        setCurrentHour(23);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPlaying(false);
      } else {
        setCurrentHour(h);
      }
    }, 500);
  }, [stopPlay]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // SVG chart
  const W = 600;
  const H = 200;
  const pad = { top: 16, right: 20, bottom: 32, left: 8 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const barW = plotW / 24;

  const maxVal = Math.max(...data.map((d) => d.verbruik), ...data.map((d) => d.solar), 0.01);
  const yScale = (v: number) => (v / maxVal) * plotH;

  return (
    <div className="card jd-wrap">
      <div className="card-header">
        <div className="card-icon">🏠</div>
        <div>
          <div className="card-title">Jouw typische dag</div>
          <div className="card-subtitle">Volg de energiestroom door je huis — uur voor uur</div>
        </div>
      </div>

      {/* Dagtype selector */}
      <div className="jd-toggle">
        {DAG_LABELS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`jd-btn${dagType === d.id ? " active" : ""}`}
            onClick={() => { setDagType(d.id); setCurrentHour(0); stopPlay(); }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* SVG stacked bars */}
      <svg viewBox={`0 0 ${W} ${H}`} className="jd-svg">
        {data.map((d) => {
          const bx = pad.left + d.uur * barW + 2;
          const bw = barW - 4;
          const baseY = pad.top + plotH;
          // Stack: directZon (bottom), batterijOntlaad, batterijLaad, vanNet
          const hZon = yScale(d.directZon);
          const hBattOnt = yScale(d.batterijOntlaad);
          const hBattLaad = yScale(d.batterijLaad);
          const hNet = yScale(d.vanNet);

          let y = baseY;
          const rects: { fill: string; h: number; y: number }[] = [];

          // directZon
          y -= hZon;
          if (hZon > 0.5) rects.push({ fill: "#FFDC3C", h: hZon, y });
          // batterijOntlaad
          y -= hBattOnt;
          if (hBattOnt > 0.5) rects.push({ fill: "#34C759", h: hBattOnt, y });
          // batterijLaad
          y -= hBattLaad;
          if (hBattLaad > 0.5) rects.push({ fill: "#2DA44E", h: hBattLaad, y });
          // vanNet
          y -= hNet;
          if (hNet > 0.5) rects.push({ fill: "#E5E5EA", h: hNet, y });

          const isActive = d.uur === currentHour;

          return (
            <g key={d.uur} opacity={isActive ? 1 : 0.7}>
              {rects.map((r, i) => (
                <rect key={i} x={bx} y={r.y} width={bw} height={r.h} rx={2} fill={r.fill} />
              ))}
              {isActive && (
                <rect x={bx - 1} y={pad.top} width={bw + 2} height={plotH} rx={2} fill="none" stroke="var(--sv-volt)" strokeWidth={1.5} />
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <text
            key={h}
            x={pad.left + h * barW + barW / 2}
            y={H - pad.bottom + 16}
            textAnchor="middle"
            fontSize="9"
            fill="var(--sv-text-muted)"
          >
            {h}:00
          </text>
        ))}
      </svg>

      {/* Legenda */}
      <div className="jd-legenda">
        <span className="jd-leg"><span className="jd-leg-dot" style={{ background: "#FFDC3C" }} /> Direct zon</span>
        <span className="jd-leg"><span className="jd-leg-dot" style={{ background: "#34C759" }} /> Uit batterij</span>
        <span className="jd-leg"><span className="jd-leg-dot" style={{ background: "#2DA44E" }} /> Batterij laadt</span>
        <span className="jd-leg"><span className="jd-leg-dot" style={{ background: "#E5E5EA" }} /> Van het net</span>
      </div>

      {/* Ticker */}
      <div className="jd-ticker">
        <p className="jd-ticker-text">{beschrijfUur(data[currentHour])}</p>
      </div>

      {/* Controls */}
      <div className="jd-controls">
        <button type="button" className="jd-play" onClick={playing ? stopPlay : startPlay}>
          {playing ? "⏸ Pauzeer" : "▶ Afspelen"}
        </button>
        <input
          type="range"
          min={0}
          max={23}
          step={1}
          value={currentHour}
          onChange={(e) => { stopPlay(); setCurrentHour(Number(e.target.value)); }}
          className="jd-slider"
        />
        <span className="jd-hour">{String(currentHour).padStart(2, "0")}:00</span>
      </div>
    </div>
  );
}
