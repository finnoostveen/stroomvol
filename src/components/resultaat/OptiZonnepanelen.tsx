"use client";

import { useMemo } from "react";
import type { FormState } from "@/components/formulier/types";
import { calc, fmt, type CalcParams, type CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
  form: FormState;
  params: CalcParams;
}

export default function OptiZonnepanelen({ result, form, params }: Props) {
  if (result.hasSolar) return null;

  const solarResult = useMemo(() => {
    return calc({ ...form, zon: "ja", panelen: 10, wpPerPaneel: 400 }, params);
  }, [form, params]);

  const hBattBesp = Math.round(result.real.total15 / 15);
  const nBattBesp = Math.round(solarResult.real.total15 / 15);

  // Totale energiekosten per scenario
  const kostenZonder = Math.round(result.totaalVerbruik * result.tarief - hBattBesp);
  const directeSolarBesp = Math.round(solarResult.zelfMetJaar * solarResult.tarief);
  const kostenMet = Math.round(
    (solarResult.totaalVerbruik - solarResult.zelfMetJaar) * solarResult.tarief - nBattBesp,
  );
  const verschil = kostenZonder - kostenMet;

  return (
    <div className="card ov-wrap">
      <div className="card-header">
        <div className="card-icon ov-dot">&#9679;</div>
        <div>
          <div className="card-title">Wat als je zonnepanelen plaatst?</div>
          <div className="card-subtitle">Simulatie met 10 panelen van 400 Wp (~4 kWp)</div>
        </div>
      </div>

      <div className="ov-grid">
        <div className="ov-col ov-col--grijs">
          <div className="ov-col-title">Zonder panelen</div>
          <div className="ov-row">Energiekosten: <strong>&euro;{fmt(kostenZonder)}/jaar</strong></div>
          <div className="ov-row">Waarvan batterij bespaart: <strong>&euro;{fmt(hBattBesp)}/jaar</strong></div>
          <div className="ov-row">Zelfconsumptie: <strong>0%</strong></div>
        </div>
        <div className="ov-col ov-col--groen">
          <div className="ov-col-title">Met 10 panelen</div>
          <div className="ov-row">Energiekosten: <strong className="ov-beter">&euro;{fmt(kostenMet)}/jaar</strong> <span className="ov-diff ov-diff--groen">(-&euro;{fmt(verschil)}/jr)</span></div>
          <div className="ov-row">Waarvan zonnestroom bespaart: <strong className="ov-beter">&euro;{fmt(directeSolarBesp)}/jaar</strong></div>
          <div className="ov-row">Waarvan batterij bespaart: <strong className="ov-beter">&euro;{fmt(nBattBesp)}/jaar</strong></div>
          <div className="ov-row">Zelfconsumptie: <strong className="ov-beter">{solarResult.zelfPctMet}%</strong></div>
        </div>
      </div>

      {verschil > 0 && (
        <div className="ov-banner">
          Met zonnepanelen dalen je totale energiekosten met &euro;{fmt(verschil)}/jaar — van &euro;{fmt(kostenZonder)} naar &euro;{fmt(kostenMet)} per jaar.
        </div>
      )}

      <div className="ov-doelen">
        <div className="ov-doel ov-doel--actief">&#10003; Zelfconsumptie: van 0% naar {solarResult.zelfPctMet}%</div>
        <div className="ov-doel ov-doel--actief">&#10003; Energie-onafhankelijkheid: van 0% naar {solarResult.zelfPctMet}%</div>
        <div className="ov-doel ov-doel--actief">&#10003; Bescherming tegen einde saldering</div>
        <div className="ov-doel ov-doel--actief">&#10003; CO&#8322;-reductie</div>
      </div>

      <div className="ov-info">
        Zonnepanelen zijn de primaire bron van besparing voor een thuisbatterij. Zonder panelen verdient de batterij
        alleen via stroomhandel. Met panelen komt daar zelfconsumptie bij — de meest waardevolle component. De batterij
        slaat overdag opgewekte stroom op voor &apos;s avonds, waardoor je minder dure stroom van het net hoeft te kopen.
      </div>
    </div>
  );
}
