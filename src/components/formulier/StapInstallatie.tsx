"use client";

import type { StapProps, Locatie, Eigendom, Afstand, Muur } from "./types";
import InfoTip from "@/components/resultaat/InfoTip";

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
          <legend>
            Locatie batterij{" "}
            <InfoTip tekst="Binnen is standaard. Buiten plaatsen kan als er geen ruimte binnen is, maar vereist een weerbestendige behuizing en kan de levensduur beïnvloeden door temperatuurschommelingen." />
          </legend>
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
          <legend>
            Eigendom{" "}
            <InfoTip tekst="Bij een huurwoning heb je toestemming nodig van de verhuurder voor een vaste installatie. Bij koop ben je vrij om te installeren." />
          </legend>
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
          <legend>
            Afstand meterkast{" "}
            <InfoTip tekst="De afstand tussen de gewenste plek van de batterij en de meterkast. Meer dan 10 meter betekent langere kabels en mogelijk hogere installatiekosten (€100–300 extra)." />
          </legend>
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
          <legend>
            Muren doorboren{" "}
            <InfoTip tekst="Het aantal muren of vloeren waar kabels doorheen moeten. 3 of meer doorvoeren verhoogt de installatiecomplexiteit en kosten." />
          </legend>
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
