"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt, NET_VERMOGEN } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

export default function Aannames({ result: c }: Props) {
  const lines = [
    `Jaarverbruik: ${fmt(c.verbruik)} kWh (${c.dagVerbruik} kWh/dag)`,
    c.hasSolar
      ? `Zonneopbrengst: ~${fmt(Math.round(c.solarKwhJaar))} kWh/jaar (${c.nPanelen} \u00d7 ${c.wpPaneel} Wp)`
      : "Geen zonnepanelen",
    c.contract === "dynamisch"
      ? `Contract: dynamisch \u2014 dal \u20AC${c.dynDal.toFixed(2)}, piek \u20AC${c.dynPiek.toFixed(2)}, gem. \u20AC${c.dynGem.toFixed(2)}`
      : `Contract: ${c.contract} \u2014 inkoop \u20AC${c.tarief.toFixed(2)}/kWh, terug \u20AC${c.terug.toFixed(2)}/kWh`,
    `Installatiekosten: \u20AC${c.cpk}/kWh \u2192 \u20AC${fmt(c.investering)} totaal`,
    `Batterij: ${c.aanbevolenKwh} kWh nom., ${c.usableKwh.toFixed(1)} kWh bruikbaar (DoD ${Math.round(c.dod * 100)}%, eff. ${Math.round(c.eff * 100)}%)`,
    `Degradatie: cycle-based (~${c.degradatiePerJaarPct}%/jaar bij ~${c.cycliPerJaar} cycli/jaar, LFP 5000 cycli tot 80%)`,
    `Levensduur: ~${c.jarenTot80Pct} jaar tot 80% capaciteit`,
    c.contract !== "vast"
      ? `Energieprijsstijging: ${c.stijgPct}%/jaar`
      : "Vast: geen prijsstijging tijdens contract",
    c.hasSolar
      ? `Zelfconsumptie: ${c.zelfPctZonder}% \u2192 ${c.zelfPctMet}% met batterij`
      : null,
    c.hasSolar && c.curtailmentJaar > 0
      ? `Curtailment: ~${fmt(c.curtailmentJaar)} kWh/jaar (${c.curtailmentPct}% van zonneopbrengst)`
      : null,
    "Saldering: volledig afgeschaft per 1/1/2027",
    `Netaansluiting: ${c.net} (max ${NET_VERMOGEN[c.net]?.maxKw ?? "?"} kW)`,
  ].filter(Boolean) as string[];

  return (
    <div className="assumptions">
      <div className="assumptions-title">Aannames in deze berekening</div>
      <div className="assumptions-list">
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
