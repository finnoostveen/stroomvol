/**
 * Stroomvol Adviseurstool — Rekenmodel v2 (TypeScript port)
 * Pure functie: calc(form) → CalcResult. Geen DOM, geen side effects.
 */
import type {
  FormState,
  ContractType,
  Profiel,
  NetAansluiting,
} from "@/components/formulier/types";

// ===================== TYPES =====================

export interface JaarBesparing {
  zelf: number;
  arb: number;
  ev: number;
  wp: number;
  peak: number;
  totaal: number;
}

export interface ScenarioResult {
  savingY1: number;
  total15: number;
  tvt: number;
  nettoWinst: number;
  perJaar: JaarBesparing[];
}

export interface CalcResult {
  contract: ContractType;
  verbruik: number;
  totaalVerbruik: number;
  verbruikMaand: number[];
  tarief: number;
  terug: number;
  dynDal: number;
  dynPiek: number;
  dynGem: number;
  spread: number;
  stijgPct: number;

  hasSolar: boolean;
  nPanelen: number;
  wpPaneel: number;
  solarKwhJaar: number;
  solarKwhMaand: number[];

  aanbevolenKwh: number;
  usableKwh: number;
  maxBattVermogenKw: number;
  tier: string;
  investering: number;
  cpk: number;
  dod: number;
  eff: number;
  net: NetAansluiting;

  profiel: Profiel;
  gvExtra: number;
  heeftEv: boolean;
  heeftWp: boolean;
  heeftHwp: boolean;
  heeftAc: boolean;

  zelfPctZonder: number;
  zelfPctMet: number;
  zelfZonderJaar: number;
  zelfMetJaar: number;
  zelfZonderMaand: number[];
  zelfMetMaand: number[];
  surplusMaand: number[];
  curtailmentMaand: number[];
  curtailmentJaar: number;
  curtailmentPct: number;

  cycliPerJaar: number;
  jarenTot80Pct: number;
  degradatiePerJaarPct: number;

  cons: ScenarioResult;
  real: ScenarioResult;
  opti: ScenarioResult;

  peakReductieKw: number;
  noodstroomUren: number;
  dagVerbruik: number;
  dagSolar: number;

  // Doelen uit form (voor render)
  doel: Set<string>;
  gv: Set<string>;
}

// ===================== CONSTANTEN =====================

const SOLAR = {
  deratingFactor: 0.9,
  effectieveZonuren: 900,
  maandFractie: [0.03, 0.05, 0.08, 0.1, 0.13, 0.14, 0.13, 0.12, 0.09, 0.06, 0.04, 0.03],
};

const VERBRUIK_MAAND: Record<string, number[]> = {
  basis:      [0.10, 0.095, 0.09, 0.08, 0.07, 0.065, 0.06, 0.065, 0.07, 0.085, 0.095, 0.105],
  warmtepomp: [0.17, 0.15, 0.12, 0.08, 0.03, 0.01, 0.01, 0.01, 0.03, 0.08, 0.13, 0.18],
  airco:      [0.0, 0.0, 0.0, 0.02, 0.08, 0.20, 0.28, 0.24, 0.12, 0.04, 0.02, 0.0],
  ev:         [0.09, 0.09, 0.085, 0.08, 0.08, 0.075, 0.075, 0.075, 0.08, 0.085, 0.09, 0.095],
};

const ZELFCONSUMPTIE_FACTOR: Record<string, number[]> = {
  "standaard":   [0.55, 0.45, 0.35, 0.30, 0.22, 0.20, 0.20, 0.22, 0.30, 0.40, 0.50, 0.55],
  "avond-zwaar": [0.45, 0.35, 0.27, 0.22, 0.17, 0.15, 0.15, 0.17, 0.22, 0.32, 0.40, 0.45],
  "overdag":     [0.70, 0.65, 0.55, 0.50, 0.42, 0.38, 0.38, 0.40, 0.48, 0.58, 0.65, 0.70],
  "ev-nacht":    [0.50, 0.40, 0.30, 0.25, 0.20, 0.18, 0.18, 0.20, 0.28, 0.38, 0.45, 0.50],
};

const BATTERIJ_LIFECYCLE = {
  lfp: { cycliTot80Pct: 5000, degradatiePerCyclus: 0.004 },
};

export const NET_VERMOGEN: Record<string, { maxKw: number; fase: number }> = {
  "1x25": { maxKw: 5.75, fase: 1 },
  "1x35": { maxKw: 8.05, fase: 1 },
  "3x25": { maxKw: 17.25, fase: 3 },
  "3x63": { maxKw: 43.47, fase: 3 },
};

export const GROOTVERBRUIK = {
  ev:  { defaultKwhJaar: 2500, dagKwhGem: 6.8, verschuifbaarPct: 0.70, capaciteitPlus: 3 },
  wp:  { defaultKwhJaar: 3500, winterDagKwh: 12, verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 2 },
  hwp: { defaultKwhJaar: 1200, winterDagKwh: 5,  verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 1 },
  ac:  { defaultKwhJaar: 600,  capaciteitPlus: 1 },
};

const ESSENTIAL_LOAD_KW = 1.2;
const CAPACITEITS_TARIEF = 40;

// ===================== HELPERS =====================

const dagenInMaand = (m: number) => [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
const som = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export interface CalcParams {
  cpk?: number;
  dod?: number;
  eff?: number;
}

// ===================== HELPERS =====================

function berekenArbitrageCycliMetSolar(surplusMaand: number[], usableKwh: number): number {
  let totaalCycli = 0;
  const dagenPerMaand = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  for (let m = 0; m < 12; m++) {
    const dagSurplus = surplusMaand[m] / dagenPerMaand[m];
    const solarBezetting = Math.min(dagSurplus / usableKwh, 1.0);
    const vrijVoorArbitrage = 1.0 - solarBezetting;
    // Minimum 0.3 cycli/dag: nachtladen → ochtend ontladen vóór solar
    const dagCycli = Math.max(vrijVoorArbitrage, 0.3);
    totaalCycli += dagCycli * dagenPerMaand[m];
  }

  // Effectiviteit: niet elke dag heeft voldoende spread (~60%)
  return Math.round(totaalCycli * 0.6);
}

// ===================== MAIN CALC =====================

export function calc(form: FormState, params: CalcParams = {}): CalcResult {
  const contract: ContractType = form.contract ?? "vast";
  const verbruik = Number(form.verbruik) || 3500;
  const cpk = params.cpk ?? 400;
  const dod = (params.dod ?? 90) / 100;
  const eff = (params.eff ?? 92) / 100;
  const profiel = form.profiel || "standaard";
  const net: NetAansluiting = form.net || "1x25";

  const hasSolar = form.zon === "ja" || form.zon === "gepland";
  const nPanelen = hasSolar ? form.panelen : 0;
  const wpPaneel = form.wpPerPaneel || 400;

  const heeftEv = form.gv.has("ev");
  const heeftWp = form.gv.has("wp");
  const heeftHwp = form.gv.has("hwp");
  const heeftAc = form.gv.has("ac");

  // Contract parameters
  let tarief: number, terug: number, dynDal: number, dynPiek: number, dynGem: number;
  let spread: number, stijgPct: number;

  if (contract === "vast") {
    tarief = form.tariefVast; terug = form.terugVast;
    dynDal = 0; dynPiek = 0; dynGem = 0;
    spread = 0; stijgPct = 0;
  } else if (contract === "variabel") {
    tarief = form.tariefVast; terug = form.terugVast;
    dynDal = 0; dynPiek = 0; dynGem = 0;
    spread = 0; stijgPct = form.varStijg;
  } else {
    dynDal = form.dynDal; dynPiek = form.dynPiek; dynGem = form.dynGem;
    tarief = dynGem; terug = dynDal * 0.8;
    spread = dynPiek - dynDal; stijgPct = 3;
  }

  // STAP 1: Zonne-opbrengst per maand
  const solarWp = nPanelen * wpPaneel;
  const solarKwhJaar = (solarWp * SOLAR.deratingFactor) / 1000 * SOLAR.effectieveZonuren;
  const solarKwhMaand = SOLAR.maandFractie.map((f) => solarKwhJaar * f);

  // STAP 2: Totaalverbruik per maand
  const gvExtraJaar =
    (heeftEv ? GROOTVERBRUIK.ev.defaultKwhJaar : 0) +
    (heeftWp ? GROOTVERBRUIK.wp.defaultKwhJaar : 0) +
    (heeftHwp ? GROOTVERBRUIK.hwp.defaultKwhJaar : 0) +
    (heeftAc ? GROOTVERBRUIK.ac.defaultKwhJaar : 0);
  const totaalJaar = verbruik + gvExtraJaar;

  const verbruikMaand: number[] = [];
  for (let m = 0; m < 12; m++) {
    let mv = verbruik * VERBRUIK_MAAND.basis[m];
    if (heeftWp) mv += GROOTVERBRUIK.wp.defaultKwhJaar * VERBRUIK_MAAND.warmtepomp[m];
    if (heeftHwp) mv += GROOTVERBRUIK.hwp.defaultKwhJaar * VERBRUIK_MAAND.warmtepomp[m];
    if (heeftEv) mv += GROOTVERBRUIK.ev.defaultKwhJaar * VERBRUIK_MAAND.ev[m];
    if (heeftAc) mv += GROOTVERBRUIK.ac.defaultKwhJaar * VERBRUIK_MAAND.airco[m];
    verbruikMaand.push(mv);
  }

  // STAP 3: Zelfconsumptie per maand (zonder batterij)
  const zcFactoren = ZELFCONSUMPTIE_FACTOR[profiel] || ZELFCONSUMPTIE_FACTOR["standaard"];
  const zelfZonderMaand: number[] = [];
  const surplusMaand: number[] = [];
  for (let m = 0; m < 12; m++) {
    const dagSolar = solarKwhMaand[m] / dagenInMaand(m);
    const dagVerbruik = verbruikMaand[m] / dagenInMaand(m);
    const directVerbruik = Math.min(dagSolar * zcFactoren[m], dagVerbruik);
    zelfZonderMaand.push(directVerbruik * dagenInMaand(m));
    surplusMaand.push((dagSolar - directVerbruik) * dagenInMaand(m));
  }
  const zelfZonderJaar = som(zelfZonderMaand);
  const surplusJaar = som(surplusMaand);

  // STAP 4: Batterij sizing
  const dagBasisVerbruik = verbruik / 365; // excl. grootverbruikers
  let aanbevolenKwh: number;
  if (!hasSolar && contract !== "dynamisch") {
    aanbevolenKwh = 5;
  } else if (!hasSolar && contract === "dynamisch") {
    aanbevolenKwh = Math.max(5, Math.min(dagBasisVerbruik * 0.5, 15));
  } else {
    const gemDagSurplus = surplusJaar / 365;
    const gemDagVerbruikAvond = (totaalJaar / 365) * 0.5;
    aanbevolenKwh = Math.min(gemDagSurplus, gemDagVerbruikAvond);
    aanbevolenKwh = Math.max(aanbevolenKwh, 5);
  }
  if (contract === "dynamisch") {
    // Minimum gebaseerd op BASISverbruik (excl. grootverbruikers)
    const dynamischMinimum = Math.max(Math.round(dagBasisVerbruik * 0.8), 5);
    aanbevolenKwh = Math.max(aanbevolenKwh, dynamischMinimum);
  }

  if (heeftEv) aanbevolenKwh += GROOTVERBRUIK.ev.capaciteitPlus;
  if (heeftWp) aanbevolenKwh += GROOTVERBRUIK.wp.capaciteitPlus;
  if (heeftHwp) aanbevolenKwh += GROOTVERBRUIK.hwp.capaciteitPlus;
  if (heeftAc) aanbevolenKwh += GROOTVERBRUIK.ac.capaciteitPlus;

  const maxKwNet = NET_VERMOGEN[net]?.maxKw ?? 5.75;
  const maxKwhVoorNet = maxKwNet * 2;
  aanbevolenKwh = Math.min(aanbevolenKwh, maxKwhVoorNet);
  aanbevolenKwh = Math.round(aanbevolenKwh);
  aanbevolenKwh = Math.max(5, Math.min(20, aanbevolenKwh));

  const usableKwh = aanbevolenKwh * dod;
  const maxBattVermogenKw = Math.min(usableKwh / 2, maxKwNet * 0.7);
  const investering = aanbevolenKwh * cpk;

  let tier: string;
  if (aanbevolenKwh <= 5) tier = "Compact — basisopslag";
  else if (aanbevolenKwh <= 10) tier = "Standaard — meest gekozen";
  else if (aanbevolenKwh <= 15) tier = "Groot — hoger verbruik of EV";
  else tier = "Extra groot — intensief gebruik";

  // STAP 5: Zelfconsumptie met batterij
  const zelfMetMaand: number[] = [];
  for (let m = 0; m < 12; m++) {
    const dagSurplusM = surplusMaand[m] / dagenInMaand(m);
    const dagVerbruikM = verbruikMaand[m] / dagenInMaand(m);
    const dagBattOpslag = Math.min(usableKwh * eff, dagSurplusM);
    const dagZelfMet = Math.min(
      zelfZonderMaand[m] / dagenInMaand(m) + dagBattOpslag,
      dagVerbruikM,
    );
    zelfMetMaand.push(dagZelfMet * dagenInMaand(m));
  }
  const zelfMetJaar = som(zelfMetMaand);
  const zelfPctZonder = hasSolar ? Math.round((zelfZonderJaar / totaalJaar) * 100) : 0;
  const zelfPctMet = hasSolar ? Math.round((zelfMetJaar / totaalJaar) * 100) : 0;

  // STAP 5b: Curtailment
  const curtailmentMaand: number[] = [];
  for (let m = 0; m < 12; m++) {
    const dagSurplusCurt = surplusMaand[m] / dagenInMaand(m);
    const dagBattOpslagCurt = Math.min(usableKwh * eff, dagSurplusCurt);
    const dagCurtailment = Math.max(0, dagSurplusCurt - dagBattOpslagCurt);
    curtailmentMaand.push(dagCurtailment * dagenInMaand(m));
  }
  const curtailmentJaar = som(curtailmentMaand);
  const curtailmentPct = solarKwhJaar > 0 ? Math.round((curtailmentJaar / solarKwhJaar) * 100) : 0;

  // STAP 5c: Cycle-based degradatie
  let battKwhPerJaar = zelfMetJaar - zelfZonderJaar;
  if (contract === "dynamisch") {
    const arbCycliJaar = hasSolar ? berekenArbitrageCycliMetSolar(surplusMaand, usableKwh) : 300;
    battKwhPerJaar += arbCycliJaar * usableKwh * eff;
  }
  const cycliPerJaar = usableKwh > 0 ? battKwhPerJaar / usableKwh : 0;
  const degradatiePerJaarPct = cycliPerJaar * BATTERIJ_LIFECYCLE.lfp.degradatiePerCyclus;
  const jarenTot80Pct = cycliPerJaar > 0 ? BATTERIJ_LIFECYCLE.lfp.cycliTot80Pct / cycliPerJaar : 99;

  // STAP 6: Besparingsberekening per jaar
  function berekenJaarBesparing(
    jaar: number,
    scenario: { prijsStijging: number; scenarioFactor: number },
  ): JaarBesparing {
    const effectiefDegPerJaar = (degradatiePerJaarPct * scenario.scenarioFactor) / 100;
    const effectiefKwh = usableKwh * Math.pow(1 - effectiefDegPerJaar, jaar - 1);
    const prijsFactor = Math.pow(1 + scenario.prijsStijging, jaar - 1);
    const huidigTarief = tarief * prijsFactor;
    const effectiefTerug = terug * prijsFactor;

    // Zelfconsumptie
    let jaarBesparingZelf = 0;
    if (hasSolar) {
      for (let mm = 0; mm < 12; mm++) {
        const dSurplus = surplusMaand[mm] / dagenInMaand(mm);
        const dBatt = Math.min(effectiefKwh * eff, dSurplus);
        const extraZelfKwh = dBatt * dagenInMaand(mm);
        jaarBesparingZelf += extraZelfKwh * (huidigTarief - effectiefTerug);
      }
    }

    // Arbitrage
    let jaarBesparingArb = 0;
    if (contract === "dynamisch") {
      const huidigSpread = spread * prijsFactor;
      const arbCycli = hasSolar ? berekenArbitrageCycliMetSolar(surplusMaand, effectiefKwh) : 300;
      const effectieveCycli = Math.min(arbCycli, 365 * 1.5);
      const kwhPerCyclus = Math.min(effectiefKwh * eff, maxBattVermogenKw * 2);
      jaarBesparingArb = effectieveCycli * kwhPerCyclus * huidigSpread;
    } else if (contract === "variabel" && form.doel.has("handel")) {
      jaarBesparingArb = effectiefKwh * 20 * prijsFactor;
    }

    // EV slim laden
    let jaarBesparingEv = 0;
    if (heeftEv && contract === "dynamisch") {
      const evDagKwh = GROOTVERBRUIK.ev.dagKwhGem;
      const verschuifbaar = evDagKwh * GROOTVERBRUIK.ev.verschuifbaarPct;
      const huidigDynGem = (dynGem || 0.15) * prijsFactor;
      const huidigDynDal = (dynDal || 0.05) * prijsFactor;
      jaarBesparingEv = verschuifbaar * 365 * (huidigDynGem - huidigDynDal);
    }

    // WP buffering
    let jaarBesparingWp = 0;
    if ((heeftWp || heeftHwp) && contract === "dynamisch") {
      const gvDef = heeftWp ? GROOTVERBRUIK.wp : GROOTVERBRUIK.hwp;
      const hDynGem = (dynGem || 0.15) * prijsFactor;
      const hDynDal = (dynDal || 0.05) * prijsFactor;
      jaarBesparingWp =
        gvDef.winterDagKwh * gvDef.winterDagen * (hDynGem - hDynDal) * gvDef.verschuifbaarPct;
    }

    // Peak shaving
    let jaarBesparingPeak = 0;
    if (form.doel.has("peak")) {
      const peakKw = Math.min(effectiefKwh / 2, maxBattVermogenKw);
      jaarBesparingPeak = peakKw * CAPACITEITS_TARIEF;
      if (heeftEv) jaarBesparingPeak += Math.min(peakKw, 3.7) * 15;
      if (heeftWp) jaarBesparingPeak += Math.min(peakKw, 2) * 10;
    }

    return {
      zelf: Math.round(jaarBesparingZelf),
      arb: Math.round(jaarBesparingArb),
      ev: Math.round(jaarBesparingEv),
      wp: Math.round(jaarBesparingWp),
      peak: Math.round(jaarBesparingPeak),
      totaal: Math.round(
        jaarBesparingZelf + jaarBesparingArb + jaarBesparingEv + jaarBesparingWp + jaarBesparingPeak,
      ),
    };
  }

  // STAP 7: Scenario's (15 jaar)
  const scenarios = {
    conservatief: {
      prijsStijging: contract === "vast" ? 0 : (stijgPct * 0.25) / 100,
      scenarioFactor: 1.25,
    },
    realistisch: {
      prijsStijging: contract === "vast" ? 0 : stijgPct / 100,
      scenarioFactor: 1.0,
    },
    optimistisch: {
      prijsStijging: contract === "vast" ? 0.01 : stijgPct / 100 + 0.02,
      scenarioFactor: 0.8,
    },
  };

  function berekenScenario(scenario: { prijsStijging: number; scenarioFactor: number }): ScenarioResult {
    let cumulatief = 0;
    const jaarData: JaarBesparing[] = [];
    for (let j = 1; j <= 15; j++) {
      const jb = berekenJaarBesparing(j, scenario);
      cumulatief += jb.totaal;
      jaarData.push(jb);
    }
    const jaar1 = jaarData[0].totaal;
    return {
      savingY1: jaar1,
      total15: cumulatief,
      tvt: jaar1 > 0 ? Math.round((investering / jaar1) * 10) / 10 : 99,
      nettoWinst: cumulatief - investering,
      perJaar: jaarData,
    };
  }

  const cons = berekenScenario(scenarios.conservatief);
  const real = berekenScenario(scenarios.realistisch);
  const opti = berekenScenario(scenarios.optimistisch);

  const peakReductieKw = form.doel.has("peak") ? Math.min(usableKwh / 2, maxBattVermogenKw) : 0;
  const noodstroomUren = Math.round((usableKwh / ESSENTIAL_LOAD_KW) * 10) / 10;

  return {
    contract,
    verbruik,
    totaalVerbruik: totaalJaar,
    verbruikMaand,
    tarief,
    terug,
    dynDal,
    dynPiek,
    dynGem,
    spread: spread || 0,
    stijgPct: stijgPct || 0,

    hasSolar,
    nPanelen,
    wpPaneel,
    solarKwhJaar,
    solarKwhMaand,

    aanbevolenKwh,
    usableKwh,
    maxBattVermogenKw,
    tier,
    investering,
    cpk,
    dod,
    eff,
    net,

    profiel,
    gvExtra: gvExtraJaar,
    heeftEv,
    heeftWp,
    heeftHwp,
    heeftAc,

    zelfPctZonder,
    zelfPctMet,
    zelfZonderJaar: Math.round(zelfZonderJaar),
    zelfMetJaar: Math.round(zelfMetJaar),
    zelfZonderMaand,
    zelfMetMaand,
    surplusMaand,
    curtailmentMaand,
    curtailmentJaar: Math.round(curtailmentJaar),
    curtailmentPct,

    cycliPerJaar: Math.round(cycliPerJaar * 10) / 10,
    jarenTot80Pct: Math.round(jarenTot80Pct * 10) / 10,
    degradatiePerJaarPct: Math.round(degradatiePerJaarPct * 100) / 100,

    cons,
    real,
    opti,

    peakReductieKw,
    noodstroomUren,
    dagVerbruik: Math.round((totaalJaar / 365) * 10) / 10,
    dagSolar: Math.round((solarKwhJaar / 365) * 10) / 10,

    doel: form.doel,
    gv: form.gv,
  };
}

// ===================== HELPERS (exporteerd voor componenten) =====================

export const fmt = (v: number) => v.toLocaleString("nl-NL");
