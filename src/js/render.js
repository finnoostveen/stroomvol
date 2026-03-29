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

  // Cumulative chart
  SV.charts.drawCumulChart(c);

  // Scenarios table
  SV.renderScenarios(c);

  // Breakdown
  SV.renderBreakdown(c);

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
  var hasGoals = S.doel.size > 0 || S.gv.size > 0;
  goalsWrap.style.display = hasGoals ? 'block' : 'none';
  if (!hasGoals) return;

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
    'Degradatie: ' + c.degPct + '%/jaar',
    c.contract !== 'vast' ? 'Energieprijsstijging: ' + c.stijgPct + '%/jaar' : 'Vast: geen prijsstijging tijdens contract',
    c.hasSolar ? 'Zelfconsumptie: ' + c.zelfPctZonder + '% \u2192 ' + c.zelfPctMet + '% met batterij' : '',
    'Saldering: afbouw per 2027 ingecalculeerd (64% \u2192 28% \u2192 0%)',
    'Netaansluiting: ' + c.net + ' (max ' + (SV.NET_VERMOGEN[c.net] ? SV.NET_VERMOGEN[c.net].maxKw : '?') + ' kW)',
  ].filter(Boolean);
  document.getElementById('r-assume').innerHTML = aL.join('<br>');
};
