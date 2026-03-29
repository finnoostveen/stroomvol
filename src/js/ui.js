/**
 * Stroomvol Adviseurstool — UI Event Handlers
 */
var SV = SV || {};

SV.ui = {
  // Set contract type
  setContract: function(type) {
    SV.state.contract = type;
    document.querySelectorAll('.sv-adv .cc').forEach(function(c) { c.classList.remove('on'); });
    var el = document.querySelector('.sv-adv .cc[data-contract="' + type + '"]');
    if (el) el.classList.add('on');

    document.getElementById('contract-fixed').style.display = (type === 'vast' || type === 'variabel') ? 'block' : 'none';
    document.getElementById('contract-var-extra').style.display = type === 'variabel' ? 'block' : 'none';
    document.getElementById('contract-dyn').style.display = type === 'dynamisch' ? 'block' : 'none';

    if (type === 'vast') {
      document.getElementById('info-vast').innerHTML = '<strong>Batterijstrategie bij vast tarief:</strong> Primair zelfconsumptie-optimalisatie. De batterij slaat overdag zonne-energie op en levert \'s avonds. Geen arbitrage mogelijk bij vaste prijs.';
    } else if (type === 'variabel') {
      document.getElementById('info-vast').innerHTML = '<strong>Batterijstrategie bij variabel tarief:</strong> Zelfconsumptie-optimalisatie. Extra voordeel: bij stijgende tarieven stijgt ook de waarde van opgeslagen stroom.';
    }

    if (type === 'dynamisch') {
      SV.charts.drawBathtub('bathtub-svg');
      SV.ui.updateDynPreview();
    }

    SV.ui.updateProg();
  },

  // Set toggle value
  setTog: function(key, val, btn) {
    SV.state[key] = val;
    btn.closest('.tg').querySelectorAll('.tb').forEach(function(b) { b.classList.remove('on'); });
    btn.classList.add('on');

    if (key === 'zon') {
      document.getElementById('zon-detail').style.display = (val === 'ja' || val === 'gepland') ? 'block' : 'none';
    }

    SV.ui.updateProg();
  },

  // Stepper +/-
  stepV: function(key, d) {
    SV.state[key] = Math.max(1, Math.min(60, SV.state[key] + d));
    document.getElementById('v-' + key).textContent = SV.state[key];
  },

  // Toggle checkbox
  togC: function(el) {
    el.classList.toggle('on');
    var val = el.getAttribute('data-val');
    var grp = el.closest('.chk-row').id === 'chk-gv' ? SV.state.gv : SV.state.doel;
    if (el.classList.contains('on')) {
      grp.add(val);
    } else {
      grp.delete(val);
    }
  },

  // Update progress bar
  updateProg: function() {
    var f = 0, t = 4;
    if (SV.state.contract) f++;
    if (SV.elVal('in-verbruik', 0) > 0) f++;
    if (SV.state.zon) f++;
    if (SV.state.omv || SV.state.net) f++;
    document.getElementById('prog').style.width = (f / t * 100) + '%';
  },

  // Update dynamic contract preview
  updateDynPreview: function() {
    var dal = SV.elVal('in-dyn-dal', 0.05);
    var piek = SV.elVal('in-dyn-piek', 0.35);
    var spreadEl = document.getElementById('dv-spread');
    var zelfEl = document.getElementById('dv-zelf');
    if (spreadEl) spreadEl.textContent = '€' + (piek - dal).toFixed(2) + '/kWh';
    if (zelfEl) zelfEl.textContent = 'Actief';
  },

  // Validate form before generating
  validate: function() {
    var valid = true;

    // Verbruik
    var verbruikEl = document.getElementById('in-verbruik');
    var errVerbruik = document.getElementById('err-verbruik');
    if (!verbruikEl.value || parseFloat(verbruikEl.value) <= 0) {
      verbruikEl.classList.add('error');
      if (errVerbruik) errVerbruik.style.display = 'block';
      verbruikEl.focus();
      valid = false;
    } else {
      verbruikEl.classList.remove('error');
      if (errVerbruik) errVerbruik.style.display = 'none';
    }

    // Contract
    if (!SV.state.contract) {
      var firstCC = document.querySelector('.sv-adv .cc');
      if (firstCC) firstCC.style.borderColor = '#e74c3c';
      valid = false;
    } else {
      document.querySelectorAll('.sv-adv .cc').forEach(function(c) { c.style.borderColor = ''; });
    }

    return valid;
  },

  // Generate advice
  generate: function() {
    if (!SV.ui.validate()) return;

    // Read klant/adviseur data into state
    SV.state.klantNaam = (document.getElementById('in-klant-naam') || {}).value || '';
    SV.state.klantAdres = (document.getElementById('in-klant-adres') || {}).value || '';
    SV.state.klantPlaats = (document.getElementById('in-klant-plaats') || {}).value || '';
    SV.state.datum = (document.getElementById('in-datum') || {}).value || '';
    SV.state.adviseur = (document.getElementById('in-adviseur') || {}).value || '';
    SV.state.bedrijf = (document.getElementById('in-bedrijf') || {}).value || 'Stroomvol';

    var result = SV.calc();
    SV.render(result);

    document.getElementById('phase-input').classList.remove('active');
    document.getElementById('phase-result').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    SV.wix.updateHeight();
  },

  // Recalculate
  recalc: function() {
    var result = SV.calc();
    SV.render(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Back to input
  backToInput: function() {
    document.getElementById('phase-result').classList.remove('active');
    document.getElementById('phase-input').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    SV.wix.updateHeight();
  },
};
