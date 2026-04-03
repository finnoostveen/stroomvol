"use client";

import type { StapProps, Profiel } from "./types";

const PROFIEL_UURVERDELING: Record<Profiel, number[]> = {
  standaard:     [2,2,2,2,2,3,5,7,5,4,3,3,3,3,3,4,5,7,8,7,5,4,3,2],
  "avond-zwaar": [2,2,1,1,1,2,3,5,4,3,2,2,2,2,3,4,6,9,10,8,6,4,3,2],
  overdag:       [2,2,2,2,2,3,4,5,5,5,5,5,5,5,5,5,5,6,7,6,5,4,3,2],
  "ev-nacht":    [5,5,5,4,3,3,4,6,5,4,3,3,3,3,3,4,5,7,8,7,5,4,5,5],
};

const PROFIEL_META: Record<Profiel, { label: string; beschrijving: string; hint: string }> = {
  standaard: {
    label: "Standaard",
    beschrijving: "Ochtend- en avondpieken, overdag lager verbruik",
    hint: "Bij een standaard profiel verbruik je ~30% van je zonnestroom direct. De batterij slaat het overige op voor 's avonds.",
  },
  "avond-zwaar": {
    label: "Avondzwaar",
    beschrijving: "Meeste verbruik na 17:00",
    hint: "Bij een avondprofiel matcht je verbruik slecht met zonne-opbrengst. Een batterij heeft hier het meeste effect.",
  },
  overdag: {
    label: "Overdag thuis",
    beschrijving: "Verspreid verbruik, ook overdag actief",
    hint: "Je verbruikt al veel tijdens zonne-uren — minder overschot voor de batterij, maar ook minder nodig.",
  },
  "ev-nacht": {
    label: "EV nachtladen",
    beschrijving: "Piek 's avonds + nachtelijk laden",
    hint: "De EV laadt 's nachts uit de batterij, die overdag is gevuld met zonnestroom.",
  },
};

function MiniDagCurve({ profiel, active }: { profiel: Profiel; active: boolean }) {
  const uur = PROFIEL_UURVERDELING[profiel];
  const max = Math.max(...uur);
  const W = 200;
  const H = 60;
  const padT = 4;
  const padB = 2;
  const plotH = H - padT - padB;

  // Build area path
  const stepW = W / 23;
  const points = uur.map((v, i) => ({
    x: i * stepW,
    y: padT + plotH - (v / max) * plotH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  // Find peak hours (top 25% values)
  const threshold = max * 0.75;
  const peakRanges: { start: number; end: number }[] = [];
  let inPeak = false;
  let peakStart = 0;
  for (let i = 0; i < 24; i++) {
    if (uur[i] >= threshold && !inPeak) {
      inPeak = true;
      peakStart = i;
    } else if ((uur[i] < threshold || i === 23) && inPeak) {
      const endI = uur[i] >= threshold ? i : i - 1;
      peakRanges.push({ start: peakStart, end: endI });
      inPeak = false;
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="60" style={{ display: "block" }}>
      {/* Peak highlight zones */}
      {peakRanges.map((r, idx) => (
        <rect
          key={idx}
          x={r.start * stepW}
          y={padT}
          width={(r.end - r.start + 1) * stepW}
          height={plotH}
          fill={active ? "rgba(255,220,60,0.15)" : "rgba(255,220,60,0.08)"}
          rx={2}
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={active ? "rgba(255,220,60,0.25)" : "rgba(255,220,60,0.12)"} />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#FFDC3C" strokeWidth={active ? 2 : 1.5} opacity={active ? 1 : 0.6} />
    </svg>
  );
}

export { PROFIEL_UURVERDELING };

export default function StapVerbruik({ form, onChange }: StapProps) {
  const verbruikError =
    form.verbruik !== "" && (isNaN(Number(form.verbruik)) || Number(form.verbruik) <= 0);

  const meta = PROFIEL_META[form.profiel];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">⚡</div>
        <div>
          <div className="card-title">Stroomverbruik</div>
          <div className="card-subtitle">Jaaropgave of slimme meter</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="in-verbruik">
          Jaarlijks verbruik <span className="req">*</span>
        </label>
        <div className="uw">
          <input
            id="in-verbruik"
            type="number"
            placeholder="bijv. 3500"
            min={0}
            max={99999}
            value={form.verbruik}
            aria-invalid={verbruikError || undefined}
            onChange={(e) => onChange("verbruik", e.target.value)}
          />
          <span className="us">kWh</span>
        </div>
        {verbruikError && <p className="field-error" role="alert">Vul een jaarverbruik in</p>}
      </div>

      <fieldset>
        <legend>Verbruiksprofiel</legend>
        <div className="profiel-grid">
          {(Object.keys(PROFIEL_META) as Profiel[]).map((p) => {
            const m = PROFIEL_META[p];
            const active = form.profiel === p;
            return (
              <button
                key={p}
                type="button"
                className={`profiel-card${active ? " active" : ""}`}
                aria-pressed={active}
                onClick={() => onChange("profiel", p)}
              >
                <div className="profiel-card-label">{m.label}</div>
                <div className="profiel-card-desc">{m.beschrijving}</div>
                <MiniDagCurve profiel={p} active={active} />
              </button>
            );
          })}
        </div>
        {/* Impact hint */}
        <p className="profiel-hint">
          <span className="profiel-hint-icon">ⓘ</span> {meta.hint}
        </p>
      </fieldset>
    </div>
  );
}
