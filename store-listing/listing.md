# Chrome Web Store listing: Arabic RTL for Slack

Everything to paste into the Chrome Web Store developer dashboard. Optional before you submit:

- `SUPPORT_URL` at the top of `slack-rtl-extension/popup.js`, if you want the "Support this extension" link. The link stays hidden while it still says `YOUR-NAME`.

## Store listing tab

**Name** (comes from the extension itself): Arabic RTL for Slack. Arabic Chrome users see: العربية من اليمين لليسار في Slack

**Summary** (comes from the extension itself, max 132 characters):
- English: Shows Arabic messages and the message box right-to-left in Slack on the web. Names, avatars, timestamps and reactions stay put.
- Arabic: يعرض الرسائل العربية وخانة الكتابة من اليمين لليسار في Slack على المتصفح، دون تحريك الأسماء والصور والأوقات والتفاعلات.

**Category:** Productivity (Workflow & Planning also fits)

**Language:** English, plus Arabic. In the dashboard, add Arabic as a second language and paste the Arabic description there.

### Description (English)

```
Slack on the web lines everything up from the left, so Arabic messages start on the wrong side, punctuation lands in odd places, and typing Arabic in the message box feels backwards.

Arabic RTL for Slack fixes that automatically:

• Arabic messages align to the right and read in the correct direction.
• English messages stay exactly as they are.
• Mixed messages are handled line by line. A line that starts in Arabic, or is mostly Arabic, goes right-to-left; a mostly-English line stays left-to-right.
• The message box follows each line as you type, so you can write Arabic and English in the same message.
• Arabic lists put their bullets on the right, and Arabic quotes move their side bar to the right.
• Code blocks always stay left-to-right.
• @mentions, links and emoji keep their correct order inside Arabic sentences.
• Names, avatars, timestamps and reactions never move.
• Works as you scroll, switch channels and edit messages.
• Persian and Urdu work too.

One switch in the toolbar turns it on or off. The popup also shows what it found on your Slack tab, so you can see it's working.

Private by design: no data is collected or sent anywhere. Everything happens inside your browser, and the only thing saved is the on/off setting.

Works on Slack in the browser (app.slack.com). It doesn't change the Slack desktop app.

Not affiliated with, endorsed by or sponsored by Slack Technologies, LLC.
```

### Description (Arabic)

```
يعرض Slack على المتصفح كل الرسائل من اليسار، فتبدأ الرسائل العربية من الجهة الخاطئة، وتظهر علامات الترقيم في أماكن غريبة، وتصبح الكتابة بالعربية في خانة الرسائل مربكة.

إضافة "العربية من اليمين لليسار في Slack" تصلح ذلك تلقائيًا:

• الرسائل العربية تظهر من اليمين وبالاتجاه الصحيح.
• الرسائل الإنجليزية تبقى كما هي تمامًا.
• الرسائل المختلطة تُعالج سطرًا بسطر: السطر الذي يبدأ بالعربية أو أغلبه عربي يصبح من اليمين لليسار، والسطر الذي أغلبه إنجليزي يبقى من اليسار لليمين.
• خانة الكتابة تتبع كل سطر أثناء الكتابة، فتستطيع كتابة العربية والإنجليزية في نفس الرسالة.
• القوائم العربية تظهر نقاطها على اليمين، والاقتباسات العربية ينتقل شريطها الجانبي إلى اليمين.
• الأكواد البرمجية تبقى دائمًا من اليسار لليمين.
• الإشارات (@) والروابط والرموز التعبيرية تحافظ على ترتيبها الصحيح داخل الجمل العربية.
• الأسماء والصور وأوقات الرسائل والتفاعلات لا تتحرك أبدًا.
• تعمل أثناء التمرير وتبديل القنوات وتعديل الرسائل.
• تدعم الفارسية والأردية أيضًا.

زر واحد في شريط الأدوات للتشغيل والإيقاف، والنافذة تعرض ما وجدته الإضافة في صفحة Slack لتتأكد أنها تعمل.

خصوصيتك محفوظة: لا تُجمع أي بيانات ولا تُرسل إلى أي مكان. كل شيء يحدث داخل متصفحك، والشيء الوحيد المحفوظ هو إعداد التشغيل والإيقاف.

تعمل على Slack في المتصفح (app.slack.com)، ولا تغيّر تطبيق Slack لسطح المكتب.

هذه الإضافة غير تابعة لشركة Slack Technologies, LLC ولا معتمدة منها.
```

### Images

| Field | File |
| --- | --- |
| Store icon (128×128) | `slack-rtl-extension/icons/icon128.png` |
| Screenshots (1280×800, up to 5) | `screenshots/0-real-slack.png` (upload first: a real Slack screenshot), then `1-before-after.png`, `2-composer.png`, `3-popup.png`, `4-arabic.png` |
| Small promo tile (440×280) | `screenshots/promo-tile-440x280.png` |
| Marquee promo tile (1400×560, optional) | `screenshots/marquee-1400x560.png` |

The logo itself (option A, the chat bubble) is in `logo/` as SVG and 512px PNG, with options B and C next to it and a side-by-side preview in `logo/logo-options.png`. The 16px toolbar icon uses `logo-A_small` (no bubble) so the letter stays readable. The SVGs use the free Noto Kufi Arabic font; install it to edit them, or use the PNGs.

`0-real-slack.png` is your own Slack (tested 12 October 2026), and it shows your Slack name and photo. Screenshots 1 to 4 were made on a copy of Slack's layout.

## Privacy practices tab

**Single purpose:**
```
Shows Arabic text in Slack's web app (app.slack.com) right-to-left, in messages and in the message box, without changing any other part of the page.
```

**Permission justification: storage**
```
Saves one setting: whether the extension is switched on or off.
```

**Permission justification: host permission (https://app.slack.com/*)**
```
The extension has to read the text of messages and the message box on app.slack.com to tell which lines are Arabic, and change their alignment on the page. It runs on no other site.
```

**Remote code:** No, I am not using remote code.

**Data usage:** tick none of the data types. Then tick all three certifications (no selling or transfer of data, no use unrelated to the single purpose, no use for creditworthiness or lending).

**Privacy policy URL:** https://github.com/odayalshareef-jpg/arabic-rtl-for-slack/blob/main/PRIVACY.md

**Support / homepage URL:** https://github.com/odayalshareef-jpg/arabic-rtl-for-slack

## Distribution tab

- Free. Visibility: Public. Regions: all.

## Package to upload

Upload `store-listing/arabic-rtl-for-slack-1.1.0.zip`. It has `manifest.json` at the top, which is what the store expects. (The other zip, `slack-rtl-extension.zip`, is the folder version for loading unpacked.)
