"use client";

import { EPEX_SHAPE } from "@/lib/constants";

interface Props {
  dynDal: number;
  dynPiek: number;
}

const UREN_LABELS = ["0:00", "3:00", "6:00", "9:00", "12:00", "15:00", "18:00", "21:00"];

export default function Badkuipmodel({ dynDal, dynPiek }: Props) {
  const spread = dynPiek - dynDal;
  const shape = EPEX_SHAPE.zomer;
  const prices = shape.map((s) => dynDal + s * (dynPiek - dynDal));
  const mediaan = [...prices].sort((a, b) => a - b)[12];
  const ladenDrempel = mediaan * 0.85;
  const ontladenDrempel = mediaan * 1.15;

  // SVG dimensions
  const W = 560;
  const H = 220;
  const pad = { top: 24, right: 20, bottom: 38, left: 52 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const minP = Math.min(...prices) - 0.01;
  const maxP = Math.max(...prices) + 0.01;
  const range = maxP - minP;

  const x = (hour: number) => pad.left + (hour / 23) * plotW;
  const y = (price: number) => pad.top + (1 - (price - minP) / range) * plotH;

  // Build polyline
  const points = prices.map((p, h) => `${x(h)},${y(p)}`).join(" ");

  // Zone rects (per hour bar)
  const barW = plotW / 24;

  return (
    <div className="badkuip-wrap">
      <div className="badkuip-header">BADKUIPMODEL — TYPISCHE DAGPRIJSCURVE</div>
      <div className="badkuip-sub">
        EPEX day-ahead: goedkoop &apos;s nachts en rond het middaguur, duur &apos;s ochtends en &apos;s avonds
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="badkuip-svg">
        {/* Zone bars */}
        {prices.map((p, h) => {
          if (p < ladenDrempel) {
            return (
              <rect
                key={`z${h}`}
                x={pad.left + h * barW}
                y={pad.top}
                width={barW}
                height={plotH}
                fill="rgba(0,200,100,0.12)"
              />
            );
          }
          if (p > ontladenDrempel) {
            return (
              <rect
                key={`z${h}`}
                x={pad.left + h * barW}
                y={pad.top}
                width={barW}
                height={plotH}
                fill="rgba(255,80,80,0.12)"
              />
            );
          }
          return null;
        })}

        {/* Mediaan stippellijn */}
        <line
          x1={pad.left}
          y1={y(mediaan)}
          x2={W - pad.right}
          y2={y(mediaan)}
          stroke="rgba(255,255,255,0.3)"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <text
          x={pad.left - 4}
          y={y(mediaan) + 3}
          textAnchor="end"
          fontSize="9"
          fill="rgba(255,255,255,0.5)"
        >
          med
        </text>

        {/* Prijscurve */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--sv-volt)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots on curve */}
        {prices.map((p, h) => (
          <circle
            key={`d${h}`}
            cx={x(h)}
            cy={y(p)}
            r={3}
            fill={
              p < ladenDrempel
                ? "var(--sv-groen)"
                : p > ontladenDrempel
                  ? "#ff6b6b"
                  : "rgba(255,255,255,0.4)"
            }
          />
        ))}

        {/* Y-axis labels */}
        <text x={pad.left - 4} y={y(dynDal) + 3} textAnchor="end" fontSize="9" fill="var(--sv-groen)">
          €{dynDal.toFixed(2)}
        </text>
        <text x={pad.left - 4} y={y(dynPiek) + 3} textAnchor="end" fontSize="9" fill="#ff6b6b">
          €{dynPiek.toFixed(2)}
        </text>

        {/* X-axis labels */}
        {UREN_LABELS.map((label, i) => (
          <text
            key={label}
            x={x(i * 3)}
            y={H - pad.bottom + 16}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.5)"
          >
            {label}
          </text>
        ))}

        {/* X-axis line */}
        <line
          x1={pad.left}
          y1={H - pad.bottom}
          x2={W - pad.right}
          y2={H - pad.bottom}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
      </svg>

      {/* Legenda */}
      <div className="badkuip-legenda">
        <span className="badkuip-leg-item">
          <span className="badkuip-leg-dot" style={{ background: "var(--sv-groen)" }} /> Laden (goedkoop)
        </span>
        <span className="badkuip-leg-item">
          <span className="badkuip-leg-dot" style={{ background: "#ff6b6b" }} /> Ontladen (duur)
        </span>
        <span className="badkuip-leg-item">
          <span className="badkuip-leg-line" /> Prijscurve
        </span>
      </div>

      {/* Info banner */}
      <div className="badkuip-banner">
        <strong>Batterijstrategie bij dynamisch tarief:</strong> Dubbele verdienlaag.
        (1) Zelfconsumptie, en (2) actieve arbitrage: laden bij lage uurprijs, ontladen bij hoge uurprijs.
      </div>

      {/* Twee kaarten */}
      <div className="badkuip-cards">
        <div className="badkuip-card">
          <div className="badkuip-card-label">ZELFCONSUMPTIE</div>
          <div className="badkuip-card-badge badkuip-card-badge--actief">Actief</div>
          <div className="badkuip-card-desc">Eigen zonnestroom &apos;s avonds verbruiken</div>
        </div>
        <div className="badkuip-card">
          <div className="badkuip-card-label">ARBITRAGE SPREAD</div>
          <div className="badkuip-card-badge badkuip-card-badge--spread">€{spread.toFixed(2)}/kWh</div>
          <div className="badkuip-card-desc">Laden bij dal, ontladen bij piek</div>
        </div>
      </div>
    </div>
  );
}
