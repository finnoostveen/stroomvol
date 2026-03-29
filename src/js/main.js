/**
 * Stroomvol Adviseurstool — Main Init
 */
var SV = SV || {};

SV.init = function() {
  // Set default date to today
  var datumEl = document.getElementById('in-datum');
  if (datumEl && !datumEl.value) {
    datumEl.value = new Date().toISOString().split('T')[0];
  }

  // Contract cards
  document.querySelectorAll('.sv-adv .cc[data-contract]').forEach(function(el) {
    el.addEventListener('click', function() {
      SV.ui.setContract(el.getAttribute('data-contract'));
    });
  });

  // Toggle buttons (all groups)
  ['tg-profiel', 'tg-zon', 'tg-omv', 'tg-net', 'tg-loc', 'tg-eig', 'tg-afst', 'tg-muur'].forEach(function(id) {
    var grp = document.getElementById(id);
    if (!grp) return;
    var key = id.replace('tg-', '');
    grp.querySelectorAll('.tb').forEach(function(btn) {
      btn.addEventListener('click', function() {
        SV.ui.setTog(key, btn.getAttribute('data-val'), btn);
      });
    });
  });

  // Steppers
  document.querySelectorAll('.sv-adv .stepper-btn[data-step]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      SV.ui.stepV(btn.getAttribute('data-step'), parseInt(btn.getAttribute('data-dir'), 10));
    });
  });

  // Checkboxes
  document.querySelectorAll('.sv-adv .chk-item[data-val]').forEach(function(el) {
    el.addEventListener('click', function() {
      SV.ui.togC(el);
    });
  });

  // Dynamic pricing inputs → live preview
  ['in-dyn-dal', 'in-dyn-piek', 'in-dyn-gem'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function() {
        SV.ui.updateDynPreview();
        SV.charts.drawBathtub('bathtub-svg');
      });
    }
  });

  // Verbruik input → progress update
  var verbruikEl = document.getElementById('in-verbruik');
  if (verbruikEl) {
    verbruikEl.addEventListener('input', function() {
      SV.ui.updateProg();
      // Clear error on input
      verbruikEl.classList.remove('error');
      var errEl = document.getElementById('err-verbruik');
      if (errEl) errEl.style.display = 'none';
    });
  }

  // Action buttons
  var btnGenerate = document.getElementById('btn-generate');
  if (btnGenerate) btnGenerate.addEventListener('click', SV.ui.generate);

  var btnRecalc = document.getElementById('btn-recalc');
  if (btnRecalc) btnRecalc.addEventListener('click', SV.ui.recalc);

  var btnBack = document.getElementById('btn-back');
  if (btnBack) btnBack.addEventListener('click', SV.ui.backToInput);

  var btnPrint = document.getElementById('btn-print');
  if (btnPrint) btnPrint.addEventListener('click', function() {
    var notitiesEl = document.getElementById('in-notities');
    if (notitiesEl) SV.state.notities = notitiesEl.value;
    SV.pdf.generate();
  });

  var btnPdf = document.getElementById('btn-pdf');
  if (btnPdf) btnPdf.addEventListener('click', function() {
    // Read notities into state before generating
    var notitiesEl = document.getElementById('in-notities');
    if (notitiesEl) SV.state.notities = notitiesEl.value;
    SV.pdf.generate();
  });

  // Init tooltips
  SV.ui.initTooltips();

  // Init Wix integration
  SV.wix.init();
};

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', SV.init);
} else {
  SV.init();
}
