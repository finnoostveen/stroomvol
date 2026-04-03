"use client";

import { useCallback, useState } from "react";
import type { TabId } from "@/components/resultaat/ContentArea";
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
import SidePanel from "@/components/resultaat/SidePanel";
import ContentArea from "@/components/resultaat/ContentArea";
import DoelMetrics from "@/components/resultaat/DoelMetrics";
import Onafhankelijkheid from "@/components/resultaat/Onafhankelijkheid";
import ProfielVisualisatie from "@/components/resultaat/ProfielVisualisatie";
import SalderingImpact from "@/components/resultaat/SalderingImpact";
import StressTest from "@/components/resultaat/StressTest";
import FinancieelOverzicht from "@/components/resultaat/FinancieelOverzicht";
import Spaarrekening from "@/components/resultaat/Spaarrekening";
import NietsDoen from "@/components/resultaat/NietsDoen";
import LaadOntlaadSchema from "@/components/resultaat/LaadOntlaadSchema";
import MaandKalender from "@/components/resultaat/MaandKalender";
import JouwDag from "@/components/resultaat/JouwDag";
import ContractSwitch from "@/components/resultaat/ContractSwitch";
import SpeelMetProfiel from "@/components/resultaat/SpeelMetProfiel";
import ScenarioTabel from "@/components/resultaat/ScenarioTabel";
import AannamesTab from "@/components/resultaat/AannamesTab";
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
  const [activeTab, setActiveTab] = useState<TabId>("advies");
  const [notities, setNotities] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const updateParam = (key: keyof CalcParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    setResult(calc(form, next));
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { AdviesRapport } = await import("@/lib/pdf-generator");
      const klantData = {
        klantNaam: form.klantNaam,
        klantAdres: form.klantAdres,
        klantPlaats: form.klantPlaats,
        datum: form.datum,
        adviseur: form.adviseur,
        notities,
      };
      const blob = await pdf(<AdviesRapport calc={result} klant={klantData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const datumStr = form.datum ? form.datum.split("-").reverse().join("-") : "rapport";
      a.href = url;
      a.download = `Stroomvol-Advies-${form.klantNaam || "Klant"}-${datumStr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }, [result, form, notities]);

  /* ===================== RESULTAATSCHERM ===================== */
  if (result) {
    return (
      <div className="sv-adv">
        <div className="resultaat-layout">
          {/* Donker zijpaneel */}
          <SidePanel
            result={result}
            klantNaam={form.klantNaam}
            datum={form.datum}
            onTerug={() => setResult(null)}
            onAanpassen={() => setActiveTab("scenarios")}
            onDownloadPdf={handleDownloadPdf}
            pdfLoading={pdfLoading}
          />

          {/* Licht contentgebied */}
          <ContentArea
            activeTab={activeTab}
            onTabChange={setActiveTab}
            advies={
              <>
                <div className="section-reveal"><ScenarioTabel result={result} /></div>
                <div className="section-reveal"><FinancieelOverzicht result={result} /></div>
                <div className="section-reveal"><DoelMetrics result={result} /></div>
                <div className="section-reveal"><ProfielVisualisatie result={result} /></div>
                <div className="section-reveal"><Onafhankelijkheid result={result} /></div>
                <div className="section-reveal"><Spaarrekening result={result} /></div>
                <div className="section-reveal"><SalderingImpact result={result} /></div>
                <div className="section-reveal"><StressTest result={result} /></div>
                <div className="section-reveal"><NietsDoen result={result} /></div>
              </>
            }
            verdieping={
              <>
                <div className="section-reveal"><LaadOntlaadSchema result={result} /></div>
                <div className="section-reveal"><MaandKalender result={result} /></div>
                <div className="section-reveal"><JouwDag result={result} /></div>
                <div className="section-reveal"><ContractSwitch result={result} form={form} params={params} /></div>
              </>
            }
            scenarios={
              <>
                <div className="section-reveal"><SpeelMetProfiel result={result} form={form} params={params} /></div>
                <div className="section-reveal"><AannamesTab params={params} onUpdate={updateParam} /></div>
              </>
            }
            belowTabs={
              <>
                {/* Adviseur notities */}
                <div className="section-reveal">
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
                      rows={3}
                      placeholder="Bijv. 'Dak op zuidwest, 6m kabellengte. Klant overweegt overstap naar dynamisch contract.'"
                      value={notities}
                      onChange={(e) => setNotities(e.target.value)}
                    />
                  </div>
                </div>

                <div className="section-reveal"><Aannames result={result} /></div>
              </>
            }
          />
        </div>
      </div>
    );
  }

  /* ===================== FORMULIER ===================== */
  return (
    <div className="sv-adv">
      <div className="formulier-container">
        {/* Brand mark */}
        <div className="brand-mark">
          <p className="brand-mark-logo">STROOM<span>VOL</span></p>
          <p className="brand-mark-tagline">Batterijadvies op maat</p>
        </div>

        {/* Progress dots */}
        <div className="step-dots">
          {STAP_LABELS.map((_, i) => (
            <span
              key={i}
              className={`step-dot${i === stap ? " active" : i < stap ? " completed" : ""}`}
            />
          ))}
        </div>

        {/* Stap label */}
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
