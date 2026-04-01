"use client";

import type { StapProps, ContractType } from "./types";

const contractOpties: { type: ContractType; icon: string; naam: string; beschrijving: string }[] = [
  { type: "vast", icon: "\u{1F512}", naam: "Vast", beschrijving: "Vaste kWh-prijs gedurende contractperiode" },
  { type: "variabel", icon: "\u{1F4CA}", naam: "Variabel", beschrijving: "Prijs volgt markt, maandelijks aangepast" },
  { type: "dynamisch", icon: "\u26A1", naam: "Dynamisch", beschrijving: "Uurprijs op basis van EPEX day-ahead" },
];

export default function StapContract({ form, onChange }: StapProps) {
  const contract = form.contract;

  return (
    <div>
      <h2>Energiecontract</h2>
      <p>Het contracttype bepaalt de rekenwijze en batterijstrategie</p>

      <fieldset>
        <legend>
          Type energiecontract <span>*</span>
        </legend>
        <div>
          {contractOpties.map((opt) => (
            <button
              key={opt.type}
              type="button"
              aria-pressed={contract === opt.type}
              onClick={() => onChange("contract", opt.type)}
            >
              <span>{opt.icon}</span>
              <strong>{opt.naam}</strong>
              <span>{opt.beschrijving}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Vast / Variabel velden */}
      {(contract === "vast" || contract === "variabel") && (
        <div>
          <div>
            <label htmlFor="in-tarief-vast">
              Inkooptarief (all-in) <span>*</span>
            </label>
            <input
              id="in-tarief-vast"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={form.tariefVast}
              onChange={(e) => onChange("tariefVast", parseFloat(e.target.value) || 0)}
            />
            <span>&euro;/kWh</span>
          </div>
          <div>
            <label htmlFor="in-terug-vast">Teruglevertarief</label>
            <input
              id="in-terug-vast"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={form.terugVast}
              onChange={(e) => onChange("terugVast", parseFloat(e.target.value) || 0)}
            />
            <span>&euro;/kWh</span>
          </div>

          {contract === "vast" && (
            <p>
              <strong>Batterijstrategie bij vast tarief:</strong> Primair
              zelfconsumptie-optimalisatie. De batterij slaat overdag
              zonne-energie op en levert &apos;s avonds. Geen arbitrage mogelijk
              bij vaste prijs.
            </p>
          )}
          {contract === "variabel" && (
            <>
              <p>
                <strong>Batterijstrategie bij variabel tarief:</strong>{" "}
                Zelfconsumptie-optimalisatie. Extra voordeel: bij stijgende
                tarieven stijgt ook de waarde van opgeslagen stroom.
              </p>
              <div>
                <label htmlFor="in-var-stijg">
                  Verwachte jaarlijkse prijsstijging
                </label>
                <input
                  id="in-var-stijg"
                  type="number"
                  step={0.5}
                  min={0}
                  max={15}
                  value={form.varStijg}
                  onChange={(e) => onChange("varStijg", parseFloat(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dynamisch velden */}
      {contract === "dynamisch" && (
        <div>
          <div>
            <label htmlFor="in-dyn-dal">
              Gem. dalprijs <span>*</span>
            </label>
            <input
              id="in-dyn-dal"
              type="number"
              step={0.01}
              min={-0.1}
              max={0.5}
              value={form.dynDal}
              onChange={(e) => onChange("dynDal", parseFloat(e.target.value) || 0)}
            />
            <span>&euro;/kWh</span>
          </div>
          <div>
            <label htmlFor="in-dyn-piek">
              Gem. piekprijs <span>*</span>
            </label>
            <input
              id="in-dyn-piek"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={form.dynPiek}
              onChange={(e) => onChange("dynPiek", parseFloat(e.target.value) || 0)}
            />
            <span>&euro;/kWh</span>
          </div>
          <div>
            <label htmlFor="in-dyn-gem">Gem. dagprijs</label>
            <input
              id="in-dyn-gem"
              type="number"
              step={0.01}
              min={0}
              max={1}
              value={form.dynGem}
              onChange={(e) => onChange("dynGem", parseFloat(e.target.value) || 0)}
            />
            <span>&euro;/kWh</span>
          </div>
          <p>
            <strong>Batterijstrategie bij dynamisch tarief:</strong> Dubbele
            verdienlaag. (1) Zelfconsumptie, en (2) actieve arbitrage: laden bij
            lage uurprijs, ontladen bij hoge uurprijs.
          </p>
          <div>
            <div>
              <span>Arbitrage spread</span>
              <strong>
                &euro;{(form.dynPiek - form.dynDal).toFixed(2)}/kWh
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
