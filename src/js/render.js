/**
 * Stroomvol Adviseurstool — Result Page Rendering
 */
var SV = SV || {};

SV.render = function(c) {
  var n = SV.n, fmt = SV.fmt;
  var S = SV.state;

  // Klant bar
  var klantBar = document.getElementById('r-klant-bar');
  if (klantBar) {
    var parts = [];
    if (S.klantNaam) parts.push('<strong>' + S.klantNaam + '</strong>');
    if (S.klantAdres) parts.push(S.klantAdres);
    if (S.klantPlaats) parts.push(S.klantPlaats);
    var right = [];
    if (S.adviseur) right.push('Adviseur: ' + S.adviseur);
    if (S.datum) right.push(S.datum);
    klantBar.innerHTML = '<div>' + parts.join(' &middot; ') + '</div><div>' + right.join(' &middot; ') + '</div>';
    klantBar.style.display = parts.length ? '' : 'none';
  }

  // Hero
  document.getElementById('r-cap').innerHTML = c.aanbevolenKwh + ' <span>kWh</span>';
  document.getElementById('r-tier').textContent = c.tier;

  // Hero text (positieve framing)
  var heroText = '';
  if (c.hasSolar && c.zelfPctMet >= 60) {
    heroText = c.zelfPctMet + '% van je eigen zonnestroom benut \u2014 maximale onafhankelijkheid van het net.';
  } else if (c.contract === 'dynamisch' && c.real.perJaar[0].arb > 0) {
    heroText = 'Slim verdienen met dynamische energieprijzen \u2014 de batterij handelt automatisch mee op uurprijzen.';
  } else if (S.doel.has('nood')) {
    heroText = c.noodstroomUren + ' uur onafhankelijk bij stroomuitval \u2014 essenti\u00eble apparaten blijven draaien.';
  } else {
    heroText = 'Een slimmere manier om energie te gebruiken \u2014 bespaar op je energierekening en word onafhankelijker.';
  }
  document.getElementById('r-hero-text').textContent = heroText;

  // Contract badge
  var badgeMap = {
    vast: ['Vast contract', 'r-contract-vast'],
    variabel: ['Variabel contract', 'r-contract-variabel'],
    dynamisch: ['Dynamisch contract', 'r-contract-dynamisch'],
  };
  var bInfo = badgeMap[c.contract];
  document.getElementById('r-contract-badge-wrap').innerHTML = '<span class="r-contract-badge ' + bInfo[1] + '">' + bInfo[0] + '</span>';

  // Tags
  var tags = [];
  if (c.hasSolar) tags.push(c.nPanelen + ' panelen \u00b7 ~' + Math.round(c.solarKwhJaar) + ' kWh/jr');
  if (c.heeftEv) tags.push('EV');
  if (c.heeftWp || c.heeftHwp) tags.push('Warmtepomp');
  if (c.contract === 'dynamisch') tags.push('Spread \u20AC' + n(c.spread).toFixed(2) + '/kWh');
  if (S.doel.has('nood')) tags.push('Noodstroom');
  var profielLabels = { standaard: 'Standaard profiel', 'avond-zwaar': 'Avondzwaar', overdag: 'Overdag thuis', 'ev-nacht': 'EV nachtladen' };
  tags.push(profielLabels[c.profiel] || 'Standaard profiel');
  document.getElementById('r-tags').innerHTML = tags.map(function(t) { return '<span class="r-tag">' + t + '</span>'; }).join('');

  // Metrics
  document.getElementById('r-invest').textContent = '\u20AC' + fmt(c.investering);
  document.getElementById('r-tvt').textContent = c.real.tvt < 30 ? c.real.tvt.toFixed(1) + ' jaar' : '> 25 jaar';
  document.getElementById('r-zelf').textContent = c.hasSolar ? c.zelfPctMet + '%' : 'n.v.t.';
  document.getElementById('r-besp').textContent = '\u20AC' + fmt(c.real.savingY1);

  // Strategy
  SV.renderStrategy(c);

  // Bathtub
  var btW = document.getElementById('r-bathtub-wrap');
  if (c.contract === 'dynamisch') {
    btW.style.display = 'block';
    SV.charts.drawBathtubResult();
  } else {
    btW.style.display = 'none';
  }

  // Goals
  SV.renderGoals(c);

  // Energie Onafhankelijkheid (na goals)
  SV.renderOnafhankelijkheid(c);

  // Stress Test (na onafhankelijkheid)
  SV.renderStressTest(c);

  // Cumulative chart
  SV.charts.drawCumulChart(c);

  // Scenarios table
  SV.renderScenarios(c);

  // Breakdown
  SV.renderBreakdown(c);

  // Batterij vs Spaarrekening (na financieel blok)
  SV.renderSpaarrekening(c);

  // Wat Als Je Niets Doet
  SV.renderNietsDoen(c);

  // Assumptions
  SV.renderAssumptions(c);
};

SV.renderStrategy = function(c) {
  var n = SV.n;
  var sH = '';

  if (c.contract === 'vast') {
    sH = '<div style="font-size:14px;color:#555;font-weight:300;line-height:1.7;margin-bottom:16px;">Bij een <strong>vast contract</strong> is de strategie: <strong>zelfconsumptie maximaliseren</strong>. Overdag opslaan, \'s avonds verbruiken.</div>'
      + '<div class="strat-cards"><div class="strat-card active-strat"><div class="strat-label">Primaire strategie</div><div class="strat-val">Zelfconsumptie</div><div class="strat-desc">Zonder batterij: ' + c.zelfPctZonder + '% \u2192 Met: ' + c.zelfPctMet + '%</div></div>'
      + '<div class="strat-card"><div class="strat-label">Arbitrage</div><div class="strat-val" style="color:#BBB;">Niet mogelijk</div><div class="strat-desc">Geen prijsverschil per uur bij vast</div></div></div>';
  } else if (c.contract === 'variabel') {
    sH = '<div style="font-size:14px;color:#555;font-weight:300;line-height:1.7;margin-bottom:16px;">Bij een <strong>variabel contract</strong>: <strong>zelfconsumptie</strong> is de kern. Bij stijgende tarieven stijgt de waarde mee.</div>'
      + '<div class="strat-cards"><div class="strat-card active-strat"><div class="strat-label">Primaire strategie</div><div class="strat-val">Zelfconsumptie</div><div class="strat-desc">Waarde stijgt mee (' + c.stijgPct + '%/jr)</div></div>'
      + '<div class="strat-card"><div class="strat-label">Prijsstijging-effect</div><div class="strat-val">+' + c.stijgPct + '%/jr</div><div class="strat-desc">Besparing groeit elk jaar</div></div></div>';
  } else {
    var y1 = c.real.perJaar[0];
    sH = '<div style="font-size:14px;color:#555;font-weight:300;line-height:1.7;margin-bottom:16px;">Bij een <strong>dynamisch contract</strong> heeft de batterij een <strong>dubbele verdienlaag</strong>: zelfconsumptie \u00e9n actieve arbitrage op uurprijzen.</div>'
      + '<div class="strat-cards"><div class="strat-card active-strat"><div class="strat-label">Laag 1 \u2014 Zelfconsumptie</div><div class="strat-val">\u20AC' + y1.zelf + '/jr</div><div class="strat-desc">Opslaan i.p.v. terugleveren tegen \u20AC' + n(c.terug).toFixed(2) + '</div></div>'
      + '<div class="strat-card active-strat"><div class="strat-label">Laag 2 \u2014 Arbitrage</div><div class="strat-val">\u20AC' + y1.arb + '/jr</div><div class="strat-desc">Laden bij \u20AC' + n(c.dynDal).toFixed(2) + ', ontladen bij \u20AC' + n(c.dynPiek).toFixed(2) + ' \u2014 spread \u20AC' + n(c.spread).toFixed(2) + '</div></div></div>'
      + '<div style="margin-top:12px;font-size:12px;color:#888;font-weight:300;line-height:1.6;"><strong>Slimme aansturing vereist:</strong> HEMS of leverancier-app (Tibber, Zonneplan, Frank Energie, Home Assistant).</div>';
  }

  document.getElementById('r-strat-body').innerHTML = sH;
};

SV.renderGoals = function(c) {
  var S = SV.state, n = SV.n, fmt = SV.fmt;
  var goalsWrap = document.getElementById('r-goals-wrap');
  // Always show — levensduur + curtailment are always relevant
  goalsWrap.style.display = 'block';

  var y1 = c.real.perJaar[0];
  var gH = '';

  // Zelfconsumptie
  if (S.doel.has('zelf') && c.hasSolar) {
    var barPct = Math.min(c.zelfPctMet, 100);
    var badge = barPct >= 70 ? 'goal-badge-green' : barPct >= 45 ? 'goal-badge-yellow' : 'goal-badge-gray';
    var badgeTxt = barPct >= 70 ? 'Sterk' : 'Verbeterd';
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\u2600\uFE0F</span>Zelfconsumptie verhogen<span class="goal-badge ' + badge + '">' + badgeTxt + '</span></div><div class="goal-val">' + c.zelfPctMet + '%</div></div>'
      + '<div class="goal-bar-wrap"><div class="goal-bar goal-bar-green" style="width:' + barPct + '%"></div></div>'
      + '<div class="goal-compare"><span class="goal-compare-before">Zonder batterij: ' + c.zelfPctZonder + '%</span><span class="goal-compare-arrow">\u2192</span><span class="goal-compare-after">Met batterij: ' + c.zelfPctMet + '%</span></div>'
      + '<div class="goal-detail">Je verbruikt <strong>' + (c.zelfPctMet - c.zelfPctZonder) + ' procentpunt meer</strong> van je eigen zonnestroom. Dat bespaart <strong>\u20AC' + fmt(y1.zelf) + '/jaar</strong>.</div></div>';
  }

  // Slim handelen
  if (S.doel.has('handel')) {
    var arbActief = c.contract === 'dynamisch';
    var arbVal = arbActief ? y1.arb : 0;
    var arbBadge = arbActief ? 'goal-badge-green' : 'goal-badge-gray';
    var arbTxt = arbActief ? 'Actief' : 'Niet mogelijk';
    var arbBarPct = arbActief ? Math.min(Math.round(arbVal / 500 * 100), 100) : 0;
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\u26A1</span>Slim handelen (arbitrage)<span class="goal-badge ' + arbBadge + '">' + arbTxt + '</span></div><div class="goal-val">' + (arbActief ? '\u20AC' + fmt(arbVal) + '/jr' : '\u2014') + '</div></div>'
      + '<div class="goal-bar-wrap"><div class="goal-bar ' + (arbActief ? 'goal-bar-green' : 'goal-bar-yellow') + '" style="width:' + arbBarPct + '%"></div></div>'
      + '<div class="goal-detail">' + (arbActief ? 'Bij een dynamisch contract met een spread van <strong>\u20AC' + n(c.spread).toFixed(2) + '/kWh</strong> verdient de batterij extra door actief te laden bij dalprijs en te ontladen bij piekprijs.' : 'Arbitrage vereist een <strong>dynamisch energiecontract</strong>. Overweeg een overstap om dit doel te activeren.') + '</div></div>';
  }

  // Piekverbruik
  if (S.doel.has('peak')) {
    var peakBadge = c.peakReductieKw >= 3 ? 'goal-badge-green' : 'goal-badge-yellow';
    var peakBarPct = Math.min(Math.round(c.peakReductieKw / 5 * 100), 100);
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\uD83D\uDCC9</span>Piekverbruik beperken<span class="goal-badge ' + peakBadge + '">\u2212' + c.peakReductieKw.toFixed(1) + ' kW</span></div><div class="goal-val">\u20AC' + fmt(y1.peak) + '/jr</div></div>'
      + '<div class="goal-bar-wrap"><div class="goal-bar goal-bar-green" style="width:' + peakBarPct + '%"></div></div>'
      + '<div class="goal-detail">De batterij kan piekmomenten opvangen door tot <strong>' + c.peakReductieKw.toFixed(1) + ' kW</strong> te ontladen. Bespaart <strong>\u20AC' + fmt(y1.peak) + '/jaar</strong> aan capaciteitstarieven.</div></div>';
  }

  // Noodstroom
  if (S.doel.has('nood')) {
    var noodBadge = c.noodstroomUren >= 8 ? 'goal-badge-green' : c.noodstroomUren >= 4 ? 'goal-badge-yellow' : 'goal-badge-gray';
    var noodBarPct = Math.min(Math.round(c.noodstroomUren / 24 * 100), 100);
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\uD83D\uDD0B</span>Noodstroom bij stroomuitval<span class="goal-badge ' + noodBadge + '">' + c.noodstroomUren + ' uur</span></div><div class="goal-val">' + c.noodstroomUren + 'u backup</div></div>'
      + '<div class="goal-bar-wrap"><div class="goal-bar goal-bar-yellow" style="width:' + noodBarPct + '%"></div></div>'
      + '<div class="goal-detail">Bij stroomuitval levert de ' + c.aanbevolenKwh + ' kWh batterij tot <strong>' + c.noodstroomUren + ' uur</strong> stroom voor essenti\u00eble apparaten (~' + SV.ESSENTIAL_LOAD_KW + ' kW).</div></div>';
  }

  // EV
  if (c.heeftEv) {
    var evActief = y1.ev > 0;
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\uD83D\uDE97</span>Elektrische auto \u2014 slim laden<span class="goal-badge ' + (evActief ? 'goal-badge-green' : 'goal-badge-yellow') + '">' + (evActief ? 'Geoptimaliseerd' : 'Basis') + '</span></div><div class="goal-val">' + (evActief ? '\u20AC' + fmt(y1.ev) + '/jr' : '+3 kWh') + '</div></div>'
      + '<div class="goal-detail">' + (evActief ? 'De batterij buffert goedkope dalstroom voor het laden van de EV. Bespaart <strong>\u20AC' + fmt(y1.ev) + '/jaar</strong>.' : 'De EV verhoogt je jaarverbruik met ~' + fmt(SV.GROOTVERBRUIK.ev.defaultKwhJaar) + ' kWh. De batterij is +3 kWh groter gedimensioneerd.') + ' Geschat extra verbruik: <strong>' + fmt(SV.GROOTVERBRUIK.ev.defaultKwhJaar) + ' kWh/jaar</strong>.</div></div>';
  }

  // Warmtepomp
  if (c.heeftWp || c.heeftHwp) {
    var wpType = c.heeftWp ? 'volledig elektrisch' : 'hybride';
    var wpBuf = y1.wp > 0;
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\uD83C\uDF21\uFE0F</span>Warmtepomp (' + wpType + ')<span class="goal-badge ' + (wpBuf ? 'goal-badge-green' : 'goal-badge-yellow') + '">' + (wpBuf ? 'Geoptimaliseerd' : 'Meegenomen') + '</span></div><div class="goal-val">' + (wpBuf ? '\u20AC' + fmt(y1.wp) + '/jr' : '+' + (c.heeftWp ? 2 : 1) + ' kWh') + '</div></div>'
      + '<div class="goal-detail">De warmtepomp voegt ~<strong>' + fmt(c.heeftWp ? SV.GROOTVERBRUIK.wp.defaultKwhJaar : SV.GROOTVERBRUIK.hwp.defaultKwhJaar) + ' kWh/jaar</strong> toe. ' + (wpBuf ? 'De batterij buffert goedkope nachtstroom voor de ochtend-opstart. Bespaart <strong>\u20AC' + fmt(y1.wp) + '/jaar</strong>.' : 'De batterij is groter gedimensioneerd.') + '</div></div>';
  }

  // Airco
  if (S.gv.has('ac')) {
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\u2744\uFE0F</span>Airconditioning<span class="goal-badge goal-badge-yellow">Meegenomen</span></div><div class="goal-val">+1 kWh</div></div>'
      + '<div class="goal-detail">De airco voegt ~<strong>' + fmt(SV.GROOTVERBRUIK.ac.defaultKwhJaar) + ' kWh/jaar</strong> toe, voornamelijk in de zomer. De batterij is +1 kWh groter gedimensioneerd.</div></div>';
  }

  // Batterijlevensduur (altijd tonen)
  var lvBadge = c.jarenTot80Pct >= 20 ? 'goal-badge-green' : c.jarenTot80Pct >= 12 ? 'goal-badge-yellow' : 'goal-badge-gray';
  var lvTxt = c.jarenTot80Pct >= 20 ? 'Uitstekend' : c.jarenTot80Pct >= 12 ? 'Goed' : 'Intensief';
  var lvBarPct = Math.min(Math.round(c.jarenTot80Pct / 25 * 100), 100);
  gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\uD83D\uDD0B</span>Batterijlevensduur <button class="info-tip" data-tip="levensduur">i<div class="info-tip-popup">De levensduur is berekend op basis van <strong>gebruikscycli</strong>. LFP-batterijen gaan ~5000 cycli mee tot 80% capaciteit. Bij ~' + c.cycliPerJaar + ' cycli/jaar komt dat neer op ~' + c.jarenTot80Pct + ' jaar. Na 80% werkt de batterij nog, maar met minder capaciteit.</div></button><span class="goal-badge ' + lvBadge + '">' + lvTxt + '</span></div><div class="goal-val">~' + c.jarenTot80Pct + ' jr</div></div>'
    + '<div class="goal-bar-wrap"><div class="goal-bar ' + (c.jarenTot80Pct >= 12 ? 'goal-bar-green' : 'goal-bar-yellow') + '" style="width:' + lvBarPct + '%"></div></div>'
    + '<div class="goal-detail">Geschatte <strong>' + c.cycliPerJaar + ' cycli/jaar</strong> \u2192 degradatie ~<strong>' + c.degradatiePerJaarPct + '%/jaar</strong>. Na ~' + c.jarenTot80Pct + ' jaar is de batterij op 80% van de oorspronkelijke capaciteit.</div></div>';

  // Curtailment (alleen bij zonnepanelen)
  if (c.hasSolar && c.curtailmentJaar > 0) {
    var curtBadge = c.curtailmentPct <= 5 ? 'goal-badge-green' : c.curtailmentPct <= 15 ? 'goal-badge-yellow' : 'goal-badge-gray';
    var curtTxt = c.curtailmentPct <= 5 ? 'Minimaal' : c.curtailmentPct <= 15 ? 'Matig' : 'Hoog';
    var curtBarPct = Math.min(c.curtailmentPct, 100);
    gH += '<div class="goal-item"><div class="goal-head"><div class="goal-name"><span class="goal-icon">\u2600\uFE0F</span>Curtailment (verlies) <button class="info-tip" data-tip="curtailment">i<div class="info-tip-popup"><strong>Curtailment</strong> = zonne-energie die niet benut wordt: niet direct verbruikt, niet in de batterij past, en teruglevering levert weinig op. Een grotere batterij of meer verbruik overdag vermindert curtailment.</div></button><span class="goal-badge ' + curtBadge + '">' + curtTxt + '</span></div><div class="goal-val">' + c.curtailmentPct + '%</div></div>'
      + '<div class="goal-bar-wrap"><div class="goal-bar ' + (c.curtailmentPct <= 10 ? 'goal-bar-green' : 'goal-bar-yellow') + '" style="width:' + curtBarPct + '%"></div></div>'
      + '<div class="goal-detail">Jaarlijks ~<strong>' + fmt(c.curtailmentJaar) + ' kWh</strong> (' + c.curtailmentPct + '% van zonneopbrengst) gaat verloren door curtailment \u2014 surplus dat niet in de batterij past.</div></div>';
  }

  document.getElementById('r-goals-body').innerHTML = gH;
};

SV.renderScenarios = function(c) {
  var fmt = SV.fmt;
  var scSub = { vast: 'Scenario\'s vari\u00ebren op degradatie en na contractverlenging.', variabel: 'Besparing stijgt mee met tarief.', dynamisch: 'Afhankelijk van EPEX-spread en slim laadgedrag.' };
  document.getElementById('r-sc-sub').textContent = scSub[c.contract];

  function row(label, badge, badgeCls, sc) {
    var netto = sc.nettoWinst;
    var hlCls = badgeCls === 'bs-r' ? ' hl' : '';
    var nettoColor = netto >= 0 ? '#22C55E' : '#EF4444';
    var nettoSize = badgeCls === 'bs-r' ? 'font-size:18px' : '';
    return '<tr><td>' + label + ' <span class="bs ' + badgeCls + '">' + badge + '</span></td>'
      + '<td class="v' + hlCls + '">\u20AC' + fmt(sc.savingY1) + '</td>'
      + '<td class="v' + hlCls + '">' + (sc.tvt < 30 ? sc.tvt.toFixed(1) + ' jaar' : '> 25 jr') + '</td>'
      + '<td class="v' + hlCls + '">\u20AC' + fmt(sc.total15) + '</td>'
      + '<td class="v" style="color:' + nettoColor + ';' + nettoSize + '">' + (netto >= 0 ? '+' : '') + '\u20AC' + fmt(netto) + '</td></tr>';
  }

  document.getElementById('r-sc-body').innerHTML =
    row('Conservatief', 'voorzichtig', 'bs-c', c.cons)
    + row('Realistisch', 'verwacht', 'bs-r', c.real)
    + row('Optimistisch', 'gunstig', 'bs-o', c.opti);
};

SV.renderBreakdown = function(c) {
  var fmt = SV.fmt;
  var y1 = c.real.perJaar[0];
  var bd = [];

  if (y1.zelf > 0) bd.push({ l: 'Zelfconsumptie-besparing', v: '\u20AC' + fmt(y1.zelf) + ' /jaar' });
  if (y1.arb > 0) bd.push({ l: 'Dynamisch tarief arbitrage', v: '\u20AC' + fmt(y1.arb) + ' /jaar' });
  if (y1.ev > 0) bd.push({ l: 'EV slim laden (dalprijs)', v: '\u20AC' + fmt(y1.ev) + ' /jaar' });
  if (y1.wp > 0) bd.push({ l: 'Warmtepomp buffering', v: '\u20AC' + fmt(y1.wp) + ' /jaar' });
  if (y1.peak > 0) bd.push({ l: 'Peak shaving', v: '\u20AC' + fmt(y1.peak) + ' /jaar' });
  bd.push({ l: 'Totale jaarlijkse besparing', v: '\u20AC' + fmt(y1.totaal) + ' /jaar', total: true });
  bd.push({ l: '' }); // spacer
  bd.push({ l: 'Totale besparing over 15 jaar (realistisch)', v: '\u20AC' + fmt(c.real.total15) });
  bd.push({ l: 'Investering', v: '\u2212\u20AC' + fmt(c.investering) });
  var nw = c.real.nettoWinst;
  bd.push({ l: 'Netto winst na 15 jaar', v: (nw >= 0 ? '+' : '') + '\u20AC' + fmt(nw), total: true, color: nw >= 0 ? '#22C55E' : '#EF4444' });

  document.getElementById('r-bd-rows').innerHTML = bd.map(function(r) {
    if (!r.v && !r.total) return '<div style="height:8px"></div>';
    var colorStyle = r.color ? ' style="color:' + r.color + '"' : '';
    return '<div class="bdown-row' + (r.total ? ' total' : '') + '"><span class="l">' + r.l + '</span><span class="v"' + colorStyle + '>' + r.v + '</span></div>';
  }).join('');
};

SV.renderAssumptions = function(c) {
  var n = SV.n, fmt = SV.fmt;
  var aL = [
    'Jaarverbruik: ' + fmt(c.verbruik) + ' kWh (' + c.dagVerbruik + ' kWh/dag)',
    c.hasSolar ? 'Zonneopbrengst: ~' + fmt(Math.round(c.solarKwhJaar)) + ' kWh/jaar (' + c.nPanelen + ' \u00d7 ' + c.wpPaneel + ' Wp)' : 'Geen zonnepanelen',
    'Contract: ' + c.contract + (c.contract === 'dynamisch' ? ' \u2014 dal \u20AC' + n(c.dynDal).toFixed(2) + ', piek \u20AC' + n(c.dynPiek).toFixed(2) + ', gem. \u20AC' + n(c.dynGem).toFixed(2) : ' \u2014 inkoop \u20AC' + n(c.tarief).toFixed(2) + '/kWh, terug \u20AC' + n(c.terug).toFixed(2) + '/kWh'),
    'Installatiekosten: \u20AC' + c.cpk + '/kWh \u2192 \u20AC' + fmt(c.investering) + ' totaal',
    'Batterij: ' + c.aanbevolenKwh + ' kWh nom., ' + n(c.usableKwh).toFixed(1) + ' kWh bruikbaar (DoD ' + Math.round(n(c.dod) * 100) + '%, eff. ' + Math.round(n(c.eff) * 100) + '%)',
    'Degradatie: cycle-based (~' + c.degradatiePerJaarPct + '%/jaar bij ~' + c.cycliPerJaar + ' cycli/jaar, LFP 5000 cycli tot 80%)',
    'Levensduur: ~' + c.jarenTot80Pct + ' jaar tot 80% capaciteit',
    c.contract !== 'vast' ? 'Energieprijsstijging: ' + c.stijgPct + '%/jaar' : 'Vast: geen prijsstijging tijdens contract',
    c.hasSolar ? 'Zelfconsumptie: ' + c.zelfPctZonder + '% \u2192 ' + c.zelfPctMet + '% met batterij' : '',
    c.hasSolar && c.curtailmentJaar > 0 ? 'Curtailment: ~' + fmt(c.curtailmentJaar) + ' kWh/jaar (' + c.curtailmentPct + '% van zonneopbrengst)' : '',
    'Saldering: volledig afgeschaft per 1/1/2027',
    'Netaansluiting: ' + c.net + ' (max ' + (SV.NET_VERMOGEN[c.net] ? SV.NET_VERMOGEN[c.net].maxKw : '?') + ' kW)',
  ].filter(Boolean);
  document.getElementById('r-assume').innerHTML = aL.join('<br>');
};

// ============================================================
// SECTIE: Energie Onafhankelijkheid
// ============================================================

SV.berekenOnafhankelijkheid = function(c) {
  var totaal = c.totaalVerbruik;
  var directZon = Math.round(c.zelfZonderJaar || 0);
  var uitBatterij = Math.round((c.zelfMetJaar || 0) - (c.zelfZonderJaar || 0));
  var vanNet = Math.round(totaal - (c.zelfMetJaar || 0));
  var pctDirectZon = Math.round(directZon / totaal * 100);
  var pctBatterij = Math.round(uitBatterij / totaal * 100);
  var pctNet = 100 - pctDirectZon - pctBatterij;
  return {
    directZon: directZon, uitBatterij: uitBatterij, vanNet: vanNet,
    pctDirectZon: pctDirectZon, pctBatterij: pctBatterij, pctNet: pctNet,
    pctOnafhankelijk: pctDirectZon + pctBatterij,
    zelfPctZonder: c.zelfPctZonder,
  };
};

SV.renderOnafhankelijkheid = function(c) {
  var wrap = document.getElementById('r-onafh-wrap');
  if (!wrap) return;
  if (!c.hasSolar) { wrap.style.display = 'none'; return; }

  var d = SV.berekenOnafhankelijkheid(c);
  var fmt = SV.fmt;

  function bar(label, pct, color, kwh) {
    return '<div class="onafh-bar"><div class="onafh-bar-head"><span>' + label + '</span><span class="onafh-bar-val">' + pct + '% &middot; ' + fmt(kwh) + ' kWh</span></div>'
      + '<div class="onafh-bar-track"><div class="onafh-bar-fill" style="width:' + Math.max(pct, 2) + '%;background:' + color + '"></div></div></div>';
  }

  var h = '<div class="onafh-header"><div class="card-header"><div class="card-icon">\uD83C\uDF0D</div><div><div class="card-title">Jouw Energie Onafhankelijkheid</div><div class="card-subtitle">Jaargemiddelde — hoeveel van je verbruik uit eigen opwek komt</div></div></div></div>';
  h += '<div class="onafh-grid">';
  h += '<div class="onafh-donut" id="onafh-donut"></div>';
  h += '<div class="onafh-bars">';
  h += bar('Direct zonneverbruik', d.pctDirectZon, '#22C55E', d.directZon);
  h += bar('Uit batterij', d.pctBatterij, '#0D9488', d.uitBatterij);
  h += bar('Van het net', d.pctNet, '#D1D5DB', d.vanNet);
  h += '</div></div>';

  if (d.pctOnafhankelijk >= 20) {
    h += '<div class="onafh-footer">' + d.pctOnafhankelijk + '% van je verbruik uit eigen opwek <span class="onafh-footer-sub">(was ' + d.zelfPctZonder + '% zonder batterij)</span></div>';
  } else {
    h += '<div class="onafh-footer onafh-footer-alt">Met een thuisbatterij benut je maximaal je eigen opwek. Overweeg meer zonnepanelen voor hogere onafhankelijkheid.</div>';
  }

  wrap.innerHTML = h;
  wrap.style.display = 'block';
  SV.charts.drawDonut('onafh-donut', d);
};

// ============================================================
// SECTIE: Stress Test — Slechte Weer Week
// ============================================================

SV.berekenStressTest = function(c) {
  var dagVerbruikDec = c.verbruikMaand[11] / 31;
  var dagSolarDec = c.solarKwhMaand[11] / 31;
  var dagSolarStress = dagSolarDec * 0.3;
  var dagVerbruikStress = dagVerbruikDec * 1.2;
  var weekVerbruik = dagVerbruikStress * 7;
  var weekSolar = dagSolarStress * 7;
  var weekNetNodig = Math.max(0, weekVerbruik - weekSolar);

  var tariefStress;
  if (c.contract === 'dynamisch') {
    tariefStress = (c.dynGem + c.dynPiek) / 2;
  } else {
    tariefStress = c.tarief;
  }
  var kostenZonder = Math.round(weekNetNodig * tariefStress * 100) / 100;

  var dagBattBesparing = c.usableKwh * c.eff;
  var kostenMet;

  if (c.contract === 'dynamisch') {
    var dagArbitrageBesparing = dagBattBesparing * (c.dynPiek - c.dynDal) * 0.7;
    var weekBesparing = dagArbitrageBesparing * 7;
    kostenMet = Math.round(Math.max(0, kostenZonder - weekBesparing) * 100) / 100;
  } else {
    var weekZelfconsumptieBesparing = Math.min(dagBattBesparing, dagSolarStress) * 7 * (tariefStress - c.terug);
    kostenMet = Math.round(Math.max(0, kostenZonder - weekZelfconsumptieBesparing) * 100) / 100;
  }

  var besparingPct = kostenZonder > 0 ? Math.round((1 - kostenMet / kostenZonder) * 100) : 0;

  return {
    scenario: 'Week in december met minimale zonnestraling, hoge energieprijzen en extra verwarming.',
    kostenZonder: kostenZonder,
    kostenMet: kostenMet,
    besparingPct: besparingPct,
    weekVerbruik: Math.round(weekVerbruik),
  };
};

SV.renderStressTest = function(c) {
  var wrap = document.getElementById('r-stress-wrap');
  if (!wrap) return;
  if (!c.hasSolar && c.contract !== 'dynamisch') { wrap.style.display = 'none'; return; }

  var d = SV.berekenStressTest(c);
  var fmt = SV.fmt;

  var h = '<div class="card-header"><div class="card-icon">\u26C8\uFE0F</div><div><div class="card-title">Stress Test: Slechte Weer Week</div><div class="card-subtitle">Wat als het \u00e9cht tegenzit? Een koude, donkere decemberweek.</div></div></div>';
  h += '<div class="stress-cards">';
  h += '<div class="stress-card"><div class="stress-card-icon">\uD83C\uDF28\uFE0F</div><div class="stress-card-label">Scenario</div><div class="stress-card-desc">' + d.scenario + '</div><div class="stress-card-meta">' + d.weekVerbruik + ' kWh weekverbruik</div></div>';
  h += '<div class="stress-card stress-card-red"><div class="stress-card-icon">\u274C</div><div class="stress-card-label">Zonder batterij</div><div class="stress-card-val">\u20AC' + fmt(d.kostenZonder) + '</div><div class="stress-card-meta">Energiekosten per week</div></div>';
  h += '<div class="stress-card stress-card-green"><div class="stress-card-icon">\u2705</div><div class="stress-card-label">Met batterij</div><div class="stress-card-val">\u20AC' + fmt(d.kostenMet) + '</div>';
  if (d.besparingPct >= 10) {
    h += '<div class="stress-badge">' + d.besparingPct + '% besparing</div>';
  }
  h += '<div class="stress-card-meta">Energiekosten per week</div></div>';
  h += '</div>';

  wrap.innerHTML = h;
  wrap.style.display = 'block';
};

// ============================================================
// SECTIE: Batterij vs. Spaarrekening
// ============================================================

SV.berekenVergelijking = function(investering, perJaarData) {
  var SPAARRENTE = 0.02;
  var jaren = [];
  var cumulatiefBatterij = 0;
  var spaarSaldo = investering;

  for (var j = 0; j < 15; j++) {
    cumulatiefBatterij += perJaarData[j].totaal;
    spaarSaldo *= (1 + SPAARRENTE);
    jaren.push({
      jaar: j + 1,
      batterijWaarde: cumulatiefBatterij,
      spaarWaarde: Math.round(spaarSaldo - investering),
    });
  }

  var batterijTotaal = cumulatiefBatterij;
  var spaarTotaal = Math.round(spaarSaldo - investering);
  var verschil = batterijTotaal - spaarTotaal;
  var factorBeter = Math.round(batterijTotaal / Math.max(spaarTotaal, 1) * 10) / 10;

  return {
    jaren: jaren, batterijTotaal: batterijTotaal, spaarTotaal: spaarTotaal,
    verschil: verschil, factorBeter: factorBeter,
  };
};

SV.renderSpaarrekening = function(c) {
  var wrap = document.getElementById('r-spaar-wrap');
  if (!wrap) return;

  var d = SV.berekenVergelijking(c.investering, c.real.perJaar);
  var fmt = SV.fmt;

  var h = '<div class="card-header"><div class="card-icon">\uD83D\uDCB0</div><div><div class="card-title">Beter dan de bank: Batterij vs. Spaarrekening</div><div class="card-subtitle">Wat als je hetzelfde bedrag op een spaarrekening zou zetten? Met ~2% rente groeit je geld een stuk langzamer.</div></div></div>';
  h += '<div class="spaar-chart" id="spaar-chart"></div>';
  h += '<div class="spaar-compare">';
  h += '<div class="spaar-card"><div class="spaar-card-val">\u20AC' + fmt(Math.round(d.batterijTotaal)) + '</div><div class="spaar-card-label">Totale waarde na 15 jaar</div><div class="spaar-card-sub">Met batterij investering</div></div>';
  h += '<div class="spaar-card"><div class="spaar-card-val">\u20AC' + fmt(d.spaarTotaal) + '</div><div class="spaar-card-label">Totale waarde na 15 jaar</div><div class="spaar-card-sub">Met spaarrekening (2%)</div></div>';
  h += '</div>';

  if (d.batterijTotaal > d.spaarTotaal) {
    h += '<div class="spaar-footer">\u20AC' + fmt(Math.round(d.verschil)) + ' meer rendement \u2014 Batterij investering levert ' + d.factorBeter + 'x meer op dan sparen</div>';
  } else {
    h += '<div class="spaar-footer spaar-footer-alt">De batterij biedt daarnaast comfort en onafhankelijkheid die een spaarrekening niet biedt.</div>';
  }

  wrap.innerHTML = h;
  wrap.style.display = 'block';
  SV.charts.drawComparisonChart('spaar-chart', d.jaren, c.investering);
};

// ============================================================
// SECTIE: Wat Als Je Niets Doet
// ============================================================

SV.berekenNietsDoen = function(c) {
  var stijging;
  if (c.contract === 'vast') {
    stijging = 0.03;
  } else if (c.contract === 'variabel') {
    stijging = c.stijgPct / 100;
  } else {
    stijging = 0.03;
  }

  var huidigJaarkosten = c.totaalVerbruik * c.tarief;
  var periodes = [
    { label: 'Vandaag', jaar: 0 },
    { label: '2030', jaar: 4 },
    { label: '2035', jaar: 9 },
  ];

  var projecties = periodes.map(function(p) {
    var toekomstigTarief = c.tarief * Math.pow(1 + stijging, p.jaar);
    var jaarkosten = Math.round(c.totaalVerbruik * toekomstigTarief);
    return {
      label: p.label,
      tarief: Math.round(toekomstigTarief * 100) / 100,
      jaarkosten: jaarkosten,
    };
  });

  var cumulatiefExtra = 0;
  for (var j = 1; j <= 10; j++) {
    var toekomstigKosten = c.totaalVerbruik * c.tarief * Math.pow(1 + stijging, j);
    cumulatiefExtra += toekomstigKosten - huidigJaarkosten;
  }

  return {
    projecties: projecties,
    stijgingPct: Math.round(stijging * 100),
    cumulatiefExtra10Jaar: Math.round(cumulatiefExtra),
    huidigJaarkosten: Math.round(huidigJaarkosten),
  };
};

SV.renderNietsDoen = function(c) {
  var wrap = document.getElementById('r-niets-wrap');
  if (!wrap) return;

  var d = SV.berekenNietsDoen(c);
  var fmt = SV.fmt;

  var subtitel = c.contract === 'vast'
    ? 'Ook bij een vast contract stijgen de tarieven bij verlenging. Een batterij beschermt je structureel.'
    : 'Energieprijzen stijgen structureel. Hoe hoger de prijzen, hoe meer je batterij verdient.';

  var h = '<div class="niets-inner"><div class="niets-header"><div class="niets-icon">\uD83D\uDCC8</div><div class="niets-title">Toekomstbestendig investeren</div><div class="niets-sub">' + subtitel + '</div></div>';
  h += '<div class="niets-cards">';
  d.projecties.forEach(function(p) {
    h += '<div class="niets-card"><div class="niets-card-icon">\uD83D\uDCC5</div><div class="niets-card-label">' + p.label + '</div><div class="niets-card-val">\u20AC' + p.tarief.toFixed(2) + '</div><div class="niets-card-sub">per kWh (verwacht)</div><div class="niets-card-kosten">Jaarkosten \u20AC' + fmt(p.jaarkosten) + '</div></div>';
  });
  h += '</div>';
  h += '<div class="niets-info">';
  h += '<div class="niets-info-block"><strong>Elektrificatie neemt toe</strong><br>Warmtepompen, EV\u2019s en inductie koken verhogen de vraag naar stroom. Dit drijft prijzen verder omhoog.</div>';
  h += '<div class="niets-info-block"><strong>Netcongestie wordt erger</strong><br>Stroomnet zit vol. Thuisbatterijen worden essentieel \u2014 en mogelijk verplicht. Early adopters profiteren het meest.</div>';
  h += '</div>';
  h += '<div class="niets-disclaimer">Prijsprojecties gebaseerd op ' + d.stijgingPct + '% jaarlijkse stijging. Werkelijke prijzen kunnen hoger of lager uitvallen.</div>';
  h += '</div>';

  wrap.innerHTML = h;
  wrap.style.display = 'block';
};
