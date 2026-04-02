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
  let dagArbitrageBesparing = 0;
  let weekBesparing = 0;

  if (calc.contract === "dynamisch") {
    dagArbitrageBesparing = dagBattBesparing * (calc.dynPiek - calc.dynDal);
    weekBesparing = dagArbitrageBesparing * 7;
    kostenMet = Math.round(Math.max(0, kostenZonder - weekBesparing) * 100) / 100;
  } else {
    const weekZelfconsumptieBesparing =
      Math.min(dagBattBesparing, dagSolarStress) * 7 * (tariefStress - calc.terug);
    weekBesparing = weekZelfconsumptieBesparing;
    kostenMet = Math.round(Math.max(0, kostenZonder - weekZelfconsumptieBesparing) * 100) / 100;
  }

  const besparingPct = kostenZonder > 0 ? Math.round((1 - kostenMet / kostenZonder) * 100) : 0;

  return {
    kostenZonder,
    kostenMet,
    besparingPct,
    weekVerbruik: Math.round(weekVerbruik),
    // Debug tussenwaarden
    _debug: {
      dagBattBesparing,
      dagArbitrageBesparing,
      weekBesparing,
      dagSolarStress,
      tariefStress,
      weekNetNodig,
    },
  };
}

const d = (v: unknown) => (v === undefined ? "UNDEFINED" : v === null ? "NULL" : String(v));
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

      {/* DEBUG BLOK — TIJDELIJK */}
      <div style={{
        marginTop: 16,
        padding: 14,
        background: "#F0F0F0",
        borderRadius: 8,
        fontSize: 11,
        fontFamily: "monospace",
        color: "#555",
        lineHeight: 1.8,
      }}>
        <strong style={{ fontSize: 12, color: "#333" }}>🔍 DEBUG — Stress Test tussenwaarden</strong>
        <br />
        <strong>calc output:</strong>
        <br />
        &nbsp;&nbsp;calc.usableKwh = {d(result.usableKwh)}
        <br />
        &nbsp;&nbsp;calc.eff = {d(result.eff)}
        <br />
        &nbsp;&nbsp;calc.dynPiek = {d(result.dynPiek)}
        <br />
        &nbsp;&nbsp;calc.dynDal = {d(result.dynDal)}
        <br />
        &nbsp;&nbsp;calc.tarief = {d(result.tarief)}
        <br />
        &nbsp;&nbsp;calc.terug = {d(result.terug)}
        <br />
        &nbsp;&nbsp;calc.contract = {d(result.contract)}
        <br />
        &nbsp;&nbsp;calc.verbruikMaand[11] = {d(result.verbruikMaand?.[11])}
        <br />
        &nbsp;&nbsp;calc.solarKwhMaand[11] = {d(result.solarKwhMaand?.[11])}
        <br />
        &nbsp;&nbsp;calc.aanbevolenKwh = {d(result.aanbevolenKwh)}
        <br />
        &nbsp;&nbsp;calc.dod = {d(result.dod)}
        <br />
        <br />
        <strong>berekende tussenwaarden:</strong>
        <br />
        &nbsp;&nbsp;dagBattBesparing = {d(data._debug.dagBattBesparing)} (usableKwh * eff/100)
        <br />
        &nbsp;&nbsp;dagArbitrageBesparing = {d(data._debug.dagArbitrageBesparing)} (dagBatt * spread)
        <br />
        &nbsp;&nbsp;weekBesparing = {d(data._debug.weekBesparing)} (dagArb * 7)
        <br />
        &nbsp;&nbsp;tariefStress = {d(data._debug.tariefStress)}
        <br />
        &nbsp;&nbsp;weekNetNodig = {d(data._debug.weekNetNodig)}
        <br />
        &nbsp;&nbsp;dagSolarStress = {d(data._debug.dagSolarStress)}
        <br />
        <br />
        <strong>resultaat:</strong>
        <br />
        &nbsp;&nbsp;kostenZonder = &euro;{d(data.kostenZonder)}
        <br />
        &nbsp;&nbsp;kostenMet = &euro;{d(data.kostenMet)}
        <br />
        &nbsp;&nbsp;besparingPct = {d(data.besparingPct)}%
      </div>
    </div>
  );
}
