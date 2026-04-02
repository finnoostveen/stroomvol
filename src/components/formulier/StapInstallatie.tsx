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
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🔧</div>
        <div>
          <div className="card-title">Installatie quickcheck</div>
          <div className="card-subtitle">Ter plekke controleren</div>
        </div>
      </div>

      <div className="r2">
        <fieldset>
          <legend>Locatie batterij</legend>
          <div className="tg">
            {locOpties.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="tb"
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
          <div className="tg">
            {eigOpties.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="tb"
                aria-pressed={form.eig === opt.value}
                onClick={() => onChange("eig", opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="r2">
        <fieldset>
          <legend>Afstand meterkast</legend>
          <div className="tg">
            {afstOpties.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="tb"
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
          <div className="tg">
            {muurOpties.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="tb"
                aria-pressed={form.muur === opt.value}
                onClick={() => onChange("muur", opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
