// Renders the Chrome Web Store screenshots (1280x800) and promo tile (440x280) from the mock page.
const path = require('path'), fs = require('fs'), os = require('os'), crypto = require('crypto');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
const EXT = fs.realpathSync(path.join(__dirname, '../extension'));
const OUT = path.join(__dirname, '../store-listing/screenshots');
const MOCK = fs.readFileSync(path.join(__dirname, 'mock.html'), 'utf8').replace('</style>', `
.c-message_kit__avatar{border:0;padding:0;background:none}
.c-message_kit__avatar img{background:#2bac76;border-radius:8px}
.c-virtual_list__item:nth-child(3n+2) .c-message_kit__avatar img{background:#e8912d}
.c-virtual_list__item:nth-child(3n) .c-message_kit__avatar img{background:#1264a3}
.c-message__sender_button{margin-right:6px}
</style>`);
const extId = crypto.createHash('sha256').update(EXT).digest('hex').slice(0, 32).split('').map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
const KEYS = ['arabic', 'english', 'mixedArFirst', 'mentionFirst', 'arabicList', 'quote'];

async function shoot(withExt, lang) {
  const args = withExt ? [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] : [];
  if (lang) args.push(`--lang=${lang}`);
  const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'store-')), { headless: true, channel: 'chromium', args, viewport: { width: 600, height: 700 }, deviceScaleFactor: 2, locale: lang || 'en-US' });
  await ctx.route('https://app.slack.com/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: MOCK }));
  return ctx;
}
async function slack(ctx, keys, file, composer) {
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.setViewportSize({ width: 600, height: 700 });
  await page.goto('https://app.slack.com/client'); await page.waitForTimeout(500);
  await page.evaluate(k => { document.querySelector('.p-workspace').style.width = '600px'; render(k); }, keys);
  await page.setViewportSize({ width: 600, height: composer ? 330 : 700 });
  if (composer) { const ed = page.locator('.ql-editor'); await ed.click(); await page.keyboard.insertText(composer); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: file });
}
async function popupShot(ctx, file) {
  const slackPage = ctx.pages()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 320, height: 400 });
  await p.addInitScript(() => { const q = chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query = () => q({ url: 'https://app.slack.com/*' }); });
  await p.goto(`chrome-extension://${extId}/popup.html`); await p.waitForTimeout(400);
  await p.setViewportSize({ width: 320, height: await p.evaluate(() => document.body.scrollHeight) });
  await p.screenshot({ path: file });
}
const img = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const T = os.tmpdir();

(async () => {
  let c = await shoot(false); await slack(c, KEYS, `${T}/before.png`); await c.close();
  c = await shoot(true); await slack(c, KEYS, `${T}/after.png`); await slack(c, ['english', 'arabic'], `${T}/composer.png`, 'السلام عليكم، الاجتماع بعد ساعة في Zoom'); await popupShot(c, `${T}/popup-en.png`); await c.close();
  c = await shoot(true, 'ar'); await slack(c, KEYS, `${T}/after-ar.png`); await popupShot(c, `${T}/popup-ar.png`); await c.close();

  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const frame = (title, sub, body, dir = 'ltr') => `<!doctype html><html dir="${dir}"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1280px;height:800px;background:linear-gradient(135deg,#0f9c75,#06493b);font-family:"Segoe UI",Roboto,"Noto Sans Arabic",sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center;padding:40px}
    h1{margin:0;font-size:40px}p.sub{margin:8px 0 28px;font-size:20px;opacity:.85}
    .row{display:flex;gap:40px;align-items:flex-start}.card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.4)}
    .card img{display:block;width:520px}.label{font-size:18px;font-weight:700;margin-bottom:10px;text-align:center}
    .bad{color:#ffd0c2}.good{color:#c9ffe9}</style><body><h1>${title}</h1><p class="sub">${sub}</p>${body}</body></html>`;
  const shots = [
    ['1-before-after.png', frame('Arabic in Slack, the right way round', 'Arabic messages align right. Names, avatars, timestamps and reactions stay put.',
      `<div class="row"><div><div class="label bad">Without the extension</div><div class="card"><img src="${img(`${T}/before.png`)}"></div></div>
       <div><div class="label good">With the extension</div><div class="card"><img src="${img(`${T}/after.png`)}"></div></div></div>`)],
    ['2-composer.png', frame('Type Arabic naturally', 'Each line of the message box follows its own language as you type.',
      `<div class="card"><img style="width:900px" src="${img(`${T}/composer.png`)}"></div>`)],
    ['3-popup.png', frame('One switch, in English or Arabic', 'Turn it off any time. The popup shows what it found on your Slack tab.',
      `<div class="row" style="margin-top:40px"><div class="card"><img style="width:400px" src="${img(`${T}/popup-en.png`)}"></div><div class="card"><img style="width:400px" src="${img(`${T}/popup-ar.png`)}"></div></div>`)],
    ['4-arabic.png', frame('العربية في Slack كما يجب', 'الرسائل العربية من اليمين لليسار، والأسماء والأوقات والتفاعلات في مكانها.',
      `<div class="card"><img style="width:560px" src="${img(`${T}/after-ar.png`)}"></div>`, 'rtl')],
  ];
  for (const [name, html] of shots) { await page.setContent(html); await page.waitForTimeout(200); await page.screenshot({ path: path.join(OUT, name) }); }

  // Small promo tile (440x280) and marquee (1400x560).
  const logo = img(path.join(__dirname, '../store-listing/logo/logo-A-512.png'));
  const tile = (w, h, iconPx, titlePx, subPx, extra = '') => `<!doctype html><meta charset="utf-8"><body style="margin:0;width:${w}px;height:${h}px;background:linear-gradient(135deg,#16c08f,#06493b);color:#fff;font-family:Inter,'Noto Sans Arabic',sans-serif;display:flex;align-items:center;justify-content:center;gap:${iconPx / 3}px">
    <img src="${logo}" width="${iconPx}" height="${iconPx}" style="filter:drop-shadow(0 8px 20px rgba(0,0,0,.25))">
    <div><div style="font-size:${titlePx}px;font-weight:800;line-height:1.1">Arabic RTL<br>for Slack</div>
    <div style="font-size:${subPx}px;margin-top:${subPx / 2}px;opacity:.92" dir="rtl">العربية من اليمين لليسار</div>${extra}</div></body>`;
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(tile(440, 280, 120, 34, 20)); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, 'promo-tile-440x280.png') });
  await page.setViewportSize({ width: 1400, height: 560 });
  await page.setContent(tile(1400, 560, 280, 76, 40, '<div style="font-size:24px;margin-top:22px;opacity:.85">Arabic messages and the message box, right-to-left.</div>')); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, 'marquee-1400x560.png') });
  await b.close();
  console.log(fs.readdirSync(OUT).join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
