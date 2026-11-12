// Builds timeline.json: shots (jump cuts), voice placement, word captions, callouts, sfx cues.
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, '..', 'audio', 'v2');
const W = n => require(path.join(A, `words_${n}.json`));
const end = ws => { const l = ws[ws.length - 1]; return l.t + l.d; };
const find = (ws, re, from = 0) => ws.find((x, i) => i >= from && re.test(x.w));

// segments = narrative blocks; each has a voice clip, a scene, and shots mapping to scene source time
const seg = [
  { id: '1', scene: 0, lead: 0.05, tail: 0.3, shots: [{ f: 1, src: [0.6, 4.2], zoom: 1.0, c: [0.5, 0.5] }] },
  { id: '2', scene: 1, lead: 0.08, tail: 0.2, shots: [{ f: 0.48, src: [0, 3.2], zoom: 1.0, c: [0.5, 0.5] }, { f: 0.52, src: [3.2, 6.4], zoom: 1.4, c: [0.5, 0.63] }] },
  { id: '3a', scene: 2, lead: 0.08, tail: 0.12, tag: 'trucks', shots: [{ f: 0.47, src: [4.0, 7.2], zoom: 1.0, c: [0.5, 0.5] }, { f: 0.53, src: [7.2, 10.5], zoom: 1.22, c: [0.45, 0.42] }] },
  { id: '3b', scene: 2, lead: 0.05, tail: 0.3, shots: [{ f: 1, src: [0.8, 3.6], zoom: 1.3, c: [0.42, 0.5] }] },
  { id: '4', scene: 3, lead: 0.08, tail: 0.5, shots: [{ f: 0.34, src: [0, 2.8], zoom: 1.0, c: [0.5, 0.5] }, { f: 0.33, src: [2.8, 5.5], zoom: 1.32, c: [0.5, 0.55] }, { f: 0.33, src: [5.5, 8.8], zoom: 1.08, c: [0.5, 0.5] }] }
];

const tl = { fps: 30, shots: [], voice: [], words: [], callouts: [], sfx: [], sceneCuts: [] };
let T = 0;
for (const s of seg) {
  const ws = W(s.id), len = s.lead + end(ws) + s.tail;
  tl.voice.push({ file: `audio/v2/vo_${s.id}.mp3`, at: +(T + s.lead).toFixed(3) });
  ws.forEach(w => tl.words.push({ w: w.w, t: +(T + s.lead + w.t).toFixed(3), d: w.d, seg: s.id }));
  let st = T;
  s.shots.forEach((sh, k) => {
    const d = sh.f * len;
    tl.shots.push({ seg: s.id, scene: s.scene, tag: s.tag || '', start: +st.toFixed(3), dur: +d.toFixed(3), src: sh.src, zoom: sh.zoom, c: sh.c, first: k === 0 });
    if (k > 0) tl.sfx.push({ type: 'snap', t: st });
    st += d;
  });
  s.start = T; s.len = len; s.ws = ws;
  if (T > 0) { tl.sceneCuts.push(+T.toFixed(3)); tl.sfx.push({ type: 'whoosh', t: T - 0.28 }, { type: 'hit', t: T }); }
  T += len;
}
tl.total = +T.toFixed(3);
const S = id => seg.find(s => s.id === id);
const at = (id, re, off = 0) => { const s = S(id); const w = find(s.ws, re); return +(s.start + s.lead + w.t + off).toFixed(3); };
// map scene-source time to global time inside a segment's shots
const srcToGlobal = (id, src) => { for (const sh of tl.shots.filter(x => x.seg === id)) { if (src >= sh.src[0] && src <= sh.src[1]) return sh.start + (src - sh.src[0]) / (sh.src[1] - sh.src[0]) * sh.dur; } return null; };

// --- callouts ---
const s1 = S('1'), s2 = S('2'), s3a = S('3a'), s3b = S('3b'), s4 = S('4');
tl.callouts.push({ type: 'big', text: '500 YEARS', sub: 'OLD SECRET', t0: at('1', /five/), t1: s1.start + s1.len, rot: -4 });
tl.callouts.push({ type: 'big', text: 'GUARANÍ', sub: 'BEFORE 1500', t0: at('2', /Guarani/), t1: s2.start + s2.len, rot: 3 });
tl.callouts.push({ type: 'counter', from: 0, to: 900000000, suffix: ' KG', sub: 'GREEN LEAF / YEAR', t0: at('3a', /^900/), t1: s3a.start + s3a.len, count: [at('3a', /^900/), at('3a', /kilos/, 0.25)], rot: -2 });
tl.callouts.push({ type: 'ratio', a: '3 KG', b: '1 KG', t0: at('3b', /three/), tb: at('3b', /^one/), t1: s3b.start + s3b.len, sub: 'LEAF  →  YERBA' });
tl.callouts.push({ type: 'big', text: '6 KG', sub: 'PER PERSON / YEAR', t0: at('4', /^six/), t1: at('4', /exports/), rot: -3 });
tl.callouts.push({ type: 'big', text: 'RECORD', sub: 'EXPORTS ↑', t0: at('4', /record/), t1: at('4', /Follow/) - 0.05, rot: 2, color: '#7fd0ff' });
tl.callouts.push({ type: 'pill', text: 'FOLLOW FOR MORE', sub: 'STORIES ABOUT MATE', t0: at('4', /Follow/), t1: tl.total + 1 });
tl.callouts.forEach(c => tl.sfx.push({ type: c.type === 'pill' ? 'popBig' : 'pop', t: c.t0 }));

// --- sfx cues ---
const recT = srcToGlobal('1', 1.25); tl.sfx.push({ type: 'beep', t: recT }, { type: 'shutter', t: recT + 0.02 });
tl.events = { flash: [], shake: [] };
tl.events.shake.push(at('1', /secret/));
tl.sfx.push({ type: 'hit', t: 0.0 }, { type: 'boomSoft', t: at('1', /secret/) });
tl.sfx.push({ type: 'crackle', t: s2.start, d: s2.len }, { type: 'birds', t: s2.start + 0.3 }, { type: 'birds', t: s2.start + 2.4 });
tl.sfx.push({ type: 'rumble', t: s3a.start, d: s3a.len });
for (let k = 0; k < 24; k++) { const L = Math.floor(k / 3); const src = 5.0 + L * 0.42 + (k % 3) * 0.09; const g = srcToGlobal('3a', src); if (g != null) tl.sfx.push({ type: 'blip', t: g, n: k }); }
const [c0, c1] = tl.callouts[2].count; for (let t = c0; t < c1; t += 0.055) tl.sfx.push({ type: 'tick', t }); tl.sfx.push({ type: 'ding', t: c1 });
const merge0 = srcToGlobal('3b', 1.4), bagT = srcToGlobal('3b', 2.5);
tl.sfx.push({ type: 'suck', t: merge0 }, { type: 'bag', t: bagT }); tl.events.flash.push(bagT + 0.05); tl.events.shake.push(bagT + 0.05);
for (let c = 0; c < 6; c++) { const g = srcToGlobal('4', c * 1.55 + 0.7); if (g != null) tl.sfx.push({ type: 'swish', t: g }); }
tl.sfx.push({ type: 'ding', t: at('4', /^six/) }, { type: 'sparkle', t: at('4', /record/) });
tl.events.flash.push(at('4', /record/)); tl.events.shake.push(at('4', /record/));
tl.sfx.sort((a, b) => a.t - b.t);
fs.writeFileSync(path.join(__dirname, '..', 'timeline.json'), JSON.stringify(tl, null, 1));
console.log('total', tl.total, 'shots', tl.shots.map(s => `${s.seg}@${s.start}+${s.dur}`).join(' '));
