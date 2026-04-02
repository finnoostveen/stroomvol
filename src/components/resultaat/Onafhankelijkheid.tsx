"use client";

import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

function berekenOnafhankelijkheid(calc: CalcResult) {
  const totaalVerbruik = calc.totaalVerbruik;
  const directZon = Math.round(calc.zelfZonderJaar || 0);
  const uitBatterij = Math.round((calc.zelfMetJaar || 0) - (calc.zelfZonderJaar || 0));
  const vanNet = Math.round(totaalVerbruik - (calc.zelfMetJaar || 0));
  const pctDirectZon = Math.round((directZon / totaalVerbruik) * 100);
  const pctBatterij = Math.round((uitBatterij / totaalVerbruik) * 100);
  const pctNet = 100 - pctDirectZon - pctBatterij;
  const pctOnafhankelijk = pctDirectZon + pctBatterij;

  return { directZon, uitBatterij, vanNet, pctDirectZon, pctBatterij, pctNet, pctOnafhankelijk };
}

function DonutChart({ pctDirectZon, pctBatterij, pctNet, pctOnafhankelijk }: {
  pctDirectZon: number;
  pctBatterij: number;
  pctNet: number;
  pctOnafhankelijk: number;
}) {
  const r = 70;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;

  // Segments: groen (directZon), donkergroen (batterij), grijs (net)
  const seg1Len = (pctDirectZon / 100) * circumference;
  const seg2Len = (pctBatterij / 100) * circumference;
  const seg3Len = (pctNet / 100) * circumference;

  const seg1Offset = 0;
  const seg2Offset = -(seg1Len);
  const seg3Offset = -(seg1Len + seg2Len);

  return (
    <svg viewBox="0 0 200 200" width="200" height="200" style={{ maxWidth: "100%" }}>
      {/* Achtergrond cirkel */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--sv-grijs)" strokeWidth="20" />
      {/* Net segment (onderlaag, volle cirkel als basis) */}
      {pctNet > 0 && (
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--sv-grijs)"
          strokeWidth="20"
          strokeDasharray={`${seg3Len} ${circumference - seg3Len}`}
          strokeDashoffset={seg3Offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {/* Batterij segment */}
      {pctBatterij > 0 && (
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--sv-groen-donker)"
          strokeWidth="20"
          strokeDasharray={`${seg2Len} ${circumference - seg2Len}`}
          strokeDashoffset={seg2Offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {/* Direct zon segment */}
      {pctDirectZon > 0 && (
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="var(--sv-groen)"
          strokeWidth="20"
          strokeDasharray={`${seg1Len} ${circumference - seg1Len}`}
          strokeDashoffset={seg1Offset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      {/* Center tekst */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="28" fontWeight="800" fill="var(--sv-text)"
        style={{ fontFamily: "var(--sv-font-heading), 'Syne', sans-serif" }}>
        {pctOnafhankelijk}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--sv-text-muted)" fontWeight="400">
        Onafhankelijk
      </text>
    </svg>
  );
}

function ProgressBar({ pct, color, label, kwh }: { pct: number; color: string; label: string; kwh: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--sv-text-muted)", fontWeight: 300 }}>
          {kwh.toLocaleString("nl-NL")} kWh — {pct}%
        </span>
      </div>
      <div style={{ height: 8, background: "var(--sv-border-light)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function Onafhankelijkheid({ result }: Props) {
  if (!result.hasSolar) return null;

  const data = berekenOnafhankelijkheid(result);

  const footerText = data.pctOnafhankelijk < 20
    ? "Overweeg meer zonnepanelen voor hogere onafhankelijkheid."
    : `${data.pctOnafhankelijk}% van je verbruik uit eigen opwek (was ${result.zelfPctZonder}% zonder batterij)`;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div className="card-icon">🔋</div>
        <div>
          <div className="card-title">Energie Onafhankelijkheid</div>
          <div className="card-subtitle">Hoeveel stroom produceer en verbruik je zelf</div>
        </div>
      </div>

      <div className="onafh-grid">
        {/* Links: Donut */}
        <div className="onafh-donut">
          <DonutChart
            pctDirectZon={data.pctDirectZon}
            pctBatterij={data.pctBatterij}
            pctNet={data.pctNet}
            pctOnafhankelijk={data.pctOnafhankelijk}
          />
        </div>

        {/* Rechts: Bars */}
        <div className="onafh-bars">
          <ProgressBar pct={data.pctDirectZon} color="var(--sv-groen)" label="Direct zonneverbruik" kwh={data.directZon} />
          <ProgressBar pct={data.pctBatterij} color="var(--sv-groen-donker)" label="Uit batterij" kwh={data.uitBatterij} />
          <ProgressBar pct={data.pctNet} color="var(--sv-grijs)" label="Van het net" kwh={data.vanNet} />
        </div>
      </div>

      {/* Footer banner */}
      <div className="onafh-footer">
        {footerText}
      </div>
    </div>
  );
}
