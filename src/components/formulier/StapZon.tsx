"use client";

import type { StapProps, ZonStatus } from "./types";

const zonOpties: { value: ZonStatus; label: string }[] = [
  { value: "ja", label: "Ja" },
  { value: "nee", label: "Nee" },
  { value: "gepland", label: "Gepland" },
];

export default function StapZon({ form, onChange }: StapProps) {
  const showDetail = form.zon === "ja" || form.zon === "gepland";

  return (
    <div>
      <h2>Zonnepanelen</h2>
      <p>Controleer ter plekke</p>

      <fieldset>
        <legend>
          Zonnepanelen aanwezig? <span>*</span>
        </legend>
        <div>
          {zonOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.zon === opt.value}
              onClick={() => onChange("zon", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {showDetail && (
        <div>
          <div>
            <label>Aantal panelen</label>
            <div>
              <button
                type="button"
                onClick={() => onChange("panelen", Math.max(1, form.panelen - 1))}
                aria-label="Minder panelen"
              >
                &minus;
              </button>
              <span>{form.panelen} panelen</span>
              <button
                type="button"
                onClick={() => onChange("panelen", Math.min(60, form.panelen + 1))}
                aria-label="Meer panelen"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="in-wp">Wp per paneel</label>
            <input
              id="in-wp"
              type="number"
              step={10}
              min={100}
              max={600}
              value={form.wpPerPaneel}
              onChange={(e) => onChange("wpPerPaneel", parseInt(e.target.value, 10) || 400)}
            />
            <span>Wp</span>
            <p>Check label achter paneel</p>
          </div>
        </div>
      )}
    </div>
  );
}
