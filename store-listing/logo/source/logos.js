// Logo options as SVG strings (512x512). Text with data-box="x y w h" is centred in that box at render time.
const t = (box, size, fill, anchor = 'middle') => `<text data-box="${box}" font-family="Kufi" font-weight="800" font-size="${size}" fill="${fill}">ع</text>`;
module.exports = {
  A: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16C08F"/><stop offset="1" stop-color="#086652"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#g)"/>
    <path d="M150 92h212a84 84 0 0 1 84 84v116a84 84 0 0 1-84 84h-2l44 60-104-60H150a84 84 0 0 1-84-84V176a84 84 0 0 1 84-84z" fill="#fff"/>
    ${t('66 92 380 284', 260, '#086652')}
  </svg>`,
  // Small-size version of A (16 and 32 px): the bubble is dropped so the letter stays readable.
  A_small: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16C08F"/><stop offset="1" stop-color="#086652"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#g)"/>
    ${t('56 56 400 400', 400, '#fff')}
  </svg>`,
  B: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C5CFA"/><stop offset="1" stop-color="#36269A"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#g)"/>
    ${t('230 60 200 236', 240, '#fff')}
    <rect x="112" y="318" width="318" height="42" rx="21" fill="#fff"/>
    <rect x="212" y="390" width="218" height="42" rx="21" fill="#fff" fill-opacity=".65"/>
  </svg>`,
  C: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A4A80"/><stop offset="1" stop-color="#111B30"/></linearGradient></defs>
    <rect width="512" height="512" rx="116" fill="url(#g)"/>
    ${t('86 56 340 290', 250, '#fff')}
    <path d="M392 410H148" stroke="#F5B83D" stroke-width="38" stroke-linecap="round"/>
    <path d="M200 360l-56 50 56 50" fill="none" stroke="#F5B83D" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};
