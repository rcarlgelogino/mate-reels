// Daily automation: build the next N reels from queue/ and collect them in out/<date>/ for the GitHub release.
// usage: node scripts/daily.js [--count 3] [--test]
//   queue/*.json   reel specs waiting to be built (sorted by file name; prefix them 0001_, 0002_, ...)
//   done/<date>/   specs that were built successfully (moved here, committed back by the workflow)
//   out/<date>/    final MP4 + caption per reel (uploaded as a GitHub release, not committed)
// --test builds samples/test_reel.json instead of the queue (nothing is moved).
const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const COUNT = +arg('--count', process.env.REELS_PER_DAY || 3); const TEST = process.argv.includes('--test');
const day = new Date().toISOString().slice(0, 10); const OUT = path.join(ROOT, 'out', day); fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const summary = []; const sum = s => { summary.push(s); log(s); };
let jobs;
if (TEST) jobs = [path.join(ROOT, 'samples', 'test_reel.json')];
else { const q = path.join(ROOT, 'queue'); jobs = fs.existsSync(q) ? fs.readdirSync(q).filter(f => f.endsWith('.json')).sort().slice(0, COUNT).map(f => path.join(q, f)) : []; }
if (!jobs.length) { sum('Queue is empty: no reels to build today. Add specs to queue/.'); fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), summary.join('\n') + '\n'); process.exit(0); }
let ok = 0;
jobs.forEach((specFile, i) => {
  const name = path.basename(specFile, '.json'); const work = path.join(ROOT, 'work', name); fs.mkdirSync(work, { recursive: true });
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8')); fs.writeFileSync(path.join(work, 'spec.json'), JSON.stringify(spec, null, 1));
  log(`building ${i + 1}/${jobs.length}: ${name}`);
  let r; for (let a = 1; a <= 2; a++) { r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(work, 'spec.json')], { stdio: 'inherit', timeout: 75 * 60 * 1000 }); if (r.status === 0) break; log(`build failed (attempt ${a}), exit ${r.status}`); }
  const mp4 = path.join(work, 'final.mp4');
  if (r.status !== 0 || !fs.existsSync(mp4)) { sum(`- ❌ ${name}: build failed, spec stays in the queue`); return; }
  const res = JSON.parse(fs.readFileSync(path.join(work, 'result.json'), 'utf8'));
  fs.copyFileSync(mp4, path.join(OUT, `${String(i + 1).padStart(2, '0')}_${name}.mp4`));
  if (fs.existsSync(path.join(work, 'caption.txt'))) fs.copyFileSync(path.join(work, 'caption.txt'), path.join(OUT, `${String(i + 1).padStart(2, '0')}_${name}.txt`));
  if (!TEST) { const dd = path.join(ROOT, 'done', day); fs.mkdirSync(dd, { recursive: true }); fs.renameSync(specFile, path.join(dd, path.basename(specFile))); fs.writeFileSync(path.join(dd, name + '.result.json'), JSON.stringify(res, null, 1)); }
  ok++; sum(`- ✅ ${name}: ${res.duration} s, voice ${res.voice}, ${res.loudness}${res.inTarget ? '' : ' (outside 35-45 s!)'}`);
});
const left = fs.existsSync(path.join(ROOT, 'queue')) ? fs.readdirSync(path.join(ROOT, 'queue')).filter(f => f.endsWith('.json')).length : 0;
sum(`\n${ok}/${jobs.length} reels built. Specs left in queue: ${left}${left < COUNT * 3 ? ' (running low, add more)' : ''}.`);
fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), `# Reels ${day}\n\n` + summary.join('\n') + '\n');
process.exit(ok ? 0 : 1);
