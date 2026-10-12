// Frames the real Slack screenshot (store-listing/screenshots/source/real-slack-after.png) as a 1280x800 store image.
const path = require('path'), fs = require('fs');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
const SHOTS = path.join(__dirname, '../store-listing/screenshots');
const img = 'data:image/png;base64,' + fs.readFileSync(path.join(SHOTS, 'source/real-slack-after.png')).toString('base64');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.setContent(`<!doctype html><meta charset="utf-8"><body style="margin:0;width:1280px;height:800px;background:linear-gradient(135deg,#0f9c75,#06493b);font-family:Inter,sans-serif;color:#fff;display:flex;flex-direction:column;align-items:center;padding:36px 40px">
<h1 style="margin:0;font-size:40px">Arabic on the right. English on the left.</h1>
<p style="margin:8px 0 26px;font-size:21px;opacity:.88">Real Slack, with the extension on. Your name, photo and time stay where they always are.</p>
<div style="border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45)"><img src="${img}" style="display:block;width:1040px"></div></body>`);
  await p.waitForTimeout(200); await p.screenshot({ path: path.join(SHOTS, '0-real-slack.png') }); await b.close();
})();
