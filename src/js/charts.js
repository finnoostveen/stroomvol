/**
 * Stroomvol Adviseurstool — SVG Chart Rendering
 */
var SV = SV || {};

SV.charts = {
  // Draw bathtub curve (input phase preview)
  drawBathtub: function(svgId, maand) {
    var prices = SV.bathtubPrices(maand);
    var svg = document.getElementById(svgId);
    if (!svg) return;

    var W = 600, H = 180, pL = 40, pR = 10, pT = 10, pB = 30;
    var cW = W - pL - pR, cH = H - pT - pB;
    var maxP = Math.max.apply(null, prices) * 1.1;
    var minP = Math.min(0, Math.min.apply(null, prices));

    function x(i) { return pL + (i / 23) * cW; }
    function y(p) { return pT + cH - ((p - minP) / (maxP - minP)) * cH; }

    var med = prices.reduce(function(a, b) { return a + b; }, 0) / 24;
    var h = '';

    // Background zones
    for (var i = 0; i < 24; i++) {
      var bw = cW / 24;
      if (prices[i] < med * 0.85) {
        h += '<rect x="' + (x(i) - bw / 2) + '" y="' + y(prices[i]) + '" width="' + bw + '" height="' + (y(minP) - y(prices[i])) + '" fill="rgba(34,197,94,0.15)" rx="2"/>';
      }
      if (prices[i] > med * 1.15) {
        h += '<rect x="' + (x(i) - bw / 2) + '" y="' + y(prices[i]) + '" width="' + bw + '" height="' + (y(med) - y(prices[i])) + '" fill="rgba(239,68,68,0.15)" rx="2"/>';
      }
    }

    // Curve path
    var path = 'M ' + x(0) + ' ' + y(prices[0]);
    for (i = 1; i < 24; i++) {
      path += ' C ' + x(i - 0.5) + ' ' + y(prices[i - 1]) + ', ' + x(i - 0.5) + ' ' + y(prices[i]) + ', ' + x(i) + ' ' + y(prices[i]);
    }
    h += '<path d="' + path + '" fill="none" stroke="rgba(255,220,60,0.8)" stroke-width="2.5" stroke-linecap="round"/>';

    // Dots
    prices.forEach(function(p, idx) {
      if (p < med * 0.85) {
        h += '<circle cx="' + x(idx) + '" cy="' + y(p) + '" r="3.5" fill="#22C55E" opacity="0.8"/>';
      } else if (p > med * 1.15) {
        h += '<circle cx="' + x(idx) + '" cy="' + y(p) + '" r="3.5" fill="#EF4444" opacity="0.8"/>';
      }
    });

    // Time labels
    [0, 3, 6, 9, 12, 15, 18, 21].forEach(function(hr) {
      h += '<text x="' + x(hr) + '" y="' + (H - 4) + '" text-anchor="middle" fill="rgba(255,255,255,.35)" font-size="10" font-family="DM Sans">' + hr + ':00</text>';
    });

    // Price labels + grid
    for (i = 0; i <= 4; i++) {
      var pv = minP + (maxP - minP) * (i / 4);
      h += '<text x="' + (pL - 6) + '" y="' + (y(pv) + 3) + '" text-anchor="end" fill="rgba(255,255,255,.3)" font-size="9" font-family="DM Sans">€' + pv.toFixed(2) + '</text>';
      h += '<line x1="' + pL + '" y1="' + y(pv) + '" x2="' + (W - pR) + '" y2="' + y(pv) + '" stroke="rgba(255,255,255,.06)" stroke-width="1"/>';
    }

    // Median line
    h += '<line x1="' + pL + '" y1="' + y(med) + '" x2="' + (W - pR) + '" y2="' + y(med) + '" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="4,4"/>';

    svg.innerHTML = h;
  },

  // Draw bathtub result with charge/discharge indicators
  drawBathtubResult: function() {
    var prices = SV.bathtubPrices(6); // zomer als default
    var svg = document.getElementById('r-bathtub-svg');
    if (!svg) return;

    var W = 600, H = 200, pL = 44, pR = 14, pT = 14, pB = 35;
    var cW = W - pL - pR, cH = H - pT - pB;
    var maxP = Math.max.apply(null, prices) * 1.15;
    var minP = Math.min(0, Math.min.apply(null, prices) * 0.9);
    var med = prices.reduce(function(a, b) { return a + b; }, 0) / 24;

    function x(i) { return pL + (i / 23) * cW; }
    function y(p) { return pT + cH - ((p - minP) / (maxP - minP)) * cH; }

    var h = '';

    // Background zones
    for (var i = 0; i < 24; i++) {
      var bw = cW / 24;
      if (prices[i] < med * 0.85) {
        h += '<rect x="' + (x(i) - bw / 2) + '" y="' + pT + '" width="' + bw + '" height="' + cH + '" fill="rgba(34,197,94,0.06)" rx="1"/>';
      } else if (prices[i] > med * 1.15) {
        h += '<rect x="' + (x(i) - bw / 2) + '" y="' + pT + '" width="' + bw + '" height="' + cH + '" fill="rgba(239,68,68,0.06)" rx="1"/>';
      }
    }

    // Grid lines
    for (i = 0; i <= 4; i++) {
      var pv = minP + (maxP - minP) * (i / 4);
      h += '<line x1="' + pL + '" y1="' + y(pv) + '" x2="' + (W - pR) + '" y2="' + y(pv) + '" stroke="#E8E8E0" stroke-width="1"/>';
      h += '<text x="' + (pL - 6) + '" y="' + (y(pv) + 3) + '" text-anchor="end" fill="#BBB" font-size="9" font-family="DM Sans">€' + pv.toFixed(2) + '</text>';
    }

    // Charge/discharge indicators
    for (i = 0; i < 24; i++) {
      var bwI = cW / 24 * 0.6;
      if (prices[i] < med * 0.85) {
        h += '<rect x="' + (x(i) - bwI / 2) + '" y="' + (y(prices[i]) + 4) + '" width="' + bwI + '" height="15" fill="#22C55E" rx="3" opacity="0.7"/>';
        h += '<text x="' + x(i) + '" y="' + (y(prices[i]) + 14) + '" text-anchor="middle" fill="white" font-size="7" font-weight="600" font-family="DM Sans">\u2193</text>';
      } else if (prices[i] > med * 1.15) {
        h += '<rect x="' + (x(i) - bwI / 2) + '" y="' + (y(prices[i]) - 19) + '" width="' + bwI + '" height="15" fill="#EF4444" rx="3" opacity="0.7"/>';
        h += '<text x="' + x(i) + '" y="' + (y(prices[i]) - 9) + '" text-anchor="middle" fill="white" font-size="7" font-weight="600" font-family="DM Sans">\u2191</text>';
      }
    }

    // Curve
    var path = 'M ' + x(0) + ' ' + y(prices[0]);
    for (i = 1; i < 24; i++) {
      path += ' C ' + x(i - 0.5) + ' ' + y(prices[i - 1]) + ', ' + x(i - 0.5) + ' ' + y(prices[i]) + ', ' + x(i) + ' ' + y(prices[i]);
    }
    h += '<path d="' + path + '" fill="none" stroke="#FFDC3C" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>';

    // Dots
    prices.forEach(function(p, idx) {
      var f = '#BBB';
      if (p < med * 0.85) f = '#22C55E';
      else if (p > med * 1.15) f = '#EF4444';
      h += '<circle cx="' + x(idx) + '" cy="' + y(p) + '" r="3" fill="' + f + '"/>';
    });

    // Time labels
    [0, 3, 6, 9, 12, 15, 18, 21].forEach(function(hr) {
      h += '<text x="' + x(hr) + '" y="' + (H - 8) + '" text-anchor="middle" fill="#BBB" font-size="10" font-family="DM Sans">' + hr + ':00</text>';
    });

    // Zone labels
    h += '<text x="' + x(2) + '" y="' + (H - 22) + '" text-anchor="middle" fill="#22C55E" font-size="9" font-weight="600" font-family="DM Sans">LADEN</text>';
    h += '<text x="' + x(12) + '" y="' + (H - 22) + '" text-anchor="middle" fill="#22C55E" font-size="9" font-weight="600" font-family="DM Sans">LADEN</text>';
    h += '<text x="' + x(8) + '" y="' + (pT + 10) + '" text-anchor="middle" fill="#EF4444" font-size="9" font-weight="600" font-family="DM Sans">ONTLADEN</text>';
    h += '<text x="' + x(19) + '" y="' + (pT + 10) + '" text-anchor="middle" fill="#EF4444" font-size="9" font-weight="600" font-family="DM Sans">ONTLADEN</text>';

    svg.innerHTML = h;
  },

  // Draw cumulative savings chart (15 years)
  drawCumulChart: function(c) {
    var svg = document.getElementById('r-cumul-svg');
    if (!svg) return;

    var W = 600, H = 250, pL = 60, pR = 20, pT = 20, pB = 40;
    var cW = W - pL - pR, cH = H - pT - pB;

    // Build cumulative data for all 3 scenarios
    var cumCons = [0], cumReal = [0], cumOpti = [0];
    for (var j = 0; j < 15; j++) {
      cumCons.push(cumCons[j] + c.cons.perJaar[j].totaal);
      cumReal.push(cumReal[j] + c.real.perJaar[j].totaal);
      cumOpti.push(cumOpti[j] + c.opti.perJaar[j].totaal);
    }

    var maxVal = Math.max(cumOpti[15], c.investering * 1.2);
    var minVal = 0;

    function x(yr) { return pL + (yr / 15) * cW; }
    function y(v) { return pT + cH - ((v - minVal) / (maxVal - minVal)) * cH; }

    var h = '';

    // Grid
    var gridSteps = 5;
    for (var g = 0; g <= gridSteps; g++) {
      var gv = minVal + (maxVal - minVal) * (g / gridSteps);
      h += '<line x1="' + pL + '" y1="' + y(gv) + '" x2="' + (W - pR) + '" y2="' + y(gv) + '" stroke="#E8E8E0" stroke-width="1"/>';
      h += '<text x="' + (pL - 8) + '" y="' + (y(gv) + 3) + '" text-anchor="end" fill="#BBB" font-size="9" font-family="DM Sans">\u20AC' + Math.round(gv).toLocaleString('nl-NL') + '</text>';
    }

    // Year labels
    for (var yr = 0; yr <= 15; yr += 3) {
      h += '<text x="' + x(yr) + '" y="' + (H - 12) + '" text-anchor="middle" fill="#BBB" font-size="10" font-family="DM Sans">Jaar ' + yr + '</text>';
    }

    // Investment line
    h += '<line x1="' + pL + '" y1="' + y(c.investering) + '" x2="' + (W - pR) + '" y2="' + y(c.investering) + '" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>';
    h += '<text x="' + (W - pR - 4) + '" y="' + (y(c.investering) - 6) + '" text-anchor="end" fill="#EF4444" font-size="9" font-weight="500" font-family="DM Sans">Investering \u20AC' + SV.fmt(c.investering) + '</text>';

    // Draw scenario lines
    function drawLine(data, color, opacity, width) {
      var p = 'M ' + x(0) + ' ' + y(data[0]);
      for (var k = 1; k <= 15; k++) {
        p += ' L ' + x(k) + ' ' + y(data[k]);
      }
      h += '<path d="' + p + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" opacity="' + opacity + '" stroke-linecap="round"/>';
    }

    // Conservative (dashed, light)
    drawLine(cumCons, '#F59E0B', 0.4, 1.5);
    // Optimistic (dashed, light)
    drawLine(cumOpti, '#3B82F6', 0.4, 1.5);
    // Realistic (solid, bold)
    drawLine(cumReal, '#22C55E', 1, 2.5);

    // Dots on realistic line
    for (yr = 0; yr <= 15; yr++) {
      h += '<circle cx="' + x(yr) + '" cy="' + y(cumReal[yr]) + '" r="3" fill="#22C55E"/>';
    }

    // TVT marker
    if (c.real.tvt < 15 && c.real.tvt > 0) {
      var tvtX = x(c.real.tvt);
      h += '<line x1="' + tvtX + '" y1="' + pT + '" x2="' + tvtX + '" y2="' + (H - pB) + '" stroke="#22C55E" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>';
      h += '<text x="' + tvtX + '" y="' + (pT - 4) + '" text-anchor="middle" fill="#22C55E" font-size="9" font-weight="600" font-family="DM Sans">TVT: ' + c.real.tvt.toFixed(1) + ' jr</text>';
    }

    // Legend
    var legendY = H - 2;
    h += '<circle cx="' + (pL + 10) + '" cy="' + legendY + '" r="4" fill="#22C55E"/>';
    h += '<text x="' + (pL + 18) + '" y="' + (legendY + 3) + '" fill="#888" font-size="9" font-family="DM Sans">Realistisch</text>';
    h += '<circle cx="' + (pL + 100) + '" cy="' + legendY + '" r="4" fill="#F59E0B" opacity="0.5"/>';
    h += '<text x="' + (pL + 108) + '" y="' + (legendY + 3) + '" fill="#888" font-size="9" font-family="DM Sans">Conservatief</text>';
    h += '<circle cx="' + (pL + 210) + '" cy="' + legendY + '" r="4" fill="#3B82F6" opacity="0.5"/>';
    h += '<text x="' + (pL + 218) + '" y="' + (legendY + 3) + '" fill="#888" font-size="9" font-family="DM Sans">Optimistisch</text>';

    svg.innerHTML = h;
  },

  // Draw donut chart for energy independence
  drawDonut: function(id, data) {
    var el = document.getElementById(id);
    if (!el) return;
    var size = 200, cx = 100, cy = 100, r = 70, sw = 28;
    var circ = 2 * Math.PI * r;
    var segments = [
      { pct: data.pctDirectZon, color: '#22C55E', label: 'Direct zon' },
      { pct: data.pctBatterij, color: '#0D9488', label: 'Uit batterij' },
      { pct: data.pctNet, color: '#D1D5DB', label: 'Van het net' },
    ];
    var h = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:200px;height:auto;">';
    // Background ring
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#F0F0EC" stroke-width="' + sw + '"/>';
    var offset = 0;
    segments.forEach(function(seg) {
      if (seg.pct <= 0) return;
      var dash = (seg.pct / 100) * circ;
      h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="' + sw + '" stroke-dasharray="' + dash + ' ' + (circ - dash) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      offset += dash;
    });
    // Center text
    h += '<text x="' + cx + '" y="' + (cy - 6) + '" text-anchor="middle" font-family="Syne,sans-serif" font-size="28" font-weight="800" fill="#0A0A0A">' + data.pctOnafhankelijk + '%</text>';
    h += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-family="DM Sans,sans-serif" font-size="10" fill="#888">Onafhankelijk</text>';
    h += '</svg>';
    el.innerHTML = h;
  },

  // Draw comparison chart: battery vs savings account
  drawComparisonChart: function(id, jarenData, investering) {
    var el = document.getElementById(id);
    if (!el) return;
    var W = 600, H = 250, pL = 60, pR = 20, pT = 20, pB = 40;
    var cW = W - pL - pR, cH = H - pT - pB;

    var maxVal = 0;
    for (var j = 0; j < jarenData.length; j++) {
      maxVal = Math.max(maxVal, jarenData[j].batterijWaarde, jarenData[j].spaarWaarde);
    }
    maxVal = Math.max(maxVal, investering) * 1.15;
    var minVal = 0;

    function x(yr) { return pL + (yr / 15) * cW; }
    function y(v) { return pT + cH - ((v - minVal) / (maxVal - minVal)) * cH; }

    var h = '';

    // Grid
    for (var g = 0; g <= 5; g++) {
      var gv = minVal + (maxVal - minVal) * (g / 5);
      h += '<line x1="' + pL + '" y1="' + y(gv) + '" x2="' + (W - pR) + '" y2="' + y(gv) + '" stroke="#E8E8E0" stroke-width="1"/>';
      h += '<text x="' + (pL - 8) + '" y="' + (y(gv) + 3) + '" text-anchor="end" fill="#BBB" font-size="9" font-family="DM Sans">\u20AC' + Math.round(gv).toLocaleString('nl-NL') + '</text>';
    }

    // Year labels
    for (var yr = 0; yr <= 15; yr += 3) {
      h += '<text x="' + x(yr) + '" y="' + (H - 12) + '" text-anchor="middle" fill="#BBB" font-size="10" font-family="DM Sans">Jaar ' + yr + '</text>';
    }

    // Investment line
    h += '<line x1="' + pL + '" y1="' + y(investering) + '" x2="' + (W - pR) + '" y2="' + y(investering) + '" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>';
    h += '<text x="' + (W - pR - 4) + '" y="' + (y(investering) - 6) + '" text-anchor="end" fill="#EF4444" font-size="9" font-weight="500" font-family="DM Sans">Investering \u20AC' + investering.toLocaleString('nl-NL') + '</text>';

    // Savings account line (dashed gray)
    var spaarPath = 'M ' + x(0) + ' ' + y(0);
    for (j = 0; j < 15; j++) {
      spaarPath += ' L ' + x(j + 1) + ' ' + y(jarenData[j].spaarWaarde);
    }
    h += '<path d="' + spaarPath + '" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-dasharray="6,4" opacity="0.7"/>';

    // Battery line (solid green)
    var battPath = 'M ' + x(0) + ' ' + y(0);
    for (j = 0; j < 15; j++) {
      battPath += ' L ' + x(j + 1) + ' ' + y(jarenData[j].batterijWaarde);
    }
    h += '<path d="' + battPath + '" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"/>';

    // Dots on battery line
    for (j = 0; j < 15; j++) {
      h += '<circle cx="' + x(j + 1) + '" cy="' + y(jarenData[j].batterijWaarde) + '" r="3" fill="#22C55E"/>';
    }

    // Legend
    var legendY = H - 2;
    h += '<circle cx="' + (pL + 10) + '" cy="' + legendY + '" r="4" fill="#22C55E"/>';
    h += '<text x="' + (pL + 18) + '" y="' + (legendY + 3) + '" fill="#888" font-size="9" font-family="DM Sans">Batterij besparing</text>';
    h += '<circle cx="' + (pL + 140) + '" cy="' + legendY + '" r="4" fill="#9CA3AF" opacity="0.7"/>';
    h += '<text x="' + (pL + 148) + '" y="' + (legendY + 3) + '" fill="#888" font-size="9" font-family="DM Sans">Spaarrekening (2%)</text>';

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">' + h + '</svg>';
  },
};
