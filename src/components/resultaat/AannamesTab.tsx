"use client";

import type { CalcParams } from "@/lib/calc";

interface Props {
  params: CalcParams;
  onUpdate: (key: keyof CalcParams, value: number) => void;
}

export default function AannamesTab({ params, onUpdate }: Props) {
  return (
    <div className="card at-wrap">
      <div className="card-header">
        <div className="card-icon">⚙️</div>
        <div>
          <div className="card-title">Aannames aanpassen</div>
          <div className="card-subtitle">Pas de rekenparameters aan en zie direct het effect</div>
        </div>
      </div>

      <div className="at-grid">
        <div className="at-item">
          <label className="at-label">
            Installatiekosten
            <span className="at-val">&euro;{params.cpk}/kWh</span>
          </label>
          <input
            type="range"
            min={200} max={800} step={25}
            value={params.cpk}
            onChange={(e) => onUpdate("cpk", Number(e.target.value))}
            className="at-slider"
          />
          <div className="at-range"><span>&euro;200</span><span>&euro;800</span></div>
        </div>

        <div className="at-item">
          <label className="at-label">
            Depth of Discharge (DoD)
            <span className="at-val">{params.dod}%</span>
          </label>
          <input
            type="range"
            min={80} max={100} step={1}
            value={params.dod}
            onChange={(e) => onUpdate("dod", Number(e.target.value))}
            className="at-slider"
          />
          <div className="at-range"><span>80%</span><span>100%</span></div>
        </div>

        <div className="at-item">
          <label className="at-label">
            Round-trip efficiency
            <span className="at-val">{params.eff}%</span>
          </label>
          <input
            type="range"
            min={85} max={98} step={1}
            value={params.eff}
            onChange={(e) => onUpdate("eff", Number(e.target.value))}
            className="at-slider"
          />
          <div className="at-range"><span>85%</span><span>98%</span></div>
        </div>
      </div>
    </div>
  );
}
