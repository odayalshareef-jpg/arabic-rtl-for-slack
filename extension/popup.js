// Your "support this" page (Buy Me a Coffee, GitHub Sponsors, Ko-fi...).
// The link stays hidden in the popup until this is changed from the placeholder.
const SUPPORT_URL = "https://www.buymeacoffee.com/YOUR-NAME";

(async () => {
  const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.documentElement.dir = chrome.i18n.getMessage("textDirection") || "ltr";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.title = t("extName");

  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;

  const support = document.getElementById("support");
  if (!SUPPORT_URL.includes("YOUR-NAME")) {
    support.href = SUPPORT_URL;
    support.hidden = false;
  }

  const toggle = document.getElementById("enabled");
  const statusText = document.getElementById("status-text");

  function render(on) {
    toggle.checked = on;
    statusText.textContent = t(on ? "statusOn" : "statusOff");
  }

  const { enabled } = await chrome.storage.sync.get({ enabled: true });
  render(enabled);

  toggle.addEventListener("change", async () => {
    render(toggle.checked);
    await chrome.storage.sync.set({ enabled: toggle.checked });
    setTimeout(showPageStatus, 150);
  });

  // "This tab" line: confirms the extension can see Slack's messages and message box.
  async function showPageStatus() {
    const box = document.getElementById("page-status");
    const el = document.getElementById("page-status-text");
    const setState = (state) => { box.className = "status " + state; };
    setState("idle");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith("https://app.slack.com/")) {
      el.textContent = t("openSlack");
      return;
    }
    let s;
    try {
      s = await chrome.tabs.sendMessage(tab.id, { type: "slack-rtl-status" });
    } catch {
      el.textContent = t("reloadTab");
      return;
    }
    if (!s.enabled) {
      el.textContent = t("offOnTab");
    } else if (s.blocks === 0 && !s.composer) {
      setState("warn");
      el.textContent = t("notFound");
    } else {
      el.textContent = t("found", [String(s.blocks), String(s.rtl)]) + " " + t(s.composer ? "composerFound" : "composerMissing");
      setState(!s.composer || s.blocks === 0 ? "warn" : "ok");
    }
  }
  showPageStatus();
})();
