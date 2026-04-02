"use client";

import { useCallback, useState } from "react";
import type { FormState, Stap } from "./types";
import { initialFormState } from "./types";
import { calc, type CalcResult } from "@/lib/calc";
import StapKlant from "./StapKlant";
import StapContract from "./StapContract";
import StapVerbruik from "./StapVerbruik";
import StapZon from "./StapZon";
import StapOmvormerNet from "./StapOmvormerNet";
import StapGrootverbruikers from "./StapGrootverbruikers";
import StapInstallatie from "./StapInstallatie";
import HeroMetrics from "@/components/resultaat/HeroMetrics";
import DoelMetrics from "@/components/resultaat/DoelMetrics";
import Onafhankelijkheid from "@/components/resultaat/Onafhankelijkheid";
import StressTest from "@/components/resultaat/StressTest";
import FinancieelOverzicht from "@/components/resultaat/FinancieelOverzicht";
import Spaarrekening from "@/components/resultaat/Spaarrekening";
import Aannames from "@/components/resultaat/Aannames";

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
  const [result, setResult] = useState<CalcResult | null>(null);

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

  if (result) {
    return (
      <div className="sv-adv">
        <div className="container">
          <header className="header">
            <h1 className="logo">
              STROOM<span>VOL</span>
            </h1>
            <p className="header-sub">Batterijadvies op maat</p>
          </header>

          <div className="phase">
            <HeroMetrics result={result} />
            <DoelMetrics result={result} />
            <Onafhankelijkheid result={result} />
            <StressTest result={result} />
            <FinancieelOverzicht result={result} />
            <Spaarrekening result={result} />
            <Aannames result={result} />
          </div>

          <nav className="nav">
            <button type="button" className="btn-back" onClick={() => setResult(null)}>
              &larr; Terug naar formulier
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-adv">
      <div className="container">
        <header className="header">
          <h1 className="logo">
            STROOM<span>VOL</span>
          </h1>
          <p className="header-sub">Batterijadvies op maat</p>
        </header>

        {/* Progress */}
        <div className="progress-bar" role="progressbar" aria-valuenow={stap + 1} aria-valuemin={1} aria-valuemax={AANTAL_STAPPEN}>
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="progress-label">
          Stap {stap + 1} van {AANTAL_STAPPEN}: {STAP_LABELS[stap]}
        </p>

        {/* Huidige stap */}
        <div className="phase">
          {stap === 0 && <StapKlant form={form} onChange={onChange} />}
          {stap === 1 && <StapContract form={form} onChange={onChange} />}
          {stap === 2 && <StapVerbruik form={form} onChange={onChange} />}
          {stap === 3 && <StapZon form={form} onChange={onChange} />}
          {stap === 4 && <StapOmvormerNet form={form} onChange={onChange} />}
          {stap === 5 && <StapGrootverbruikers form={form} onChange={onChange} />}
          {stap === 6 && <StapInstallatie form={form} onChange={onChange} />}
        </div>

        {/* Error */}
        {error && <p className="error-msg" role="alert">{error}</p>}

        {/* Navigatie */}
        <nav className="nav">
          {stap > 0 ? (
            <button type="button" className="btn-back" onClick={vorige}>
              &larr; Vorige
            </button>
          ) : <span />}
          {stap < AANTAL_STAPPEN - 1 ? (
            <button type="button" className="btn-next" onClick={volgende}>
              Volgende &rarr;
            </button>
          ) : (
            <button type="button" className="btn-next" onClick={() => setResult(calc(form))}>
              Genereer advies &rarr;
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
