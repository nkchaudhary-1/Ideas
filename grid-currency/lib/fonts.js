'use strict';
/*
 * Every <text> names exactly one family in its font-family attribute: "Impact" or "Inter Display". That is what
 * Figma and Illustrator read, so they ask for the real fonts.
 * Browsers additionally apply the CSS below: the same families first, then fallbacks. Where Impact is missing they use
 * 'GRID Impact Fallback': Anton (SIL OFL 1.1, see assets/Anton-OFL.txt) at 92% so its cap height matches Impact's.
 * Anton is narrower than Impact, so layouts keep their air.
 */
const fs = require('fs');
const path = require('path');
let css = null;
function fontFallbackStyle() {
  if (!css) {
    const b64 = fs.readFileSync(path.join(__dirname, '..', 'assets', 'anton-latin-400-normal.woff2')).toString('base64');
    css = `<style>@font-face{font-family:'GRID Impact Fallback';src:url(data:font/woff2;base64,${b64}) format('woff2');size-adjust:92%}\n`
      + `text[font-family="Impact"]{font-family:Impact,'GRID Impact Fallback',Haettenschweiler,'Arial Narrow Bold',sans-serif}\n`
      + `text[font-family="Inter Display"]{font-family:'Inter Display',Inter,'Helvetica Neue',Arial,sans-serif}</style>`;
  }
  return css;
}
module.exports = { fontFallbackStyle, anton64: () => fs.readFileSync(path.join(__dirname, '..', 'assets', 'anton-latin-400-normal.woff2')).toString('base64') };
