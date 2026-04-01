"use client";

import { useCallback, useState } from "react";
import type { FormState, Stap } from "./types";
import { initialFormState } from "./types";
import StapKlant from "./StapKlant";
import StapContract from "./StapContract";
import StapVerbruik from "./StapVerbruik";
import StapZon from "./StapZon";
import StapOmvormerNet from "./StapOmvormerNet";
import StapGrootverbruikers from "./StapGrootverbruikers";
import StapInstallatie from "./StapInstallatie";

const STAP_LABELS = [
  "Klant & Adviseur",
  "Energiecontract",
  "Stroomverbruik",
  "Zonnepanelen",
  "Omvormer & Net",
  "Grootverbruikers & Doelen",
  "Installatie",
] as const;

const AANTAL_STAPPEN = STAP_LABELS.length;

function validate(form: FormState, stap: Stap): string | null {
  switch (stap) {
    case 1:
      if (!form.contract) return "Kies een contracttype";
      return null;
    case 2: {
      const v = Number(form.verbruik);
      if (!form.verbruik || isNaN(v) || v <= 0) return "Vul een jaarverbruik in";
      return null;
    }
    case 3:
      if (!form.zon) return "Geef aan of er zonnepanelen zijn";
      return null;
    default:
      return null;
  }
}

export default function AdviseurTool() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [stap, setStap] = useState<Stap>(0);
  const [error, setError] = useState<string | null>(null);

  const onChange = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    [],
  );

  const volgende = () => {
    const err = validate(form, stap);
    if (err) {
      setError(err);
      return;
    }
    if (stap < AANTAL_STAPPEN - 1) {
      setStap((stap + 1) as Stap);
      setError(null);
    }
  };

  const vorige = () => {
    if (stap > 0) {
      setStap((stap - 1) as Stap);
      setError(null);
    }
  };

  const progressPct = ((stap + 1) / AANTAL_STAPPEN) * 100;

  return (
    <div>
      <header>
        <h1>
          STROOM<span>VOL</span>
        </h1>
        <p>Batterijadvies op maat</p>
      </header>

      {/* Progress */}
      <div role="progressbar" aria-valuenow={stap + 1} aria-valuemin={1} aria-valuemax={AANTAL_STAPPEN}>
        <div style={{ width: `${progressPct}%` }} />
      </div>
      <p>
        Stap {stap + 1} van {AANTAL_STAPPEN}: {STAP_LABELS[stap]}
      </p>

      {/* Huidige stap */}
      {stap === 0 && <StapKlant form={form} onChange={onChange} />}
      {stap === 1 && <StapContract form={form} onChange={onChange} />}
      {stap === 2 && <StapVerbruik form={form} onChange={onChange} />}
      {stap === 3 && <StapZon form={form} onChange={onChange} />}
      {stap === 4 && <StapOmvormerNet form={form} onChange={onChange} />}
      {stap === 5 && <StapGrootverbruikers form={form} onChange={onChange} />}
      {stap === 6 && <StapInstallatie form={form} onChange={onChange} />}

      {/* Error */}
      {error && <p role="alert">{error}</p>}

      {/* Navigatie */}
      <nav>
        {stap > 0 && (
          <button type="button" onClick={vorige}>
            &larr; Vorige
          </button>
        )}
        {stap < AANTAL_STAPPEN - 1 ? (
          <button type="button" onClick={volgende}>
            Volgende &rarr;
          </button>
        ) : (
          <button type="button" onClick={() => {/* TODO: genereer advies */}}>
            Genereer advies &rarr;
          </button>
        )}
      </nav>
    </div>
  );
}
