const path = require('path'), fs = require('fs'), crypto = require('crypto');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
const EXT = fs.realpathSync(path.join(__dirname, '../extension'));
const MOCK = fs.readFileSync(path.join(__dirname, 'mock.html'), 'utf8');
const extId = crypto.createHash('sha256').update(EXT).digest('hex').slice(0, 32).split('').map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
const results = []; const ok = (name, cond, info = '') => { results.push([cond ? 'PASS' : 'FAIL', name, info]); };

async function launch(withExt) {
  const dir = fs.mkdtempSync(require('os').tmpdir() + '/slack-rtl-prof-');
  const args = withExt ? [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] : [];
  const ctx = await chromium.launchPersistentContext(dir, { headless: true, channel: 'chromium', args, viewport: { width: 800, height: 1400 } });
  await ctx.route('https://app.slack.com/**', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: MOCK }));
  const page = ctx.pages()[0] || await ctx.newPage();
  await page.goto('https://app.slack.com/client/T1/C1');
  await page.waitForTimeout(800);
  return { ctx, page };
}
// Geometry of the parts that must not move.
const chrome = page => page.evaluate(() => [...document.querySelectorAll('.c-virtual_list__item')].map(it => {
  const r = s => { const b = it.querySelector(s).getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width)]; };
  return { id: it.dataset.id, avatar: r('.c-message_kit__avatar'), name: r('.c-message__sender_button'), time: r('.c-timestamp'), react: r('.c-reaction') };
}));
// Where the text of a block actually sits: left and right edge of its rendered glyphs vs. the block box.
const textPos = (page, id, sel = '.p-rich_text_section') => page.evaluate(([id, sel]) => {
  const el = document.querySelector(`[data-id="${id}"] ${sel}`);
  const box = el.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(el); const t = rg.getBoundingClientRect();
  return { dir: el.getAttribute('dir'), css: getComputedStyle(el).direction, leftGap: Math.round(t.left - box.left), rightGap: Math.round(box.right - t.right) };
}, [id, sel]);
const isRight = p => p.rightGap <= 2 && p.leftGap > 20;
const isLeft = p => p.leftGap <= 2 && p.rightGap > 20;

(async () => {
  console.log('extension id', extId);
  const base = await launch(false);
  const baseChrome = await chrome(base.page);
  await base.page.screenshot({ path: path.join(__dirname, 'before.png') });
  const { ctx, page } = await launch(true);
  ok('extension content script ran', await page.evaluate(() => document.documentElement.classList.contains('slack-rtl-on')));

  for (const id of ['arabic', 'mixedArFirst', 'mixedEnFirstMostlyAr', 'emojiFirst', 'mentionFirst', 'urlFirst', 'longMention', 'emojiCode', 'persian']) {
    const p = await textPos(page, id); ok(`${id}: right aligned`, p.dir === 'rtl' && isRight(p), JSON.stringify(p));
  }
  for (const id of ['english', 'mixedEnMostly']) {
    const p = await textPos(page, id); ok(`${id}: stays left`, p.dir === null && isLeft(p), JSON.stringify(p));
  }
  const code = await textPos(page, 'arabicWithCode', '.p-rich_text_preformatted');
  ok('code block in Arabic message stays LTR', code.css === 'ltr', JSON.stringify(code));
  ok('Arabic text above code is RTL', (await textPos(page, 'arabicWithCode')).dir === 'rtl');
  const list = await page.evaluate(() => { const ul = document.querySelector('[data-id="arabicList"] ul'); const li = ul.querySelector('li').getBoundingClientRect(); const b = ul.getBoundingClientRect(); return { dir: ul.getAttribute('dir'), rightPad: Math.round(b.right - li.right), leftPad: Math.round(li.left - b.left) }; });
  ok('Arabic list RTL (bullets on the right)', list.dir === 'rtl' && list.rightPad > list.leftPad, JSON.stringify(list));
  const l1 = await page.evaluate(() => [...document.querySelectorAll('[data-id="twoLines"] .p-rich_text_section')].map(e => e.getAttribute('dir')));
  ok('two-line message: Arabic line RTL, English line LTR', l1[0] === 'rtl' && l1[1] === null, JSON.stringify(l1));
  ok('quote RTL', (await textPos(page, 'quote', '.p-rich_text_quote')).dir === 'rtl');
  const bar = (id) => page.evaluate((id) => {
    const q = document.querySelector(`[data-id="${id}"] .p-rich_text_quote`); const cs = getComputedStyle(q); const b = getComputedStyle(q, '::before');
    const qb = q.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(q); const t = rg.getBoundingClientRect();
    return { bl: cs.borderLeftWidth, br: cs.borderRightWidth, brc: cs.borderRightColor, beforeLeft: b.left, beforeRight: b.right, pl: cs.paddingLeft, pr: cs.paddingRight, textToRight: Math.round(qb.right - t.right) };
  }, id);
  const qb1 = await bar('quote');
  ok('Arabic quote (border bar): bar moved to the right, text beside it', qb1.bl === '0px' && qb1.br === '4px' && qb1.pr === '12px' && qb1.textToRight >= 12, JSON.stringify(qb1));
  const qb2 = await bar('quoteBefore');
  ok('Arabic quote (::before bar): bar moved to the right', qb2.beforeRight === '0px' && qb2.pr === '16px', JSON.stringify(qb2));
  const qb3 = await bar('quoteEnglish');
  ok('English quote: bar stays on the left', qb3.bl === '4px' && qb3.br === '0px', JSON.stringify(qb3));
  const order = (id, a, b) => page.evaluate(([id, a, b]) => {
    const n = document.querySelector(`[data-id="${id}"] .c-member_slug`).firstChild; const r = document.createRange();
    const x = i => { r.setStart(n, i); r.setEnd(n, i + 1); return r.getBoundingClientRect().left; };
    return x(a) < x(b);
  }, [id, a, b]);
  ok('English @mention in Arabic line reads "@Ahmed", not "Ahmed@"', await order('mentionFirst', 0, 1));
  ok('Arabic @mention in Arabic line keeps @ on the right', await order('arabicMention', 1, 0));
  const wrappers = await page.evaluate(() => document.querySelectorAll('[data-qa="message-text"][data-slack-rtl]').length);
  ok('wrapper around message lines is never flipped', wrappers === 0, String(wrappers));

  const extChrome = await chrome(page);
  const moved = extChrome.filter((m, i) => JSON.stringify(m) !== JSON.stringify(baseChrome[i]));
  ok('avatars, names, timestamps, reactions unchanged vs no extension', moved.length === 0, JSON.stringify(moved).slice(0, 400));
  await page.screenshot({ path: path.join(__dirname, 'after.png') });

  // Message loaded later (scrolling) and channel switch.
  await page.evaluate(() => append('arabic', 'late1')); await page.waitForTimeout(100);
  ok('message added later gets RTL', (await textPos(page, 'late1')).dir === 'rtl');
  await page.evaluate(() => render(['english', 'arabic'])); await page.waitForTimeout(100);
  ok('channel switch: new list handled', (await textPos(page, 'arabic')).dir === 'rtl' && (await textPos(page, 'english')).dir === null);
  // In-place edit: Arabic -> English and back.
  await page.evaluate(() => { document.querySelector('[data-id="arabic"] .p-rich_text_section').firstChild.data = 'Edited to English'; }); await page.waitForTimeout(100);
  ok('edited to English: dir removed', (await textPos(page, 'arabic')).dir === null);
  await page.evaluate(() => { document.querySelector('[data-id="arabic"] .p-rich_text_section').firstChild.data = 'عدلت الرسالة'; }); await page.waitForTimeout(100);
  ok('edited back to Arabic: RTL', (await textPos(page, 'arabic')).dir === 'rtl');

  // Composer: type Arabic, English, mixed lines.
  const ed = page.locator('[data-qa="message_input"] .ql-editor');
  await ed.click();
  await ed.evaluate(e => { e.innerHTML = '<p>السلام عليكم يا فريق</p><p>English line here</p><p>مرحبا team كيف الحال</p>'; });
  await page.waitForTimeout(50);
  const comp = await ed.evaluate(e => [...e.querySelectorAll('p')].map(p => { const b = p.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(p); const t = rg.getBoundingClientRect(); return { leftGap: Math.round(t.left - b.left), rightGap: Math.round(b.right - t.right), dirAttr: p.getAttribute('dir') }; }));
  ok('composer Arabic line right-aligned', isRight(comp[0]), JSON.stringify(comp[0]));
  ok('composer English line left-aligned', isLeft(comp[1]), JSON.stringify(comp[1]));
  ok('composer mixed (Arabic first) right-aligned', isRight(comp[2]), JSON.stringify(comp[2]));
  ok('composer DOM not rewritten', comp.every(c => c.dirAttr === null));
  await ed.evaluate(e => { e.innerHTML = '<p><br></p>'; }); await ed.click();
  await page.keyboard.insertText('اكتب رسالة');
  const typed = await ed.evaluate(e => { const p = e.querySelector('p'); const b = p.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(p); const t = rg.getBoundingClientRect(); return { leftGap: Math.round(t.left - b.left), rightGap: Math.round(b.right - t.right) }; });
  ok('composer: real typing in Arabic aligns right', isRight(typed), JSON.stringify(typed));
  await page.screenshot({ path: path.join(__dirname, 'composer.png') });

  // Popup toggle off -> everything reverts; on -> reapplied.
  const popup = await ctx.newPage();
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await popup.waitForTimeout(300);
  ok('popup shows toggle on', await popup.locator('#enabled').isChecked());
  ok('support link hidden until a real URL is set', await popup.locator('#support').isHidden());
  await popup.screenshot({ path: path.join(__dirname, 'popup.png') });
  await popup.locator('label.toggle-row').click(); await page.waitForTimeout(300);
  const off = await page.evaluate(() => ({ marked: document.querySelectorAll('[data-slack-rtl]').length, cls: document.documentElement.classList.contains('slack-rtl-on') }));
  ok('toggle off reverts all changes', off.marked === 0 && !off.cls, JSON.stringify(off));
  await popup.locator('label.toggle-row').click(); await page.waitForTimeout(300);
  ok('toggle on reapplies', (await textPos(page, 'arabic')).dir === 'rtl');

  // Popup "this tab" line, with the Slack tab reported as the active tab.
  const slackTabStatus = await popup.evaluate(async () => { const [t] = await chrome.tabs.query({ url: 'https://app.slack.com/*' }); return chrome.tabs.sendMessage(t.id, { type: 'slack-rtl-status' }); });
  ok('content script reports status to popup', slackTabStatus.enabled && slackTabStatus.blocks === 4 && slackTabStatus.rtl === 1 && slackTabStatus.composer, JSON.stringify(slackTabStatus));
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { const q = chrome.tabs.query.bind(chrome.tabs); chrome.tabs.query = () => q({ url: 'https://app.slack.com/*' }); });
  await p2.goto(`chrome-extension://${extId}/popup.html`); await p2.waitForTimeout(400);
  const line = await p2.locator('#page-status').textContent();
  ok('popup shows what it found on the Slack tab', /message paragraphs found/.test(line) && /Message box found/.test(line), line);
  await p2.screenshot({ path: path.join(__dirname, 'popup.png') });
  await page.evaluate(() => { document.querySelectorAll('.c-message_kit__blocks').forEach(b => b.className = 'renamed'); document.querySelectorAll('[data-qa="message-text"]').forEach(b => b.removeAttribute('data-qa')); document.querySelector('[data-qa="message_input"]').removeAttribute('data-qa'); document.querySelector('.ql-editor').className = 'x'; });
  await p2.reload(); await p2.waitForTimeout(400);
  const warn = await p2.locator('#page-status').textContent();
  ok('popup warns when Slack markup no longer matches', /Slack may have changed/.test(warn), warn);
  await p2.close();

  // Speed, measured as CPU time spent inside the extension's own code (CDP profiler), which
  // is stable from run to run, unlike wall-clock comparisons between two browsers.
  await page.bringToFront(); await page.evaluate(() => render([]));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
  const extCpu = async (fn) => {
    await cdp.send('Profiler.start'); await page.evaluate(fn); const { profile } = await cdp.send('Profiler.stop');
    // A sample counts when any frame on its stack is the extension's (so built-ins it calls count too).
    const parent = new Map(); profile.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
    const byId = new Map(profile.nodes.map(n => [n.id, n])); const inExt = new Map(); let us = 0;
    const isExt = id => { if (id === undefined) return false; if (inExt.has(id)) return inExt.get(id); const v = byId.get(id).callFrame.url.startsWith('chrome-extension://') || isExt(parent.get(id)); inExt.set(id, v); return v; };
    profile.samples.forEach((id, i) => { if (isExt(id)) us += profile.timeDeltas[i] || 0; });
    return +(us / 1000).toFixed(1);
  };
  // Slack loads messages in chunks as you scroll: 20 chunks of 100.
  const loadMs = await extCpu(async () => {
    const keys = Object.keys(MESSAGES); const list = document.getElementById('list');
    for (let c = 0; c < 20; c++) {
      list.insertAdjacentHTML('afterbegin', Array.from({ length: 100 }, (_, i) => `<div class="c-virtual_list__item"><div class="c-message_kit__blocks"><div class="p-rich_text_block">${MESSAGES[keys[(c * 100 + i) % keys.length]]}</div></div></div>`).join(''));
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    }
  });
  const handled = await page.evaluate(() => document.querySelectorAll('[data-slack-rtl]').length);
  ok('2000 messages loaded in chunks: all Arabic ones handled', handled > 1500, String(handled));
  ok('2000 messages: under 100ms of extension CPU in total', loadMs < 100, `${loadMs}ms`);
  const typeMs = await extCpu(async () => {
    const ed = document.querySelector('.x') || document.querySelector('.ql-editor');
    for (let i = 0; i < 500; i++) { ed.textContent = 'كتابة سريعة '.repeat(i % 20); await Promise.resolve(); }
    await new Promise(r => requestAnimationFrame(r));
  });
  ok('500 rapid composer edits: under 20ms of extension CPU', typeMs < 20, `${typeMs}ms`);

  await ctx.close(); await base.ctx.close();
  for (const r of results) console.log(r.join('  '));
  console.log(results.filter(r => r[0] === 'FAIL').length ? 'SOME FAILED' : 'ALL PASSED');
})().catch(e => { console.error(e); process.exit(1); });
