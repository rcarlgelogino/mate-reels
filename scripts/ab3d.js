// A/B: build today's A/B script (picked by daily.js, saved in out/<day>/ab3d.json) a second time in another style (default toy3d).
// Same text, same voice take (narration cache is copied from the 2D build), only the pictures differ. Never touches queue/ or done/.
// usage: node scripts/ab3d.js [--style toy3d] [--day YYYY-MM-DD]   -> out/<day>/NN_<name>_3d.mp4 + .txt
const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const MK = require('./make');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const STYLE = arg('--style', process.env.AB_STYLE || 'toy3d'); const day = arg('--day', new Date().toISOString().slice(0, 10)); const OUT = path.join(ROOT, 'out', day);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const abFile = path.join(OUT, 'ab3d.json'); if (!fs.existsSync(abFile)) { log('no A/B script today (no 2D reel was built)'); process.exit(0); }
const ab = JSON.parse(fs.readFileSync(abFile, 'utf8')); const name = ab.name; const tag = name + '_3d';
const work = path.join(ROOT, 'work', tag); fs.mkdirSync(work, { recursive: true });
const vo2d = path.join(ROOT, 'work', name, 'vo'); if (fs.existsSync(vo2d)) fs.cpSync(vo2d, path.join(work, 'vo'), { recursive: true });
const spec = MK.toSpec(ab.script, STYLE); spec.ab = `A/B ${name}: ${STYLE}`; fs.writeFileSync(path.join(work, 'spec.json'), JSON.stringify(spec, null, 1));
log(`building the ${STYLE} version of ${name}`);
let r; for (let a = 1; a <= 2; a++) { r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(work, 'spec.json')], { stdio: 'inherit', timeout: 150 * 60 * 1000 }); if (r.status === 0) break; log(`build failed (attempt ${a}), exit ${r.status}`); }
const mp4 = path.join(work, 'final.mp4'); const line = s => fs.appendFileSync(path.join(OUT, 'SUMMARY.md'), s + '\n');
if (r.status !== 0 || !fs.existsSync(mp4)) { line(`- ❌ A/B ${STYLE} version of ${name}: build failed`); process.exit(1); }
const res = JSON.parse(fs.readFileSync(path.join(work, 'result.json'), 'utf8'));
// visual analysis for learning only (never blocks), stored next to the 2D one
spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'qa.js'), work], { stdio: 'inherit', timeout: 10 * 60 * 1000 });
try { const qd = path.join(ROOT, 'qa', day); fs.mkdirSync(qd, { recursive: true }); const base = path.join(qd, (ab.test ? 'TEST_' : '') + tag);
  for (const [src, ext] of [['qa.json', '.json'], ['qa.md', '.md'], ['qa_frames.jpg', '.jpg']]) if (fs.existsSync(path.join(work, src))) fs.copyFileSync(path.join(work, src), base + ext); } catch {}
const out = `${String(ab.n).padStart(2, '0')}_${tag}`; fs.copyFileSync(mp4, path.join(OUT, out + '.mp4'));
if (fs.existsSync(path.join(work, 'caption.txt'))) fs.copyFileSync(path.join(work, 'caption.txt'), path.join(OUT, out + '.txt'));
fs.writeFileSync(path.join(OUT, 'ab3d.out'), out + '\n');
line(`- 🅱️ A/B ${STYLE} version of ${name}: ${res.duration} s, voice ${res.voice}, ${res.loudness} (${res.minutes} min render)`);
log('done', out);
