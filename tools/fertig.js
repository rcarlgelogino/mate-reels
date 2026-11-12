// Copies every finished reel into fertig/ with a running version tag.
// Usage (from the project folder): node tools/fertig.js
// - outbox/<date>/<folder>/final.mp4  ->  fertig/v###_<date>_<folder>.mp4 (+ .txt caption)
// - root *.mp4 (early prototypes) are tagged too, once.
// A rebuilt video (newer file) gets a new version number; unchanged videos are skipped.
// fertig/index.json is the manifest (version, file, source, date, topic, variant, lang, duration).
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'fertig'), IDX = path.join(OUT, 'index.json');
fs.mkdirSync(OUT, { recursive: true });
const idx = fs.existsSync(IDX) ? JSON.parse(fs.readFileSync(IDX, 'utf8')) : [];
const seen = new Set(idx.map(e => e.source + '|' + e.mtime));
let next = idx.reduce((m, e) => Math.max(m, e.version), 0) + 1;
const pad = n => String(n).padStart(3, '0');
const items = [];
for (const f of fs.readdirSync(ROOT).filter(f => /\.mp4$/i.test(f)).sort())
  items.push({ src: path.join(ROOT, f), name: path.basename(f, '.mp4'), date: '', folder: path.basename(f, '.mp4') });
const ob = path.join(ROOT, 'outbox');
if (fs.existsSync(ob)) for (const d of fs.readdirSync(ob).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()) {
  // posting order first (schedule.json), then any other folders
  const dd = path.join(ob, d); let order = [];
  try { order = JSON.parse(fs.readFileSync(path.join(dd, 'schedule.json'), 'utf8')).map(s => s.file.split('/')[0]); } catch {}
  const folders = fs.readdirSync(dd).filter(f => fs.existsSync(path.join(dd, f, 'final.mp4')));
  folders.sort((a, b) => ((order.indexOf(a) + 1) || 99) - ((order.indexOf(b) + 1) || 99) || a.localeCompare(b));
  for (const f of folders) items.push({ src: path.join(dd, f, 'final.mp4'), name: d + '_' + f, date: d, folder: f, dir: path.join(dd, f) });
}
const added = [];
for (const it of items) {
  const rel = path.relative(ROOT, it.src).replace(/\\/g, '/'), mtime = Math.round(fs.statSync(it.src).mtimeMs);
  if (seen.has(rel + '|' + mtime)) continue;
  const v = next++, stem = 'v' + pad(v) + '_' + it.name;
  fs.copyFileSync(it.src, path.join(OUT, stem + '.mp4'));
  const e = { version: v, file: stem + '.mp4', source: rel, mtime, date: it.date };
  if (it.dir) {
    const m = it.folder.match(/^(t\d+)_([AB])(?:_(\w+))?$/); if (m) { e.topic = m[1]; e.variant = m[2]; }
    try { const s = JSON.parse(fs.readFileSync(path.join(it.dir, 'spec.json'), 'utf8')); e.lang = (s.voice || 'en-US').slice(0, 5); e.ab = s.ab; } catch {}
    try { e.duration = JSON.parse(fs.readFileSync(path.join(it.dir, 'result.json'), 'utf8')).duration; } catch {}
    const cap = path.join(it.dir, 'caption.txt'); if (fs.existsSync(cap)) { fs.copyFileSync(cap, path.join(OUT, stem + '.txt')); e.caption = stem + '.txt'; }
  }
  idx.push(e); added.push(e.file);
}
fs.writeFileSync(IDX, JSON.stringify(idx, null, 1));
console.log(added.length ? 'added ' + added.length + ':\n' + added.join('\n') : 'nothing new', '\ntotal', idx.length);
