// Synthesizes audio/v2/sfx.wav (effects from timeline cues) and audio/v2/music.wav (light 112 BPM beat).
const fs = require('fs'), path = require('path');
const tl = require('../timeline.json');
const SR = 48000, LEN = Math.ceil((tl.total + 0.6) * SR);
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;
function buf() { return [new Float32Array(LEN), new Float32Array(LEN)]; }
function add(B, t, mono, gain = 1, pan = 0) { // mono Float32Array at time t
  const s0 = Math.round(t * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < mono.length; i++) { const j = s0 + i; if (j < 0 || j >= LEN) continue; B[0][j] += mono[i] * gl; B[1][j] += mono[i] * gr; }
}
const gen = (dur, f) => { const n = Math.round(dur * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(i / SR, i / n); return a; };
function lp(a, fc) { const k = 1 - Math.exp(-2 * Math.PI * fc / SR); let y = 0; return a.map(x => (y += k * (x - y))); }
function hp(a, fc) { const l = lp(a, fc); return a.map((x, i) => x - l[i]); }
// time-varying one-pole lowpass (cutoff function of progress)
function lpv(a, fcf) { let y = 0; return a.map((x, i) => { const k = 1 - Math.exp(-2 * Math.PI * fcf(i / a.length) / SR); return (y += k * (x - y)); }); }
const env = (p, att, rel) => (p < att ? p / att : Math.pow(1 - (p - att) / (1 - att), rel));

// ---------- effect library ----------
const fx = {
  whoosh: () => { const d = 0.5; const n = gen(d, () => noise()); const f = lpv(n, p => 300 + 5000 * Math.sin(p * Math.PI)); const g = hp(f, 150); return g.map((x, i) => x * env(i / g.length, 0.6, 2) * 0.9); },
  hit: () => gen(0.55, (t) => { const f = 70 * Math.exp(-t * 6) + 38; return (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 6) + (t < 0.01 ? noise() * 0.6 * (1 - t / 0.01) : 0)) * 0.95; }),
  boomSoft: () => gen(0.8, (t) => Math.sin(2 * Math.PI * (45 + 25 * Math.exp(-t * 8)) * t) * Math.exp(-t * 4) * 0.8),
  snap: () => { const a = gen(0.05, (t, p) => noise() * Math.pow(1 - p, 3)); return hp(a, 2500).map(x => x * 0.7); },
  pop: () => gen(0.13, (t) => Math.sin(2 * Math.PI * (900 * Math.exp(-t * 30) + 260) * t) * Math.exp(-t * 28) * 0.6),
  popBig: () => gen(0.3, (t) => (Math.sin(2 * Math.PI * (700 * Math.exp(-t * 18) + 180) * t) * Math.exp(-t * 14) + Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 20) * 0.3) * 0.7),
  beep: () => gen(0.14, (t, p) => Math.sign(Math.sin(2 * Math.PI * 1150 * t)) * 0.18 * (p < 0.9 ? 1 : (1 - p) * 10)),
  shutter: () => { const a = gen(0.12, (t) => (t < 0.012 || (t > 0.06 && t < 0.075) ? noise() : 0)); return hp(a, 1800).map(x => x * 0.6); },
  tick: () => hp(gen(0.018, (t, p) => noise() * (1 - p)), 3000).map(x => x * 0.35),
  ding: () => gen(1.2, (t) => [[1, 1], [2.76, 0.4], [5.4, 0.2]].reduce((s, [m, g]) => s + Math.sin(2 * Math.PI * 1318 * m * t) * g * Math.exp(-t * (3 + m)), 0) * 0.32),
  sparkle: () => { const out = new Float32Array(Math.round(1.4 * SR)); [1046, 1318, 1568, 2093, 2637].forEach((f, k) => { const s = Math.round(k * 0.07 * SR); for (let i = 0; i + s < out.length; i++) { const t = i / SR; out[i + s] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5) * 0.22; } }); return out; },
  blip: (e) => { const f = 440 * Math.pow(2, (e.n % 12 + Math.floor(e.n / 12) * 0) / 12 + 0.5); return gen(0.12, (t) => (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 30) * 0.28); },
  suck: () => { const n = gen(0.6, () => noise()); const f = lpv(n, p => 4000 * Math.pow(1 - p, 2) + 200); return f.map((x, i) => x * env(i / f.length, 0.2, 1.5) * 0.5); },
  bag: () => gen(0.45, (t) => (Math.sin(2 * Math.PI * (120 * Math.exp(-t * 12) + 60) * t) * Math.exp(-t * 9) + (t < 0.02 ? noise() * 0.5 : 0)) * 0.9),
  swish: () => { const n = gen(0.28, () => noise()); const f = lpv(n, p => 600 + 2500 * Math.sin(p * Math.PI)); return hp(f, 300).map((x, i) => x * Math.sin(i / f.length * Math.PI) * 0.35); },
  birds: () => { const out = new Float32Array(Math.round(0.9 * SR)); for (let k = 0; k < 3; k++) { const s = Math.round((k * 0.18 + rnd() * 0.05) * SR), f0 = 2600 + rnd() * 900; for (let i = 0; i < 0.11 * SR; i++) { const t = i / SR; out[s + i] += Math.sin(2 * Math.PI * (f0 + 9000 * t) * t) * Math.sin(Math.PI * t / 0.11) * 0.12; } } return out; },
  crackle: (e) => { const a = gen(e.d, (t, p) => (rnd() < 0.0016 ? noise() * 1.5 : 0) + noise() * 0.02); const h = hp(a, 900); return h.map((x, i) => x * Math.min(1, i / (0.2 * SR), (h.length - i) / (0.2 * SR)) * 0.5); },
  rumble: (e) => { let b = 0; const a = gen(e.d, (t) => { b = 0.98 * b + 0.02 * noise(); return b * (1 + 0.3 * Math.sin(2 * Math.PI * 9 * t)); }); const l = lp(a, 140); return l.map((x, i) => x * 3.2 * Math.min(1, i / (0.4 * SR), (l.length - i) / (0.25 * SR))); }
};
const pans = { whoosh: 0, swish: 0.3, birds: -0.4 };
const B = buf();
for (const e of tl.sfx) { const f = fx[e.type]; if (!f) continue; add(B, Math.max(0, e.t), f(e), 1, e.type === 'blip' ? ((e.n % 2) ? 0.35 : -0.35) : (pans[e.type] || 0)); }

// ---------- music: 112 BPM, Am-F-C-G marimba arps + kick + shaker ----------
const M = buf(), bpm = 112, beat = 60 / bpm;
const kick = gen(0.35, (t) => Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 9) * 0.9);
const shaker = hp(gen(0.06, (t, p) => noise() * Math.pow(1 - p, 2)), 5000).map(x => x * 0.18);
const mar = (f) => gen(0.5, (t) => (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * 4 * f * t) * Math.exp(-t * 30)) * Math.exp(-t * 7) * 0.22);
const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]];
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const nBeats = Math.ceil(tl.total / beat) + 1;
for (let b = 0; b < nBeats; b++) {
  const t = b * beat; const bar = Math.floor(b / 4) % 4, ch = chords[bar];
  if (t > 0.1) add(M, t, kick, b % 4 === 0 ? 1 : 0.75);
  add(M, t + beat / 2, shaker, 1, 0.3); add(M, t + beat / 4, shaker, 0.5, -0.3); add(M, t + 3 * beat / 4, shaker, 0.5, -0.3);
  for (let k = 0; k < 2; k++) { const note = ch[(b * 2 + k) % 4] + 12; add(M, t + k * beat / 2, mar(hz(note)), 0.8, k ? 0.25 : -0.25); }
  if (b % 4 === 0) add(M, t, gen(beat * 3.5, (tt) => Math.sin(2 * Math.PI * hz(ch[0] - 12) * tt) * Math.exp(-tt * 1.2) * 0.35));
}
// fade music out over the last 0.6 s
for (let i = 0; i < LEN; i++) { const t = i / SR, f = Math.min(1, Math.max(0, (tl.total + 0.4 - t) / 0.8)); M[0][i] *= f; M[1][i] *= f; }

function writeWav(file, B) {
  let peak = 0; for (const ch of B) for (const x of ch) peak = Math.max(peak, Math.abs(x));
  const g = peak > 0.98 ? 0.98 / peak : 1, n = B[0].length, data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) { data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, B[0][i] * g)) * 32767), i * 4); data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, B[1][i] * g)) * 32767), i * 4 + 2); }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data])); console.log(file, 'peak', peak.toFixed(2));
}
const out = path.join(__dirname, '..', 'audio', 'v2');
writeWav(path.join(out, 'sfx.wav'), B); writeWav(path.join(out, 'music.wav'), M);
