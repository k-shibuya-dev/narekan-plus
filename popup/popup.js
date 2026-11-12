chrome.storage.sync.get({ settings: {} }, ({ settings }) => {
  document.querySelectorAll("input[data-id]").forEach((cb) => {
    cb.checked = settings[cb.dataset.id] !== false;
    cb.addEventListener("change", () => {
      settings[cb.dataset.id] = cb.checked;
      chrome.storage.sync.set({ settings });
    });
  });
});
