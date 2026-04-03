"use client";

import type { CalcResult, JaarBesparing } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

const SPAARRENTE = 0.02;

function berekenVergelijking(investering: number, perJaarData: JaarBesparing[]) {
  const jaren = [];
  let batterijWaarde = investering;
  let spaarWaarde = investering;

  for (let j = 0; j < 15; j++) {
    batterijWaarde += perJaarData[j].totaal;
    spaarWaarde *= 1 + SPAARRENTE;
    jaren.push({
      jaar: j + 1,
      batterijWaarde: Math.round(batterijWaarde),
      spaarWaarde: Math.round(spaarWaarde),
    });
  }

  const verschil = jaren[14].batterijWaarde - jaren[14].spaarWaarde;
  const factorBeter = Math.round((jaren[14].batterijWaarde / Math.max(jaren[14].spaarWaarde, 1)) * 10) / 10;

  return { jaren, investering, batterijTotaal: jaren[14].batterijWaarde, spaarTotaal: jaren[14].spaarWaarde, verschil, factorBeter };
}

const nlEuro = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 0 });

function LineChart({ jaren, investering }: { jaren: { jaar: number; batterijWaarde: number; spaarWaarde: number }[]; investering: number }) {
  const W = 700;
  const H = 300;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Alle waarden voor max schaal
  const allVals = jaren.flatMap((j) => [j.batterijWaarde, j.spaarWaarde]);
  const maxVal = Math.max(...allVals, 1);
  // Rond af naar boven op mooie stappen
  const yMax = Math.ceil(maxVal / 1000) * 1000;

  const x = (jaar: number) => padL + (jaar / 15) * plotW;
  const y = (val: number) => padT + plotH - (val / yMax) * plotH;

  // Batterij pad (start bij investering)
  const battPoints = [{ jaar: 0, val: investering }, ...jaren.map((j) => ({ jaar: j.jaar, val: j.batterijWaarde }))];
  const battPath = battPoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jaar)},${y(p.val)}`).join(" ");

  // Spaar pad (start bij investering)
  const spaarPoints = [{ jaar: 0, val: investering }, ...jaren.map((j) => ({ jaar: j.jaar, val: j.spaarWaarde }))];
  const spaarPath = spaarPoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.jaar)},${y(p.val)}`).join(" ");

  // Y-as labels (5 stappen)
  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => Math.round((yMax / ySteps) * i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }}>
      {/* Grid lijnen */}
      {yLabels.map((v) => (
        <g key={v}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="var(--sv-border)" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--sv-text-muted)" fontWeight="300">
            &euro;{nlEuro(v)}
          </text>
        </g>
      ))}

      {/* X-as labels */}
      <text x={x(0)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--sv-text-muted)" fontWeight="300">Start</text>
      {[5, 10, 15].map((j) => (
        <text key={j} x={x(j)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--sv-text-muted)" fontWeight="300">
          Jaar {j}
        </text>
      ))}

      {/* Spaar lijn (stippel, onder batterij) */}
      <path d={spaarPath} fill="none" stroke="var(--sv-grijs-donker)" strokeWidth="2" strokeDasharray="6 4" />

      {/* Batterij lijn */}
      <path d={battPath} fill="none" stroke="var(--sv-groen)" strokeWidth="2.5" />

      {/* Eindpunt dots */}
      <circle cx={x(15)} cy={y(jaren[14].batterijWaarde)} r="4" fill="var(--sv-groen)" />
      <circle cx={x(15)} cy={y(jaren[14].spaarWaarde)} r="4" fill="var(--sv-grijs-donker)" />
    </svg>
  );
}

export default function Spaarrekening({ result }: Props) {
  const data = berekenVergelijking(result.investering, result.real.perJaar);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div className="card-icon">🏦</div>
        <div>
          <div className="card-title">Beter dan de bank: Batterij vs. Spaarrekening</div>
          <div className="card-subtitle">
            Wat als je hetzelfde bedrag op een spaarrekening zou zetten? Met de huidige rente van ~2% groeit je geld een stuk langzamer.
          </div>
        </div>
      </div>

      {/* Grafiek */}
      <div style={{ marginBottom: 20 }}>
        <LineChart jaren={data.jaren} investering={data.investering} />
        <div className="spaar-legend">
          <span className="spaar-legend-item">
            <span className="spaar-legend-line spaar-legend-line--batt" /> Batterij investering
          </span>
          <span className="spaar-legend-item">
            <span className="spaar-legend-line spaar-legend-line--spaar" /> Spaarrekening (2%)
          </span>
        </div>
      </div>

      {/* Twee kaarten */}
      <div className="r2" style={{ marginBottom: 16 }}>
        <div className="spaar-total spaar-total--batt">
          <div className="spaar-total-label">Totale waarde na 15 jaar</div>
          <div className="spaar-total-val">&euro;{nlEuro(data.batterijTotaal)}</div>
          <div className="spaar-total-sub">Met batterij investering</div>
        </div>
        <div className="spaar-total spaar-total--spaar">
          <div className="spaar-total-label">Totale waarde na 15 jaar</div>
          <div className="spaar-total-val">&euro;{nlEuro(data.spaarTotaal)}</div>
          <div className="spaar-total-sub">Met spaarrekening (2%)</div>
        </div>
      </div>

      {/* Footer */}
      {data.batterijTotaal > data.spaarTotaal ? (
        <div className="spaar-footer">
          &euro;{nlEuro(data.verschil)} meer rendement — Batterij investering levert {data.factorBeter}x meer op dan sparen
        </div>
      ) : (
        <div className="spaar-footer spaar-footer--neutral">
          De batterij biedt daarnaast comfort en onafhankelijkheid die een spaarrekening niet biedt.
        </div>
      )}
    </div>
  );
}
