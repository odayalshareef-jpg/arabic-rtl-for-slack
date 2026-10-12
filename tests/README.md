# Tests for Slack Arabic RTL Fixer

- `node unit.js`: 27 direction cases (Arabic, English, mixed, emoji, numbers, links, mentions, Persian, Urdu) run against the real `content.js`.
- `node run.js` (43 checks): loads the unpacked extension (`../extension`) in headless Chromium (Playwright), serves `mock.html` (a copy of Slack's message and composer markup) at app.slack.com, and checks alignment, quotes, mentions, code, untouched avatars/names/timestamps/reactions, late-loading messages, edits, the composer, the popup switch and status line, and speed.

Both need Node; `run.js` also needs Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`).
- `node store-assets.js`: re-renders the Chrome Web Store screenshots and promo tile into `../store-listing/screenshots/`.

Speed is checked as CPU time spent in the extension's own code (Chrome's profiler): about 25ms in total for 2000 messages, and about 2ms for 500 rapid edits in the message box.
