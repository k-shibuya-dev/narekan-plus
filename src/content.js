/** Narekan Plus - エントリポイント */
(function () {
  "use strict";
  function start() {
    window.NarekanPlus.startAll();
  }
  try {
    chrome.storage.sync.get({ settings: {} }, (res) => {
      window.NarekanPlus.settings = (res && res.settings) || {};
      start();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.settings) {
        window.NarekanPlus.settings = changes.settings.newValue || {};
        window.NarekanPlus.refreshAll();
      }
    });
  } catch (e) {
    start();
  }
})();
