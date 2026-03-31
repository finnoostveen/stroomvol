/**
 * Stroomvol Adviseurstool — PDF Generation
 * Uses jsPDF v2.5.2 + html2canvas 1.4.1 (inlined, no CDN)
 * 6-page commercial PDF with warm, advisory tone
 */
var SV = SV || {};

SV.pdf = {
  generating: false,
  _safetyTimeout: null,

  generate: function() {
    alert('PDF-export is tijdelijk uitgeschakeld. Gebruik "Print advies" om het resultaat af te drukken of op te slaan als PDF via je browser.');
  },

  cleanup: function() {
    SV.pdf.generating = false;
    var btn = document.getElementById('btn-pdf');
    if (btn) { btn.disabled = false; btn.textContent = 'Download PDF'; }
  },

  // ===== PAGE BUILDERS =====

  // Page 1: Cover
  buildCoverPage: function(c, S) {
    var page = SV.pdf.createPage();
    var cover = document.createElement('div');
    cover.className = 'sv-pdf-cover';
    cover.innerHTML = '<div class="sv-pdf-cover-logo">STROOM<span>VOL</span></div>'
      + '<div class="sv-pdf-cover-subtitle">Batterijadvies op maat</div>'
      + '<div class="sv-pdf-cover-badge">Persoonlijk adviesrapport</div>'
      + '<div class="sv-pdf-cover-info">'
      + (S.klantNaam ? '<strong>' + SV.pdf.esc(S.klantNaam) + '</strong><br>' : '')
      + (S.klantAdres ? SV.pdf.esc(S.klantAdres) + '<br>' : '')
      + (S.klantPlaats ? SV.pdf.esc(S.klantPlaats) + '<br>' : '')
      + '</div>'
      + '<div class="sv-pdf-cover-date">'
      + (S.adviseur ? 'Uw adviseur: ' + SV.pdf.esc(S.adviseur) + '<br>' : '')
      + (S.bedrijf ? SV.pdf.esc(S.bedrijf) + '<br>' : '')
      + (S.datum ? S.datum : new Date().toLocaleDateString('nl-NL'))
      + '</div>';
    page.appendChild(cover);
    return page;
  },

  // Page 2: Persoonlijk voordeel-overzicht
  buildPersonalPage: function(c, S) {
    var page = SV.pdf.createPage();
    var n = SV.n, fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    var naam = S.klantNaam ? SV.pdf.esc(S.klantNaam) : '';
    var greeting = naam ? 'Beste ' + naam + ',' : '';

    var content = document.createElement('div');
    var html = '<div class="sv-pdf-section-title">Wat betekent dit concreet voor u?</div>';

    if (greeting) {
      html += '<div class="sv-pdf-greeting">' + greeting + '</div>';
    }

    html += '<div class="sv-pdf-intro">Op basis van uw situatie hebben wij de belangrijkste voordelen voor u op een rij gezet. Dit overzicht toont wat een thuisbatterij concreet voor u oplevert.</div>';

    // Build highlight cards (3-4 cards)
    var cards = [];

    // Card 1: Always — annual savings
    cards.push(SV.pdf.highlightCard(
      '\u20AC' + fmt(c.real.savingY1) + '/jaar',
      'Verwachte jaarlijkse besparing',
      'Op basis van uw verbruik van ' + c.dagVerbruik + ' kWh/dag en uw ' + c.contract + ' contract.'
    ));

    // Card 2: Solar → self-consumption, else dynamisch → arbitrage
    if (c.hasSolar) {
      cards.push(SV.pdf.highlightCard(
        c.zelfPctZonder + '% \u2192 ' + c.zelfPctMet + '%',
        'Uw zelfconsumptie stijgt',
        'U benut ' + (c.zelfPctMet - c.zelfPctZonder) + ' procentpunt meer van uw eigen zonnestroom. Minder terugleveren, meer zelf gebruiken.'
      ));
    } else if (c.contract === 'dynamisch') {
      cards.push(SV.pdf.highlightCard(
        '\u20AC' + n(c.spread).toFixed(2) + '/kWh',
        'Verdienen op prijsverschillen',
        'Laden bij \u20AC' + n(c.dynDal).toFixed(2) + ', ontladen bij \u20AC' + n(c.dynPiek).toFixed(2) + '. De batterij handelt automatisch mee op uurprijzen.'
      ));
    } else {
      // Fallback: netto winst
      var nw = c.real.nettoWinst;
      cards.push(SV.pdf.highlightCard(
        (nw >= 0 ? '+' : '') + '\u20AC' + fmt(nw),
        'Netto resultaat na 15 jaar',
        'De investering van \u20AC' + fmt(c.investering) + ' verdient zichzelf naar verwachting ruim terug.'
      ));
    }

    // Card 3: Always — battery lifespan
    cards.push(SV.pdf.highlightCard(
      '~' + c.jarenTot80Pct + ' jaar',
      'Geschatte batterijlevensduur',
      'Bij ~' + c.cycliPerJaar + ' cycli per jaar bereikt uw LFP-batterij pas na ' + c.jarenTot80Pct + ' jaar de 80%-grens. Daarna werkt hij nog steeds.'
    ));

    // Card 4: Conditional — first match
    if (S.doel.has('nood')) {
      cards.push(SV.pdf.highlightCard(
        c.noodstroomUren + ' uur backup',
        'Noodstroom bij stroomuitval',
        'Uw essenti\u00eble apparaten \u2014 koelkast, verlichting, wifi \u2014 blijven tot ' + c.noodstroomUren + ' uur draaien bij een stroomstoring.'
      ));
    } else if (c.heeftEv) {
      cards.push(SV.pdf.highlightCard(
        'Slim laden',
        'Uw elektrische auto laadt mee',
        'De batterij buffert goedkope stroom voor het laden van uw EV. Geschat extra verbruik: ' + fmt(SV.GROOTVERBRUIK.ev.defaultKwhJaar) + ' kWh/jaar.'
      ));
    } else if (c.heeftWp) {
      cards.push(SV.pdf.highlightCard(
        'Effici\u00ebnter',
        'Uw warmtepomp draait slimmer',
        'Door \u2019s nachts goedkoop op te slaan draait de warmtepomp overdag op gebufferde stroom. Bespaart op uw verwarmingskosten.'
      ));
    } else {
      var netto = c.real.nettoWinst;
      if (netto > 0 && c.hasSolar) {
        cards.push(SV.pdf.highlightCard(
          '+\u20AC' + fmt(netto),
          'Netto winst na 15 jaar',
          'Uw investering van \u20AC' + fmt(c.investering) + ' levert naar verwachting \u20AC' + fmt(netto) + ' netto op over 15 jaar.'
        ));
      } else {
        cards.push(SV.pdf.highlightCard(
          c.aanbevolenKwh + ' kWh',
          'Op maat gedimensioneerd',
          'De aanbevolen batterij is afgestemd op uw verbruik, netaansluiting en doelen \u2014 niet te groot, niet te klein.'
        ));
      }
    }

    html += '<div class="sv-pdf-highlights">' + cards.join('') + '</div>';

    content.innerHTML = html;
    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Page 3: Capaciteitsadvies (warm tone)
  buildAdvicePage: function(c, S) {
    var page = SV.pdf.createPage();
    var n = SV.n, fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    // Build warm intro
    var introDetail = 'uw ' + c.contract + ' contract';
    if (c.hasSolar) introDetail += ' en ' + c.nPanelen + ' zonnepanelen';
    if (c.heeftEv) introDetail += ', elektrische auto';

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Ons advies voor u: een ' + c.aanbevolenKwh + ' kWh thuisbatterij</div>'
      + '<div class="sv-pdf-section-sub">' + c.tier + '</div>'
      + '<div class="sv-pdf-intro">Op basis van uw verbruik van ' + c.dagVerbruik + ' kWh/dag, ' + introDetail + ' adviseren wij het volgende systeem.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">'
      + SV.pdf.metricBox('Geschatte investering', '\u20AC' + fmt(c.investering))
      + SV.pdf.metricBox('Terugverdientijd', (c.real.tvt < 30 ? c.real.tvt.toFixed(1) + ' jaar' : '> 25 jr'))
      + SV.pdf.metricBox('Zelfconsumptie met batterij', c.hasSolar ? c.zelfPctMet + '%' : 'n.v.t.')
      + SV.pdf.metricBox('Verwachte jaarlijkse besparing', '\u20AC' + fmt(c.real.savingY1))
      + '</div>'
      + '<div class="sv-pdf-section-title" style="font-size:16px;">Hoe werkt uw batterij?</div>'
      + '<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:16px;">'
      + SV.pdf.strategyText(c)
      + '</div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Page 4: Scenario's & financieel
  buildScenariosPage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var y1 = c.real.perJaar[0];
    var content = document.createElement('div');

    // Breakdown
    var bdHtml = '<div class="sv-pdf-section-title">Waar komt uw besparing vandaan?</div>'
      + '<div class="sv-pdf-intro">Hieronder ziet u hoe uw jaarlijkse besparing is opgebouwd uit de verschillende componenten.</div>'
      + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">';
    if (y1.zelf > 0) bdHtml += SV.pdf.bdRow('Zelfconsumptie', '\u20AC' + SV.fmt(y1.zelf));
    if (y1.arb > 0) bdHtml += SV.pdf.bdRow('Dynamisch tarief arbitrage', '\u20AC' + SV.fmt(y1.arb));
    if (y1.ev > 0) bdHtml += SV.pdf.bdRow('EV slim laden', '\u20AC' + SV.fmt(y1.ev));
    if (y1.wp > 0) bdHtml += SV.pdf.bdRow('Warmtepomp buffering', '\u20AC' + SV.fmt(y1.wp));
    if (y1.peak > 0) bdHtml += SV.pdf.bdRow('Peak shaving', '\u20AC' + SV.fmt(y1.peak));
    bdHtml += '<tr style="border-top:2px solid #E8E8E0;font-weight:600;"><td style="padding:10px 0;">Totaal jaar 1</td><td style="padding:10px 0;text-align:right;font-family:Syne,sans-serif;font-size:16px;">\u20AC' + SV.fmt(y1.totaal) + '</td></tr>';
    bdHtml += '</table>';

    // Scenarios table
    bdHtml += '<div class="sv-pdf-section-title" style="font-size:16px;">Drie scenario\u2019s over 15 jaar</div>'
      + '<div class="sv-pdf-intro" style="margin-bottom:12px;">Wij rekenen met drie scenario\u2019s: voorzichtig, verwacht en gunstig. Zo ziet u de bandbreedte van uw investering.</div>'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">'
      + '<tr style="background:#FAFAF8;"><th style="text-align:left;padding:8px;border:1px solid #E8E8E0;">Scenario</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Besparing/jr</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">TVT</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Totaal 15 jr</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Netto</th></tr>'
      + SV.pdf.scRow('Conservatief', c.cons)
      + SV.pdf.scRow('Realistisch', c.real, true)
      + SV.pdf.scRow('Optimistisch', c.opti)
      + '</table>';

    // Netto winst highlight
    var nw = c.real.nettoWinst;
    bdHtml += '<div style="background:' + (nw >= 0 ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + ';border-radius:10px;padding:16px;text-align:center;font-size:14px;">'
      + '<strong>Uw verwachte netto resultaat na 15 jaar:</strong> <span style="font-family:Syne,sans-serif;font-size:20px;font-weight:800;color:' + (nw >= 0 ? '#22C55E' : '#EF4444') + ';">' + (nw >= 0 ? '+' : '') + '\u20AC' + SV.fmt(nw) + '</span></div>';

    content.innerHTML = bdHtml;
    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Page 5: Visuele tijdlijn / roadmap
  buildRoadmapPage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var content = document.createElement('div');
    var html = '<div class="sv-pdf-section-title">Hoe gaat het verder?</div>'
      + '<div class="sv-pdf-intro">Van advies tot besparing \u2014 hieronder ziet u de stappen van uw traject naar een thuisbatterij.</div>';

    html += '<div class="sv-pdf-timeline">'
      + '<div class="sv-pdf-timeline-line"></div>';

    // Step 1: Adviesgesprek (active)
    html += '<div class="sv-pdf-timeline-step sv-pdf-timeline-active">'
      + '<div class="sv-pdf-timeline-circle">1</div>'
      + '<div class="sv-pdf-timeline-title">Adviesgesprek <span class="sv-pdf-timeline-badge">U bent hier</span></div>'
      + '<div class="sv-pdf-timeline-desc">U heeft dit persoonlijke adviesrapport ontvangen. Op basis van uw situatie hebben wij het beste batterijsysteem voor u berekend.</div>'
      + '</div>';

    // Step 2: Offerte
    html += '<div class="sv-pdf-timeline-step">'
      + '<div class="sv-pdf-timeline-circle">2</div>'
      + '<div class="sv-pdf-timeline-title">Offerte op maat</div>'
      + '<div class="sv-pdf-timeline-desc">Uw adviseur stelt een persoonlijke offerte op met de exacte kosten, het gekozen systeem en een voorstel voor de installatiedatum.</div>'
      + '</div>';

    // Step 3: Installatie
    html += '<div class="sv-pdf-timeline-step">'
      + '<div class="sv-pdf-timeline-circle">3</div>'
      + '<div class="sv-pdf-timeline-title">Installatie</div>'
      + '<div class="sv-pdf-timeline-desc">Een gecertificeerd installateur plaatst de batterij bij u thuis. Gemiddeld duurt een installatie 1 werkdag. De batterij wordt direct aangesloten en geconfigureerd.</div>'
      + '</div>';

    // Step 4: Besparing begint
    html += '<div class="sv-pdf-timeline-step">'
      + '<div class="sv-pdf-timeline-circle">4</div>'
      + '<div class="sv-pdf-timeline-title">Besparing begint!</div>'
      + '<div class="sv-pdf-timeline-desc">Vanaf dag \u00e9\u00e9n begint uw batterij met besparen. Via de app kunt u live meekijken hoe uw batterij laadt, ontlaadt en bespaart.</div>'
      + '</div>';

    html += '</div>'; // end timeline

    // CTA
    var contactNaam = S.adviseur ? SV.pdf.esc(S.adviseur) : '';
    var contactBedrijf = S.bedrijf ? SV.pdf.esc(S.bedrijf) : 'Stroomvol';
    var ctaText = contactNaam
      ? 'Neem contact op met <strong>' + contactNaam + '</strong> van <strong>' + contactBedrijf + '</strong> om de volgende stap te zetten.'
      : 'Neem contact op met <strong>' + contactBedrijf + '</strong> om de volgende stap te zetten.';

    html += '<div class="sv-pdf-cta">' + ctaText + '</div>';

    content.innerHTML = html;
    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Page 6: Bijlage
  buildAppendixPage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Bijlage: aannames en parameters</div>'
      + '<div class="sv-pdf-intro">Onderstaande aannames zijn gebruikt bij het opstellen van dit advies. Deze zijn gebaseerd op uw opgegeven situatie en marktgemiddelden.</div>'
      + '<div style="font-size:11px;color:#555;line-height:1.8;margin-bottom:24px;">'
      + document.getElementById('r-assume').innerHTML
      + '</div>'
      + (S.notities ? '<div class="sv-pdf-section-title" style="font-size:16px;">Notities van uw adviseur</div><div style="font-size:12px;color:#555;line-height:1.6;background:#FAFAF8;border-radius:8px;padding:16px;white-space:pre-wrap;">' + SV.pdf.esc(S.notities) + '</div>' : '')
      + '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8E8E0;font-size:10px;color:#BBB;line-height:1.6;">'
      + 'Dit advies is gegenereerd met de Stroomvol Adviseurstool en is indicatief. Werkelijke besparingen kunnen afwijken op basis van individueel verbruiksgedrag, weersomstandigheden en marktontwikkelingen. Raadpleeg een gecertificeerd installateur voor een definitieve offerte.'
      + '</div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // ===== NEW SECTION PAGES =====

  // Energie Onafhankelijkheid
  buildOnafhPage: function(c, S) {
    var page = SV.pdf.createPage();
    var fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    var d = SV.berekenOnafhankelijkheid(c);

    // Build SVG donut inline
    var size = 180, cx = 90, cy = 90, r = 65, sw = 24;
    var circ = 2 * Math.PI * r;
    var segs = [
      { pct: d.pctDirectZon, color: '#22C55E' },
      { pct: d.pctBatterij, color: '#0D9488' },
      { pct: d.pctNet, color: '#D1D5DB' },
    ];
    var donutSvg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">';
    donutSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#F0F0EC" stroke-width="' + sw + '"/>';
    var offset = 0;
    segs.forEach(function(seg) {
      if (seg.pct <= 0) return;
      var dash = (seg.pct / 100) * circ;
      donutSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="' + sw + '" stroke-dasharray="' + dash + ' ' + (circ - dash) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      offset += dash;
    });
    donutSvg += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-family="Syne,sans-serif" font-size="26" font-weight="800" fill="#0A0A0A">' + d.pctOnafhankelijk + '%</text>';
    donutSvg += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="10" fill="#888">Onafhankelijk</text>';
    donutSvg += '</svg>';

    function pdfBar(label, pct, color, kwh) {
      return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:#555;">' + label + '</span><span style="font-weight:600;">' + pct + '% &middot; ' + fmt(kwh) + ' kWh</span></div>'
        + '<div style="height:8px;background:#F0F0EC;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + Math.max(pct, 2) + '%;background:' + color + ';border-radius:4px;"></div></div></div>';
    }

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Jouw Energie Onafhankelijkheid</div>'
      + '<div class="sv-pdf-section-sub">Hoeveel van je verbruik komt uit eigen opwek? (jaargemiddelde)</div>'
      + '<div style="display:grid;grid-template-columns:180px 1fr;gap:32px;align-items:center;margin-bottom:24px;">'
      + '<div>' + donutSvg + '</div>'
      + '<div>' + pdfBar('Direct zonneverbruik', d.pctDirectZon, '#22C55E', d.directZon)
      + pdfBar('Uit batterij', d.pctBatterij, '#0D9488', d.uitBatterij)
      + pdfBar('Van het net', d.pctNet, '#D1D5DB', d.vanNet) + '</div></div>'
      + '<div style="background:rgba(34,197,94,.08);border-radius:10px;padding:14px 20px;text-align:center;font-size:13px;color:#166534;font-weight:600;">'
      + d.pctOnafhankelijk + '% van uw verbruik uit eigen opwek <span style="font-weight:300;color:#888;margin-left:4px;">(was ' + d.zelfPctZonder + '% zonder batterij)</span></div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Stress Test
  buildStressPage: function(c, S) {
    var page = SV.pdf.createPage();
    var fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    var d = SV.berekenStressTest(c);
    var badgeHtml = d.besparingPct >= 10 ? '<div style="display:inline-block;background:#22C55E;color:white;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;margin-top:6px;">' + d.besparingPct + '% besparing</div>' : '';

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Stress Test: Slechte Weer Week</div>'
      + '<div class="sv-pdf-section-sub">Wat als het \u00e9cht tegenzit? Een koude, donkere decemberweek met minimale zon, hoge energieprijzen en extra verwarming.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">'
      + '<div style="background:#FAFAF8;border:1px solid #E8E8E0;border-radius:10px;padding:20px;text-align:center;"><div style="font-size:24px;margin-bottom:8px;">\uD83C\uDF28\uFE0F</div><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Scenario</div><div style="font-size:12px;color:#555;line-height:1.5;">' + d.scenario + '</div><div style="font-size:11px;color:#888;margin-top:6px;">' + d.weekVerbruik + ' kWh weekverbruik</div></div>'
      + '<div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:20px;text-align:center;"><div style="font-size:24px;margin-bottom:8px;">\u274C</div><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Zonder batterij</div><div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;">\u20AC' + fmt(d.kostenZonder) + '</div><div style="font-size:11px;color:#888;margin-top:4px;">Energiekosten per week</div></div>'
      + '<div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:20px;text-align:center;"><div style="font-size:24px;margin-bottom:8px;">\u2705</div><div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;">Met batterij</div><div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;">\u20AC' + fmt(d.kostenMet) + '</div>' + badgeHtml + '<div style="font-size:11px;color:#888;margin-top:4px;">Energiekosten per week</div></div>'
      + '</div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Batterij vs. Spaarrekening
  buildSpaarPage: function(c, S) {
    var page = SV.pdf.createPage();
    var fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    var d = SV.berekenVergelijking(c.investering, c.real.perJaar);

    // Build SVG comparison chart inline
    var W = 680, H = 240, pL = 60, pR = 20, pT = 20, pB = 40;
    var cW = W - pL - pR, cH = H - pT - pB;
    var maxVal = 0;
    for (var j = 0; j < d.jaren.length; j++) {
      maxVal = Math.max(maxVal, d.jaren[j].batterijWaarde, d.jaren[j].spaarWaarde);
    }
    maxVal = Math.max(maxVal, c.investering) * 1.15;
    function xc(yr) { return pL + (yr / 15) * cW; }
    function yc(v) { return pT + cH - (v / maxVal) * cH; }

    var svgH = '';
    for (var g = 0; g <= 5; g++) {
      var gv = maxVal * (g / 5);
      svgH += '<line x1="' + pL + '" y1="' + yc(gv) + '" x2="' + (W - pR) + '" y2="' + yc(gv) + '" stroke="#E8E8E0" stroke-width="1"/>';
      svgH += '<text x="' + (pL - 8) + '" y="' + (yc(gv) + 3) + '" text-anchor="end" fill="#BBB" font-size="9" font-family="DM Sans">\u20AC' + Math.round(gv).toLocaleString('nl-NL') + '</text>';
    }
    for (var yr = 0; yr <= 15; yr += 3) {
      svgH += '<text x="' + xc(yr) + '" y="' + (H - 12) + '" text-anchor="middle" fill="#BBB" font-size="10" font-family="DM Sans">Jaar ' + yr + '</text>';
    }
    svgH += '<line x1="' + pL + '" y1="' + yc(c.investering) + '" x2="' + (W - pR) + '" y2="' + yc(c.investering) + '" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>';
    var spP = 'M ' + xc(0) + ' ' + yc(0);
    var btP = 'M ' + xc(0) + ' ' + yc(0);
    for (j = 0; j < 15; j++) {
      spP += ' L ' + xc(j + 1) + ' ' + yc(d.jaren[j].spaarWaarde);
      btP += ' L ' + xc(j + 1) + ' ' + yc(d.jaren[j].batterijWaarde);
    }
    svgH += '<path d="' + spP + '" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-dasharray="6,4" opacity="0.7"/>';
    svgH += '<path d="' + btP + '" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"/>';
    for (j = 0; j < 15; j++) {
      svgH += '<circle cx="' + xc(j + 1) + '" cy="' + yc(d.jaren[j].batterijWaarde) + '" r="3" fill="#22C55E"/>';
    }
    var chartSvg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' + svgH + '</svg>';

    var footerHtml = d.batterijTotaal > d.spaarTotaal
      ? '<div style="background:rgba(34,197,94,.08);border-radius:10px;padding:14px 20px;text-align:center;font-size:14px;color:#166534;font-weight:600;">\u20AC' + fmt(Math.round(d.verschil)) + ' meer rendement \u2014 Batterij investering levert ' + d.factorBeter + 'x meer op dan sparen</div>'
      : '<div style="background:rgba(255,220,60,.1);border-radius:10px;padding:14px 20px;text-align:center;font-size:13px;color:#555;">De batterij biedt daarnaast comfort en onafhankelijkheid die een spaarrekening niet biedt.</div>';

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Beter dan de bank: Batterij vs. Spaarrekening</div>'
      + '<div class="sv-pdf-section-sub">Wat als u hetzelfde bedrag op een spaarrekening zou zetten? Met ~2% rente groeit uw geld een stuk langzamer.</div>'
      + '<div style="margin-bottom:16px;">' + chartSvg + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">'
      + '<div style="background:#FAFAF8;border-radius:10px;padding:16px;text-align:center;"><div style="font-family:Syne,sans-serif;font-size:22px;font-weight:800;margin-bottom:2px;">\u20AC' + fmt(Math.round(d.batterijTotaal)) + '</div><div style="font-size:11px;color:#888;">Totale waarde na 15 jaar \u2014 Batterij</div></div>'
      + '<div style="background:#FAFAF8;border-radius:10px;padding:16px;text-align:center;"><div style="font-family:Syne,sans-serif;font-size:22px;font-weight:800;margin-bottom:2px;">\u20AC' + fmt(d.spaarTotaal) + '</div><div style="font-size:11px;color:#888;">Totale waarde na 15 jaar \u2014 Spaarrekening</div></div>'
      + '</div>'
      + footerHtml;

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // Wat Als Je Niets Doet
  buildNietsPage: function(c, S) {
    var page = SV.pdf.createPage();
    var fmt = SV.fmt;
    SV.pdf.addHeader(page, S);

    var d = SV.berekenNietsDoen(c);
    var subtitel = c.contract === 'vast'
      ? 'Ook bij een vast contract stijgen de tarieven bij verlenging. Een batterij beschermt u structureel.'
      : 'Energieprijzen stijgen structureel. Hoe hoger de prijzen, hoe meer uw batterij verdient.';

    var cardsHtml = '';
    d.projecties.forEach(function(p) {
      cardsHtml += '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:20px;text-align:center;">'
        + '<div style="font-size:20px;margin-bottom:8px;">\uD83D\uDCC5</div>'
        + '<div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.5);margin-bottom:8px;">' + p.label + '</div>'
        + '<div style="font-family:Syne,sans-serif;font-size:24px;font-weight:800;color:#FFDC3C;margin-bottom:2px;">\u20AC' + p.tarief.toFixed(2) + '</div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.4);">per kWh (verwacht)</div>'
        + '<div style="font-size:12px;color:#FFDC3C;font-weight:500;margin-top:8px;">Jaarkosten \u20AC' + fmt(p.jaarkosten) + '</div>'
        + '</div>';
    });

    var content = document.createElement('div');
    content.innerHTML = '<div style="background:linear-gradient(135deg,#0A0A0A 0%,#1A1A1A 100%);border-radius:12px;padding:32px;color:white;">'
      + '<div style="text-align:center;margin-bottom:24px;"><div style="font-size:28px;margin-bottom:8px;">\uD83D\uDCC8</div>'
      + '<div style="font-family:Syne,sans-serif;font-size:20px;font-weight:800;margin-bottom:8px;">Toekomstbestendig investeren</div>'
      + '<div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;max-width:500px;margin:0 auto;">' + subtitel + '</div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">' + cardsHtml + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">'
      + '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;"><strong style="color:rgba(255,255,255,.85);">Elektrificatie neemt toe</strong><br>Warmtepompen, EV\u2019s en inductie koken verhogen de vraag naar stroom. Dit drijft prijzen verder omhoog.</div>'
      + '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;font-size:12px;color:rgba(255,255,255,.6);line-height:1.6;"><strong style="color:rgba(255,255,255,.85);">Netcongestie wordt erger</strong><br>Stroomnet zit vol. Thuisbatterijen worden essentieel \u2014 en mogelijk verplicht. Early adopters profiteren het meest.</div>'
      + '</div>'
      + '<div style="font-size:11px;color:rgba(255,255,255,.3);text-align:center;">Prijsprojecties gebaseerd op ' + d.stijgingPct + '% jaarlijkse stijging. Werkelijke prijzen kunnen hoger of lager uitvallen.</div>'
      + '</div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  // ===== HELPERS =====

  createPage: function() {
    var page = document.createElement('div');
    page.className = 'sv-pdf-page';
    return page;
  },

  addHeader: function(page, S) {
    var header = document.createElement('div');
    header.className = 'sv-pdf-header';
    header.innerHTML = '<div class="sv-pdf-logo">STROOM<span>VOL</span></div>'
      + '<div class="sv-pdf-meta">'
      + (S.klantNaam ? '<strong>' + SV.pdf.esc(S.klantNaam) + '</strong><br>' : '')
      + (S.klantAdres ? SV.pdf.esc(S.klantAdres) + '<br>' : '')
      + (S.datum ? S.datum : new Date().toLocaleDateString('nl-NL'))
      + '</div>';
    page.appendChild(header);
  },

  addFooter: function(page) {
    var footer = document.createElement('div');
    footer.className = 'sv-pdf-footer';
    footer.innerHTML = '<span>\u00A9 ' + (SV.state.bedrijf || 'Stroomvol') + '</span><span>Gegenereerd door Stroomvol Adviseurstool</span>';
    page.appendChild(footer);
  },

  highlightCard: function(bigValue, label, subtext) {
    return '<div class="sv-pdf-highlight">'
      + '<div class="sv-pdf-highlight-val">' + bigValue + '</div>'
      + '<div class="sv-pdf-highlight-label">' + label + '</div>'
      + '<div class="sv-pdf-highlight-sub">' + subtext + '</div>'
      + '</div>';
  },

  metricBox: function(label, value) {
    return '<div style="background:#FAFAF8;border-radius:10px;padding:16px;"><div style="font-family:Syne,sans-serif;font-size:22px;font-weight:800;letter-spacing:-1px;margin-bottom:2px;">' + value + '</div><div style="font-size:11px;color:#888;">' + label + '</div></div>';
  },

  bdRow: function(label, value) {
    return '<tr><td style="padding:8px 0;color:#555;border-bottom:1px solid #F5F5F0;">' + label + '</td><td style="padding:8px 0;text-align:right;font-weight:500;border-bottom:1px solid #F5F5F0;">' + value + '</td></tr>';
  },

  scRow: function(label, sc, highlight) {
    var netto = sc.nettoWinst;
    var bold = highlight ? 'font-weight:600;' : '';
    var nettoColor = netto >= 0 ? '#22C55E' : '#EF4444';
    return '<tr><td style="padding:8px;border:1px solid #E8E8E0;' + bold + '">' + label + '</td>'
      + '<td style="padding:8px;border:1px solid #E8E8E0;text-align:right;' + bold + '">\u20AC' + SV.fmt(sc.savingY1) + '</td>'
      + '<td style="padding:8px;border:1px solid #E8E8E0;text-align:right;' + bold + '">' + (sc.tvt < 30 ? sc.tvt.toFixed(1) + ' jr' : '> 25 jr') + '</td>'
      + '<td style="padding:8px;border:1px solid #E8E8E0;text-align:right;' + bold + '">\u20AC' + SV.fmt(sc.total15) + '</td>'
      + '<td style="padding:8px;border:1px solid #E8E8E0;text-align:right;color:' + nettoColor + ';' + bold + '">' + (netto >= 0 ? '+' : '') + '\u20AC' + SV.fmt(netto) + '</td></tr>';
  },

  strategyText: function(c) {
    if (c.contract === 'vast') {
      return 'Bij uw vaste contract is de strategie: <strong>zelfconsumptie maximaliseren</strong>. Uw batterij slaat overdag de zonne-energie op die u \'s avonds en \'s nachts verbruikt. Zo haalt u het maximale uit uw eigen opgewekte stroom en bent u minder afhankelijk van het net.';
    }
    if (c.contract === 'variabel') {
      return 'Bij uw variabele contract is <strong>zelfconsumptie-optimalisatie</strong> de kern. Uw batterij slaat zonne-overschot op voor later gebruik. Een extra voordeel: bij stijgende tarieven (' + c.stijgPct + '%/jaar verwacht) stijgt ook de waarde van elke opgeslagen kWh.';
    }
    return 'Bij uw dynamische contract heeft de batterij een <strong>dubbele verdienlaag</strong>. Ten eerste: zelfconsumptie \u2014 uw eigen zonnestroom opslaan voor later. Ten tweede: <strong>actieve arbitrage</strong> \u2014 automatisch laden bij lage uurprijzen (\u20AC' + SV.n(c.dynDal).toFixed(2) + ') en ontladen bij hoge prijzen (\u20AC' + SV.n(c.dynPiek).toFixed(2) + '). Dat levert u extra besparing op bovenop de zelfconsumptie.';
  },

  esc: function(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  },
};
