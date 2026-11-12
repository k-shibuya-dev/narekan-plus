/**
 * Narekan Plus - 機能: お気に入りFAQ
 *  - FAQ詳細ページ（/team/{id}/faq/{数字}）のタイトル横に ★ を追加
 *  - FAQトップ（/team/{id}/faq）の検索欄の下に「すべて / ★お気に入り」の絞り込みタブを追加
 *  - 「お気に入り」タブでは、登録したFAQの一覧に表示を切り替える
 * 保存先は localStorage（チーム別・期限なし）。ナレカンのCSSクラスはビルド毎に変わる
 * （emotion）ため、セレクタはタグ・URL・構造だけに頼る。
 */
(function () {
  "use strict";

  // ---- チューニングポイント ---------------------------------------------------
  const SELECTORS = {
    title: "main h1",
    breadcrumb: 'nav[aria-label="breadcrumb"]',
    searchInput: "main form input",
  };
  // ----------------------------------------------------------------------------

  const SETTING_ID = "favorite-faqs";
  const STORAGE_KEY = "narekanPlus.favoriteFaqs";
  const STAR_AREA = "narekan-plus-star";
  const TABS = "narekan-plus-tabs";
  const PANEL = "narekan-plus-panel";
  const HIDDEN_ATTR = "data-narekan-plus-hidden";
  const STAR_SVG =
    '<svg viewBox="0 0 576 512" width="20" height="20" fill="currentColor" aria-hidden="true">' +
    '<path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"/></svg>';

  let favMode = false;

  function loadAll() {
    try {
      const l = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(l) ? l : [];
    } catch (e) { return []; }
  }
  function saveAll(l) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)); } catch (e) {}
  }

  function route() {
    const m = location.pathname.match(/^\/team\/([^/]+)\/faq(?:\/(\d+))?\/?$/);
    return { isFaq: !!m, team: m ? m[1] : "", faqId: m && m[2] ? m[2] : "" };
  }
  const faqPath = (team, id) => `/team/${team}/faq/${id}`;

  function teamFavs(team) {
    return loadAll().filter((f) => f.team === team).sort((a, b) => b.savedAt - a.savedAt);
  }
  const isFav = (team, id) => loadAll().some((f) => f.team === team && f.faqId === id);

  /** 詳細ページのタイトルとカテゴリ（パンくずの末尾の1つ前） */
  function currentInfo() {
    const h1 = document.querySelector(SELECTORS.title);
    let title = "";
    if (h1) {
      const c = h1.cloneNode(true);
      c.querySelectorAll("." + STAR_AREA).forEach((e) => e.remove());
      title = c.textContent.replace(/\s+/g, " ").trim();
    }
    const bc = document.querySelector(SELECTORS.breadcrumb);
    let category = "";
    if (bc) {
      const items = [...bc.querySelectorAll("a, li, span")]
        .map((e) => e.textContent.trim())
        .filter(Boolean);
      const uniq = items.filter((t, i) => items.indexOf(t) === i);
      if (uniq.length >= 2) category = uniq[uniq.length - 2];
    }
    return { title, category };
  }

  function toggleFav() {
    const { team, faqId } = route();
    if (!team || !faqId) return;
    const list = loadAll();
    const i = list.findIndex((f) => f.team === team && f.faqId === faqId);
    if (i >= 0) list.splice(i, 1);
    else list.push({ team, faqId, ...currentInfo(), savedAt: Date.now() });
    saveAll(list);
    refresh();
  }

  // ---- 詳細ページの★ -----------------------------------------------------------
  function ensureStar() {
    const { team, faqId } = route();
    let area = document.querySelector("." + STAR_AREA + ":not(.small)");
    const h1 = document.querySelector(SELECTORS.title);
    if (!faqId || !h1) { if (area) area.remove(); return; }
    if (area && (area.dataset.inst !== window.NarekanPlus.instanceId || area.parentElement !== h1)) {
      area.remove(); area = null;
    }
    if (!area) {
      area = document.createElement("button");
      area.type = "button";
      area.className = STAR_AREA;
      area.dataset.inst = window.NarekanPlus.instanceId;
      area.innerHTML = STAR_SVG;
      area.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleFav(); });
      h1.appendChild(area);
    }
    const on = isFav(team, faqId);
    area.classList.toggle("active", on);
    const label = on ? "お気に入りから外す（Narekan Plus）" : "お気に入りに追加（Narekan Plus）";
    if (area.title !== label) area.title = label;
  }

  // ---- トップの絞り込みタブ ----------------------------------------------------
  function topContainer() {
    const input = document.querySelector(SELECTORS.searchInput);
    const form = input && input.closest("form");
    return form ? { form, container: form.parentElement } : null;
  }

  function ensureTabs() {
    const { team, faqId, isFaq } = route();
    const top = isFaq && !faqId ? topContainer() : null;
    let tabs = document.querySelector("." + TABS);
    let panel = document.querySelector("." + PANEL);
    if (!top) {
      if (tabs) tabs.remove();
      if (panel) panel.remove();
      favMode = false;
      return;
    }
    const { form } = top;

    if (tabs && (tabs.dataset.inst !== window.NarekanPlus.instanceId || tabs.previousElementSibling !== form)) {
      tabs.remove(); tabs = null;
    }
    const favs = teamFavs(team);
    if (!tabs) {
      tabs = document.createElement("div");
      tabs.className = TABS;
      tabs.dataset.inst = window.NarekanPlus.instanceId;
      tabs.innerHTML =
        '<button type="button" data-tab="all">すべて</button>' +
        '<button type="button" data-tab="fav">★ お気に入り<span class="cnt"></span></button>';
      tabs.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-tab]");
        if (!b) return;
        favMode = b.dataset.tab === "fav";
        refresh();
      });
      form.insertAdjacentElement("afterend", tabs);
    }
    tabs.querySelector(".cnt").textContent = favs.length ? `(${favs.length})` : "";
    tabs.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", (b.dataset.tab === "fav") === favMode)
    );

    // 元のコンテンツ（タブより後ろの兄弟）の表示切替
    for (let el = tabs.nextElementSibling; el; el = el.nextElementSibling) {
      if (el === panel) continue;
      if (favMode) {
        if (el.getAttribute(HIDDEN_ATTR) === null) {
          el.setAttribute(HIDDEN_ATTR, "1");
          el.style.display = "none";
        }
      } else if (el.getAttribute(HIDDEN_ATTR) !== null) {
        el.style.display = "";
        el.removeAttribute(HIDDEN_ATTR);
      }
    }

    if (!favMode) { if (panel) panel.remove(); return; }
    const sig = JSON.stringify([window.NarekanPlus.instanceId, favs]);
    if (panel && panel.previousElementSibling === tabs && panel.dataset.sig === sig) return;
    if (panel) panel.remove();
    panel = document.createElement("div");
    panel.className = PANEL;
    panel.dataset.sig = sig;
    if (!favs.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "お気に入りのFAQはまだありません。FAQ詳細ページのタイトル横の ★ から登録できます。";
      panel.appendChild(p);
    } else {
      const ul = document.createElement("ul");
      for (const f of favs) ul.appendChild(buildItem(f));
      panel.appendChild(ul);
    }
    tabs.insertAdjacentElement("afterend", panel);
  }

  function buildItem(f) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = faqPath(f.team, f.faqId);
    const t = document.createElement("span");
    t.className = "t";
    t.textContent = f.title || "(タイトル不明)";
    a.appendChild(t);
    if (f.category) {
      const c = document.createElement("span");
      c.className = "c";
      c.textContent = f.category;
      a.appendChild(c);
    }
    li.appendChild(a);
    const un = document.createElement("button");
    un.type = "button";
    un.className = "narekan-plus-star active small";
    un.title = "お気に入りから外す（Narekan Plus）";
    un.innerHTML = STAR_SVG;
    un.addEventListener("click", (e) => {
      e.preventDefault();
      saveAll(loadAll().filter((x) => !(x.team === f.team && x.faqId === f.faqId)));
      refresh();
    });
    li.appendChild(un);
    return li;
  }

  // ---- 全体 ------------------------------------------------------------------
  function removeAll() {
    favMode = false;
    document.querySelectorAll(`.${STAR_AREA}, .${TABS}, .${PANEL}`).forEach((e) => e.remove());
    document.querySelectorAll(`[${HIDDEN_ATTR}]`).forEach((e) => {
      e.style.display = "";
      e.removeAttribute(HIDDEN_ATTR);
    });
  }

  let timer = null;
  function refresh() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (!window.NarekanPlus.isCurrentInstance()) return;
      if (!window.NarekanPlus.isFeatureEnabled(SETTING_ID)) { removeAll(); return; }
      ensureStar();
      ensureTabs();
    }, 200);
  }

  window.NarekanPlus.registerFeature({
    id: SETTING_ID,
    name: "お気に入りFAQ",
    init() {
      new MutationObserver(refresh).observe(document.body, { childList: true, subtree: true });
      window.addEventListener("popstate", refresh);
      refresh();
    },
    refresh,
  });
})();
