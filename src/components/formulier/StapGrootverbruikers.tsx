"use client";

import type { StapProps, Grootverbruiker, Doel } from "./types";

const gvOpties: { value: Grootverbruiker; label: string }[] = [
  { value: "ev", label: "Elektrische auto + thuislader" },
  { value: "wp", label: "Warmtepomp (volledig elektrisch)" },
  { value: "hwp", label: "Hybride warmtepomp" },
  { value: "ac", label: "Airconditioning" },
];

const doelOpties: { value: Doel; label: string }[] = [
  { value: "zelf", label: "Zelfconsumptie verhogen" },
  { value: "handel", label: "Slim handelen (arbitrage)" },
  { value: "peak", label: "Piekverbruik beperken" },
  { value: "nood", label: "Noodstroom" },
];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export default function StapGrootverbruikers({ form, onChange }: StapProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🏠</div>
        <div>
          <div className="card-title">Grootverbruikers &amp; Doelen</div>
          <div className="card-subtitle">Wat staat er in huis? Wat wil de klant?</div>
        </div>
      </div>

      <fieldset>
        <legend>Grootverbruikers</legend>
        <div className="chk-row">
          {gvOpties.map((opt) => {
            const checked = form.gv.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`chk-item${checked ? " on" : ""}`}
                data-checked={checked}
              >
                <span className="chk-dot">
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange("gv", toggleInSet(form.gv, opt.value))}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Doelen</legend>
        <div className="chk-row">
          {doelOpties.map((opt) => {
            const checked = form.doel.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`chk-item${checked ? " on" : ""}`}
                data-checked={checked}
              >
                <span className="chk-dot">
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange("doel", toggleInSet(form.doel, opt.value))}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
