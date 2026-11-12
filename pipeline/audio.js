// Sound library: synthesizes sfx + music WAVs from cue lists. Pure Node, no samples.
const fs = require('fs');
const SR = 48000;
function make(totalSec) {
  const LEN = Math.ceil((totalSec + 0.8) * SR);
  let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const noise = () => rnd() * 2 - 1;
  const buf = () => [new Float32Array(LEN), new Float32Array(LEN)];
  const add = (B, t, mono, gain = 1, pan = 0) => { const s0 = Math.round(t * SR), gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < mono.length; i++) { const j = s0 + i; if (j < 0 || j >= LEN) continue; B[0][j] += mono[i] * gl; B[1][j] += mono[i] * gr; } };
  const gen = (dur, f) => { const n = Math.max(1, Math.round(dur * SR)), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(i / SR, i / n); return a; };
  const lp = (a, fc) => { const k = 1 - Math.exp(-2 * Math.PI * fc / SR); let y = 0; return a.map(x => (y += k * (x - y))); };
  const hp = (a, fc) => { const l = lp(a, fc); return a.map((x, i) => x - l[i]); };
  const lpv = (a, fcf) => { let y = 0; return a.map((x, i) => { const k = 1 - Math.exp(-2 * Math.PI * fcf(i / a.length) / SR); return (y += k * (x - y)); }); };
  const env = (p, att, rel) => (p < att ? p / att : Math.pow(1 - (p - att) / (1 - att), rel));
  const fade = (a, fi = 0.2, fo = 0.25) => a.map((x, i) => x * Math.min(1, i / (fi * SR), (a.length - i) / (fo * SR)));
  const fx = {
    whoosh: () => { const n = gen(0.5, () => noise()); const f = lpv(n, p => 300 + 5000 * Math.sin(p * Math.PI)); return hp(f, 150).map((x, i, a) => x * env(i / a.length, 0.6, 2) * 0.9); },
    hit: () => gen(0.55, t => (Math.sin(2 * Math.PI * (70 * Math.exp(-t * 6) + 38) * t) * Math.exp(-t * 6) + (t < 0.01 ? noise() * 0.6 * (1 - t / 0.01) : 0)) * 0.95),
    boomSoft: () => gen(0.8, t => Math.sin(2 * Math.PI * (45 + 25 * Math.exp(-t * 8)) * t) * Math.exp(-t * 4) * 0.8),
    snap: () => hp(gen(0.05, (t, p) => noise() * Math.pow(1 - p, 3)), 2500).map(x => x * 0.7),
    pop: () => gen(0.13, t => Math.sin(2 * Math.PI * (900 * Math.exp(-t * 30) + 260) * t) * Math.exp(-t * 28) * 0.6),
    popBig: () => gen(0.3, t => (Math.sin(2 * Math.PI * (700 * Math.exp(-t * 18) + 180) * t) * Math.exp(-t * 14) + Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 20) * 0.3) * 0.7),
    beep: () => gen(0.14, (t, p) => Math.sign(Math.sin(2 * Math.PI * 1150 * t)) * 0.18 * (p < 0.9 ? 1 : (1 - p) * 10)),
    shutter: () => hp(gen(0.12, t => (t < 0.012 || (t > 0.06 && t < 0.075) ? noise() : 0)), 1800).map(x => x * 0.6),
    tick: () => hp(gen(0.018, (t, p) => noise() * (1 - p)), 3000).map(x => x * 0.35),
    ding: () => gen(1.2, t => [[1, 1], [2.76, 0.4], [5.4, 0.2]].reduce((s, [m, g]) => s + Math.sin(2 * Math.PI * 1318 * m * t) * g * Math.exp(-t * (3 + m)), 0) * 0.32),
    buzz: () => gen(0.35, (t, p) => (Math.sign(Math.sin(2 * Math.PI * 110 * t)) * 0.5 + Math.sin(2 * Math.PI * 165 * t) * 0.5) * 0.22 * (1 - p)),
    sparkle: () => { const out = new Float32Array(Math.round(1.4 * SR)); [1046, 1318, 1568, 2093, 2637].forEach((f, k) => { const s = Math.round(k * 0.07 * SR); for (let i = 0; i + s < out.length; i++) { const t = i / SR; out[i + s] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5) * 0.22; } }); return out; },
    blip: e => { const f = 440 * Math.pow(2, ((e.n || 0) % 12) / 12 + 0.5); return gen(0.12, t => (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 30) * 0.28); },
    rise: e => { const f = 330 * Math.pow(2, ((e.n || 0) * 2) / 12); return gen(0.35, (t, p) => Math.sin(2 * Math.PI * f * (1 + p * 0.5) * t) * Math.sin(p * Math.PI) * 0.25); },
    suck: () => { const f = lpv(gen(0.6, () => noise()), p => 4000 * Math.pow(1 - p, 2) + 200); return f.map((x, i) => x * env(i / f.length, 0.2, 1.5) * 0.5); },
    bag: () => gen(0.45, t => (Math.sin(2 * Math.PI * (120 * Math.exp(-t * 12) + 60) * t) * Math.exp(-t * 9) + (t < 0.02 ? noise() * 0.5 : 0)) * 0.9),
    swish: () => { const f = lpv(gen(0.28, () => noise()), p => 600 + 2500 * Math.sin(p * Math.PI)); return hp(f, 300).map((x, i) => x * Math.sin(i / f.length * Math.PI) * 0.35); },
    rustle: () => hp(gen(0.9, (t, p) => noise() * (0.3 + 0.7 * Math.abs(Math.sin(t * 40))) * Math.sin(p * Math.PI)), 2000).map(x => x * 0.35),
    pour: () => { const f = lpv(gen(1.6, () => noise()), p => 1800 + 600 * Math.sin(p * 20)); return fade(hp(f, 400).map(x => x * 0.55), 0.1, 0.3); },
    hiss: () => fade(hp(gen(1.4, () => noise()), 5000).map(x => x * 0.12), 0.3, 0.6),
    shake: () => hp(gen(0.8, t => noise() * Math.max(0, Math.sin(t * 2 * Math.PI * 7)) ** 3), 1500).map(x => x * 0.5),
    clink: () => gen(0.5, t => (Math.sin(2 * Math.PI * 2400 * t) + 0.6 * Math.sin(2 * Math.PI * 3710 * t)) * Math.exp(-t * 14) * 0.22),
    clank: () => gen(0.4, t => (Math.sin(2 * Math.PI * 180 * t) * 0.6 + noise() * 0.3) * Math.exp(-t * 12) * 0.6),
    birds: () => { const out = new Float32Array(Math.round(0.9 * SR)); for (let k = 0; k < 3; k++) { const s = Math.round((k * 0.18 + rnd() * 0.05) * SR), f0 = 2600 + rnd() * 900; for (let i = 0; i < 0.11 * SR; i++) { const t = i / SR; out[s + i] += Math.sin(2 * Math.PI * (f0 + 9000 * t) * t) * Math.sin(Math.PI * t / 0.11) * 0.12; } } return out; },
    crackle: e => fade(hp(gen(e.d || 2, () => (rnd() < 0.0016 ? noise() * 1.5 : 0) + noise() * 0.02), 900).map(x => x * 0.5)),
    rumble: e => { let b = 0; const a = gen(e.d || 2, t => { b = 0.98 * b + 0.02 * noise(); return b * (1 + 0.3 * Math.sin(2 * Math.PI * 9 * t)); }); return fade(lp(a, 140).map(x => x * 3.2), 0.4, 0.25); },
    hum: e => fade(gen(e.d || 2, t => (Math.sin(2 * Math.PI * 100 * t) * 0.5 + Math.sin(2 * Math.PI * 200 * t) * 0.2) * 0.08 * (1 + 0.2 * Math.sin(t * 3)))),
    clock: e => { const d = e.d || 2; const out = new Float32Array(Math.round(d * SR)); for (let t = 0; t < d; t += 0.25) { const s = Math.round(t * SR); for (let i = 0; i < 0.02 * SR && s + i < out.length; i++) out[s + i] += Math.sin(2 * Math.PI * 3000 * i / SR) * Math.exp(-i / SR * 200) * 0.3; } return out; },
    waves: e => { let b = 0; return fade(gen(e.d || 2, t => { b = 0.97 * b + 0.03 * noise(); return (noise() * 0.15 + b) * (0.4 + 0.6 * Math.pow(Math.sin(t * 0.9) * 0.5 + 0.5, 2)) * 0.5; })); },
    keys: e => { const d = e.d || 2; const out = new Float32Array(Math.round(d * SR)); let t = 0.1; while (t < d) { const s = Math.round(t * SR); for (let i = 0; i < 0.015 * SR && s + i < out.length; i++) out[s + i] += noise() * Math.exp(-i / SR * 400) * 0.25; t += 0.08 + rnd() * 0.18; } return hp(out, 1500); }
  };
  const pans = { whoosh: 0, swish: 0.3, birds: -0.4 };
  function sfx(cues) { const B = buf(); for (const e of cues) { const f = fx[e.type]; if (!f) continue; add(B, Math.max(0, e.t), f(e), e.gain || 1, e.type === 'blip' ? ((e.n % 2) ? 0.35 : -0.35) : (pans[e.type] || 0)); } return B; }
  function music(style = {}) {
    const M = buf(), bpm = style.bpm || 112, beat = 60 / bpm;
    const kick = gen(0.35, t => Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 9) * 0.9);
    const shaker = hp(gen(0.06, (t, p) => noise() * Math.pow(1 - p, 2)), 5000).map(x => x * 0.18);
    const mar = f => gen(0.5, t => (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * 4 * f * t) * Math.exp(-t * 30)) * Math.exp(-t * 7) * 0.22);
    const progs = { minor: [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]], major: [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]], latin: [[50, 53, 57, 62], [55, 59, 62, 67], [48, 52, 55, 60], [57, 61, 64, 69]] };
    const chords = progs[style.mood || 'minor'] || progs.minor; const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    for (let b = 0; b * beat < totalSec + 1; b++) { const t = b * beat, ch = chords[Math.floor(b / 4) % 4];
      if (t > 0.1) add(M, t, kick, b % 4 === 0 ? 1 : 0.75);
      add(M, t + beat / 2, shaker, 1, 0.3); add(M, t + beat / 4, shaker, 0.5, -0.3); add(M, t + 3 * beat / 4, shaker, 0.5, -0.3);
      for (let k = 0; k < 2; k++) add(M, t + k * beat / 2, mar(hz(ch[(b * 2 + k) % 4] + 12)), 0.8, k ? 0.25 : -0.25);
      if (b % 4 === 0) add(M, t, gen(beat * 3.5, tt => Math.sin(2 * Math.PI * hz(ch[0] - 12) * tt) * Math.exp(-tt * 1.2) * 0.35)); }
    for (let i = 0; i < LEN; i++) { const f = Math.min(1, Math.max(0, (totalSec + 0.4 - i / SR) / 0.8)); M[0][i] *= f; M[1][i] *= f; }
    return M;
  }
  function writeWav(file, B) { let peak = 0; for (const ch of B) for (const x of ch) peak = Math.max(peak, Math.abs(x)); const g = peak > 0.98 ? 0.98 / peak : 1, n = B[0].length, data = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++) { data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, B[0][i] * g)) * 32767), i * 4); data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, B[1][i] * g)) * 32767), i * 4 + 2); }
    const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
    fs.writeFileSync(file, Buffer.concat([h, data])); }
  return { sfx, music, writeWav, types: Object.keys(fx) };
}
module.exports = { make };
