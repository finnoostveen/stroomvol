/**
 * Stroomvol Adviseurstool — Centrale State
 */
var SV = SV || {};

// Diagnostiek: toon zichtbaar of JS uitvoert
(function() {
  var d = document.createElement('div');
  d.id = 'sv-diag';
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#111;color:#0f0;font:13px monospace;padding:10px 16px;z-index:99999;';
  d.textContent = 'JS LOADED OK | Build: ' + new Date().toISOString().slice(0,16);
  document.documentElement.appendChild(d);
  window.onerror = function(msg, src, line) {
    d.style.background = '#600';
    d.textContent = 'JS ERROR: ' + msg + ' (line ' + line + ')';
  };
})();

SV.state = {
  // Klant & adviseur
  klantNaam: '',
  klantAdres: '',
  klantPlaats: '',
  datum: '',
  adviseur: '',
  bedrijf: 'Stroomvol',
  notities: '',

  // Energiecontract
  contract: null, // 'vast' | 'variabel' | 'dynamisch'

  // Verbruik
  profiel: 'standaard',

  // Zonnepanelen
  zon: null, // 'ja' | 'nee' | 'gepland'
  panelen: 10,

  // Omvormer & net
  omv: null,
  net: null,

  // Installatie
  loc: null,
  eig: null,
  afst: null,
  muur: null,

  // Grootverbruikers & doelen (Sets)
  gv: new Set(),
  doel: new Set(),

  // Laatste berekening
  lastCalc: null,
};

// Helper: parse number safely
SV.n = function(v) {
  var x = Number(v);
  return isFinite(x) ? x : 0;
};

// Helper: format number NL style
SV.fmt = function(v) {
  return SV.n(v).toLocaleString('nl-NL');
};

// Helper: get element value with fallback
SV.elVal = function(id, fb) {
  var el = document.getElementById(id);
  if (!el) return fb;
  var v = parseFloat(el.value);
  return isFinite(v) ? v : fb;
};

// Helper: days per month
SV.dagenInMaand = function(m) {
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
};

// Helper: sum array
SV.som = function(arr) {
  return arr.reduce(function(a, b) { return a + b; }, 0);
};
