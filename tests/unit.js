// Direction-detection cases, run in Node against the real content.js.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ext = fs.realpathSync(path.join(__dirname, '../extension'));
const ctx = { self: {}, chrome: { storage: { sync: { get() {} }, onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} } } } };
ctx.self = ctx; vm.createContext(ctx);
for (const f of ['selectors.js', 'content.js']) vm.runInContext(fs.readFileSync(path.join(ext, f), 'utf8'), ctx);
const { detectDirection } = ctx.__slackRtl;
const cases = [
  ['مرحبا بالجميع', 'rtl'], ['Hello everyone', null], ['', null], ['123 456', null], ['👍👍', null],
  ['مرحبا team', 'rtl'], ['Hi يا جماعة كيف حالكم اليوم', 'rtl'], ['Meeting at 3pm in the big room مع أحمد', 'ltr'],
  ['🎉 تم النشر', 'rtl'], ['3 رسائل جديدة', 'rtl'], ['١٢٣ رسالة', 'rtl'], ['(ملاحظة) مهم', 'rtl'], ['"اقتباس" هنا', 'rtl'],
  ['؟؟ ماذا', 'rtl'], ['OK', null], ['OK تمام', 'rtl'], ['PR جاهز للمراجعة', 'rtl'], ['The word مرحبا means hello', 'ltr'],
  ['سلام دوستان، امروز جلسه داریم', 'rtl'], ['آپ کیسے ہیں', 'rtl'], ['ﷺ', 'rtl'],
  ['https://example.com/a/very/long/path شوفوا الرابط', 'rtl'], ['www.example.com/docs راجعوا هذا', 'rtl'],
  [':tada: :rocket: مبروك', 'rtl'], ['Check https://example.com/ar مهم', 'ltr'],
  ['React Native و Flutter', 'ltr'], ['استخدم React Native أو Flutter في المشروع', 'rtl'],
];
let fail = 0;
for (const [t, want] of cases) { const got = detectDirection(t); const okk = got === want; if (!okk) fail++; console.log(okk ? 'PASS' : 'FAIL', JSON.stringify(t), '->', got, okk ? '' : `(want ${want})`); }
console.log(fail ? `${fail} FAILED` : `ALL ${cases.length} PASSED`); process.exit(fail ? 1 : 0);
