"use client";

import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

const MAAND_NAMEN = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

export default function MaandKalender({ result: c }: Props) {
  if (!c.hasSolar) return null;

  const maanden = Array.from({ length: 12 }, (_, m) => {
    const opwek = Math.round(c.solarKwhMaand[m]);
    const verbruik = Math.round(c.verbruikMaand[m]);
    const batterij = Math.round(c.zelfMetMaand[m] - c.zelfZonderMaand[m]);
    const zelfPct = verbruik > 0 ? Math.round(c.zelfMetMaand[m] / verbruik * 100) : 0;
    return { naam: MAAND_NAMEN[m], opwek, verbruik, batterij, zelfPct: Math.min(zelfPct, 100) };
  });

  return (
    <div className="card mk-wrap">
      <div className="card-header">
        <div className="card-icon">📅</div>
        <div>
          <div className="card-title">Jouw energiejaar in 12 maanden</div>
          <div className="card-subtitle">Zie per maand hoe zon, verbruik en batterij samenwerken</div>
        </div>
      </div>

      <div className="mk-grid">
        {maanden.map((m) => {
          const accent =
            m.zelfPct >= 70 ? "var(--sv-groen)" :
            m.zelfPct >= 40 ? "var(--sv-volt)" :
            "var(--sv-grijs)";
          return (
            <div key={m.naam} className="mk-card">
              <div className="mk-card-naam" style={{ color: accent }}>{m.naam}</div>
              <div className="mk-card-rows">
                <div className="mk-row"><span className="mk-icon">☀️</span> <span className="mk-label">Opwek</span> <span className="mk-val">{m.opwek} kWh</span></div>
                <div className="mk-row"><span className="mk-icon">🔌</span> <span className="mk-label">Verbruik</span> <span className="mk-val">{m.verbruik} kWh</span></div>
                <div className="mk-row"><span className="mk-icon">🔋</span> <span className="mk-label">Batterij</span> <span className="mk-val">+{m.batterij} kWh</span></div>
              </div>
              <div className="mk-bar-wrap">
                <div className="mk-bar" style={{ width: `${m.zelfPct}%`, background: accent }} />
              </div>
              <div className="mk-pct" style={{ color: accent }}>{m.zelfPct}% zelfconsumptie</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
