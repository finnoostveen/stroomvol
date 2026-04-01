"use client";

import type { StapProps, OmvormerType, NetAansluiting } from "./types";

const omvormerOpties: { value: OmvormerType; label: string }[] = [
  { value: "hybride", label: "Hybride" },
  { value: "standaard", label: "Standaard" },
  { value: "micro", label: "Micro" },
];

const netOpties: { value: NetAansluiting; label: string }[] = [
  { value: "1x25", label: "1\u00D725A" },
  { value: "1x35", label: "1\u00D735A" },
  { value: "3x25", label: "3\u00D725A" },
  { value: "3x63", label: "3\u00D763A" },
];

export default function StapOmvormerNet({ form, onChange }: StapProps) {
  return (
    <div>
      <h2>Omvormer &amp; Net</h2>
      <p>Check meterkast en omvormer</p>

      <fieldset>
        <legend>Omvormertype</legend>
        <div>
          {omvormerOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.omv === opt.value}
              onClick={() => onChange("omv", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Netaansluiting</legend>
        <div>
          {netOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.net === opt.value}
              onClick={() => onChange("net", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
