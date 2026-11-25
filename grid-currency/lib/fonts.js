'use strict';
/*
 * Fallback for machines without Impact. The font stack names the system Impact first, so wherever Impact exists
 * nothing changes. Only when it is missing does the browser use 'GRID Impact Fallback': Anton (SIL OFL 1.1, see
 * assets/Anton-OFL.txt) at 92% so its cap height matches Impact's. Narrower than Impact, so layouts keep their air.
 * Figma and Illustrator ignore @font-face and follow the normal font stack.
 */
const fs = require('fs');
const path = require('path');
let css = null;
function fontFallbackStyle() {
  if (!css) {
    const b64 = fs.readFileSync(path.join(__dirname, '..', 'assets', 'anton-latin-400-normal.woff2')).toString('base64');
    css = `<style>@font-face{font-family:'GRID Impact Fallback';src:url(data:font/woff2;base64,${b64}) format('woff2');size-adjust:92%}</style>`;
  }
  return css;
}
module.exports = { fontFallbackStyle };
