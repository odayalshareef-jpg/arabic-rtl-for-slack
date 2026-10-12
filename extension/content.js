// Slack Arabic RTL for Slack: content script for app.slack.com.
// Marks Arabic message text right-to-left and leaves everything else in the message row alone.
(() => {
  "use strict";

  const SEL = self.SLACK_RTL_SELECTORS;
  const MARK = "data-slack-rtl";            // set on every element whose dir we changed
  const QUOTE_MARK = "data-slack-rtl-quote"; // "border" or "before": how a quote's bar was mirrored
  const QUOTE_VARS = ["--srtl-bar", "--srtl-pl", "--srtl-pr", "--srtl-before-left"];
  const ROOT_CLASS = "slack-rtl-on";        // on <html> while the extension is enabled
  const STYLE_ID = "slack-rtl-style";

  // Arabic script blocks (Arabic, Persian, Urdu...): Arabic, Supplement, Extended-A/B, Presentation Forms A/B.
  const AR = "؀-ۿݐ-ݿࡰ-ࣿﭐ-﷿ﹰ-﻿";
  const LA = "A-Za-zÀ-ɏ";
  const ARABIC = new RegExp(`[${AR}]`);
  const ARABIC_G = new RegExp(`[${AR}]`, "g");
  const LATIN_G = new RegExp(`[${LA}]`, "g");
  // First letter that has a strong direction, skipping digits, emoji, punctuation.
  const FIRST_STRONG = new RegExp(`[${LA}${AR}]`);
  // Text that never decides direction: links, :emoji_codes:, and file/channel-like tokens.
  const NOISE = /\b(?:https?:\/\/|www\.)\S+|:[a-z0-9_+'-]+:/gi;

  const messageSelector = SEL.messageBlocks.join(",");
  const ltrSelector = SEL.alwaysLtr.join(",");
  const ignoreSelector = SEL.ignoreForDetection.concat(SEL.alwaysLtr).join(",");
  const quoteSelector = SEL.quotes.join(",");
  const composerSelector = SEL.composerEditor.join(",");

  let enabled = false;
  let observer = null;
  const pending = new Set();
  let scheduled = false;

  function textForDetection(el) {
    let text;
    if (el.querySelector(ignoreSelector)) {
      const clone = el.cloneNode(true);
      clone.querySelectorAll(ignoreSelector).forEach((n) => n.remove());
      text = clone.textContent || "";
    } else {
      text = el.textContent || "";
    }
    return text.replace(NOISE, " ");
  }

  // "rtl" when the text starts with an Arabic letter, or has more Arabic letters than Latin ones.
  // So "مرحبا team" and "Hi يا جماعة كيف حالكم" are RTL, "Meeting at 3 مع أحمد" stays LTR.
  function detectDirection(text) {
    text = text.replace(NOISE, " ");
    if (!ARABIC.test(text)) return null;
    const first = text.match(FIRST_STRONG);
    if (first && ARABIC.test(first[0])) return "rtl";
    const arabic = (text.match(ARABIC_G) || []).length;
    const latin = (text.match(LATIN_G) || []).length;
    return arabic > latin ? "rtl" : "ltr";
  }

  // Quotes draw their side bar with a physical left border or a ::before at the left edge.
  // measureQuote only reads; applyQuoteMirror writes the result.
  function measureQuote(el) {
    if (!el.matches(quoteSelector) || el.hasAttribute(QUOTE_MARK)) return null;
    const cs = getComputedStyle(el);
    const m = { pl: cs.paddingLeft, pr: cs.paddingRight };
    if (parseFloat(cs.borderLeftWidth) > 0 && parseFloat(cs.borderRightWidth) === 0) {
      return { ...m, kind: "border", bar: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}` };
    }
    const before = getComputedStyle(el, "::before");
    if (before.content !== "none" && before.position === "absolute" && before.left !== "auto" &&
        parseFloat(before.left) < parseFloat(before.right)) {
      return { ...m, kind: "before", beforeLeft: before.left };
    }
    return null;
  }

  function applyQuoteMirror(el, m) {
    if (m.kind === "border") el.style.setProperty("--srtl-bar", m.bar);
    else el.style.setProperty("--srtl-before-left", m.beforeLeft);
    el.style.setProperty("--srtl-pl", m.pl);
    el.style.setProperty("--srtl-pr", m.pr);
    el.setAttribute(QUOTE_MARK, m.kind);
  }

  function unmark(el) {
    if (el.getAttribute(MARK) === "rtl") el.removeAttribute("dir");
    el.removeAttribute(MARK);
    if (el.hasAttribute(QUOTE_MARK)) {
      el.removeAttribute(QUOTE_MARK);
      QUOTE_VARS.forEach((v) => el.style.removeProperty(v));
      if (!el.getAttribute("style")) el.removeAttribute("style");
    }
  }

  // Read-only: what should this block become? "rtl", "clear" (undo our change) or null (leave it).
  function decide(el) {
    if (!el.isConnected || el.matches(ltrSelector)) return null;
    // Wrapper around other message blocks: leave it to the inner ones,
    // otherwise an RTL wrapper would flip its English lines too.
    if (el.querySelector(messageSelector)) return el.hasAttribute(MARK) ? "clear" : null;
    if (detectDirection(textForDetection(el)) === "rtl") return "rtl";
    // Text was edited and is no longer Arabic: undo only what we set.
    return el.hasAttribute(MARK) ? "clear" : null;
  }

  function markRtl(el, quote) {
    if (quote) applyQuoteMirror(el, quote);
    if (el.getAttribute("dir") !== "rtl") el.setAttribute("dir", "rtl");
    el.setAttribute(MARK, "rtl");
  }

  function collect(node) {
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    // The node itself or an ancestor may be a message block (e.g. text edited in place)...
    const owner = node.closest(messageSelector);
    if (owner) pending.add(owner);
    // ...and it may contain blocks (a whole message row or channel view was added).
    node.querySelectorAll(messageSelector).forEach((el) => pending.add(el));
  }

  function flush() {
    scheduled = false;
    if (!enabled) { pending.clear(); return; }
    // All reads first, then all writes, so the browser never recomputes styles mid-batch.
    const plan = [];
    pending.forEach((el) => {
      const action = decide(el);
      if (action) plan.push([el, action, action === "rtl" ? measureQuote(el) : null]);
    });
    pending.clear();
    // Quote bars are moved in the same frame as the text, so there is no flicker.
    for (const [el, action, quote] of plan) action === "rtl" ? markRtl(el, quote) : unmark(el);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  function onMutations(mutations) {
    for (const m of mutations) {
      // Typing in the message box is handled by CSS alone; skip it so typing stays free.
      const t = m.target.nodeType === Node.ELEMENT_NODE ? m.target : m.target.parentElement;
      if (t && t.closest(composerSelector)) continue;
      if (m.type === "characterData") collect(m.target);
      else m.addedNodes.forEach(collect);
    }
    if (pending.size) schedule();
  }

  function buildCss() {
    const on = `html.${ROOT_CLASS}`;
    const composer = SEL.composerLines.map((s) => `${on} ${s}`).join(",\n");
    const ltr = SEL.alwaysLtr.map((s) => `${on} [${MARK}] ${s}`).join(",\n");
    return `
${composer} {
  unicode-bidi: plaintext;
  text-align: start;
}
${on} [${MARK}="rtl"] {
  text-align: right;
}
${on} [${MARK}="rtl"] :is(${SEL.isolateInRtl.join(", ")}) {
  unicode-bidi: plaintext;
}
${on} [${QUOTE_MARK}] {
  padding-left: var(--srtl-pr) !important;
  padding-right: var(--srtl-pl) !important;
}
${on} [${QUOTE_MARK}="border"] {
  border-left: 0 !important;
  border-right: var(--srtl-bar) !important;
}
${on} [${QUOTE_MARK}="before"]::before {
  left: auto !important;
  right: var(--srtl-before-left) !important;
}
${ltr} {
  direction: ltr;
  text-align: left;
  unicode-bidi: isolate;
}`;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildCss();
    (document.head || document.documentElement).appendChild(style);
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    injectStyle();
    document.documentElement.classList.add(ROOT_CLASS);
    document.querySelectorAll(messageSelector).forEach((el) => pending.add(el));
    schedule();
    observer = new MutationObserver(onMutations);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    if (observer) observer.disconnect();
    observer = null;
    pending.clear();
    document.documentElement.classList.remove(ROOT_CLASS);
    document.querySelectorAll(`[${MARK}]`).forEach(unmark);
  }

  function setEnabled(on) { on ? enable() : disable(); }

  // What the popup's "this page" line shows, so a Slack markup change is visible at a glance.
  function status() {
    return {
      enabled,
      blocks: document.querySelectorAll(messageSelector).length,
      rtl: document.querySelectorAll(`[${MARK}="rtl"]`).length,
      composer: !!document.querySelector(composerSelector)
    };
  }

  chrome.storage.sync.get({ enabled: true }, (s) => setEnabled(s.enabled));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.enabled) setEnabled(changes.enabled.newValue);
  });
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg && msg.type === "slack-rtl-status") reply(status());
  });

  // Exposed for tests only.
  self.__slackRtl = { detectDirection };
})();
