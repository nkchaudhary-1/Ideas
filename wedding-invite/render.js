/* Shared renderer. Reads CONFIG, fills the markup, wires RSVP. Every template uses this unchanged. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const first = s => String(s).trim().split(/\s+/)[0];
  const parse = (d, t="00:00") => new Date(`${d}T${t}:00`);
  const fmtTime = t => { const [h,m] = t.split(":").map(Number); const ap = h>=12?"pm":"am"; const hh = h%12||12; return m ? `${hh}:${String(m).padStart(2,"0")} ${ap}` : `${hh} ${ap}`; };
  const longDate = d => { const x = parse(d); return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS_LONG[x.getMonth()]} ${x.getFullYear()}`; };
  const stampD = d => { const p = n => String(n).padStart(2,"0"); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`; };
  /* Calendar span. With no end time the event is saved as 3 hours; the guest can adjust it. */
  const span = f => { const s = parse(f.date, f.time); let e = f.end ? parse(f.date, f.end) : new Date(s.getTime() + 3*36e5); if (e <= s) e = new Date(e.getTime() + 864e5); return [s, e]; };
  const pin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const cal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  const sideFromHash = () => { const h = location.hash.replace("#",""); return h === "bride" || h === "groom" ? h : null; };
  const setText = (id, txt) => { const el = $(id); el.textContent = txt || ""; el.hidden = !txt; };

  /* One size for both names, shrunk until the longer one fits its column. */
  function fitNames(){
    const ns = [...document.querySelectorAll(".names .n")];
    ns.forEach(n => { n.style.whiteSpace = "nowrap"; n.style.fontSize = ""; });
    const size = Math.max(26, Math.min(...ns.map(n => { const fs = parseFloat(getComputedStyle(n).fontSize), cw = n.clientWidth, sw = n.scrollWidth; return sw > cw && cw > 0 ? fs * cw / sw * .97 : fs; })));
    ns.forEach(n => n.style.fontSize = size + "px");
  }

  function render(){
    const side = sideFromHash() || CONFIG.side || "groom";
    const host = CONFIG[side], other = CONFIG[side === "groom" ? "bride" : "groom"];
    const fill = s => String(s||"").replace(/\{host\}/g, first(host.name)).replace(/\{other\}/g, first(other.name));
    const fns = CONFIG.functions.filter(f => f.side === "both" || f.side === side);
    const main = fns.find(f => /phera|wedding|shaadi|vivah|nikah/i.test(f.name)) || fns[fns.length-1];
    const f0 = fns[0], fN = fns[fns.length-1];
    document.documentElement.dataset.side = side;
    document.title = `${first(host.name)} & ${first(other.name)} · Wedding invitation`;

    $("previewBar").hidden = !CONFIG.preview;
    $("pvGroom").setAttribute("aria-current", side === "groom" ? "page" : "false");
    $("pvBride").setAttribute("aria-current", side === "bride" ? "page" : "false");

    $("blessing").innerHTML = esc(CONFIG.blessing) + (CONFIG.blessingEn ? `<small>${esc(CONFIG.blessingEn)}</small>` : "");
    $("eyebrow").innerHTML = CONFIG.intro;
    $("nameA").textContent = host.name; $("nameB").textContent = other.name;
    $("joiner").textContent = CONFIG.joiner || "and";
    $("lineA").innerHTML = (host.lineage||[]).map(esc).join("<br>");
    $("lineB").innerHTML = (other.lineage||[]).map(esc).join("<br>");
    $("mainDate").textContent = longDate(main.date);
    $("mainPlace").textContent = [main.venue, CONFIG.city].filter(Boolean).join(", ");

    $("inviteText").innerHTML = CONFIG.inviteText;
    setText("signWarm", CONFIG.signoff);
    setText("signFam", `${host.family} & ${other.family}`);
    setText("signCity", CONFIG.city);

    $("fnTitle").textContent = CONFIG.functionsTitle || "The functions";
    $("fnLead").textContent = fns.length === 1
      ? "Save it to your calendar so the evening isn't missed."
      : `${f0.date === fN.date ? "One day" : `${parse(f0.date).getDate()} to ${parse(fN.date).getDate()} ${MONTHS_LONG[parse(fN.date).getMonth()]}`}, ${fns.length} functions. Tap one to open the venue in Maps or add it to your calendar.`;

    const days = Math.ceil((parse(main.date, main.time) - Date.now())/864e5);
    $("countdown").innerHTML = days > 1 ? `<b>${days}</b><span>days to go</span>` : days === 1 ? `<b>1</b><span>day to go</span>` : days === 0 ? `<b>Today</b>` : `<b>Married</b><span>${Math.abs(days)} days ago</span>`;

    const gcal = f => { const [s, e] = span(f); const place = [f.venue, f.address, CONFIG.city].filter(Boolean).join(", ");
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${f.name}: ${host.name} & ${other.name}`)}&dates=${stampD(s)}/${stampD(e)}&location=${encodeURIComponent(place)}&details=${encodeURIComponent(fill(f.body || f.note))}`; };
    $("timeline").innerHTML = fns.map(f => { const d = parse(f.date);
      const time = f.timeText || (fmtTime(f.time) + (f.end ? ` to ${fmtTime(f.end)}` : ""));
      const place = [f.venue, f.address].filter(Boolean).join(", ") || CONFIG.city;
      return `<li class="fn">
      <div class="when"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="what">
        <h3>${esc(f.name)}${f.hindi ? `<span class="dn" lang="hi">${esc(f.hindi)}</span>` : ""}</h3>
        ${f.headline ? `<p class="headline">${esc(fill(f.headline))}</p>` : ""}
        ${f.body ? `<p class="evtext">${esc(fill(f.body))}</p>` : ""}
        <p class="meta"><b>${esc(time)}</b> · ${esc(place)}</p>
        ${f.note ? `<p class="note">${esc(fill(f.note))}</p>` : ""}
        ${f.dress ? `<p class="dress"><b>Wear</b>${esc(f.dress)}</p>` : ""}
        <div class="acts">
          ${f.map ? `<a class="chip" href="${esc(f.map)}" target="_blank" rel="noopener">${pin}Open in Maps</a>` : ""}
          <a class="chip" href="${gcal(f)}" target="_blank" rel="noopener">${cal}Add to calendar</a>
        </div>
      </div></li>`; }).join("");

    const travel = CONFIG.travel || [];
    $("venue").hidden = !travel.length;
    $("venueLead").textContent = CONFIG.venueLead || "";
    $("venueGrid").innerHTML = travel.map(t => `<div><h4>${esc(t.h)}</h4><p>${t.p}</p></div>`).join("");

    $("rsvp").hidden = !host.whatsapp;
    $("rPhone").textContent = host.whatsapp ? "+" + host.whatsapp : "";
    const keep = new Set([...document.querySelectorAll('#rFns input:checked')].map(i => i.value));
    const fresh = !$("rFns").children.length;
    $("rFns").innerHTML = fns.map((f,i) => `<label><input type="checkbox" name="fn" value="${esc(f.name)}" id="fn${i}" ${fresh || keep.has(f.name) ? "checked" : ""}>${esc(f.name)}</label>`).join("");

    setText("closingHindi", CONFIG.closingHindi); setText("closingLine", CONFIG.closingLine); setText("closingSig", CONFIG.closingSig);
    render.current = { side, host, other, fns };
    fitNames();
  }

  const form = $("rsvpForm");
  const buildMsg = () => {
    const { host, other } = render.current; const fd = new FormData(form); const fns = fd.getAll("fn");
    return [
      `RSVP for ${host.name} & ${other.name}'s wedding`,
      `Name: ${fd.get("name")||""}`,
      `Guests: ${fd.get("count")}`,
      fd.get("city") ? `Coming from: ${fd.get("city")}` : null,
      `Attending: ${fns.length ? fns.join(", ") : "Sadly can't make it"}`,
      fd.get("note") ? `Note: ${fd.get("note")}` : null
    ].filter(Boolean).join("\n");
  };
  form.addEventListener("input", () => { const p = $("rPreview"); p.hidden = !$("rName").value.trim(); p.textContent = buildMsg(); });
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!$("rName").value.trim()) { $("rName").focus(); $("rName").placeholder = "We need your name first"; return; }
    const url = `https://wa.me/${render.current.host.whatsapp}?text=${encodeURIComponent(buildMsg())}`;
    const w = window.open(url, "_blank", "noopener"); if (!w) location.href = url;
  });
  $("copyPhone").addEventListener("click", async () => {
    const b = $("copyPhone"); const txt = "+" + render.current.host.whatsapp;
    try { await navigator.clipboard.writeText(txt); b.textContent = "copied"; }
    catch { const r = document.createRange(); r.selectNodeContents($("rPhone")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "selected, press copy"; }
    setTimeout(() => b.textContent = "copy number", 1800);
  });

  render();
  addEventListener("hashchange", render);
  addEventListener("resize", fitNames);
  if (document.fonts) document.fonts.ready.then(fitNames);
})();
