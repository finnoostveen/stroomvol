"use client";

import { useMemo } from "react";
import type { FormState } from "@/components/formulier/types";
import { calc, fmt, type CalcParams, type CalcResult } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";

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

  const hBesp = Math.round(result.real.total15 / 15);
  const nBesp = Math.round(solarResult.real.total15 / 15);
  const hTvt = berekenCumulatieveTvt(result.real, result.investering);
  const nTvt = berekenCumulatieveTvt(solarResult.real, solarResult.investering);
  const verschil = nBesp - hBesp;

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
          <div className="ov-row">Besparing: <strong>&euro;{fmt(hBesp)}/jaar</strong></div>
          <div className="ov-row">TVT: <strong>{formatTvt(hTvt)}</strong></div>
          <div className="ov-row">Zelfconsumptie: <strong>0%</strong></div>
          <div className="ov-row">Investering: <strong>&euro;{fmt(result.investering)}</strong></div>
        </div>
        <div className="ov-col ov-col--groen">
          <div className="ov-col-title">Met 10 panelen</div>
          <div className="ov-row">Besparing: <strong className="ov-beter">&euro;{fmt(nBesp)}/jaar</strong> <span className="ov-diff ov-diff--groen">(+&euro;{fmt(verschil)}/jr)</span></div>
          <div className="ov-row">TVT: <strong className="ov-beter">{formatTvt(nTvt)}</strong></div>
          <div className="ov-row">Zelfconsumptie: <strong className="ov-beter">{solarResult.zelfPctMet}%</strong></div>
          <div className="ov-row">Investering: <strong>&euro;{fmt(solarResult.investering)}</strong></div>
        </div>
      </div>

      {verschil > 0 && (
        <div className="ov-banner">
          Met zonnepanelen stijgt je besparing met &euro;{fmt(verschil)}/jaar en dekt je {solarResult.zelfPctMet}% van je verbruik met eigen opwek.
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
