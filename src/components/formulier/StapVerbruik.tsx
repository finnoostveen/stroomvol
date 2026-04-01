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
    <div>
      <h2>Stroomverbruik</h2>
      <p>Jaaropgave of slimme meter</p>

      <div>
        <label htmlFor="in-verbruik">
          Jaarlijks verbruik <span>*</span>
        </label>
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
        <span>kWh</span>
        {verbruikError && <p role="alert">Vul een jaarverbruik in</p>}
      </div>

      <fieldset>
        <legend>Verbruiksprofiel</legend>
        <div>
          {profielOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.profiel === opt.value}
              onClick={() => onChange("profiel", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p>Bepaalt wanneer de klant de meeste stroom verbruikt.</p>
      </fieldset>
    </div>
  );
}
