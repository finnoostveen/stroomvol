"use client";

import { useState } from "react";
import type { CalcResult } from "@/lib/calc";
import { batterySchedule } from "@/lib/bathtub";

interface Props {
  result: CalcResult;
}

const UREN_LABELS = ["0:00", "3:00", "6:00", "9:00", "12:00", "15:00", "18:00", "21:00"];

export default function LaadOntlaadSchema({ result: c }: Props) {
  if (c.contract !== "dynamisch") return null;

  const [seizoen, setSeizoen] = useState<"zomer" | "winter">("zomer");
  const schedule = batterySchedule(c.dynDal, c.dynPiek, c.usableKwh, c.maxBattVermogenKw, seizoen);

  // SVG dimensions
  const W = 600;
  const H = 240;
  const pad = { top: 28, right: 24, bottom: 42, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const prices = schedule.map((s) => s.prijs);
  const minP = Math.min(...prices) - 0.01;
  const maxP = Math.max(...prices) + 0.01;
  const range = maxP - minP;

  const x = (hour: number) => pad.left + (hour / 23) * plotW;
  const y = (price: number) => pad.top + (1 - (price - minP) / range) * plotH;

  const barW = plotW / 24;

  // Find zone label positions
  const ladenUren = schedule.filter((s) => s.actie === "laden");
  const ontladenUren = schedule.filter((s) => s.actie === "ontladen");
  const ladenMid = ladenUren.length > 0
    ? ladenUren[Math.floor(ladenUren.length / 2)].uur
    : -1;
  const ontladenMid = ontladenUren.length > 0
    ? ontladenUren[Math.floor(ontladenUren.length / 2)].uur
    : -1;

  // Polyline
  const points = schedule.map((s) => `${x(s.uur)},${y(s.prijs)}`).join(" ");

  return (
    <div className="card laadschema-wrap">
      <div className="card-header">
        <div className="card-icon">⚡</div>
        <div>
          <div className="card-title">Dagelijks laad/ontlaadschema</div>
          <div className="card-subtitle">Hoe de batterij slim meedraait met het prijsprofiel</div>
        </div>
      </div>

      {/* Seizoen toggle */}
      <div className="laadschema-toggle">
        <button
          type="button"
          className={`laadschema-btn${seizoen === "zomer" ? " active" : ""}`}
          onClick={() => setSeizoen("zomer")}
        >
          Zomer
        </button>
        <button
          type="button"
          className={`laadschema-btn${seizoen === "winter" ? " active" : ""}`}
          onClick={() => setSeizoen("winter")}
        >
          Winter
        </button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="laadschema-svg">
        {/* Zone background bars */}
        {schedule.map((s) => {
          if (s.actie === "laden") {
            return (
              <rect
                key={`bg${s.uur}`}
                x={pad.left + s.uur * barW}
                y={pad.top}
                width={barW}
                height={plotH}
                fill="rgba(0,200,100,0.08)"
              />
            );
          }
          if (s.actie === "ontladen") {
            return (
              <rect
                key={`bg${s.uur}`}
                x={pad.left + s.uur * barW}
                y={pad.top}
                width={barW}
                height={plotH}
                fill="rgba(255,80,80,0.08)"
              />
            );
          }
          return null;
        })}

        {/* Zone labels */}
        {ladenMid >= 0 && (
          <text
            x={x(ladenMid)}
            y={pad.top + 14}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="var(--sv-groen)"
            opacity={0.6}
          >
            LADEN
          </text>
        )}
        {ontladenMid >= 0 && (
          <text
            x={x(ontladenMid)}
            y={pad.top + 14}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#ff6b6b"
            opacity={0.6}
          >
            ONTLADEN
          </text>
        )}

        {/* Price curve */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--sv-volt)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Action icons on curve */}
        {schedule.map((s) => {
          const cx = x(s.uur);
          const cy = y(s.prijs);
          if (s.actie === "laden") {
            return (
              <g key={`ic${s.uur}`}>
                <rect x={cx - 6} y={cy - 6} width={12} height={12} rx={2} fill="var(--sv-groen)" />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">↓</text>
              </g>
            );
          }
          if (s.actie === "ontladen") {
            return (
              <g key={`ic${s.uur}`}>
                <rect x={cx - 6} y={cy - 6} width={12} height={12} rx={2} fill="#ff6b6b" />
                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">↑</text>
              </g>
            );
          }
          return (
            <circle key={`ic${s.uur}`} cx={cx} cy={cy} r={3} fill="var(--sv-grijs)" />
          );
        })}

        {/* X-axis */}
        <line
          x1={pad.left}
          y1={H - pad.bottom}
          x2={W - pad.right}
          y2={H - pad.bottom}
          stroke="var(--sv-border-light)"
          strokeWidth={1}
        />
        {UREN_LABELS.map((label, i) => (
          <text
            key={label}
            x={x(i * 3)}
            y={H - pad.bottom + 16}
            textAnchor="middle"
            fontSize="9"
            fill="var(--sv-text-muted)"
          >
            {label}
          </text>
        ))}

        {/* Y-axis labels */}
        <text x={pad.left - 4} y={y(c.dynDal) + 3} textAnchor="end" fontSize="9" fill="var(--sv-groen)">
          €{c.dynDal.toFixed(2)}
        </text>
        <text x={pad.left - 4} y={y(c.dynPiek) + 3} textAnchor="end" fontSize="9" fill="#ff6b6b">
          €{c.dynPiek.toFixed(2)}
        </text>
      </svg>

      {/* Legenda */}
      <div className="laadschema-legenda">
        <span className="laadschema-leg-item">
          <span className="laadschema-leg-icon" style={{ background: "var(--sv-groen)" }}>↓</span> Laden (goedkoop)
        </span>
        <span className="laadschema-leg-item">
          <span className="laadschema-leg-icon" style={{ background: "#ff6b6b" }}>↑</span> Ontladen (duur)
        </span>
        <span className="laadschema-leg-item">
          <span className="laadschema-leg-dot" /> Idle
        </span>
        <span className="laadschema-leg-item">
          <span className="laadschema-leg-line" /> Prijscurve
        </span>
      </div>
    </div>
  );
}
