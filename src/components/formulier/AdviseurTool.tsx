"use client";

import { useCallback, useState } from "react";
import type { FormState, Stap } from "./types";
import { initialFormState } from "./types";
import { calc, type CalcResult, type CalcParams } from "@/lib/calc";
import StapKlant from "./StapKlant";
import StapContract from "./StapContract";
import StapVerbruik from "./StapVerbruik";
import StapZon from "./StapZon";
import StapOmvormerNet from "./StapOmvormerNet";
import StapGrootverbruikers from "./StapGrootverbruikers";
import StapInstallatie from "./StapInstallatie";
import HeroMetrics from "@/components/resultaat/HeroMetrics";
import DoelMetrics from "@/components/resultaat/DoelMetrics";
import LaadOntlaadSchema from "@/components/resultaat/LaadOntlaadSchema";
import Onafhankelijkheid from "@/components/resultaat/Onafhankelijkheid";
import StressTest from "@/components/resultaat/StressTest";
import FinancieelOverzicht from "@/components/resultaat/FinancieelOverzicht";
import Spaarrekening from "@/components/resultaat/Spaarrekening";
import NietsDoen from "@/components/resultaat/NietsDoen";
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
  const [params, setParams] = useState<CalcParams>({ cpk: 400, dod: 90, eff: 92 });
  const [paramsOpen, setParamsOpen] = useState(false);
  const [notities, setNotities] = useState("");

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

  const updateParam = (key: keyof CalcParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    setResult(calc(form, next));
  };

  if (result) {
    return (
      <div className="sv-adv">
        <div className="container">
          <div className="header-sticky">
            <h1 className="logo">
              STROOM<span>VOL</span>
            </h1>
          </div>

          <div className="phase">
            <HeroMetrics result={result} />
            <DoelMetrics result={result} />
            <div className="section-gray">
              <LaadOntlaadSchema result={result} />
            </div>
            <Onafhankelijkheid result={result} />
            <StressTest result={result} />
            <FinancieelOverzicht result={result} />
            <div className="section-gray">
              <Spaarrekening result={result} />
            </div>
            <NietsDoen result={result} />

            {/* Instelbare aannames */}
            <div className="params-panel">
              <button type="button" className="params-toggle" onClick={() => setParamsOpen(!paramsOpen)}>
                <span className="params-toggle-label">⚙️ Aannames aanpassen</span>
                {!paramsOpen && (
                  <span className="params-toggle-summary">
                    &euro;{params.cpk}/kWh &middot; DoD {params.dod}% &middot; Eff {params.eff}%
                  </span>
                )}
                <span className={`params-toggle-arrow${paramsOpen ? " open" : ""}`}>▼</span>
              </button>
              {paramsOpen && (
                <div className="params-body">
                  <div className="params-grid">
                    <div className="param-item">
                      <label>
                        Kosten per kWh (cpk)
                        <div className="param-val">&euro;{params.cpk}/kWh</div>
                      </label>
                      <input
                        type="range"
                        min={200} max={800} step={10}
                        value={params.cpk}
                        onChange={(e) => updateParam("cpk", Number(e.target.value))}
                      />
                      <div className="param-range-labels"><span>&euro;200</span><span>&euro;800</span></div>
                    </div>
                    <div className="param-item">
                      <label>
                        Depth of Discharge (DoD)
                        <div className="param-val">{params.dod}%</div>
                      </label>
                      <input
                        type="range"
                        min={80} max={100} step={1}
                        value={params.dod}
                        onChange={(e) => updateParam("dod", Number(e.target.value))}
                      />
                      <div className="param-range-labels"><span>80%</span><span>100%</span></div>
                    </div>
                    <div className="param-item">
                      <label>
                        Round-trip efficiency
                        <div className="param-val">{params.eff}%</div>
                      </label>
                      <input
                        type="range"
                        min={85} max={98} step={1}
                        value={params.eff}
                        onChange={(e) => updateParam("eff", Number(e.target.value))}
                      />
                      <div className="param-range-labels"><span>85%</span><span>98%</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Adviseur notities */}
            <div className="notities-section">
              <div className="notities-header">
                <span className="notities-icon">{"\uD83D\uDCDD"}</span>
                <div>
                  <div className="notities-title">Adviseur notities</div>
                  <div className="notities-sub">Bijzonderheden voor het dossier</div>
                </div>
              </div>
              <textarea
                className="notities-textarea"
                rows={4}
                placeholder="Bijv. 'Dak op zuidwest, 6m kabellengte. Klant overweegt overstap naar dynamisch contract.'"
                value={notities}
                onChange={(e) => setNotities(e.target.value)}
              />
            </div>

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
      <div className="hero-bg" style={{ padding: "36px 20px 28px", marginBottom: 0 }}>
        <div className="container">
          <header className="header" style={{ position: "relative" }}>
            <h1 className="logo">
              STROOM<span>VOL</span>
            </h1>
            <p className="header-sub">Batterijadvies op maat</p>
            <div className="header-badge">ADVISEURSTOOL</div>
          </header>
        </div>
      </div>
      <div className="container" style={{ paddingTop: 24 }}>

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
            <button type="button" className="btn-next" onClick={() => setResult(calc(form, params))}>
              Genereer advies &rarr;
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
