/**
 * Stroomvol Adviseurstool — Rekenmodel v2
 * Pure functie: calc(input) → output. Geen DOM, geen side effects.
 * Bron van waarheid: docs/rekenmodel-v2.md
 */
var SV = SV || {};

// ===================== CONSTANTEN =====================

SV.SOLAR = {
  deratingFactor: 0.90,
  effectieveZonuren: 900,
  maandFractie: [0.03, 0.05, 0.08, 0.10, 0.13, 0.14, 0.13, 0.12, 0.09, 0.06, 0.04, 0.03],
};

SV.VERBRUIK_MAAND = {
  basis:      [0.10, 0.095, 0.09, 0.08, 0.07, 0.065, 0.06, 0.065, 0.07, 0.085, 0.095, 0.105],
  warmtepomp: [0.17, 0.15, 0.12, 0.08, 0.03, 0.01, 0.01, 0.01, 0.03, 0.08, 0.13, 0.18],
  airco:      [0.0, 0.0, 0.0, 0.02, 0.08, 0.20, 0.28, 0.24, 0.12, 0.04, 0.02, 0.0],
  ev:         [0.09, 0.09, 0.085, 0.08, 0.08, 0.075, 0.075, 0.075, 0.08, 0.085, 0.09, 0.095],
};

SV.ZELFCONSUMPTIE_FACTOR = {
  'standaard':   [0.55, 0.45, 0.35, 0.30, 0.22, 0.20, 0.20, 0.22, 0.30, 0.40, 0.50, 0.55],
  'avond-zwaar': [0.45, 0.35, 0.27, 0.22, 0.17, 0.15, 0.15, 0.17, 0.22, 0.32, 0.40, 0.45],
  'overdag':     [0.70, 0.65, 0.55, 0.50, 0.42, 0.38, 0.38, 0.40, 0.48, 0.58, 0.65, 0.70],
  'ev-nacht':    [0.50, 0.40, 0.30, 0.25, 0.20, 0.18, 0.18, 0.20, 0.28, 0.38, 0.45, 0.50],
};

SV.SALDERING = {
  // Saldering volledig afgeschaft per 1/1/2027
  terugFractieNaSaldering: 0.25,
};

SV.BATTERIJ_LIFECYCLE = {
  lfp: {
    cycliTot80Pct: 5000,
    degradatiePerCyclus: 0.004, // 0.004% per cyclus
  },
};

SV.NET_VERMOGEN = {
  '1x25': { maxKw: 5.75, fase: 1 },
  '1x35': { maxKw: 8.05, fase: 1 },
  '3x25': { maxKw: 17.25, fase: 3 },
  '3x63': { maxKw: 43.47, fase: 3 },
};

SV.GROOTVERBRUIK = {
  ev:  { defaultKwhJaar: 2500, dagKwhGem: 6.8, verschuifbaarPct: 0.70, capaciteitPlus: 3 },
  wp:  { defaultKwhJaar: 3500, winterDagKwh: 12, verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 2 },
  hwp: { defaultKwhJaar: 1200, winterDagKwh: 5, verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 1 },
  ac:  { defaultKwhJaar: 600, capaciteitPlus: 1 },
};

SV.EPEX_SHAPE = {
  zomer:  [0.05,0.03,0.02,0.01,0.02,0.05,0.15, 0.70,0.85,0.75, 0.35,0.18,0.08,0.12,0.25, 0.45,0.60,0.82,1.0,0.95,0.78, 0.50,0.28,0.10],
  winter: [0.08,0.05,0.03,0.02,0.03,0.08,0.25, 0.80,0.95,0.90, 0.55,0.45,0.40,0.42,0.48, 0.58,0.72,0.90,1.0,0.95,0.82, 0.58,0.32,0.15],
};

SV.ESSENTIAL_LOAD_KW = 1.2;
SV.CAPACITEITS_TARIEF = 40;

// ===================== MAIN CALC =====================

SV.calc = function() {
  var S = SV.state;
  var n = SV.n, som = SV.som, dagenInMaand = SV.dagenInMaand;

  var contract = S.contract || 'vast';
  var verbruik = SV.elVal('in-verbruik', 3500);
  var cpk = SV.elVal('p-cpk', 400);
  var dod = SV.elVal('p-dod', 90) / 100;
  var eff = SV.elVal('p-eff', 92) / 100;
  var profiel = S.profiel || 'standaard';
  var net = S.net || '1x25';

  var hasSolar = (S.zon === 'ja' || S.zon === 'gepland');
  var nPanelen = hasSolar ? S.panelen : 0;
  var wpPaneel = SV.elVal('in-wp', 400);

  var heeftEv = S.gv.has('ev');
  var heeftWp = S.gv.has('wp');
  var heeftHwp = S.gv.has('hwp');
  var heeftAc = S.gv.has('ac');

  // Contract parameters
  var tarief, terug, dynDal, dynPiek, dynGem, spread, stijgPct;
  if (contract === 'vast') {
    tarief = SV.elVal('in-tarief-vast', 0.28);
    terug = SV.elVal('in-terug-vast', 0.07);
    spread = 0; stijgPct = 0;
  } else if (contract === 'variabel') {
    tarief = SV.elVal('in-tarief-vast', 0.28);
    terug = SV.elVal('in-terug-vast', 0.07);
    spread = 0; stijgPct = SV.elVal('in-var-stijg', 4);
  } else {
    dynDal = SV.elVal('in-dyn-dal', 0.05);
    dynPiek = SV.elVal('in-dyn-piek', 0.35);
    dynGem = SV.elVal('in-dyn-gem', 0.15);
    tarief = dynGem; terug = dynDal * 0.8;
    spread = dynPiek - dynDal; stijgPct = 3;
  }

  // === STAP 1: Zonne-opbrengst per maand ===
  var solarWp = nPanelen * wpPaneel;
  var solarKwhJaar = solarWp * SV.SOLAR.deratingFactor / 1000 * SV.SOLAR.effectieveZonuren;
  var solarKwhMaand = SV.SOLAR.maandFractie.map(function(f) { return solarKwhJaar * f; });

  // === STAP 2: Totaalverbruik per maand ===
  var gvExtraJaar = (heeftEv ? SV.GROOTVERBRUIK.ev.defaultKwhJaar : 0)
    + (heeftWp ? SV.GROOTVERBRUIK.wp.defaultKwhJaar : 0)
    + (heeftHwp ? SV.GROOTVERBRUIK.hwp.defaultKwhJaar : 0)
    + (heeftAc ? SV.GROOTVERBRUIK.ac.defaultKwhJaar : 0);
  var basisJaar = verbruik;
  var totaalJaar = basisJaar + gvExtraJaar;

  var verbruikMaand = [];
  for (var m = 0; m < 12; m++) {
    var mv = basisJaar * SV.VERBRUIK_MAAND.basis[m];
    if (heeftWp)  mv += SV.GROOTVERBRUIK.wp.defaultKwhJaar * SV.VERBRUIK_MAAND.warmtepomp[m];
    if (heeftHwp) mv += SV.GROOTVERBRUIK.hwp.defaultKwhJaar * SV.VERBRUIK_MAAND.warmtepomp[m];
    if (heeftEv)  mv += SV.GROOTVERBRUIK.ev.defaultKwhJaar * SV.VERBRUIK_MAAND.ev[m];
    if (heeftAc)  mv += SV.GROOTVERBRUIK.ac.defaultKwhJaar * SV.VERBRUIK_MAAND.airco[m];
    verbruikMaand.push(mv);
  }

  // === STAP 3: Zelfconsumptie per maand (zonder batterij) ===
  var zcFactoren = SV.ZELFCONSUMPTIE_FACTOR[profiel] || SV.ZELFCONSUMPTIE_FACTOR['standaard'];
  var zelfZonderMaand = [];
  var surplusMaand = [];
  for (m = 0; m < 12; m++) {
    var dagSolar = solarKwhMaand[m] / dagenInMaand(m);
    var dagVerbruik = verbruikMaand[m] / dagenInMaand(m);
    var directVerbruik = Math.min(dagSolar * zcFactoren[m], dagVerbruik);
    zelfZonderMaand.push(directVerbruik * dagenInMaand(m));
    surplusMaand.push((dagSolar - directVerbruik) * dagenInMaand(m));
  }
  var zelfZonderJaar = som(zelfZonderMaand);
  var surplusJaar = som(surplusMaand);

  // === STAP 4: Batterij sizing ===
  var aanbevolenKwh;
  if (!hasSolar && contract !== 'dynamisch') {
    aanbevolenKwh = 5;
  } else if (!hasSolar && contract === 'dynamisch') {
    var dagVerbruikGem = totaalJaar / 365;
    aanbevolenKwh = Math.max(5, Math.min(dagVerbruikGem * 0.5, 15));
  } else {
    var gemDagSurplus = surplusJaar / 365;
    var gemDagVerbruikAvond = (totaalJaar / 365) * 0.5;
    aanbevolenKwh = Math.min(gemDagSurplus, gemDagVerbruikAvond);
    aanbevolenKwh = Math.max(aanbevolenKwh, 5);
  }
  if (contract === 'dynamisch') aanbevolenKwh = Math.max(aanbevolenKwh, 10);

  // Upsize for grootverbruikers
  if (heeftEv)  aanbevolenKwh += SV.GROOTVERBRUIK.ev.capaciteitPlus;
  if (heeftWp)  aanbevolenKwh += SV.GROOTVERBRUIK.wp.capaciteitPlus;
  if (heeftHwp) aanbevolenKwh += SV.GROOTVERBRUIK.hwp.capaciteitPlus;
  if (heeftAc)  aanbevolenKwh += SV.GROOTVERBRUIK.ac.capaciteitPlus;

  // Net begrenzing
  var maxKwNet = SV.NET_VERMOGEN[net] ? SV.NET_VERMOGEN[net].maxKw : 5.75;
  var maxKwhVoorNet = maxKwNet * 2;
  aanbevolenKwh = Math.min(aanbevolenKwh, maxKwhVoorNet);

  // Afronden op 5 kWh
  aanbevolenKwh = Math.round(aanbevolenKwh / 5) * 5;
  aanbevolenKwh = Math.max(5, Math.min(30, aanbevolenKwh));

  var usableKwh = aanbevolenKwh * dod;
  var maxBattVermogenKw = Math.min(usableKwh / 2, maxKwNet * 0.7);
  var investering = aanbevolenKwh * cpk;

  // Tier label
  var tier;
  if (aanbevolenKwh <= 5) tier = 'Compact — basisopslag';
  else if (aanbevolenKwh <= 10) tier = 'Standaard — meest gekozen';
  else if (aanbevolenKwh <= 15) tier = 'Groot — hoger verbruik of EV';
  else tier = 'Extra groot — intensief gebruik';

  // === STAP 5: Zelfconsumptie met batterij (per maand) ===
  var zelfMetMaand = [];
  for (m = 0; m < 12; m++) {
    var dagSurplusM = surplusMaand[m] / dagenInMaand(m);
    var dagVerbruikM = verbruikMaand[m] / dagenInMaand(m);
    var dagBattOpslag = Math.min(usableKwh * eff, dagSurplusM);
    var dagZelfMet = Math.min(
      (zelfZonderMaand[m] / dagenInMaand(m)) + dagBattOpslag,
      dagVerbruikM
    );
    zelfMetMaand.push(dagZelfMet * dagenInMaand(m));
  }
  var zelfMetJaar = som(zelfMetMaand);
  var zelfPctZonder = hasSolar ? Math.round(zelfZonderJaar / totaalJaar * 100) : 0;
  var zelfPctMet = hasSolar ? Math.round(zelfMetJaar / totaalJaar * 100) : 0;

  // === STAP 5b: Curtailment tracking ===
  var curtailmentMaand = [];
  for (m = 0; m < 12; m++) {
    var dagSurplusCurt = surplusMaand[m] / dagenInMaand(m);
    var dagBattOpslagCurt = Math.min(usableKwh * eff, dagSurplusCurt);
    var dagCurtailment = Math.max(0, dagSurplusCurt - dagBattOpslagCurt);
    curtailmentMaand.push(dagCurtailment * dagenInMaand(m));
  }
  var curtailmentJaar = som(curtailmentMaand);
  var curtailmentPct = solarKwhJaar > 0 ? Math.round(curtailmentJaar / solarKwhJaar * 100) : 0;

  // === STAP 5c: Cycle-based degradatie ===
  var battKwhPerJaar = zelfMetJaar - zelfZonderJaar; // extra kWh door batterij
  if (contract === 'dynamisch') {
    var arbCycliJaar = hasSolar ? 50 : 300;
    battKwhPerJaar += arbCycliJaar * usableKwh * eff;
  }
  var cycliPerJaar = usableKwh > 0 ? battKwhPerJaar / usableKwh : 0;
  var degradatiePerJaarPct = cycliPerJaar * SV.BATTERIJ_LIFECYCLE.lfp.degradatiePerCyclus;
  var jarenTot80Pct = cycliPerJaar > 0 ? SV.BATTERIJ_LIFECYCLE.lfp.cycliTot80Pct / cycliPerJaar : 99;

  // === STAP 6: Besparingsberekening per jaar ===
  function berekenJaarBesparing(jaar, scenario) {
    var effectiefDegPerJaar = degradatiePerJaarPct * scenario.scenarioFactor / 100;
    var effectiefKwh = usableKwh * Math.pow(1 - effectiefDegPerJaar, jaar - 1);
    var prijsFactor = Math.pow(1 + scenario.prijsStijging, jaar - 1);
    var huidigTarief = tarief * prijsFactor;

    // Saldering volledig afgeschaft per 1/1/2027 — teruglevertarief is vast
    var effectiefTerug = terug * prijsFactor;

    // Component 1: Zelfconsumptie
    var jaarBesparingZelf = 0;
    if (hasSolar) {
      for (var mm = 0; mm < 12; mm++) {
        var dSurplus = surplusMaand[mm] / dagenInMaand(mm);
        var dBatt = Math.min(effectiefKwh * eff, dSurplus);
        var extraZelfKwh = dBatt * dagenInMaand(mm);
        jaarBesparingZelf += extraZelfKwh * (huidigTarief - effectiefTerug);
      }
    }

    // Component 2: Arbitrage
    var jaarBesparingArb = 0;
    if (contract === 'dynamisch') {
      var huidigSpread = spread * prijsFactor;
      var arbCycli = hasSolar ? 50 : 300;
      var effectieveCycli = Math.min(arbCycli, 365 * 1.5);
      var kwhPerCyclus = Math.min(effectiefKwh * eff, maxBattVermogenKw * 2);
      jaarBesparingArb = effectieveCycli * kwhPerCyclus * huidigSpread;
    } else if (contract === 'variabel' && S.doel.has('handel')) {
      jaarBesparingArb = effectiefKwh * 20 * prijsFactor;
    }

    // Component 3: EV slim laden
    var jaarBesparingEv = 0;
    if (heeftEv && contract === 'dynamisch') {
      var evDagKwh = SV.GROOTVERBRUIK.ev.dagKwhGem;
      var verschuifbaar = evDagKwh * SV.GROOTVERBRUIK.ev.verschuifbaarPct;
      var huidigDynGem = (dynGem || 0.15) * prijsFactor;
      var huidigDynDal = (dynDal || 0.05) * prijsFactor;
      jaarBesparingEv = verschuifbaar * 365 * (huidigDynGem - huidigDynDal);
    }

    // Component 4: WP buffering
    var jaarBesparingWp = 0;
    if ((heeftWp || heeftHwp) && contract === 'dynamisch') {
      var gv = heeftWp ? SV.GROOTVERBRUIK.wp : SV.GROOTVERBRUIK.hwp;
      var hDynGem = (dynGem || 0.15) * prijsFactor;
      var hDynDal = (dynDal || 0.05) * prijsFactor;
      jaarBesparingWp = gv.winterDagKwh * gv.winterDagen * (hDynGem - hDynDal) * gv.verschuifbaarPct;
    }

    // Component 5: Peak shaving
    var jaarBesparingPeak = 0;
    if (S.doel.has('peak')) {
      var peakKw = Math.min(effectiefKwh / 2, maxBattVermogenKw);
      jaarBesparingPeak = peakKw * SV.CAPACITEITS_TARIEF;
      if (heeftEv) jaarBesparingPeak += Math.min(peakKw, 3.7) * 15;
      if (heeftWp) jaarBesparingPeak += Math.min(peakKw, 2) * 10;
    }

    return {
      zelf: Math.round(jaarBesparingZelf),
      arb: Math.round(jaarBesparingArb),
      ev: Math.round(jaarBesparingEv),
      wp: Math.round(jaarBesparingWp),
      peak: Math.round(jaarBesparingPeak),
      totaal: Math.round(jaarBesparingZelf + jaarBesparingArb + jaarBesparingEv + jaarBesparingWp + jaarBesparingPeak),
    };
  }

  // === STAP 7: Scenario's (15 jaar) ===
  var scenarios = {
    conservatief: { prijsStijging: contract === 'vast' ? 0 : stijgPct * 0.25 / 100, scenarioFactor: 1.25 },
    realistisch:  { prijsStijging: contract === 'vast' ? 0 : stijgPct / 100, scenarioFactor: 1.00 },
    optimistisch: { prijsStijging: contract === 'vast' ? 0.01 : stijgPct / 100 + 0.02, scenarioFactor: 0.80 },
  };

  function berekenScenario(scenario) {
    var cumulatief = 0;
    var jaarData = [];
    for (var j = 1; j <= 15; j++) {
      var jb = berekenJaarBesparing(j, scenario);
      cumulatief += jb.totaal;
      jaarData.push(jb);
    }
    var jaar1 = jaarData[0].totaal;
    return {
      savingY1: jaar1,
      total15: cumulatief,
      tvt: jaar1 > 0 ? Math.round(investering / jaar1 * 10) / 10 : 99,
      nettoWinst: cumulatief - investering,
      perJaar: jaarData,
    };
  }

  var cons = berekenScenario(scenarios.conservatief);
  var real = berekenScenario(scenarios.realistisch);
  var opti = berekenScenario(scenarios.optimistisch);

  // Doelmetrics
  var peakReductieKw = S.doel.has('peak') ? Math.min(usableKwh / 2, maxBattVermogenKw) : 0;
  var noodstroomUren = Math.round(usableKwh / SV.ESSENTIAL_LOAD_KW * 10) / 10;

  var dagVerbruikGemiddeld = Math.round(totaalJaar / 365 * 10) / 10;
  var dagSolarGemiddeld = Math.round(solarKwhJaar / 365 * 10) / 10;

  // === OUTPUT ===
  var result = {
    contract: contract,
    verbruik: verbruik,
    totaalVerbruik: totaalJaar,
    verbruikMaand: verbruikMaand,
    tarief: tarief,
    terug: terug,
    dynDal: dynDal,
    dynPiek: dynPiek,
    dynGem: dynGem,
    spread: spread || 0,
    stijgPct: stijgPct || 0,

    hasSolar: hasSolar,
    nPanelen: nPanelen,
    wpPaneel: wpPaneel,
    solarKwhJaar: solarKwhJaar,
    solarKwhMaand: solarKwhMaand,

    aanbevolenKwh: aanbevolenKwh,
    usableKwh: usableKwh,
    maxBattVermogenKw: maxBattVermogenKw,
    tier: tier,
    investering: investering,
    cpk: cpk,
    dod: dod,
    eff: eff,
    net: net,

    profiel: profiel,
    gvExtra: gvExtraJaar,
    heeftEv: heeftEv,
    heeftWp: heeftWp,
    heeftHwp: heeftHwp,
    heeftAc: heeftAc,

    zelfPctZonder: zelfPctZonder,
    zelfPctMet: zelfPctMet,
    zelfZonderMaand: zelfZonderMaand,
    zelfMetMaand: zelfMetMaand,
    surplusMaand: surplusMaand,
    curtailmentMaand: curtailmentMaand,
    curtailmentJaar: Math.round(curtailmentJaar),
    curtailmentPct: curtailmentPct,

    cycliPerJaar: Math.round(cycliPerJaar * 10) / 10,
    jarenTot80Pct: Math.round(jarenTot80Pct * 10) / 10,
    degradatiePerJaarPct: Math.round(degradatiePerJaarPct * 100) / 100,

    cons: cons,
    real: real,
    opti: opti,

    peakReductieKw: peakReductieKw,
    noodstroomUren: noodstroomUren,
    dagVerbruik: dagVerbruikGemiddeld,
    dagSolar: dagSolarGemiddeld,
  };

  SV.state.lastCalc = result;
  return result;
};

// Bathtub prices for a given month
SV.bathtubPrices = function(maand) {
  var isZomer = (maand !== undefined) ? (maand >= 3 && maand <= 8) : true;
  var shape = isZomer ? SV.EPEX_SHAPE.zomer : SV.EPEX_SHAPE.winter;
  var dal = SV.elVal('in-dyn-dal', 0.05);
  var piek = SV.elVal('in-dyn-piek', 0.35);
  return shape.map(function(s) { return dal + s * (piek - dal); });
};

// Battery schedule simulation (for visualization)
SV.batterySchedule = function(prices, usableKwh, maxKw) {
  var mediaan = prices.reduce(function(a, b) { return a + b; }, 0) / 24;
  var soc = 0.2;
  var schedule = [];
  for (var h = 0; h < 24; h++) {
    var actie = 'idle';
    var vermogenKw = 0;
    if (prices[h] < mediaan * 0.85 && soc < 0.95) {
      actie = 'laden';
      vermogenKw = Math.min(maxKw, (0.95 - soc) * usableKwh);
      soc += vermogenKw / usableKwh;
    } else if (prices[h] > mediaan * 1.15 && soc > 0.15) {
      actie = 'ontladen';
      vermogenKw = Math.min(maxKw, (soc - 0.15) * usableKwh);
      soc -= vermogenKw / usableKwh;
    }
    schedule.push({ uur: h, prijs: prices[h], actie: actie, vermogenKw: vermogenKw, soc: soc });
  }
  return schedule;
};
