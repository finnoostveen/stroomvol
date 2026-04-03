"use client";

import { useMemo } from "react";
import type { FormState, NetAansluiting } from "@/components/formulier/types";
import { calc, fmt, NET_VERMOGEN, type CalcParams, type CalcResult } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";

interface Props {
  result: CalcResult;
  form: FormState;
  params: CalcParams;
}

const NET_UPGRADE: Record<string, NetAansluiting> = {
  "1x25": "3x25",
  "1x35": "3x25",
  "3x25": "3x63",
};

export default function OptiNetUpgrade({ result, form, params }: Props) {
  if (!result.netBeperkt) return null;

  const nieuweNet = NET_UPGRADE[result.net] || "3x25";
  const nieuweMaxKw = NET_VERMOGEN[nieuweNet]?.maxKw ?? 17.25;

  const netResult = useMemo(() => {
    return calc({ ...form, net: nieuweNet }, params);
  }, [form, params, nieuweNet]);

  const hBesp = Math.round(result.real.total15 / 15);
  const nBesp = Math.round(netResult.real.total15 / 15);
  const hTvt = berekenCumulatieveTvt(result.real, result.investering);
  const nTvt = berekenCumulatieveTvt(netResult.real, netResult.investering);
  const verschil = nBesp - hBesp;

  return (
    <div className="card ov-wrap">
      <div className="card-header">
        <div className="card-icon ov-dot">&#9679;</div>
        <div>
          <div className="card-title">Wat als je je netaansluiting upgradet?</div>
          <div className="card-subtitle">Van {result.net} naar {nieuweNet}</div>
        </div>
      </div>

      <div className="ov-grid">
        <div className="ov-col ov-col--grijs">
          <div className="ov-col-title">Huidig ({result.net})</div>
          <div className="ov-row">Besparing: <strong>&euro;{fmt(hBesp)}/jaar</strong></div>
          <div className="ov-row">TVT: <strong>{formatTvt(hTvt)}</strong></div>
          <div className="ov-row">Max. vermogen: <strong>{result.maxKwNet} kW</strong></div>
          <div className="ov-row">Investering: <strong>&euro;{fmt(result.investering)}</strong></div>
        </div>
        <div className="ov-col ov-col--groen">
          <div className="ov-col-title">Na upgrade ({nieuweNet})</div>
          <div className="ov-row">Besparing: <strong className="ov-beter">&euro;{fmt(nBesp)}/jaar</strong> {verschil > 0 && <span className="ov-diff ov-diff--groen">(+&euro;{fmt(verschil)}/jr)</span>}</div>
          <div className="ov-row">TVT: <strong className="ov-beter">{formatTvt(nTvt)}</strong></div>
          <div className="ov-row">Max. vermogen: <strong className="ov-beter">{nieuweMaxKw} kW</strong></div>
          <div className="ov-row">Investering: <strong>&euro;{fmt(netResult.investering)}</strong></div>
        </div>
      </div>

      {verschil > 0 && (
        <div className="ov-banner">
          Een zwaardere aansluiting geeft de batterij meer ruimte om te laden en ontladen, wat de arbitrage-opbrengst verhoogt.
        </div>
      )}

      <div className="ov-doelen">
        <div className="ov-doel ov-doel--actief">&#10003; Batterijvermogen: van {result.maxKwNet} kW naar {nieuweMaxKw} kW</div>
        <div className="ov-doel ov-doel--actief">&#10003; Arbitrage: sneller laden/ontladen bij prijspieken</div>
        {(result.heeftEv && (result.heeftWp || result.heeftHwp)) && (
          <div className="ov-doel ov-doel--actief">&#10003; Minder netcongestie bij gelijktijdig gebruik EV + WP</div>
        )}
      </div>

      <div className="ov-info">
        Je huidige {result.net} aansluiting ({result.maxKwNet} kW) beperkt het laad- en ontlaadvermogen van de batterij.
        Bij een upgrade naar {nieuweNet} ({nieuweMaxKw} kW) kan de batterij sneller handelen en meer pieken opvangen.
        Let op: een netupgrade kost circa &euro;500–1.500 bij de netbeheerder en kan een wachttijd hebben.
      </div>
    </div>
  );
}
