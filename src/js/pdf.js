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
    if (SV.pdf.generating) return;
    SV.pdf.generating = true;

    var btn = document.getElementById('btn-pdf');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'PDF genereren...';
    }

    // Safety timeout: reset na 30s als er iets misgaat
    SV.pdf._safetyTimeout = setTimeout(function() {
      console.error('PDF generation timed out after 30s');
      SV.pdf.cleanup();
    }, 30000);

    // Check dependencies (inlined, should always be available)
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      console.error('PDF libs missing. html2canvas:', typeof html2canvas, 'jspdf:', typeof window.jspdf);
      alert('PDF-bibliotheken konden niet geladen worden. Herlaad de pagina en probeer opnieuw.');
      SV.pdf.cleanup();
      return;
    }

    var c = SV.state.lastCalc;
    if (!c) {
      SV.pdf.cleanup();
      return;
    }

    var S = SV.state;
    var container = document.getElementById('pdf-container');
    container.innerHTML = '';

    // Build PDF pages (6 pages)
    try {
      var pages = [];
      pages.push(SV.pdf.buildCoverPage(c, S));
      pages.push(SV.pdf.buildPersonalPage(c, S));
      pages.push(SV.pdf.buildAdvicePage(c, S));
      pages.push(SV.pdf.buildScenariosPage(c, S));
      pages.push(SV.pdf.buildRoadmapPage(c, S));
      pages.push(SV.pdf.buildAppendixPage(c, S));

      // Append all pages to container
      pages.forEach(function(page) { container.appendChild(page); });

      // Render each page to canvas, then to PDF
      setTimeout(function() {
        SV.pdf.renderPages(pages, c, S);
      }, 300);
    } catch (e) {
      console.error('PDF build error:', e);
      alert('Er ging iets mis bij het genereren van de PDF: ' + e.message);
      SV.pdf.cleanup();
    }
  },

  renderPages: function(pages, c, S) {
    try {
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    } catch (e) {
      console.error('jsPDF init error:', e);
      alert('Kon PDF-bibliotheek niet laden. Controleer uw internetverbinding en probeer het opnieuw.');
      SV.pdf.cleanup();
      return;
    }
    var pageWidth = 210;
    var pageHeight = 297;

    function renderNext(idx) {
      if (idx >= pages.length) {
        var fileName = 'Stroomvol-Advies';
        if (S.klantNaam) fileName += '-' + S.klantNaam.replace(/[^a-zA-Z0-9]/g, '-');
        if (S.datum) fileName += '-' + S.datum;
        fileName += '.pdf';

        pdf.save(fileName);
        SV.pdf.cleanup();
        return;
      }

      html2canvas(pages[idx], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      }).then(function(canvas) {
        if (idx > 0) pdf.addPage();

        var imgData = canvas.toDataURL('image/jpeg', 0.95);
        var imgWidth = pageWidth;
        var imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > pageHeight) {
          imgHeight = pageHeight;
          imgWidth = (canvas.width * imgHeight) / canvas.height;
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

        pdf.setFontSize(8);
        pdf.setTextColor(180);
        pdf.text('Pagina ' + (idx + 1) + ' van ' + pages.length, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Gegenereerd door Stroomvol Adviseurstool', pageWidth - 15, pageHeight - 8, { align: 'right' });

        renderNext(idx + 1);
      }).catch(function(err) {
        console.error('html2canvas error on page ' + (idx + 1) + ':', err);
        renderNext(idx + 1);
      });
    }

    renderNext(0);
  },

  cleanup: function() {
    if (SV.pdf._safetyTimeout) {
      clearTimeout(SV.pdf._safetyTimeout);
      SV.pdf._safetyTimeout = null;
    }
    SV.pdf.generating = false;
    var btn = document.getElementById('btn-pdf');
    if (btn) { btn.disabled = false; btn.textContent = 'Download PDF'; }
    var container = document.getElementById('pdf-container');
    container.innerHTML = '';
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
