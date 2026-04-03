"use client";

import type { StapProps, Grootverbruiker, Doel } from "./types";
import InfoTip from "@/components/resultaat/InfoTip";

const gvOpties: { value: Grootverbruiker; label: string; tip: string }[] = [
  { value: "ev", label: "Elektrische auto + thuislader", tip: "Een EV laadt gemiddeld ~2.500 kWh per jaar (bij ~15.000 km/jaar). De batterij kan slim laden verschuiven naar goedkope uren." },
  { value: "wp", label: "Warmtepomp (volledig elektrisch)", tip: "Een volledig elektrische warmtepomp verbruikt ~3.500 kWh/jaar voor verwarming en warm water. Het verbruik is sterk winterlastig." },
  { value: "hwp", label: "Hybride warmtepomp", tip: "Een hybride warmtepomp schakelt bij kou over naar gas. Lager stroomverbruik (~1.200 kWh/jaar) dan een volledig elektrische warmtepomp." },
  { value: "ac", label: "Airconditioning", tip: "Een airco verbruikt ~600 kWh/jaar, vooral in de zomermaanden. De batterij kan de zonnestroom overdag opslaan en 's avonds aan de airco leveren." },
];

const doelOpties: { value: Doel; label: string; tip: string }[] = [
  { value: "zelf", label: "Zelfconsumptie verhogen", tip: "Maximaliseer het gebruik van eigen zonnestroom door overschot op te slaan in de batterij voor later gebruik." },
  { value: "handel", label: "Slim handelen (arbitrage)", tip: "Verdien extra door de batterij te laden bij lage stroomprijs en te ontladen bij hoge prijs. Vereist een dynamisch energiecontract." },
  { value: "peak", label: "Piekverbruik beperken", tip: "Verlaag de belasting op je netaansluiting door pieken op te vangen met de batterij. Relevant bij gelijktijdig gebruik van EV-lader, warmtepomp en kookplaat." },
  { value: "nood", label: "Noodstroom", tip: "Gebruik de batterij als noodstroomvoorziening bij een stroomstoring. De batterij schakelt automatisch over en houdt essentiële apparaten draaiende." },
];

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export default function StapGrootverbruikers({ form, onChange }: StapProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🏠</div>
        <div>
          <div className="card-title">Grootverbruikers &amp; Doelen</div>
          <div className="card-subtitle">Wat staat er in huis? Wat wil de klant?</div>
        </div>
      </div>

      <fieldset>
        <legend>Grootverbruikers</legend>
        <div className="chk-row">
          {gvOpties.map((opt) => {
            const checked = form.gv.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`chk-item${checked ? " on" : ""}`}
                data-checked={checked}
              >
                <span className="chk-dot">
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange("gv", toggleInSet(form.gv, opt.value))}
                />
                {opt.label} <InfoTip tekst={opt.tip} />
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Doelen</legend>
        <div className="chk-row">
          {doelOpties.map((opt) => {
            const checked = form.doel.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`chk-item${checked ? " on" : ""}`}
                data-checked={checked}
              >
                <span className="chk-dot">
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange("doel", toggleInSet(form.doel, opt.value))}
                />
                {opt.label} <InfoTip tekst={opt.tip} />
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
