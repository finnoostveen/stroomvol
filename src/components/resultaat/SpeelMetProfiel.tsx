"use client";

import { useMemo, useState } from "react";
import type { FormState, ContractType, Grootverbruiker } from "@/components/formulier/types";
import { calc, fmt, type CalcParams, type CalcResult } from "@/lib/calc";
import { berekenCumulatieveTvt } from "@/lib/helpers";

interface Props {
  result: CalcResult;
  form: FormState;
  params: CalcParams;
}

interface WhatIf {
  ev: boolean;
  wp: boolean;
  hwp: boolean;
  ac: boolean;
  panelen: number;
  contract: ContractType;
}

function toggleGv(base: Set<Grootverbruiker>, key: Grootverbruiker, on: boolean, off?: Grootverbruiker): Set<Grootverbruiker> {
  const next = new Set(base);
  if (on) {
    next.add(key);
    if (off) next.delete(off);
  } else {
    next.delete(key);
  }
  return next;
}

export default function SpeelMetProfiel({ result, form, params }: Props) {
  const initial: WhatIf = {
    ev: form.gv.has("ev"),
    wp: form.gv.has("wp"),
    hwp: form.gv.has("hwp"),
    ac: form.gv.has("ac"),
    panelen: form.panelen,
    contract: form.contract || "vast",
  };

  const [wi, setWi] = useState<WhatIf>(initial);

  const whatIfResult = useMemo(() => {
    let gv = new Set(form.gv);
    // Apply toggles
    if (wi.ev && !gv.has("ev")) gv.add("ev");
    if (!wi.ev && gv.has("ev")) gv.delete("ev");
    if (wi.wp) { gv.add("wp"); gv.delete("hwp"); }
    else if (wi.hwp) { gv.add("hwp"); gv.delete("wp"); }
    else { gv.delete("wp"); gv.delete("hwp"); }
    if (wi.ac && !gv.has("ac")) gv.add("ac");
    if (!wi.ac && gv.has("ac")) gv.delete("ac");

    const wiForm: FormState = {
      ...form,
      gv,
      panelen: wi.panelen,
      contract: wi.contract,
      // Set sensible defaults for dynamic if switching
      ...(wi.contract === "dynamisch" && form.contract !== "dynamisch" ? { dynDal: 0.05, dynPiek: 0.35, dynGem: 0.15 } : {}),
    };
    return calc(wiForm, params);
  }, [wi, form, params]);

  const hTvt = berekenCumulatieveTvt(result.real, result.investering);
  const wTvt = berekenCumulatieveTvt(whatIfResult.real, whatIfResult.investering);

  const rows = [
    { label: "Batterij", nu: `${result.aanbevolenKwh} kWh`, na: `${whatIfResult.aanbevolenKwh} kWh`, diff: whatIfResult.aanbevolenKwh - result.aanbevolenKwh, unit: " kWh", better: (d: number) => d > 0 },
    { label: "Investering", nu: `\u20AC${fmt(result.investering)}`, na: `\u20AC${fmt(whatIfResult.investering)}`, diff: whatIfResult.investering - result.investering, unit: "", better: (d: number) => d < 0 },
    { label: "Besparing/jaar", nu: `\u20AC${fmt(Math.round(result.real.total15 / 15))}`, na: `\u20AC${fmt(Math.round(whatIfResult.real.total15 / 15))}`, diff: Math.round(whatIfResult.real.total15 / 15) - Math.round(result.real.total15 / 15), unit: "", better: (d: number) => d > 0 },
    { label: "TVT", nu: hTvt < 30 ? `${hTvt.toFixed(1)} jaar` : "> 25 jr", na: wTvt < 30 ? `${wTvt.toFixed(1)} jaar` : "> 25 jr", diff: wTvt - hTvt, unit: " jaar", better: (d: number) => d < 0 },
    { label: "Zelfconsumptie", nu: `${result.zelfPctMet}%`, na: `${whatIfResult.zelfPctMet}%`, diff: whatIfResult.zelfPctMet - result.zelfPctMet, unit: "%", better: (d: number) => d > 0 },
  ];

  const isChanged = wi.ev !== initial.ev || wi.wp !== initial.wp || wi.hwp !== initial.hwp || wi.ac !== initial.ac || wi.panelen !== initial.panelen || wi.contract !== initial.contract;

  return (
    <div className="card smp-wrap">
      <div className="card-header">
        <div className="card-icon">🎮</div>
        <div>
          <div className="card-title">Speel met je profiel</div>
          <div className="card-subtitle">Wat verandert er als jouw situatie wijzigt?</div>
        </div>
      </div>

      <div className="smp-controls">
        {/* Kolom 1: Apparaten */}
        <div className="smp-col">
          <div className="smp-col-title">Apparaten</div>
          <label className="smp-toggle">
            <input type="checkbox" checked={wi.ev} onChange={(e) => setWi((p) => ({ ...p, ev: e.target.checked }))} />
            <span>Elektrische auto</span>
          </label>
          <label className="smp-toggle">
            <input type="checkbox" checked={wi.wp} onChange={(e) => setWi((p) => ({ ...p, wp: e.target.checked, hwp: e.target.checked ? false : p.hwp }))} />
            <span>Warmtepomp</span>
          </label>
          <label className="smp-toggle">
            <input type="checkbox" checked={wi.hwp} onChange={(e) => setWi((p) => ({ ...p, hwp: e.target.checked, wp: e.target.checked ? false : p.wp }))} />
            <span>Hybride warmtepomp</span>
          </label>
          <label className="smp-toggle">
            <input type="checkbox" checked={wi.ac} onChange={(e) => setWi((p) => ({ ...p, ac: e.target.checked }))} />
            <span>Airconditioning</span>
          </label>
        </div>

        {/* Kolom 2: Zonnepanelen */}
        <div className="smp-col">
          <div className="smp-col-title">Zonnepanelen</div>
          <div className="smp-slider-wrap">
            <input
              type="range"
              min={0} max={40} step={2}
              value={wi.panelen}
              onChange={(e) => setWi((p) => ({ ...p, panelen: Number(e.target.value) }))}
              className="smp-slider"
            />
            <div className="smp-slider-val">{wi.panelen} panelen</div>
          </div>
        </div>

        {/* Kolom 3: Contract */}
        <div className="smp-col">
          <div className="smp-col-title">Contract</div>
          <div className="smp-contract-btns">
            {(["vast", "variabel", "dynamisch"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`smp-contract-btn${wi.contract === c ? " active" : ""}`}
                onClick={() => setWi((p) => ({ ...p, contract: c }))}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vergelijkingstabel */}
      <div className="smp-table-wrap">
        <table className="smp-table">
          <thead>
            <tr>
              <th></th>
              <th>Nu</th>
              <th>Na wijziging</th>
              <th>Verschil</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isBetter = r.better(r.diff);
              const isWorse = !r.better(r.diff) && r.diff !== 0;
              const diffStr = r.label === "TVT"
                ? (r.diff !== 0 ? `${r.diff > 0 ? "+" : ""}${r.diff.toFixed(1)}${r.unit}` : "—")
                : r.label === "Investering"
                  ? (r.diff !== 0 ? `${r.diff > 0 ? "+" : ""}\u20AC${fmt(Math.abs(r.diff))}` : "—")
                  : r.label === "Besparing/jaar"
                    ? (r.diff !== 0 ? `${r.diff > 0 ? "+" : ""}\u20AC${fmt(r.diff)}` : "—")
                    : (r.diff !== 0 ? `${r.diff > 0 ? "+" : ""}${r.diff}${r.unit}` : "—");
              return (
                <tr key={r.label}>
                  <td className="smp-label">{r.label}</td>
                  <td className="smp-val">{r.nu}</td>
                  <td className="smp-val">{r.na}</td>
                  <td className={`smp-diff${isBetter ? " smp-better" : isWorse ? " smp-worse" : ""}`}>
                    {diffStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isChanged && (
        <button
          type="button"
          className="smp-reset"
          onClick={() => setWi(initial)}
        >
          Reset naar origineel
        </button>
      )}
    </div>
  );
}
