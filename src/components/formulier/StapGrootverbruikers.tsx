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
    <div>
      <h2>Grootverbruikers &amp; Doelen</h2>
      <p>Wat staat er in huis? Wat wil de klant?</p>

      <fieldset>
        <legend>Grootverbruikers</legend>
        <div>
          {gvOpties.map((opt) => (
            <label key={opt.value}>
              <input
                type="checkbox"
                checked={form.gv.has(opt.value)}
                onChange={() => onChange("gv", toggleInSet(form.gv, opt.value))}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Doelen</legend>
        <div>
          {doelOpties.map((opt) => (
            <label key={opt.value}>
              <input
                type="checkbox"
                checked={form.doel.has(opt.value)}
                onChange={() => onChange("doel", toggleInSet(form.doel, opt.value))}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
