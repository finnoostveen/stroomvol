"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";

interface Props {
  result: CalcResult;
}

export default function AdviesSamenvatting({ result }: Props) {
  const r = result;
  const tvt = berekenCumulatieveTvt(r.real, r.investering);
  const besparingJaar = Math.round(r.real.total15 / 15);
  const totaal15 = r.real.total15;
  const onafh = r.zelfPctMet;

  return (
    <div className="adv-samenvatting">
      <div className="adv-sam-card adv-sam-card--dark">
        <div className="adv-sam-label">Batterij</div>
        <div className="adv-sam-val">{r.aanbevolenKwh} kWh</div>
      </div>
      <div className="adv-sam-card">
        <div className="adv-sam-label">TVT</div>
        <div className={`adv-sam-val ${tvt > 15 ? "adv-sam-val--amber" : "adv-sam-val--groen"}`}>{formatTvt(tvt)}</div>
      </div>
      <div className="adv-sam-card">
        <div className="adv-sam-label">Besparing</div>
        <div className="adv-sam-val">&euro;{fmt(besparingJaar)}/jr</div>
      </div>
      <div className="adv-sam-card">
        <div className="adv-sam-label">Totaal 15 jr</div>
        <div className="adv-sam-val">&euro;{fmt(totaal15)}</div>
      </div>
      <div className="adv-sam-card">
        <div className="adv-sam-label">Onafh.</div>
        <div className="adv-sam-val adv-sam-val--groen">{onafh}%</div>
      </div>
    </div>
  );
}
