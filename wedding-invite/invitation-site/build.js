/* usage: SITE_URL=https://your-domain.example/ node build.js
   styles.src.css -> styles.css   (design pixels 390d become calc(390 * var(--u)))
   index.src.html -> index.html   (same for inline styles, plus calendar, maps and share-image links) */
const fs = require("fs"), path = require("path");
const R = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const DP = /(?<![0-9a-fA-F#])(-?\d*\.?\d+)d(?![a-zA-Z0-9])/g;
const conv = s => s.replace(DP, (_, n) => `calc(${n} * var(--u))`);
const css = conv(R("styles.src.css"));
fs.writeFileSync(path.join(__dirname, "styles.css"), css);

const site = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/?$/, "/") : "";
const enc = encodeURIComponent;
const venue = "Near Salori Powerhouse, Old Cantt Garden Guest House, Prayagraj, Uttar Pradesh";
const cal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc("Wedding of Neelesh & Pranati")}&dates=20261211T153000Z/20261211T183000Z&location=${enc(venue)}&details=${enc("Baraat departure and venue. Your presence and blessings will make this occasion truly special.")}&ctz=Asia/Kolkata`;
const maps = `https://www.google.com/maps/search/?api=1&query=${enc("Salori Powerhouse Old Cantt Garden Guest House Prayagraj")}`;
let html = R("index.src.html")
  .replace(/style="([^"]*)"/g, (_, s) => `style="${conv(s)}"`)
  .replace(/__SITE__/g, site).replace("__CAL__", cal.replace(/&/g, "&amp;")).replace("__MAPS__", maps.replace(/&/g, "&amp;"));
fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("built styles.css and index.html", site ? "for " + site : "(relative share-image URL; set SITE_URL for absolute)");
