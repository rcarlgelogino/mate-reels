// Review material for one built reel (or the newest one).
// Usage: node tools/review.js [outbox/<date>/<folder>]
// Writes into that folder: review_hook.png (frames 0-2.5 s), review_strip.png (one frame every 3 s),
// review.json (retention numbers from timeline.json + audio gaps). Prints a short summary.
const fs = require('fs'), path = require('path'), { execFileSync, spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), FF = require(path.join(ROOT, 'tools', 'node_modules', 'ffmpeg-static'));
let dir = process.argv[2] && path.resolve(ROOT, process.argv[2]);
if (!dir) { // newest final.mp4 in outbox
  let best = null; const ob = path.join(ROOT, 'outbox');
  for (const d of fs.readdirSync(ob)) { const dd = path.join(ob, d); if (!fs.statSync(dd).isDirectory()) continue;
    for (const f of fs.readdirSync(dd)) { const p = path.join(dd, f, 'final.mp4'); if (fs.existsSync(p)) { const m = fs.statSync(p).mtimeMs; if (!best || m > best.m) best = { m, dir: path.join(dd, f) }; } } }
  if (!best) { console.log('no final.mp4 found'); process.exit(1); } dir = best.dir;
}
const mp4 = path.join(dir, 'final.mp4'), tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
const ff = a => execFileSync(FF, ['-y', '-v', 'error', ...a]);
ff(['-t', '2.5', '-i', mp4, '-vf', 'fps=2,scale=216:-1,tile=5x1', '-frames:v', '1', path.join(dir, 'review_hook.png')]);
ff(['-i', mp4, '-vf', 'fps=1/3,scale=180:-1,tile=8x2', '-frames:v', '1', path.join(dir, 'review_strip.png')]);
const sd = spawnSync(FF, ['-v', 'info', '-i', mp4, '-af', 'silencedetect=n=-40dB:d=0.35', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const silences = [...sd.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map(m => ({ at: +(+m[1]).toFixed(2), dur: +(+m[2]).toFixed(2) }));
const r = (x) => +x.toFixed(2), T = tl.shots.reduce((m, s) => Math.max(m, s.start + s.dur), 0);
const durs = tl.shots.map(s => s.dur), words = tl.words || [], co = (tl.callouts || []).filter(c => c.type !== 'pill');
const impacts = co.filter(c => c.impact).map(c => r(c.t0));
const gaps = []; for (let i = 1; i < impacts.length; i++) gaps.push(r(impacts[i] - impacts[i - 1]));
// seconds without any callout on screen
let bare = 0, longestBare = 0, run = 0; for (let t = 0; t < T; t += 0.1) { const on = co.some(c => t >= c.t0 && t <= (c.t1 ?? c.t0 + 1.5)); if (on) run = 0; else { bare += 0.1; run += 0.1; longestBare = Math.max(longestBare, run); } }
const repeats = []; for (let i = 1; i < tl.shots.length; i++) { const a = tl.shots[i - 1], b = tl.shots[i]; if (a.tpl === b.tpl && JSON.stringify(a.p) === JSON.stringify(b.p)) repeats.push(r(b.start)); }
const segEnd = s => Math.max(...words.filter(w => w.seg === s).map(w => w.t + (w.d || 0)), 0);
const out = {
  video: path.relative(ROOT, mp4), duration: r(T), shots: tl.shots.length,
  hook: { firstWord: words[0] ? r(words[0].t) : null, firstCallout: co[0] ? r(co[0].t0) : null, firstCut: tl.shots[1] ? r(tl.shots[1].start) : null, hookImpact: impacts[0] ?? null },
  openLoopSegment2Ends: r(segEnd(1)),
  pace: { avgShot: r(durs.reduce((a, b) => a + b, 0) / durs.length), maxShot: r(Math.max(...durs)), shotsOver3s: durs.filter(d => d > 3).length },
  rehooks: { impactsAt: impacts, gaps, over10s: gaps.filter(g => g > 10).length },
  payoff: impacts.length ? impacts[impacts.length - 1] : null,
  callouts: { count: co.length, byType: co.reduce((m, c) => (m[c.type] = (m[c.type] || 0) + 1, m), {}), secondsBare: r(bare), longestBare: r(longestBare) },
  sound: { cues: (tl.cues || []).length, cueTypes: [...new Set((tl.cues || []).map(c => c.type))], silences },
  sameShotBackToBack: repeats,
  lastWords: words.filter(w => w.seg === Math.max(...words.map(x => x.seg))).map(w => w.w).join(' ')
};
fs.writeFileSync(path.join(dir, 'review.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
