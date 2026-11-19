// Daily automation: build the next N reels from queue/ and collect them in out/<date>/ for the GitHub release.
// usage: node scripts/daily.js [--count 3] [--test]
//   queue/*.json   reel specs waiting to be built (sorted by file name; prefix them 0001_, 0002_, ...)
//   done/<date>/   specs that were built successfully (moved here, committed back by the workflow)
//   out/<date>/    final MP4 + caption per reel (uploaded as a GitHub release, not committed)
// --test builds samples/test_reel.json instead of the queue (nothing is moved).
const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const MK = require('./make'); const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const COUNT = +arg('--count', process.env.REELS_PER_DAY || 3); const TEST = process.argv.includes('--test');
const day = new Date().toISOString().slice(0, 10); const OUT = path.join(ROOT, 'out', day); fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const summary = []; const sum = s => { summary.push(s); log(s); };
let jobs;
if (TEST) jobs = [path.join(ROOT, 'samples', 'test_reel.json')];
else jobs = null;
// ---- rotation: slots of the day (COUNT built here + one 3D slot built by scripts/ab3d.js); topics already started get a style they do not have yet
const ROT = path.join(ROOT, 'rotation'), STATE = path.join(ROT, 'state.json'); const STYLES = ['flat2d', 'pixel8', 'build3d'];
let state = {}; try { state = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
const doy0 = Math.floor((Date.parse(day) - Date.parse(day.slice(0, 4) + '-01-01')) / 864e5);
const slots = ['build3d', 'pixel8', 'flat2d']; for (let k = 3; k < COUNT + 1; k++) slots.push(k % 2 === doy0 % 2 ? 'flat2d' : 'pixel8'); if (process.env.PIXEL_DAILY === '0') slots.splice(slots.indexOf('pixel8'), 1, 'flat2d');
const plan = [];
if (!TEST) { const used = new Set(); const qd = path.join(ROOT, 'queue'); const queue = fs.existsSync(qd) ? fs.readdirSync(qd).filter(f => f.endsWith('.json')).sort() : [];
  const started = Object.keys(state).filter(n => fs.existsSync(path.join(ROT, n + '.json'))).sort((a, b) => (state[a].first || '').localeCompare(state[b].first || '') || a.localeCompare(b));
  for (const st of slots) { let name = started.find(n => !used.has(n) && !(state[n].styles || []).includes(st)); let file;
    if (name) file = path.join(ROT, name + '.json'); else { const q = queue.find(f => !used.has(f.replace(/\.json$/, ''))); if (!q) continue; name = q.replace(/\.json$/, ''); file = path.join(qd, q); }
    used.add(name); plan.push({ name, file, style: st, fresh: file.startsWith(qd) }); } }
jobs = TEST ? [path.join(ROOT, 'samples', 'test_reel.json')] : plan.filter(p => p.style !== 'build3d').map(p => p.file);
const styleOf = file => (plan.find(p => p.file === file) || {}).style;
const job3d = plan.find(p => p.style === 'build3d');
log('plan of the day: ' + plan.map(p => `${p.style}=${p.name}${p.fresh ? ' (new)' : ''}`).join(', '));
if (process.argv.includes('--plan')) process.exit(0); // only show the plan
// a topic that starts today moves from queue/ to rotation/ (the queue stays the list of topics nobody has seen yet)
const markDone = p => { fs.mkdirSync(ROT, { recursive: true }); const dst = path.join(ROT, p.name + '.json'); if (p.fresh && fs.existsSync(p.file)) { fs.copyFileSync(p.file, dst); } const e = state[p.name] = state[p.name] || { first: day, styles: [] }; if (!e.styles.includes(p.style)) e.styles.push(p.style);
  if (STYLES.every(x => e.styles.includes(x))) { try { fs.unlinkSync(dst); } catch {} delete state[p.name]; } fs.writeFileSync(STATE, JSON.stringify(state, null, 1)); };
if (job3d && !TEST) { const sj = JSON.parse(fs.readFileSync(job3d.file, 'utf8')); fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'ab3d.json'), JSON.stringify({ name: job3d.name, n: jobs.length + 1, test: false, script: sj }, null, 1));
  const dd = path.join(ROOT, 'done', day); fs.mkdirSync(dd, { recursive: true }); fs.writeFileSync(path.join(dd, '_3d.json'), JSON.stringify({ name: job3d.name, n: jobs.length + 1, script: sj }, null, 1));
  if (job3d.fresh) { fs.copyFileSync(job3d.file, path.join(dd, path.basename(job3d.file))); } markDone(job3d); if (job3d.fresh) try { fs.unlinkSync(job3d.file); } catch {} }
if (!jobs.length) { sum('Queue is empty: no reels to build today. Add specs to queue/.'); fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), summary.join('\n') + '\n'); process.exit(0); }
let ok = 0;
jobs.forEach((specFile, i) => { try {
  const name = path.basename(specFile, '.json'); const work = path.join(ROOT, 'work', name); fs.mkdirSync(work, { recursive: true });
  // visual learnings of earlier reels pick better pictures for this script (text locked; falls back to the original)
  const improved = path.join(work, 'script.improved.json'); try { fs.unlinkSync(improved); } catch {}
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'improve.js'), specFile, improved], { stdio: 'inherit', timeout: 5 * 60 * 1000 });
  const scriptFile = fs.existsSync(improved) ? improved : specFile;
  const scriptJson = JSON.parse(fs.readFileSync(scriptFile, 'utf8')); const style = TEST ? MK.activeStyle() : (styleOf(specFile) || MK.activeStyle()); const outName = style === 'pixel8' ? name + '_px' : name; const spec = MK.toSpec(scriptJson, style); fs.writeFileSync(path.join(work, 'spec.json'), JSON.stringify(spec, null, 1));
  log(`building ${i + 1}/${jobs.length}: ${name}`);
  try { const L = require('./lint').lint(scriptJson); if (L.out.length) log('retention check (docs/WATCHTIME.md, does not block): ' + L.out.join(' | ')); } catch (e) { log('retention check skipped: ' + e.message); }
  let r; for (let a = 1; a <= 2; a++) { r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(work, 'spec.json')], { stdio: 'inherit', timeout: 75 * 60 * 1000 }); if (r.status === 0) break; log(`build failed (attempt ${a}), exit ${r.status}`); if (a === 1) spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},120000)']); }
  const mp4 = path.join(work, 'final.mp4');
  if (r.status !== 0 || !fs.existsSync(mp4)) { sum(`- ❌ ${name}: build failed (e.g. no Gemini voice), spec stays in the queue for the next run`); return; }
  const res = JSON.parse(fs.readFileSync(path.join(work, 'result.json'), 'utf8'));
  // visual analysis after the build: only for learning, never holds a reel back. Kept in qa/<day>/ (json + readable md)
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'qa.js'), work], { stdio: 'inherit', timeout: 10 * 60 * 1000 });
  let qa = null; try { qa = JSON.parse(fs.readFileSync(path.join(work, 'qa.json'), 'utf8')); const qd = path.join(ROOT, 'qa', day); fs.mkdirSync(qd, { recursive: true }); const base = path.join(qd, (TEST ? 'TEST_' : '') + name);
    fs.writeFileSync(base + '.json', JSON.stringify(qa, null, 1)); if (fs.existsSync(path.join(work, 'qa.md'))) fs.copyFileSync(path.join(work, 'qa.md'), base + '.md');
    if (fs.existsSync(path.join(work, 'qa_frames.jpg'))) fs.copyFileSync(path.join(work, 'qa_frames.jpg'), base + '.jpg'); } catch {}
  const qaNote = qa ? ` · visual analysis: ${qa.issues.length} issue(s)${qa.scores && qa.scores.overall ? ', ' + qa.scores.overall + '/10' : ''}` : '';
  const impNote = scriptFile === improved ? ' · visuals adjusted from learnings' : '';
  if (!TEST && scriptFile === improved) { const dd = path.join(ROOT, 'done', day); fs.mkdirSync(dd, { recursive: true }); fs.copyFileSync(improved, path.join(dd, name + '.improved.json')); }
  fs.copyFileSync(mp4, path.join(OUT, `${String(i + 1).padStart(2, '0')}_${outName}.mp4`));
  if (fs.existsSync(path.join(work, 'caption.txt'))) fs.copyFileSync(path.join(work, 'caption.txt'), path.join(OUT, `${String(i + 1).padStart(2, '0')}_${outName}.txt`));
  if (fs.existsSync(path.join(work, 'cover.jpg'))) fs.copyFileSync(path.join(work, 'cover.jpg'), path.join(OUT, `${String(i + 1).padStart(2, '0')}_${outName}.jpg`));
  if (!TEST) { const dd = path.join(ROOT, 'done', day); fs.mkdirSync(dd, { recursive: true }); const p = plan.find(x => x.file === specFile); fs.copyFileSync(specFile, path.join(dd, name + (style === 'flat2d' ? '' : '.' + style) + '.json')); fs.writeFileSync(path.join(dd, outName + '.result.json'), JSON.stringify(res, null, 1)); markDone(p); if (p.fresh) fs.unlinkSync(specFile); }
  ok++; sum(`- ✅ ${name} (style ${spec.style_used || spec.preset || 'custom'}): ${res.duration} s, voice ${res.voice}, ${res.loudness}${res.inTarget ? '' : ' (outside 35-45 s!)'}${qaNote}${impNote}`);
  } catch (e) { sum(`- ❌ ${path.basename(specFile, '.json')}: ${String(e && e.message || e).slice(0, 200)}`); }
});
const left = fs.existsSync(path.join(ROOT, 'queue')) ? fs.readdirSync(path.join(ROOT, 'queue')).filter(f => f.endsWith('.json')).length : 0;
sum(`\n${ok}/${jobs.length} reels built. Specs left in queue: ${left}${left < COUNT * 3 ? ' (running low, add more)' : ''}.`);
spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'qa_summary.js')], { stdio: 'inherit' });
fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), `# Reels ${day}\n\n` + summary.join('\n') + '\n');
process.exit(ok ? 0 : 1);
