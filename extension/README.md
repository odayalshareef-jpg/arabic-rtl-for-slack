# Arabic RTL for Slack

A Chrome extension (Manifest V3) for Slack Web (app.slack.com). It aligns Arabic messages and Arabic lines in the message box right-to-left. Names, avatars, timestamps and reactions stay where Slack puts them.

## Install (unpacked)

1. Download the `slack-rtl-extension` folder to your computer and keep it somewhere permanent (Chrome loads it from that spot every time).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the `slack-rtl-extension` folder (the one that contains `manifest.json`).
5. Open or reload https://app.slack.com. Arabic messages now align right.
6. Optional: click the puzzle-piece icon in the toolbar and pin **Arabic RTL for Slack** so the on/off switch is one click away.

After editing any file, click the reload arrow on the extension's card in `chrome://extensions`, then reload the Slack tab.

## How it decides direction

Each paragraph of a message (each line block, list, or quote) is checked on its own:

- It turns right-to-left if its first letter is Arabic, or if it has more Arabic letters than Latin ones. Emoji, numbers, punctuation and @mentions at the start don't count.
- So `مرحبا team` and `Hi يا جماعة كيف حالكم اليوم` go right-to-left, while `Meeting at 3pm in the big room مع أحمد` stays left-to-right.
- Links, @mentions, #channels and :emoji: codes are skipped when deciding, so `@Jonathan.Richardson شكرا` still goes right-to-left.
- Inside a right-to-left line, mentions and links keep their own reading order, so `@Ahmed` never shows up as `Ahmed@`.
- Quotes move their side bar to the right when the quote is Arabic.
- Code blocks and inline code always stay left-to-right.
- Persian and Urdu work too, since they use Arabic script.
- In the message box, each line follows its first letter as you type, so you can mix Arabic and English lines in one message.

## Files

| File | What it does |
| --- | --- |
| `manifest.json` | Extension setup; runs only on app.slack.com |
| `selectors.js` | **Every Slack selector, in one place.** Edit this when Slack changes its page structure |
| `content.js` | Arabic detection, MutationObserver for new/edited messages, on/off handling |
| `popup.html`, `popup.css`, `popup.js` | Toolbar popup with the on/off switch. Set `SUPPORT_URL` at the top of `popup.js` to show a "Support this extension" link |
| `_locales/en`, `_locales/ar` | English and Arabic text for the name, description and popup |
| `icons/` | Toolbar icons |

## Checking it on your Slack

Click the extension's toolbar icon while Slack is open. The line under the switch says how many message paragraphs it found on that tab, how many it set right-to-left, and whether it found the message box. If it says it can't find Slack's messages, Slack has changed its page and `selectors.js` needs updating.

Things worth trying in a test channel or your own DM:

1. An Arabic message, an English message, and `مرحبا team، الاجتماع الساعة 3` (should align right).
2. `Meeting at 3pm in the big room مع أحمد` (should stay left).
3. A message with one Arabic line and one English line (Shift+Enter between them).
4. An Arabic quote (start the line with `>`), an Arabic bullet list, and an Arabic line with a code block.
5. `@someone شكرا` with a real mention.
6. Typing Arabic in the main message box, a thread reply, and when editing a message.
7. Scrolling far back, switching channels, and turning the switch off and on.

## If something stops working after a Slack update

Open Slack, right-click a message's text, choose **Inspect**, and compare the class names with the ones in `selectors.js`. Message text currently lives in `.p-rich_text_section` inside `.c-message_kit__blocks`; the message box is `[data-qa='message_input'] .ql-editor`.
