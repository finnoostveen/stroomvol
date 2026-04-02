"use client";

import type { StapProps, ContractType } from "./types";

const contractOpties: { type: ContractType; icon: string; naam: string; beschrijving: string }[] = [
  { type: "vast", icon: "🔒", naam: "Vast", beschrijving: "Vaste kWh-prijs gedurende contractperiode" },
  { type: "variabel", icon: "📊", naam: "Variabel", beschrijving: "Prijs volgt markt, maandelijks aangepast" },
  { type: "dynamisch", icon: "⚡", naam: "Dynamisch", beschrijving: "Uurprijs op basis van EPEX day-ahead" },
];

export default function StapContract({ form, onChange }: StapProps) {
  const contract = form.contract;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">📋</div>
        <div>
          <div className="card-title">Energiecontract</div>
          <div className="card-subtitle">Het contracttype bepaalt de rekenwijze en batterijstrategie</div>
        </div>
      </div>

      <fieldset>
        <legend>
          Type energiecontract <span className="req">*</span>
        </legend>
        <div className="contract-cards">
          {contractOpties.map((opt) => (
            <button
              key={opt.type}
              type="button"
              className="cc"
              aria-pressed={contract === opt.type}
              onClick={() => onChange("contract", opt.type)}
            >
              <div className="cc-icon">{opt.icon}</div>
              <div className="cc-name">{opt.naam}</div>
              <div className="cc-desc">{opt.beschrijving}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Vast / Variabel velden */}
      {(contract === "vast" || contract === "variabel") && (
        <>
          <div className="r2">
            <div className="field">
              <label className="field-label" htmlFor="in-tarief-vast">
                Inkooptarief (all-in) <span className="req">*</span>
              </label>
              <div className="uw">
                <input
                  id="in-tarief-vast"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={form.tariefVast}
                  onChange={(e) => onChange("tariefVast", parseFloat(e.target.value) || 0)}
                />
                <span className="us">&euro;/kWh</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="in-terug-vast">Teruglevertarief</label>
              <div className="uw">
                <input
                  id="in-terug-vast"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={form.terugVast}
                  onChange={(e) => onChange("terugVast", parseFloat(e.target.value) || 0)}
                />
                <span className="us">&euro;/kWh</span>
              </div>
            </div>
          </div>

          {contract === "vast" && (
            <div className="info-box">
              <strong>Batterijstrategie bij vast tarief:</strong> Primair
              zelfconsumptie-optimalisatie. De batterij slaat overdag
              zonne-energie op en levert &apos;s avonds. Geen arbitrage mogelijk
              bij vaste prijs.
            </div>
          )}
          {contract === "variabel" && (
            <>
              <div className="info-box">
                <strong>Batterijstrategie bij variabel tarief:</strong>{" "}
                Zelfconsumptie-optimalisatie. Extra voordeel: bij stijgende
                tarieven stijgt ook de waarde van opgeslagen stroom.
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field-label" htmlFor="in-var-stijg">
                  Verwachte jaarlijkse prijsstijging
                </label>
                <div className="uw">
                  <input
                    id="in-var-stijg"
                    type="number"
                    step={0.5}
                    min={0}
                    max={15}
                    value={form.varStijg}
                    onChange={(e) => onChange("varStijg", parseFloat(e.target.value) || 0)}
                  />
                  <span className="us">%</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Dynamisch velden */}
      {contract === "dynamisch" && (
        <>
          <div className="r3">
            <div className="field">
              <label className="field-label" htmlFor="in-dyn-dal">
                Gem. dalprijs <span className="req">*</span>
              </label>
              <div className="uw">
                <input
                  id="in-dyn-dal"
                  type="number"
                  step={0.01}
                  min={-0.1}
                  max={0.5}
                  value={form.dynDal}
                  onChange={(e) => onChange("dynDal", parseFloat(e.target.value) || 0)}
                />
                <span className="us">&euro;/kWh</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="in-dyn-piek">
                Gem. piekprijs <span className="req">*</span>
              </label>
              <div className="uw">
                <input
                  id="in-dyn-piek"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={form.dynPiek}
                  onChange={(e) => onChange("dynPiek", parseFloat(e.target.value) || 0)}
                />
                <span className="us">&euro;/kWh</span>
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="in-dyn-gem">Gem. dagprijs</label>
              <div className="uw">
                <input
                  id="in-dyn-gem"
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                  value={form.dynGem}
                  onChange={(e) => onChange("dynGem", parseFloat(e.target.value) || 0)}
                />
                <span className="us">&euro;/kWh</span>
              </div>
            </div>
          </div>

          <div className="info-box">
            <strong>Batterijstrategie bij dynamisch tarief:</strong> Dubbele
            verdienlaag. (1) Zelfconsumptie, en (2) actieve arbitrage: laden bij
            lage uurprijs, ontladen bij hoge uurprijs.
          </div>

          <div className="strat-cards">
            <div className="strat-card">
              <div className="strat-label">Arbitrage spread</div>
              <div className="strat-val">
                &euro;{(form.dynPiek - form.dynDal).toFixed(2)}/kWh
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
