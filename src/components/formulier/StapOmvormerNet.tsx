"use client";

import type { StapProps, OmvormerType, NetAansluiting } from "./types";
import InfoTip from "@/components/resultaat/InfoTip";

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
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🔌</div>
        <div>
          <div className="card-title">Omvormer &amp; Net</div>
          <div className="card-subtitle">Check meterkast en omvormer</div>
        </div>
      </div>

      <fieldset>
        <legend>
          Omvormertype{" "}
          <InfoTip tekst="Hybride: een omvormer die zowel zonnepanelen als een batterij aanstuurt. Meest efficiënt (DC-gekoppeld). Standaard: een string-omvormer voor zonnepanelen. De batterij wordt apart aangesloten (AC-gekoppeld, iets minder efficiënt). Micro-omvormers: kleine omvormers per paneel. De batterij wordt altijd AC-gekoppeld aangesloten." />
        </legend>
        <div className="tg">
          {omvormerOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="tb"
              aria-pressed={form.omv === opt.value}
              onClick={() => onChange("omv", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>
          Netaansluiting{" "}
          <InfoTip tekst="De capaciteit van je aansluiting op het elektriciteitsnet. Dit staat op je meterkast of energierekening. 1×25A is standaard voor oudere woningen. 3×25A is standaard voor nieuwere woningen en nodig bij een warmtepomp of snellader. 3×63A is voor zware installaties." />
        </legend>
        <div className="tg">
          {netOpties.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="tb"
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
