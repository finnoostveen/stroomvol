/**
 * Stroomvol Adviseurstool — Wix / iframe Integration
 * Auto-detects if running in an iframe and provides height sync.
 */
var SV = SV || {};

SV.wix = {
  inIframe: false,

  init: function() {
    try {
      SV.wix.inIframe = window.self !== window.top;
    } catch (e) {
      SV.wix.inIframe = true;
    }

    if (SV.wix.inIframe) {
      // Auto-height via ResizeObserver
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(function() {
          SV.wix.updateHeight();
        }).observe(document.body);
      }

      // Also update on window resize
      window.addEventListener('resize', SV.wix.updateHeight);
    }
  },

  updateHeight: function() {
    if (!SV.wix.inIframe) return;
    try {
      var height = document.body.scrollHeight;
      window.parent.postMessage({ type: 'setHeight', height: height }, '*');
    } catch (e) {
      // Silently fail if cross-origin restrictions apply
    }
  },

  scrollToTop: function() {
    if (SV.wix.inIframe) {
      try {
        window.parent.postMessage({ type: 'scrollToTop' }, '*');
      } catch (e) {}
    }
  },
};
