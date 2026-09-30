/* The six layouts. Same live data, different worlds. All positions are world units (1 unit ≈ 38 px at the focal plane). */
(() => {
const S = window.Studio, TAU = Math.PI * 2, P = Math.PI, N = 1100;
const cs = Math.cos, sn = Math.sin;
const ringPos = (r, a, y) => [cs(a) * r, y || 0, sn(a) * r];
const set = (o, v) => { o.tgt[0] = v[0]; o.tgt[1] = v[1]; o.tgt[2] = v[2]; };
const orbit = (n, h, rad, spd, yS) => { const a = n.seed * TAU + S.api.T * spd * (.5 + n.v), sgn = n.j % 2 ? 1 : -1; n.tgt[0] = h.pos[0] + cs(a * sgn) * rad; n.tgt[1] = h.pos[1] + sn(a * 1.7 + n.seed * 9) * yS; n.tgt[2] = h.pos[2] + sn(a * sgn) * rad; };
const shell = (d, T, r0, r1, sq) => { const y = 1 - 2 * (d.i + .5) / N, rr = Math.sqrt(1 - y * y), th = d.i * 2.39996 + T * .02 * (d.seed - .5), R = r0 + (r1 - r0) * ((d.seed * 7.13) % 1);
  d.tgt[0] = rr * cs(th) * R; d.tgt[1] = y * R * (sq || .8) + sn(T * .3 + d.seed * 30) * .15; d.tgt[2] = rr * sn(th) * R; };
const reg = def => S.register(Object.assign({ draw(a) { S.scene.render(def); } }, def));
const fmtR = r => 'R ' + (r < 10 ? '0' : '') + r.toFixed(1);
const HK = ['cpu', 'mem', 'gpu', 'disk', 'net', 'procs'];

/* 01 · Quantum Flow: hubs on a drifting loop, nodes spiral as helices, links arc with your voice waveform */
const flow = { id: 'flow', name: 'Quantum Flow', cam: { pitch: .42, dist: 29, yaw: .00016 }, curve: 1.1,
  place(Sc, T) { const H = Sc.hubs; HK.forEach((k, i) => { const th = i / 6 * TAU + T * .04; set(H[k], [8.6 * cs(th), 2.6 * sn(2 * th + T * .1), 7 * sn(th)]); }); set(H.voice, [0, 0, 0]);
    Object.values(H).forEach(h => h.nodes.forEach(n => { const a = n.seed * TAU + T * (.22 + n.v * .9), rad = h.key === 'voice' ? 1.2 + (n.j % 10) * .25 : 1.1 + (n.j % 8) * .3;
      n.tgt[0] = h.pos[0] + cs(a) * rad; n.tgt[1] = h.pos[1] + ((n.j % 5) - 2) * .45 + sn(a * 1.4) * .5; n.tgt[2] = h.pos[2] + sn(a) * rad; })); },
  guides(Sc) { Sc.ring(8.6, 0, .1, fmtR(8.6)); Sc.ring(13, -1.5, .05, fmtR(13)); },
  dust(d, T) { shell(d, T, 3, 20, .7); } };

/* 02 · Knowledge Orb: everything on a sphere, nodes circling their hub */
const fib = (i, n) => { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996; return [r * cs(th), y, r * sn(th)]; };
const orb = { id: 'orb', name: 'Knowledge Orb', cam: { pitch: .3, dist: 27, yaw: .00014 }, curve: 0,
  place(Sc, T) { const H = Sc.hubs, R = 7.6, order = ['voice', 'cpu', 'mem', 'net', 'procs', 'disk', 'gpu']; order.forEach((k, i) => { const v = fib(i, 7); set(H[k], [v[0] * R, v[1] * R, v[2] * R]); });
    order.forEach(k => { const h = H[k], u = [h.tgt[0] / R, h.tgt[1] / R, h.tgt[2] / R], up = Math.abs(u[1]) > .9 ? [1, 0, 0] : [0, 1, 0];
      let t1 = [u[1] * up[2] - u[2] * up[1], u[2] * up[0] - u[0] * up[2], u[0] * up[1] - u[1] * up[0]]; const l = Math.hypot(...t1) || 1; t1 = t1.map(x => x / l); const t2 = [u[1] * t1[2] - u[2] * t1[1], u[2] * t1[0] - u[0] * t1[2], u[0] * t1[1] - u[1] * t1[0]];
      h.nodes.forEach(n => { const a = n.seed * TAU + T * .15 * (.5 + n.v), sp = .16 + (n.j % 9) * .034 + Math.floor(n.j / 9) * .05, v = [u[0] + (t1[0] * cs(a) + t2[0] * sn(a)) * sp, u[1] + (t1[1] * cs(a) + t2[1] * sn(a)) * sp, u[2] + (t1[2] * cs(a) + t2[2] * sn(a)) * sp], m = Math.hypot(...v) || 1; set(n, [v[0] / m * R, v[1] / m * R, v[2] / m * R]); }); }); },
  guides(Sc) { const R = 7.6, ctx = S.api.ctx; for (const ph of [-60, -30, 0, 30, 60]) { const f = ph * P / 180; Sc.ring(cs(f) * R, sn(f) * R, ph === 0 ? .14 : .07, ph === 0 ? fmtR(R) : null); }
    for (let m = 0; m < 12; m++) { const a = m / 12 * TAU; ctx.beginPath(); let first = true; for (let i = 0; i <= 28; i++) { const f = -P / 2 + i / 28 * P, p = Sc.P3(cs(f) * cs(a) * R, sn(f) * R, cs(f) * sn(a) * R); if (!p) { first = true; continue; } first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; } ctx.lineWidth = 1; ctx.strokeStyle = S.api.rgba(.05, S.api.col.a); ctx.stroke(); } },
  dust(d, T) { d.seed > .86 ? shell(d, T, 11, 21, .8) : shell(d, T, 7.6, 8.5, 1); } };

/* 03 · Layered Intelligence: stacked planes, each a tier of the machine */
const PLANE = { voice: [-3.2, -7, 0], gpu: [3.2, -7, 0], net: [-3.2, -3.5, 0], disk: [3.2, -3.5, 0], mem: [0, 0, 0], cpu: [0, 3.5, 0], procs: [0, 7, 0] };
const layers = { id: 'layers', name: 'Layered Intelligence', cam: { pitch: .55, dist: 31, yaw: .00012 }, curve: 0,
  place(Sc, T) { Object.keys(PLANE).forEach(k => { const h = Sc.hubs[k]; set(h, PLANE[k]); h.nodes.forEach(n => { const rad = 2.4 + (n.j % 6) * .5 + Math.floor(n.j / 6) * .9, a = n.seed * TAU + T * (.12 + n.v * .5) * (n.j % 2 ? 1 : -1); n.tgt[0] = h.pos[0] + cs(a) * rad; n.tgt[1] = h.pos[1] + sn(a * 3 + n.seed * 7) * .12; n.tgt[2] = h.pos[2] + sn(a) * rad * .9; }); }); },
  guides(Sc) { [-7, -3.5, 0, 3.5, 7].forEach(y => { Sc.ring(10, y, .15, null); Sc.ring(6, y, .06, null); Sc.tag(0, y - .55, 10.9, 'PLANE ' + (y < 0 ? '-' : '+') + (Math.abs(y) < 10 ? '0' : '') + Math.abs(y).toFixed(1), .45); });
    const a = Sc.P3(0, -7, 0), b = Sc.P3(0, 7, 0); if (a && b) { S.api.line(a[0], a[1], b[0], b[1], 1, .08, S.api.col.a); } },
  dust(d, T) { const y = [-7, -3.5, 0, 3.5, 7][d.i % 5], r = Math.sqrt((d.seed * 13.7) % 1) * 11, a = d.seed * 97 + T * .03 * (1 + (d.i % 3) * .3); d.tgt[0] = cs(a) * r; d.tgt[1] = y + sn(d.seed * 50 + T * .4) * .18; d.tgt[2] = sn(a) * r; } };

/* 04 · Knowledge Galaxy: spiral arms, hubs as star systems */
const galaxy = { id: 'galaxy', name: 'Knowledge Galaxy', cam: { pitch: .7, dist: 30, yaw: .00008 }, curve: .4, dustAlpha: 2.4,
  place(Sc, T) { const H = Sc.hubs; set(H.voice, [0, 0, 0]); HK.forEach((k, i) => { const r = 3.6 + i * 1.7, th = i * 1.15 + T * .05 / Math.sqrt(r); set(H[k], [cs(th) * r, sn(i * 2.1) * .5, sn(th) * r]); });
    Object.values(H).forEach(h => h.nodes.forEach(n => { const a = n.seed * TAU + T * .12 * (.5 + n.v), rad = h.key === 'voice' ? .8 + (n.j % 10) * .22 : .9 + (n.j % 7) * .3; n.tgt[0] = h.pos[0] + cs(a) * rad; n.tgt[1] = h.pos[1] + sn(a * 1.7) * .3; n.tgt[2] = h.pos[2] + sn(a) * rad; })); },
  guides(Sc) { [4, 8, 12].forEach(r => Sc.ring(r, 0, .07, fmtR(r))); },
  dust(d, T) { const u = d.seed, r = 1.5 + Math.pow((u * 37.1) % 1, .6) * 14, arm = d.i % 2, th = arm * P + r * .42 + (((u * 91.7) % 1) - .5) * .7 + T * .05 / Math.sqrt(r + 1); d.tgt[0] = cs(th) * r; d.tgt[1] = (((u * 13.3) % 1) - .5) * .9 * (1 - r / 19); d.tgt[2] = sn(th) * r; } };

/* 05 · Intelligence Engine: tilted orbital plane, rings at R 03 / 08 / 13.5, far clusters */
const engine = { id: 'engine', name: 'Intelligence Engine', cam: { pitch: .42, dist: 27, yaw: .0001 }, curve: .5,
  place(Sc, T) { const H = Sc.hubs; set(H.cpu, [0, 0, 0]); set(H.mem, ringPos(8, T * .05 + 1.2)); set(H.gpu, ringPos(8, T * .05 + 4)); set(H.procs, ringPos(13.5, T * .03 + 3)); set(H.net, [14, 4.5, -7]); set(H.disk, [17, 2, -3]); set(H.voice, [9.5, 6.5, -8]);
    const place = (arr, r, spd) => arr.forEach((n, i) => { const a = i / Math.max(1, arr.length) * TAU + n.seed * .3 + T * (spd + n.v * .35); n.tgt[0] = cs(a) * r; n.tgt[1] = sn(n.seed * 40 + T) * .05; n.tgt[2] = sn(a) * r; });
    place(H.cpu.nodes, 3, .18); place(H.mem.nodes.concat(H.gpu.nodes), 8, .06); place(H.procs.nodes, 13.5, .035);
    ['net', 'disk', 'voice'].forEach(k => H[k].nodes.forEach(n => orbit(n, H[k], .7 + (n.j % 8) * .16, .3, .3))); },
  guides(Sc) { Sc.ring(3, 0, .22, fmtR(3)); Sc.ring(8, 0, .18, fmtR(8)); Sc.ring(13.5, 0, .14, fmtR(13.5)); Sc.ring(17.5, 0, .05, null); Sc.tag(0, -7.5, 0, 'PLANE -07.5', .5); },
  dust(d, T) { shell(d, T, 4, 24, .6); } };

/* 06 · Neural Brain: the original brain at the core, hubs orbiting it */
const brain = { id: 'brain', name: 'Neural Brain', cam: { pitch: .48, dist: 27, yaw: .0001 }, curve: .6,
  place(Sc, T) { const H = Sc.hubs, keys = ['cpu', 'mem', 'gpu', 'disk', 'net', 'procs', 'voice']; keys.forEach((k, i) => set(H[k], ringPos(9.5, i / 7 * TAU + T * .04, sn(i * 1.9) * 1.2)));
    Object.values(H).forEach(h => h.nodes.forEach(n => orbit(n, h, .8 + (n.j % 8) * .26, .25, .45))); },
  guides(Sc) { Sc.ring(9.5, 0, .16, fmtR(9.5)); Sc.ring(14, -1, .06, fmtR(14)); S.api.brain.draw(S.api.cx, 470, 150, { n: 420, alpha: .9 }); },
  dust(d, T) { shell(d, T, 5, 22, .7); } };

[flow, orb, layers, galaxy, engine, brain].forEach(reg);
})();
