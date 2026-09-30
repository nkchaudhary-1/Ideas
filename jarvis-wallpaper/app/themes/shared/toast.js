/* Injected into every theme by the main process.
   - shows the voice-command toast
   - forwards voice events to the theme (window event 'jarvis-voice')
   - gives the classic themes (hud/brain/eye) a show/hide implementation of jarvisConfig */
(() => {
  if (window.__jarvisToast) return; window.__jarvisToast = true;
  let hidden = [];
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:7vh;transform:translateX(-50%);z-index:99999;padding:10px 18px;font:12px "Cascadia Mono",Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#f0eee6;background:rgba(10,10,12,.72);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(6px);opacity:0;transition:opacity .35s;pointer-events:none;white-space:nowrap;max-width:80vw;overflow:hidden;text-overflow:ellipsis';
  document.documentElement.appendChild(el);
  const stEl = document.createElement('div');
  stEl.style.cssText = 'position:fixed;right:14px;bottom:10px;z-index:99999;font:10px "Cascadia Mono",Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.35);pointer-events:none';
  document.documentElement.appendChild(stEl);
  let t = 0;
  window.jarvisVoice = m => {
    window.dispatchEvent(new CustomEvent('jarvis-voice', { detail: m }));
    if (hidden.includes('voice')) return;
    const icon = m.status === 'ok' ? '✓' : m.status === 'error' ? '✕' : m.status === 'ignored' ? '…' : '▸';
    el.textContent = icon + ' ' + m.text + (m.msg ? '  ·  ' + m.msg : '');
    el.style.borderColor = m.status === 'ok' ? 'rgba(120,255,190,.6)' : m.status === 'error' ? 'rgba(255,110,110,.6)' : 'rgba(255,255,255,.18)';
    el.style.opacity = 1; clearTimeout(t); t = setTimeout(() => el.style.opacity = 0, 3200);
  };
  window.jarvisVoiceState = s => { stEl.textContent = hidden.includes('voice') ? '' : (s === 'on' ? '● voice ready' : s === 'hearing' ? '◉ hearing…' : s === 'error' ? '✕ voice engine error' : '○ voice off'); stEl.style.color = s === 'hearing' ? 'rgba(120,255,190,.8)' : s === 'error' ? 'rgba(255,110,110,.8)' : 'rgba(255,255,255,.35)'; };
  const legacy = {
    cpu: () => [document.getElementById('cpu')?.closest('.row')], mem: () => [document.getElementById('ram')?.closest('.row')],
    net: () => [document.getElementById('net')?.closest('.row')], batt: () => [document.getElementById('bat')?.closest('.row')],
    sys: () => [document.getElementById('clock'), document.getElementById('greet')], voice: () => [document.getElementById('log')]
  };
  const prev = window.jarvisConfig;
  window.jarvisConfig = c => {
    if (c.hidden) { hidden = c.hidden; stEl.style.display = hidden.includes('voice') ? 'none' : ''; }
    if (prev) return prev(c);
    if (c.hidden) for (const k in legacy) legacy[k]().forEach(n => { if (n) n.style.display = hidden.includes(k) ? 'none' : ''; });
  };
})();
