/* Shared renderer. Reads CONFIG, fills the markup, wires RSVP. Every template uses this unchanged. */
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const parse = (d, t="00:00") => new Date(`${d}T${t}:00`);
  const fmtTime = t => { const [h,m] = t.split(":").map(Number); const ap = h>=12?"pm":"am"; const hh = h%12||12; return m ? `${hh}:${String(m).padStart(2,"0")} ${ap}` : `${hh} ${ap}`; };
  const longDate = d => { const x = parse(d); return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS_LONG[x.getMonth()]} ${x.getFullYear()}`; };
  const stamp = (d,t) => { const x = parse(d,t); const p = n => String(n).padStart(2,"0"); return `${x.getFullYear()}${p(x.getMonth()+1)}${p(x.getDate())}T${p(x.getHours())}${p(x.getMinutes())}00`; };
  const pin = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const cal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';

  function sideFromHash(){ const h = location.hash.replace("#",""); return h === "bride" || h === "groom" ? h : null; }

  function render(){
    const side = sideFromHash() || CONFIG.side || "groom";
    const host = CONFIG[side], other = CONFIG[side === "groom" ? "bride" : "groom"];
    const child = side === "groom" ? "son" : "daughter";
    const fns = CONFIG.functions.filter(f => f.side === "both" || f.side === side);
    const pheras = fns.find(f => /phera|wedding|shaadi|vivah|nikah/i.test(f.name)) || fns[fns.length-1];
    const first = fns[0], last = fns[fns.length-1];
    document.documentElement.dataset.side = side;

    $("previewBar").hidden = !CONFIG.sample;
    $("pvGroom").setAttribute("aria-current", side === "groom" ? "page" : "false");
    $("pvBride").setAttribute("aria-current", side === "bride" ? "page" : "false");

    $("blessing").textContent = CONFIG.blessing;
    $("eyebrow").textContent = `${host.parents} request the pleasure of your company at the wedding of their ${child}`;
    $("nameA").textContent = host.name; $("nameB").textContent = other.name;
    $("mainDate").textContent = longDate(pheras.date);
    $("mainPlace").textContent = `${pheras.venue}, ${CONFIG.city}`;
    $("inviteText").innerHTML = `We would love for you to be with us as <em>${esc(host.name)}</em> and <em>${esc(other.name)}</em> begin their life together, surrounded by the people who made them who they are.`;
    $("famALabel").textContent = side === "groom" ? "The groom" : "The bride";
    $("famA").innerHTML = `${esc(host.name)} <span class="dn" lang="hi">${esc(host.hindi||"")}</span><br>${child} of ${esc(host.parents)}`;
    $("famBLabel").textContent = side === "groom" ? "The bride" : "The groom";
    $("famB").innerHTML = `${esc(other.name)} <span class="dn" lang="hi">${esc(other.hindi||"")}</span><br>${side === "groom" ? "daughter" : "son"} of ${esc(other.parents)}`;
    $("venueLead").textContent = CONFIG.venueLead;
    $("closingHindi").textContent = CONFIG.closingHindi;
    $("closingLine").textContent = CONFIG.closingLine;
    $("closingSig").textContent = `${host.name} and ${other.name}, with the ${host.parents.replace(/^Mr\.? & Mrs\.? /,"")} family`;
    $("rPhone").textContent = "+" + host.whatsapp;
    $("fnLead").textContent = `${first.date === last.date ? "One day" : `${parse(first.date).getDate()} to ${parse(last.date).getDate()} ${MONTHS_LONG[parse(last.date).getMonth()]}`}, ${fns.length} functions. Tap one to open the venue in Maps or add it to your calendar.`;

    const days = Math.ceil((parse(pheras.date, pheras.time) - Date.now())/864e5);
    $("countdown").innerHTML = days > 1 ? `<b>${days}</b><span>days to go</span>` : days === 1 ? `<b>1</b><span>day to go</span>` : days === 0 ? `<b>Today</b>` : `<b>Married</b><span>${Math.abs(days)} days ago</span>`;

    const gcal = f => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${f.name}: ${host.name} & ${other.name}`)}&dates=${stamp(f.date,f.time)}/${stamp(f.date,f.end||f.time)}&location=${encodeURIComponent(`${f.venue}, ${f.address}`)}&details=${encodeURIComponent(f.note||"")}`;
    $("timeline").innerHTML = fns.map(f => { const d = parse(f.date); return `<li class="fn">
      <div class="when"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="what">
        <h3>${esc(f.name)}<span class="dn" lang="hi">${esc(f.hindi||"")}</span></h3>
        <p class="meta"><b>${fmtTime(f.time)}${f.end?` to ${fmtTime(f.end)}`:""}</b> · ${esc(f.venue)}, ${esc(f.address)}</p>
        ${f.note?`<p class="note">${esc(f.note)}</p>`:""}
        ${f.dress?`<p class="dress"><b>Wear</b>${esc(f.dress)}</p>`:""}
        <div class="acts">
          ${f.map?`<a class="chip" href="${esc(f.map)}" target="_blank" rel="noopener">${pin}Open in Maps</a>`:""}
          <a class="chip" href="${gcal(f)}" target="_blank" rel="noopener">${cal}Add to calendar</a>
        </div>
      </div></li>`; }).join("");
    $("venueGrid").innerHTML = CONFIG.travel.map(t => `<div><h4>${esc(t.h)}</h4><p>${t.p}</p></div>`).join("");

    const keep = new Set([...document.querySelectorAll('#rFns input:checked')].map(i => i.value));
    const fresh = !$("rFns").children.length;
    $("rFns").innerHTML = fns.map((f,i) => `<label><input type="checkbox" name="fn" value="${esc(f.name)}" id="fn${i}" ${fresh || keep.has(f.name) ? "checked" : ""}>${esc(f.name)}</label>`).join("");

    render.current = { side, host, other, fns };
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
})();
