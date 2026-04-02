"use client";

import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

function berekenStressTest(calc: CalcResult) {
  const m = 11; // december
  const dagVerbruikDec = calc.verbruikMaand[m] / 31;
  const dagSolarDec = calc.solarKwhMaand[m] / 31;
  const dagSolarStress = dagSolarDec * 0.3;
  const dagVerbruikStress = dagVerbruikDec * 1.2;
  const weekVerbruik = dagVerbruikStress * 7;
  const weekSolar = dagSolarStress * 7;
  const weekNetNodig = Math.max(0, weekVerbruik - weekSolar);

  let tariefStress: number;
  if (calc.contract === "dynamisch") {
    tariefStress = (calc.dynGem + calc.dynPiek) / 2;
  } else {
    tariefStress = calc.tarief;
  }
  const kostenZonder = Math.round(weekNetNodig * tariefStress * 100) / 100;

  const dagBattBesparing = calc.usableKwh * (calc.eff / 100);
  let kostenMet: number;

  if (calc.contract === "dynamisch") {
    // Bij dynamisch: batterij laadt bij dal, ontlaadt bij piek.
    // Besparing = batterij-kWh × (piektarief − daltarief) per cyclus.
    // In een stressweek draait de batterij 1 volledige cyclus per dag.
    const dagBesparing = dagBattBesparing * (calc.dynPiek - calc.dynDal);
    const weekBesparing = dagBesparing * 7;

    console.log("[StressTest debug]", {
      usableKwh: calc.usableKwh,
      eff: calc.eff,
      dynPiek: calc.dynPiek,
      dynDal: calc.dynDal,
      spread: calc.dynPiek - calc.dynDal,
      dagBattBesparing,
      dagBesparing,
      weekBesparing,
      kostenZonder,
    });

    kostenMet = Math.round(Math.max(0, kostenZonder - weekBesparing) * 100) / 100;
  } else {
    const weekZelfconsumptieBesparing =
      Math.min(dagBattBesparing, dagSolarStress) * 7 * (tariefStress - calc.terug);
    kostenMet = Math.round(Math.max(0, kostenZonder - weekZelfconsumptieBesparing) * 100) / 100;
  }

  const besparingPct = kostenZonder > 0 ? Math.round((1 - kostenMet / kostenZonder) * 100) : 0;

  return {
    kostenZonder,
    kostenMet,
    besparingPct,
    weekVerbruik: Math.round(weekVerbruik),
  };
}

const nlEuro = (n: number) =>
  n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StressTest({ result }: Props) {
  // Verberg bij vast/variabel contract zonder zonnepanelen
  if (!result.hasSolar && result.contract !== "dynamisch") return null;

  const data = berekenStressTest(result);
  const lowSaving = data.besparingPct < 15;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <div className="card-icon">🌧️</div>
        <div>
          <div className="card-title">Stress Test: Slecht weer week</div>
          <div className="card-subtitle">Wat kost een winterweek met minimale zon en hoge prijzen?</div>
        </div>
      </div>

      <div className="stress-grid">
        {/* Scenario kaart */}
        <div className="stress-card stress-card--scenario">
          <div className="stress-card-icon">☁️</div>
          <div className="stress-card-label">Scenario</div>
          <p className="stress-card-desc">
            Week in december met minimale zonnestraling, hoge energieprijzen en extra verwarming.
          </p>
          <div className="stress-card-meta">
            {data.weekVerbruik.toLocaleString("nl-NL")} kWh weekverbruik
          </div>
        </div>

        {/* Zonder batterij */}
        <div className="stress-card stress-card--zonder">
          <div className="stress-card-icon">⚠️</div>
          <div className="stress-card-label">Zonder batterij</div>
          <div className="stress-card-amount">&euro;{nlEuro(data.kostenZonder)}</div>
          <div className="stress-card-sub">Energiekosten per week</div>
        </div>

        {/* Met batterij */}
        <div className="stress-card stress-card--met">
          <div className="stress-card-icon">✅</div>
          <div className="stress-card-label">Met batterij{result.contract === "dynamisch" ? " + handel" : ""}</div>
          <div className="stress-card-amount">&euro;{nlEuro(data.kostenMet)}</div>
          <div className="stress-card-sub">Energiekosten per week</div>
          {data.besparingPct >= 10 && (
            <span className="stress-badge">{data.besparingPct}% besparing</span>
          )}
        </div>
      </div>

      {lowSaving && (
        <div className="info-box" style={{ marginTop: 12 }}>
          Bij een vast tarief is de weekbesparing beperkt. De batterij verdient zich vooral terug over het hele jaar door zelfconsumptie.
        </div>
      )}
    </div>
  );
}
