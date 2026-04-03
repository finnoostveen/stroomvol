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

function MetricRow({ label, huidig, dynamisch, beter }: { label: string; huidig: string; dynamisch: string; beter: boolean }) {
  return (
    <tr>
      <td className="cs-label">{label}</td>
      <td className="cs-val">{huidig}</td>
      <td className={`cs-val cs-dyn${beter ? " cs-better" : ""}`}>{dynamisch}</td>
    </tr>
  );
}

export default function ContractSwitch({ result, form, params }: Props) {
  if (result.contract === "dynamisch") return null;

  const dynResult = useMemo(() => {
    const dynForm: FormState = {
      ...form,
      contract: "dynamisch",
      dynDal: 0.05,
      dynPiek: 0.35,
      dynGem: 0.15,
    };
    return calc(dynForm, params);
  }, [form, params]);

  const hTvt = berekenCumulatieveTvt(result.real, result.investering);
  const dTvt = berekenCumulatieveTvt(dynResult.real, dynResult.investering);
  const hBesparingJaar = Math.round(result.real.total15 / 15);
  const dBesparingJaar = Math.round(dynResult.real.total15 / 15);
  const verschilJaar = dBesparingJaar - hBesparingJaar;

  const huidigLabel = result.contract === "vast" ? "Vast contract" : "Variabel contract";

  const hComponenten = [
    { label: "Zelfconsumptie", actief: result.hasSolar },
    { label: "Stroomhandel (arbitrage)", actief: false },
    { label: "Peak shaving", actief: result.peakReductieKw > 0 },
  ];

  const dComponenten = [
    { label: "Zelfconsumptie", actief: dynResult.hasSolar },
    { label: "Stroomhandel (arbitrage)", actief: true },
    { label: "Peak shaving", actief: dynResult.peakReductieKw > 0 },
  ];

  return (
    <div className="card cs-wrap">
      <div className="card-header">
        <div className="card-icon">🔄</div>
        <div>
          <div className="card-title">Wat als je overstapt naar dynamisch?</div>
          <div className="card-subtitle">Met een dynamisch contract verdient je batterij extra door slim te handelen.</div>
        </div>
      </div>

      <div className="cs-columns">
        {/* Huidig contract */}
        <div className="cs-col">
          <div className="cs-col-header">{huidigLabel}</div>
          <table className="cs-table">
            <tbody>
              <MetricRow label="Besparing/jaar" huidig={`€${fmt(hBesparingJaar)}`} dynamisch="" beter={false} />
              <MetricRow label="Terugverdientijd" huidig={formatTvt(hTvt)} dynamisch="" beter={false} />
              <MetricRow label="Totaal 15 jaar" huidig={`€${fmt(result.real.total15)}`} dynamisch="" beter={false} />
            </tbody>
          </table>
          <div className="cs-componenten">
            {hComponenten.map((c) => (
              <div key={c.label} className={`cs-comp${c.actief ? " cs-comp-actief" : ""}`}>
                <span>{c.actief ? "✓" : "✗"}</span> {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamisch contract */}
        <div className="cs-col cs-col-dyn">
          <div className="cs-col-header">Dynamisch contract</div>
          <table className="cs-table">
            <tbody>
              <MetricRow label="Besparing/jaar" huidig="" dynamisch={`€${fmt(dBesparingJaar)}`} beter={dBesparingJaar > hBesparingJaar} />
              <MetricRow label="Terugverdientijd" huidig="" dynamisch={formatTvt(dTvt)} beter={dTvt < hTvt} />
              <MetricRow label="Totaal 15 jaar" huidig="" dynamisch={`€${fmt(dynResult.real.total15)}`} beter={dynResult.real.total15 > result.real.total15} />
            </tbody>
          </table>
          <div className="cs-componenten">
            {dComponenten.map((c) => (
              <div key={c.label} className={`cs-comp${c.actief ? " cs-comp-actief" : ""}`}>
                <span>{c.actief ? "✓" : "✗"}</span> {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verschil banner */}
      {verschilJaar > 0 && (
        <div className="cs-banner">
          Met een dynamisch contract bespaar je <strong>&euro;{fmt(verschilJaar)}/jaar</strong> extra
        </div>
      )}

      <p className="cs-disclaimer">
        Een dynamisch contract brengt prijsrisico met zich mee. De batterij beperkt dit risico.
      </p>
    </div>
  );
}
