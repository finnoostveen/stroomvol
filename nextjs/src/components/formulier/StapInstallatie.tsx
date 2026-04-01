"use client";

import type { StapProps, Locatie, Eigendom, Afstand, Muur } from "./types";

const locOpties: { value: Locatie; label: string }[] = [
  { value: "binnen", label: "Binnen" },
  { value: "buiten", label: "Buiten" },
];

const eigOpties: { value: Eigendom; label: string }[] = [
  { value: "koop", label: "Koop" },
  { value: "huur", label: "Huur" },
];

const afstOpties: { value: Afstand; label: string }[] = [
  { value: "<10m", label: "<10m" },
  { value: ">10m", label: ">10m" },
];

const muurOpties: { value: Muur; label: string }[] = [
  { value: "0-2", label: "0\u20132" },
  { value: "3+", label: "3+" },
];

export default function StapInstallatie({ form, onChange }: StapProps) {
  return (
    <div>
      <h2>Installatie quickcheck</h2>
      <p>Ter plekke controleren</p>

      <fieldset>
        <legend>Locatie batterij</legend>
        <div>
          {locOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.loc === opt.value}
              onClick={() => onChange("loc", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Eigendom</legend>
        <div>
          {eigOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.eig === opt.value}
              onClick={() => onChange("eig", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Afstand meterkast</legend>
        <div>
          {afstOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.afst === opt.value}
              onClick={() => onChange("afst", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Muren doorboren</legend>
        <div>
          {muurOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={form.muur === opt.value}
              onClick={() => onChange("muur", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
