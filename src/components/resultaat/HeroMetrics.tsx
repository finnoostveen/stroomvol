"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";
import InfoTip from "./InfoTip";

const PROFIEL_LABELS: Record<string, string> = {
  standaard: "Standaard profiel",
  "avond-zwaar": "Avondzwaar",
  overdag: "Overdag thuis",
  "ev-nacht": "EV nachtladen",
};

const CONTRACT_BADGE: Record<string, { label: string; className: string }> = {
  vast:       { label: "Vast contract",      className: "r-contract-vast" },
  variabel:   { label: "Variabel contract",  className: "r-contract-variabel" },
  dynamisch:  { label: "Dynamisch contract", className: "r-contract-dynamisch" },
};

function heroText(c: CalcResult): string {
  if (c.hasSolar && c.zelfPctMet >= 60) {
    return `${c.zelfPctMet}% van je eigen zonnestroom benut \u2014 maximale onafhankelijkheid van het net.`;
  }
  if (c.contract === "dynamisch" && c.real.perJaar[0].arb > 0) {
    return "Slim verdienen met dynamische energieprijzen \u2014 de batterij handelt automatisch mee op uurprijzen.";
  }
  if (c.doel.has("nood")) {
    return `${c.noodstroomUren} uur onafhankelijk bij stroomuitval \u2014 essenti\u00eble apparaten blijven draaien.`;
  }
  return "Een slimmere manier om energie te gebruiken \u2014 bespaar op je energierekening en word onafhankelijker.";
}

function buildTags(c: CalcResult): string[] {
  const tags: string[] = [];
  if (c.hasSolar) tags.push(`${c.nPanelen} panelen \u00b7 ~${Math.round(c.solarKwhJaar)} kWh/jr`);
  if (c.heeftEv) tags.push("EV");
  if (c.heeftWp || c.heeftHwp) tags.push("Warmtepomp");
  if (c.contract === "dynamisch") tags.push(`Spread \u20AC${c.spread.toFixed(2)}/kWh`);
  if (c.doel.has("nood")) tags.push("Noodstroom");
  tags.push(PROFIEL_LABELS[c.profiel] || "Standaard profiel");
  return tags;
}

interface Props {
  result: CalcResult;
}

export default function HeroMetrics({ result: c }: Props) {
  const badge = CONTRACT_BADGE[c.contract];
  const tags = buildTags(c);
  const tvt = berekenCumulatieveTvt(c.real, c.investering);
  const gemBesparing = Math.round(c.real.total15 / 15);

  return (
    <>
      {/* Hero */}
      <div className="result-hero">
        <div className="result-hero-grid" />
        <div className="r-label">Capaciteitsadvies</div>
        <div className="r-cap">
          {c.aanbevolenKwh} <span>kWh</span>
        </div>
        <div className="r-tier">{c.tier}</div>
        <div className="r-hero-text">{heroText(c)}</div>
        <div>
          <span className={`r-contract-badge ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="r-tags">
          {tags.map((t) => (
            <span key={t} className="r-tag">{t}</span>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics">
        <div className="mc">
          <div className="mc-icon">{"\uD83D\uDCB0"}</div>
          <div className="mc-val">&euro;{fmt(c.investering)}</div>
          <div className="mc-label">Geschatte investering</div>
        </div>
        <div className="mc">
          <div className="mc-icon">{"\uD83D\uDCC9"}</div>
          <div className="mc-val">
            {formatTvt(tvt)}
          </div>
          <div className="mc-label">
            Terugverdientijd (realistisch)
            <InfoTip tekst="Het aantal jaren voordat de cumulatieve besparing de investering overtreft. Gebaseerd op het realistische scenario met verwachte degradatie en prijsontwikkeling." />
          </div>
        </div>
        <div className="mc">
          <div className="mc-icon">{"\u2600\uFE0F"}</div>
          <div className="mc-val">
            {c.hasSolar ? `${c.zelfPctMet}%` : "n.v.t."}
          </div>
          <div className="mc-label">
            Zelfconsumptie met batterij
            <InfoTip tekst="Het percentage van je zonneopbrengst dat je zelf verbruikt (direct + via batterij). Hoe hoger, hoe minder je teruglevert aan het net tegen een lager tarief." />
          </div>
        </div>
        <div className="mc">
          <div className="mc-icon">{"\uD83D\uDCA1"}</div>
          <div className="mc-val">&euro;{fmt(gemBesparing)}</div>
          <div className="mc-label">
            Gem. besparing / jaar
            <InfoTip tekst="Gemiddelde jaarlijkse besparing over 15 jaar, rekening houdend met batterijdegradatie en prijsstijgingen." />
          </div>
        </div>
      </div>
    </>
  );
}
