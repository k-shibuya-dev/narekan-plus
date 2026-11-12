/** Narekan Plus - 機能マネージャ（機能ON/OFF・インスタンスガード） */
(function () {
  "use strict";
  window.NarekanPlus = window.NarekanPlus || {};
  const features = [];
  const ID = Date.now() + "-" + Math.random().toString(36).slice(2);
  document.documentElement.setAttribute("data-narekan-plus-instance", ID);
  window.NarekanPlus.isCurrentInstance = () =>
    document.documentElement.getAttribute("data-narekan-plus-instance") === ID;
  window.NarekanPlus.instanceId = ID;
  window.NarekanPlus.settings = {};
  // 値がfalseのものだけOFF（未設定はON）
  window.NarekanPlus.isFeatureEnabled = (id) => window.NarekanPlus.settings[id] !== false;
  window.NarekanPlus.registerFeature = (f) => features.push(f);
  window.NarekanPlus.startAll = function () {
    for (const f of features) {
      try { f.init(); } catch (e) { console.error(`[Narekan Plus] "${f.id}" failed`, e); }
    }
  };
  window.NarekanPlus.refreshAll = function () {
    for (const f of features) if (typeof f.refresh === "function") f.refresh();
  };
})();
