/**
 * Stroomvol Adviseurstool — PDF Generation
 * Uses jsPDF + html2canvas (loaded via CDN)
 */
var SV = SV || {};

SV.pdf = {
  generating: false,

  generate: function() {
    if (SV.pdf.generating) return;
    SV.pdf.generating = true;

    var btn = document.getElementById('btn-pdf');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'PDF genereren...';
    }

    var c = SV.state.lastCalc;
    if (!c) {
      SV.pdf.generating = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Download PDF'; }
      return;
    }

    var S = SV.state;
    var container = document.getElementById('pdf-container');
    container.innerHTML = '';

    // Build PDF pages
    var pages = [];
    pages.push(SV.pdf.buildCoverPage(c, S));
    pages.push(SV.pdf.buildAdvicePage(c, S));
    pages.push(SV.pdf.buildScenariosPage(c, S));
    pages.push(SV.pdf.buildAppendixPage(c, S));

    // Append all pages to container
    pages.forEach(function(page) { container.appendChild(page); });

    // Render each page to canvas, then to PDF
    setTimeout(function() {
      SV.pdf.renderPages(pages, c, S);
    }, 200);
  },

  renderPages: function(pages, c, S) {
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageWidth = 210;
    var pageHeight = 297;
    var renderedCount = 0;

    function renderNext(idx) {
      if (idx >= pages.length) {
        // All pages rendered, save
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

        // Footer on every page
        pdf.setFontSize(8);
        pdf.setTextColor(180);
        pdf.text('Pagina ' + (idx + 1) + ' van ' + pages.length, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Gegenereerd door Stroomvol Adviseurstool', pageWidth - 15, pageHeight - 8, { align: 'right' });

        renderNext(idx + 1);
      }).catch(function() {
        renderNext(idx + 1);
      });
    }

    renderNext(0);
  },

  cleanup: function() {
    SV.pdf.generating = false;
    var btn = document.getElementById('btn-pdf');
    if (btn) { btn.disabled = false; btn.textContent = 'Download PDF'; }
    var container = document.getElementById('pdf-container');
    container.innerHTML = '';
  },

  // ===== PAGE BUILDERS =====

  buildCoverPage: function(c, S) {
    var page = SV.pdf.createPage();
    var cover = document.createElement('div');
    cover.className = 'sv-pdf-cover';
    cover.innerHTML = '<div class="sv-pdf-cover-logo">STROOM<span>VOL</span></div>'
      + '<div class="sv-pdf-cover-subtitle">Batterijadvies op maat</div>'
      + '<div class="sv-pdf-cover-badge">Adviesrapport</div>'
      + '<div class="sv-pdf-cover-info">'
      + (S.klantNaam ? '<strong>' + SV.pdf.esc(S.klantNaam) + '</strong><br>' : '')
      + (S.klantAdres ? SV.pdf.esc(S.klantAdres) + '<br>' : '')
      + (S.klantPlaats ? SV.pdf.esc(S.klantPlaats) + '<br>' : '')
      + '</div>'
      + '<div class="sv-pdf-cover-date">'
      + (S.adviseur ? 'Adviseur: ' + SV.pdf.esc(S.adviseur) + '<br>' : '')
      + (S.bedrijf ? SV.pdf.esc(S.bedrijf) + '<br>' : '')
      + (S.datum ? S.datum : new Date().toLocaleDateString('nl-NL'))
      + '</div>';
    page.appendChild(cover);
    return page;
  },

  buildAdvicePage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Capaciteitsadvies: ' + c.aanbevolenKwh + ' kWh</div>'
      + '<div class="sv-pdf-section-sub">' + c.tier + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">'
      + SV.pdf.metricBox('Investering', '\u20AC' + SV.fmt(c.investering))
      + SV.pdf.metricBox('Terugverdientijd', (c.real.tvt < 30 ? c.real.tvt.toFixed(1) + ' jaar' : '> 25 jr'))
      + SV.pdf.metricBox('Zelfconsumptie', c.hasSolar ? c.zelfPctMet + '%' : 'n.v.t.')
      + SV.pdf.metricBox('Jaarlijkse besparing', '\u20AC' + SV.fmt(c.real.savingY1))
      + '</div>'
      + '<div class="sv-pdf-section-title" style="font-size:16px;">Batterijstrategie</div>'
      + '<div style="font-size:13px;color:#555;line-height:1.7;margin-bottom:16px;">'
      + SV.pdf.strategyText(c)
      + '</div>';

    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  buildScenariosPage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var y1 = c.real.perJaar[0];
    var content = document.createElement('div');

    // Breakdown
    var bdHtml = '<div class="sv-pdf-section-title">Besparingsopbouw (jaar 1)</div><table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;">';
    if (y1.zelf > 0) bdHtml += SV.pdf.bdRow('Zelfconsumptie', '\u20AC' + SV.fmt(y1.zelf));
    if (y1.arb > 0) bdHtml += SV.pdf.bdRow('Arbitrage', '\u20AC' + SV.fmt(y1.arb));
    if (y1.ev > 0) bdHtml += SV.pdf.bdRow('EV slim laden', '\u20AC' + SV.fmt(y1.ev));
    if (y1.wp > 0) bdHtml += SV.pdf.bdRow('Warmtepomp buffering', '\u20AC' + SV.fmt(y1.wp));
    if (y1.peak > 0) bdHtml += SV.pdf.bdRow('Peak shaving', '\u20AC' + SV.fmt(y1.peak));
    bdHtml += '<tr style="border-top:2px solid #E8E8E0;font-weight:600;"><td style="padding:10px 0;">Totaal jaar 1</td><td style="padding:10px 0;text-align:right;font-family:Syne,sans-serif;font-size:16px;">\u20AC' + SV.fmt(y1.totaal) + '</td></tr>';
    bdHtml += '</table>';

    // Scenarios table
    bdHtml += '<div class="sv-pdf-section-title">Scenario\u2019s over 15 jaar</div>'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">'
      + '<tr style="background:#FAFAF8;"><th style="text-align:left;padding:8px;border:1px solid #E8E8E0;">Scenario</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Besparing/jr</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">TVT</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Totaal 15 jr</th><th style="padding:8px;border:1px solid #E8E8E0;text-align:right;">Netto</th></tr>'
      + SV.pdf.scRow('Conservatief', c.cons)
      + SV.pdf.scRow('Realistisch', c.real, true)
      + SV.pdf.scRow('Optimistisch', c.opti)
      + '</table>';

    // Netto winst highlight
    var nw = c.real.nettoWinst;
    bdHtml += '<div style="background:' + (nw >= 0 ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)') + ';border-radius:10px;padding:16px;text-align:center;font-size:14px;">'
      + '<strong>Netto resultaat na 15 jaar (realistisch):</strong> <span style="font-family:Syne,sans-serif;font-size:20px;font-weight:800;color:' + (nw >= 0 ? '#22C55E' : '#EF4444') + ';">' + (nw >= 0 ? '+' : '') + '\u20AC' + SV.fmt(nw) + '</span></div>';

    content.innerHTML = bdHtml;
    page.appendChild(content);
    SV.pdf.addFooter(page);
    return page;
  },

  buildAppendixPage: function(c, S) {
    var page = SV.pdf.createPage();
    SV.pdf.addHeader(page, S);

    var content = document.createElement('div');
    content.innerHTML = '<div class="sv-pdf-section-title">Aannames</div>'
      + '<div style="font-size:11px;color:#555;line-height:1.8;margin-bottom:24px;">'
      + document.getElementById('r-assume').innerHTML
      + '</div>'
      + (S.notities ? '<div class="sv-pdf-section-title">Adviseur notities</div><div style="font-size:12px;color:#555;line-height:1.6;background:#FAFAF8;border-radius:8px;padding:16px;white-space:pre-wrap;">' + SV.pdf.esc(S.notities) + '</div>' : '')
      + '<div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8E8E0;font-size:10px;color:#BBB;line-height:1.6;">'
      + 'Dit advies is gegenereerd met de Stroomvol Adviseurstool en is indicatief. Werkelijke besparingen kunnen afwijken op basis van individueel verbruiksgedrag, weersomstandigheden, en marktontwikkelingen. Raadpleeg een gecertificeerd installateur voor een definitieve offerte.'
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
    if (c.contract === 'vast') return 'Bij een vast contract is de strategie: <strong>zelfconsumptie maximaliseren</strong>. Overdag zonne-energie opslaan, \'s avonds verbruiken. Geen arbitrage mogelijk bij vaste prijs.';
    if (c.contract === 'variabel') return 'Bij een variabel contract: <strong>zelfconsumptie-optimalisatie</strong>. Bij stijgende tarieven (' + c.stijgPct + '%/jaar) stijgt ook de waarde van opgeslagen stroom.';
    return 'Bij een dynamisch contract heeft de batterij een <strong>dubbele verdienlaag</strong>: zelfconsumptie \u00e9n actieve arbitrage. Laden bij dalprijs (\u20AC' + SV.n(c.dynDal).toFixed(2) + '), ontladen bij piekprijs (\u20AC' + SV.n(c.dynPiek).toFixed(2) + ').';
  },

  esc: function(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  },
};
