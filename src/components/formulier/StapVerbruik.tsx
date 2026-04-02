"use client";

import type { StapProps, Profiel } from "./types";

const profielOpties: { value: Profiel; label: string }[] = [
  { value: "standaard", label: "Standaard" },
  { value: "avond-zwaar", label: "Avondzwaar" },
  { value: "overdag", label: "Overdag thuis" },
  { value: "ev-nacht", label: "EV nachtladen" },
];

export default function StapVerbruik({ form, onChange }: StapProps) {
  const verbruikError =
    form.verbruik !== "" && (isNaN(Number(form.verbruik)) || Number(form.verbruik) <= 0);

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
        <div className="tg">
          {profielOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="tb"
              aria-pressed={form.profiel === opt.value}
              onClick={() => onChange("profiel", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="field-hint">Bepaalt wanneer de klant de meeste stroom verbruikt.</p>
      </fieldset>
    </div>
  );
}
