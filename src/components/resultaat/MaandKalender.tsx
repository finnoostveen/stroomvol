"use client";

import { useState } from "react";
import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

const MAAND_NAMEN = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
const MAAND_LANG = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

export default function MaandKalender({ result: c }: Props) {
  if (!c.hasSolar) return null;

  const [hover, setHover] = useState<number | null>(null);

  const maanden = Array.from({ length: 12 }, (_, m) => {
    const verbruik = c.verbruikMaand[m];
    const directZon = c.zelfZonderMaand[m];
    const uitBatterij = c.zelfMetMaand[m] - c.zelfZonderMaand[m];
    const vanNet = verbruik - c.zelfMetMaand[m];
    const zelfPct = verbruik > 0 ? Math.round(c.zelfMetMaand[m] / verbruik * 100) : 0;
    const opwek = c.solarKwhMaand[m];
    return { verbruik, directZon, uitBatterij, vanNet: Math.max(0, vanNet), zelfPct: Math.min(zelfPct, 100), opwek };
  });

  const maxVerbruik = Math.max(...maanden.map((m) => m.verbruik));

  // Samenvatting
  const zomerMaanden = [4, 5, 6, 7];
  const winterMaanden = [10, 11, 0, 1];

  const gemZomerPct = Math.round(
    zomerMaanden.reduce((sum, m) => sum + c.zelfMetMaand[m], 0) /
    zomerMaanden.reduce((sum, m) => sum + c.verbruikMaand[m], 0) * 100
  );
  const gemWinterPct = Math.round(
    winterMaanden.reduce((sum, m) => sum + c.zelfMetMaand[m], 0) /
    winterMaanden.reduce((sum, m) => sum + c.verbruikMaand[m], 0) * 100
  );
  const gemWinterBattBijdrage = Math.round(
    winterMaanden.reduce((sum, m) => sum + (c.zelfMetMaand[m] - c.zelfZonderMaand[m]), 0) /
    winterMaanden.reduce((sum, m) => sum + c.verbruikMaand[m], 0) * 100
  );

  // SVG layout
  const svgW = 700;
  const svgH = 420;
  const labelW = 36;
  const pctW = 48;
  const barX = labelW + 8;
  const barMaxW = svgW - barX - pctW - 8;
  const barH = 24;
  const gap = 8;
  const topOffset = 30; // space for legend

  return (
    <div className="card mk-wrap">
      <div className="card-header">
        <div className="card-icon">📅</div>
        <div>
          <div className="card-title">Jouw energiejaar in 12 maanden</div>
          <div className="card-subtitle">Zie per maand hoe zon, verbruik en batterij samenwerken</div>
        </div>
      </div>

      <div className="mk-chart" style={{ position: "relative", marginTop: 16 }}>
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          style={{ display: "block", fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Legenda */}
          <circle cx={barX} cy={12} r={5} fill="#34C759" />
          <text x={barX + 10} y={16} fontSize={11} fill="#4A4A4A">Direct van zon</text>
          <circle cx={barX + 120} cy={12} r={5} fill="#2DA44E" />
          <text x={barX + 130} y={16} fontSize={11} fill="#4A4A4A">Uit batterij</text>
          <circle cx={barX + 230} cy={12} r={5} fill="#E5E5EA" />
          <text x={barX + 240} y={16} fontSize={11} fill="#4A4A4A">Van het net</text>

          {maanden.map((m, i) => {
            const y = topOffset + i * (barH + gap);
            const totalW = maxVerbruik > 0 ? (m.verbruik / maxVerbruik) * barMaxW : 0;
            const zonW = m.verbruik > 0 ? (m.directZon / m.verbruik) * totalW : 0;
            const battW = m.verbruik > 0 ? (m.uitBatterij / m.verbruik) * totalW : 0;
            const netW = totalW - zonW - battW;

            const pctColor = m.zelfPct >= 60 ? "#34C759" : m.zelfPct >= 40 ? "#FF9500" : "#8E8E93";

            return (
              <g
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "default" }}
              >
                {/* Hover highlight */}
                {hover === i && (
                  <rect
                    x={0}
                    y={y - 2}
                    width={svgW}
                    height={barH + 4}
                    rx={4}
                    fill="rgba(0,0,0,0.03)"
                  />
                )}

                {/* Maandlabel */}
                <text x={0} y={y + barH / 2 + 4} fontSize={12} fill="#4A4A4A">
                  {MAAND_NAMEN[i]}
                </text>

                {/* Stacked bar */}
                <rect x={barX} y={y} width={Math.max(0, zonW)} height={barH} rx={i === 0 || zonW === totalW ? 4 : 0} fill="#34C759" />
                <rect x={barX + zonW} y={y} width={Math.max(0, battW)} height={barH} fill="#2DA44E" />
                <rect x={barX + zonW + battW} y={y} width={Math.max(0, netW)} height={barH} rx={4} fill="#E5E5EA" />

                {/* Rounded corners: overlay rects for clean edges */}
                {totalW > 0 && (
                  <>
                    <rect x={barX} y={y} width={Math.min(4, totalW)} height={barH} rx={4} fill="#34C759" />
                    <rect x={barX + totalW - Math.min(4, totalW)} y={y} width={Math.min(4, totalW)} height={barH} rx={4} fill={netW > 0.5 ? "#E5E5EA" : battW > 0.5 ? "#2DA44E" : "#34C759"} />
                  </>
                )}

                {/* Percentage */}
                <text
                  x={barX + barMaxW + 8}
                  y={y + barH / 2 + 5}
                  fontSize={12}
                  fontWeight={700}
                  fill={pctColor}
                >
                  {m.zelfPct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hover !== null && (
          <div className="mk-tooltip" style={{
            top: topOffset + hover * (barH + gap) - 6,
            left: barX + 40,
          }}>
            <strong>{MAAND_LANG[hover]}</strong>: {Math.round(maanden[hover].opwek)} kWh opwek,{" "}
            {Math.round(maanden[hover].verbruik)} kWh verbruik,{" "}
            {Math.round(maanden[hover].uitBatterij)} kWh via batterij,{" "}
            {maanden[hover].zelfPct}% zelfconsumptie
          </div>
        )}
      </div>

      {/* Samenvatting */}
      <p className="mk-summary">
        In de zomermaanden (mei–aug) kom je voor {gemZomerPct}% rond op eigen stroom.
        In de wintermaanden (nov–feb) is dat {gemWinterPct}% — de batterij maakt het verschil van {gemWinterBattBijdrage} procentpunt.
      </p>
    </div>
  );
}
