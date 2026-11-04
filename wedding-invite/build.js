const fs = require("fs");
const s = fs.readFileSync(__dirname + "/page.html", "utf8");
const i = s.indexOf("<canvas");
const head = s.slice(0, i).replace(/<meta name="claude:viewport-fit-sides"[^>]*>\n/, "");
fs.writeFileSync(__dirname + "/index.html", `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Wedding invitation: dates, venues, travel and RSVP.">\n${head}</head>\n<body>\n${s.slice(i)}</body>\n</html>\n`);
console.log("wrote index.html");
