"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

function berekenSalderingImpact(c: CalcResult) {
  const surplusJaar = c.solarKwhJaar - c.zelfZonderJaar;

  // Scenario 1: Met saldering (huidig, vóór 2027)
  // Surplus wordt gesaldeerd tegen vol tarief — effectief €0 verlies
  const kostenMetSaldering = (c.totaalVerbruik - c.solarKwhJaar) * c.tarief;
  const jaarKostenMetSaldering = Math.max(0, Math.round(kostenMetSaldering));

  // Scenario 2: Zonder saldering, ZONDER batterij (post-2027)
  const netVerbruikZonder = c.totaalVerbruik - c.zelfZonderJaar;
  const jaarKostenZonderSalderingZonderBatt = Math.round(
    netVerbruikZonder * c.tarief - surplusJaar * c.terug
  );

  // Scenario 3: Zonder saldering, MET batterij (post-2027)
  const netVerbruikMet = c.totaalVerbruik - c.zelfMetJaar;
  const restSurplus = c.curtailmentJaar; // wat nog naar net gaat na batterij
  const jaarKostenZonderSalderingMetBatt = Math.round(
    netVerbruikMet * c.tarief - restSurplus * c.terug
  );

  const extraKostenDoorAfschaffing = jaarKostenZonderSalderingZonderBatt - jaarKostenMetSaldering;
  const besparingDoorBatterij = jaarKostenZonderSalderingZonderBatt - jaarKostenZonderSalderingMetBatt;

  return {
    jaarKostenMetSaldering,
    jaarKostenZonderSalderingZonderBatt,
    jaarKostenZonderSalderingMetBatt,
    extraKostenDoorAfschaffing,
    besparingDoorBatterij,
    surplusKwh: Math.round(surplusJaar),
  };
}

export { berekenSalderingImpact };

export default function SalderingImpact({ result }: Props) {
  if (!result.hasSolar) return null;

  const d = berekenSalderingImpact(result);

  return (
    <div className="card si-wrap">
      <div className="card-header">
        <div className="card-icon">⚡</div>
        <div>
          <div className="card-title">Impact afschaffing saldering</div>
          <div className="card-subtitle">
            Vanaf 1 januari 2027 stopt de salderingsregeling. Dit is wat dat voor jou betekent.
          </div>
        </div>
      </div>

      {/* Drie scenario kolommen */}
      <div className="si-grid">
        {/* Kolom 1: Huidig */}
        <div className="si-col si-col--neutral">
          <div className="si-badge si-badge--neutral">Huidig</div>
          <div className="si-col-title">Met saldering</div>
          <div className="si-col-sub">2026</div>
          <div className="si-kosten-label">Energiekosten</div>
          <div className="si-kosten-val">&euro;{fmt(d.jaarKostenMetSaldering)}/jaar</div>
        </div>

        {/* Kolom 2: Zonder batterij */}
        <div className="si-col si-col--rood">
          <div className="si-badge si-badge--rood">Vanaf 2027</div>
          <div className="si-col-title">Zonder batterij</div>
          <div className="si-col-sub">Zonder saldering</div>
          <div className="si-kosten-label">Energiekosten</div>
          <div className="si-kosten-val">&euro;{fmt(d.jaarKostenZonderSalderingZonderBatt)}/jaar</div>
          {d.extraKostenDoorAfschaffing > 0 && (
            <div className="si-impact si-impact--rood">+&euro;{fmt(d.extraKostenDoorAfschaffing)}/jaar extra</div>
          )}
        </div>

        {/* Kolom 3: Met batterij */}
        <div className="si-col si-col--groen">
          <div className="si-badge si-badge--groen">Vanaf 2027</div>
          <div className="si-col-title">Met batterij</div>
          <div className="si-col-sub">Zonder saldering</div>
          <div className="si-kosten-label">Energiekosten</div>
          <div className="si-kosten-val">&euro;{fmt(d.jaarKostenZonderSalderingMetBatt)}/jaar</div>
          {d.besparingDoorBatterij > 0 && (
            <div className="si-impact si-impact--groen">bespaard: &euro;{fmt(d.besparingDoorBatterij)}/jaar</div>
          )}
        </div>
      </div>

      {/* Uitleg */}
      <div className="si-uitleg">
        Zonder saldering ontvang je voor teruggeleverde stroom nog slechts &euro;{result.terug.toFixed(2)}/kWh
        in plaats van &euro;{result.tarief.toFixed(2)}/kWh.
        Jij levert jaarlijks ~{fmt(d.surplusKwh)} kWh terug — dat kost
        je &euro;{fmt(d.extraKostenDoorAfschaffing)}/jaar.
        De batterij vangt dit op door die stroom zelf op te slaan en te gebruiken.
      </div>
    </div>
  );
}
