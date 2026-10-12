const path=require('path'),fs=require('fs');
const {chromium}=require(path.join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
const logos=require('./logos.js');
const css=`@font-face{font-family:Kufi;font-weight:800;src:url(data:font/woff2;base64,${fs.readFileSync(__dirname+'/kufi800.woff2').toString('base64')})}
@font-face{font-family:Cairo;font-weight:700;src:url(data:font/woff2;base64,${fs.readFileSync(__dirname+'/kufi800.woff2').toString('base64')})}`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
for(const [k,svg] of Object.entries(logos)){await p.setContent(`<style>${css}body{margin:0}svg{display:block;width:512px;height:512px}</style>${svg}`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);await p.evaluate(()=>document.querySelectorAll('text[data-box]').forEach(t=>{const [x,y,w,h]=t.dataset.box.split(' ').map(Number);const c=document.createElement('canvas').getContext('2d');c.direction='ltr';c.textAlign='left';c.font=`800 ${t.getAttribute('font-size')}px Kufi`;const m=c.measureText(t.textContent);const iw=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,ih=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;t.setAttribute('direction','ltr');t.setAttribute('x',x+(w-iw)/2+m.actualBoundingBoxLeft);t.setAttribute('y',y+(h-ih)/2+m.actualBoundingBoxAscent);t.removeAttribute('data-box');}));fs.writeFileSync(`${__dirname}/logo-${k}.svg`,await p.evaluate(()=>document.querySelector('svg').outerHTML));await p.screenshot({path:`${__dirname}/logo-${k}-512.png`,omitBackground:true});}
// Preview sheet
const img=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
await p.setViewportSize({width:1200,height:620});
const col=(k,name,note)=>`<div class="opt"><div class="big"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="200"></div>
<div class="sizes"><div class="bar light"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="48"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="32"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="16"></div>
<div class="bar dark"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="48"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="32"><img src="${img(`${__dirname}/logo-${k}-512.png`)}" width="16"></div></div>
<h2>${k}. ${name}</h2><p>${note}</p></div>`;
await p.setContent(`<style>${css}body{margin:0;padding:36px;font-family:Inter,sans-serif;background:#f4f4f6;color:#1d1c1d}
.row{display:flex;gap:28px}.opt{flex:1;background:#fff;border-radius:16px;padding:24px;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.06)}
.big{height:210px;display:flex;align-items:center;justify-content:center}.sizes{display:flex;flex-direction:column;gap:8px;margin:14px 0}
.bar{display:flex;gap:18px;align-items:center;justify-content:center;padding:10px;border-radius:10px}.light{background:#e9e9ec}.dark{background:#2b2b30}
h2{margin:8px 0 4px;font-size:20px}p{margin:0;color:#555;font-size:14px;line-height:1.4}</style>
<div class="row">${col('A','Chat bubble','The letter ع in a speech bubble. Reads as "messages in Arabic".')}${col('B','Align right','ع over right-aligned text lines. Says what it does: lines up text on the right.')}${col('C','Direction arrow','A big ع with an arrow pointing right-to-left. Boldest at small sizes.')}</div>`);
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
await p.screenshot({path:`${__dirname}/logo-options.png`});await b.close();})();
