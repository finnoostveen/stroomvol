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
    <div className="card">
      <div className="card-header">
        <div className="card-icon">☀️</div>
        <div>
          <div className="card-title">Zonnepanelen</div>
          <div className="card-subtitle">Controleer ter plekke</div>
        </div>
      </div>

      <fieldset>
        <legend>
          Zonnepanelen aanwezig? <span className="req">*</span>
        </legend>
        <div className="tg">
          {zonOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="tb"
              aria-pressed={form.zon === opt.value}
              onClick={() => onChange("zon", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {showDetail && (
        <>
          <div className="field">
            <label className="field-label">Aantal panelen</label>
            <div className="stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onChange("panelen", Math.max(1, form.panelen - 1))}
                aria-label="Minder panelen"
              >
                &minus;
              </button>
              <div className="stepper-mid">
                {form.panelen}
                <span className="stepper-sub">panelen</span>
              </div>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onChange("panelen", Math.min(60, form.panelen + 1))}
                aria-label="Meer panelen"
              >
                +
              </button>
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="in-wp">Wp per paneel</label>
            <div className="uw">
              <input
                id="in-wp"
                type="number"
                step={10}
                min={100}
                max={600}
                value={form.wpPerPaneel}
                onChange={(e) => onChange("wpPerPaneel", parseInt(e.target.value, 10) || 400)}
              />
              <span className="us">Wp</span>
            </div>
            <p className="field-hint">Check label achter paneel</p>
          </div>
        </>
      )}
    </div>
  );
}
