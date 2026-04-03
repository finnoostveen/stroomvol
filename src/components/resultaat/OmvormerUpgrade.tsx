"use client";

import { calc, fmt, type CalcResult, type CalcParams } from "@/lib/calc";
import type { FormState } from "@/components/formulier/types";

interface Props {
  result: CalcResult;
  form: FormState;
  params: CalcParams;
}

export default function OmvormerUpgrade({ result, form, params }: Props) {
  const c = result;

  // Al hybride? Kort blok.
  if (c.omv === "hybride") {
    return (
      <div className="card ou-wrap">
        <div className="card-header">
          <div className="card-icon">🔌</div>
          <div>
            <div className="card-title">Omvormer upgrade-analyse</div>
          </div>
        </div>
        <div className="ou-ok">
          Je hebt al een hybride omvormer — dat is de meest efficiënte koppeling met een thuisbatterij.
          Geen extra omvormerkosten, maximale roundtrip efficiency.
        </div>
      </div>
    );
  }

  // Bereken hybride scenario
  const hybrideForm: FormState = { ...form, omv: "hybride", omvormerMerk: "" };
  const hyb = calc(hybrideForm, params);

  const omvLabel = c.omv === "micro" ? "micro-omvormer" : "standaard omvormer";
  const huidigEff = Math.round(c.effectieveEff * 100);
  const hybrideEff = Math.round(hyb.eff * 100);
  const huidigCpk = c.cpk + (c.omv === "micro" ? 75 : 50);
  const hybrideCpk = hyb.cpk;
  const huidigBesparingJaar = c.real.savingY1;
  const hybrideBesparingJaar = hyb.real.savingY1;
  const huidigTvt = c.real.tvt;
  const hybrideTvt = hyb.real.tvt;

  const verschil = hybrideBesparingJaar - huidigBesparingJaar;
  const tvtVerschil = Math.round((huidigTvt - hybrideTvt) * 10) / 10;

  return (
    <div className="card ou-wrap">
      <div className="card-header">
        <div className="card-icon">🔌</div>
        <div>
          <div className="card-title">Omvormer upgrade-analyse</div>
          <div className="card-subtitle">
            Wat levert een hybride omvormer op ten opzichte van je huidige {omvLabel}?
          </div>
        </div>
      </div>

      <div className="ou-grid">
        {/* Huidige situatie */}
        <div className="ou-col ou-col--grijs">
          <div className="ou-col-title">{c.omvormerMerk} ({omvLabel})</div>
          <div className="ou-row">Efficiency: <strong>{huidigEff}%</strong></div>
          <div className="ou-row">Installatiekosten: <strong>&euro;{fmt(huidigCpk)}/kWh</strong></div>
          <div className="ou-row">Besparing/jaar: <strong>&euro;{fmt(huidigBesparingJaar)}</strong></div>
          <div className="ou-row">TVT: <strong>{huidigTvt} jaar</strong></div>
        </div>

        {/* Hybride scenario */}
        <div className="ou-col ou-col--groen">
          <div className="ou-col-title">Hybride omvormer</div>
          <div className="ou-row">Efficiency: <strong>{hybrideEff}%</strong></div>
          <div className="ou-row">Installatiekosten: <strong>&euro;{fmt(hybrideCpk)}/kWh</strong></div>
          <div className="ou-row">Besparing/jaar: <strong>&euro;{fmt(hybrideBesparingJaar)}</strong></div>
          <div className="ou-row">TVT: <strong>{hybrideTvt} jaar</strong></div>
        </div>
      </div>

      {verschil > 0 && (
        <div className="ou-banner">
          Een hybride omvormer bespaart &euro;{fmt(verschil)}/jaar extra en verkort de terugverdientijd met {tvtVerschil} jaar.
        </div>
      )}

      {/* Doelen die verbeteren */}
      <div className="ov-doelen">
        <div className="ov-doel ov-doel--actief">&#10003; Efficiency: van {huidigEff}% naar {hybrideEff}%</div>
        {verschil > 0 && (
          <div className="ov-doel ov-doel--actief">&#10003; Besparing: +&euro;{fmt(verschil)}/jaar door hogere efficiency</div>
        )}
        <div className="ov-doel ov-doel--actief">&#10003; Lagere installatiekosten: -&euro;{fmt(huidigCpk - hybrideCpk)}/kWh (geen aparte batterij-omvormer)</div>
        {tvtVerschil > 0 && (
          <div className="ov-doel ov-doel--actief">&#10003; Terugverdientijd: -{tvtVerschil} jaar sneller</div>
        )}
      </div>

      <div className="ou-info">
        Een hybride omvormer stuurt de batterij direct aan via DC-koppeling. Dit elimineert de dubbele AC-DC conversie
        en bespaart op installatiekosten doordat er geen aparte batterij-omvormer nodig is.
      </div>
    </div>
  );
}
