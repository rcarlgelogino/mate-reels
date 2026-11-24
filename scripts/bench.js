// Benchmark: the same 3 scripts in all 3 styles, 12 fixed moments each, so every style change is compared before/after on identical pictures.
// usage: node scripts/bench.js <label> [--only flat2d,pixel8,build3d] [--scripts story,list,pov] [--base <label>]
//   -> work/bench/<label>/<style>_<script>.jpg (12 frames, 6x2) and, with --base, cmp_<style>_<script>.jpg (base on top, new below)
// Uses the test voice (edge) and --sheet-only builds: nothing is posted, the queue is not touched.
const fs = require('fs'), path = require('path'), http = require('http'); const { spawnSync, execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const MK = require('./make'); const TOOLS = path.join(ROOT, 'tools', 'node_modules');
const SCRIPTS = { story: 'done/2026-11-19/0019_tu_suegra_y_el_mate_hirviendo.json', list: 'queue/0034_los_seis_de_toda_ronda.json', pov: 'done/2026-11-20/0030p_pov_tu_suegra_te_ceba.json', tiles: 'queue/0028_si_tu_mate_se_tapa.json' }; // tiles: only with --scripts tiles (✓/✗ headlines over the picture)
const FRACS = [0.03, 0.1, 0.18, 0.26, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.84, 0.95];
const a = process.argv.slice(2); const label = a[0] || 'run'; const arg = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const styles = (arg('--only') || 'flat2d,pixel8,build3d').split(','); const keep = arg('--scripts') ? arg('--scripts').split(',') : null; const base = arg('--base');
const OUT = path.join(ROOT, 'work', 'bench', label); fs.mkdirSync(OUT, { recursive: true });
const FF = require(path.join(TOOLS, 'ffmpeg-static'));
async function grab(dir, outFile) { const puppeteer = require(path.join(TOOLS, 'puppeteer'));
  const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : p.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' }); r.end(d); }); }); await new Promise(r => srv.listen(0, r));
  const b = await puppeteer.launch({ headless: true, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'] }); const pg = await b.newPage(); const kill = setTimeout(() => { console.log('TIMEOUT grab', outFile); b.process() && b.process().kill(); }, 240000);
  try { await pg.goto(`http://127.0.0.1:${srv.address().port}/engine/index.html`); await pg.waitForFunction('window.__engineReady===true', { timeout: 120000 });
    const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')); await pg.evaluate(t => window.__engine.init(t), tl); const times = FRACS.map(f => +(f * tl.total).toFixed(2));
    const d = await pg.evaluate(async ts => { const E = window.__engine; const cw = 270, ch = 480, c = document.createElement('canvas'); c.width = cw * 6; c.height = ch * 2; const g = c.getContext('2d');
      for (let i = 0; i < ts.length; i++) { const u = E.jpeg(ts[i], 0.8); const im = new Image(); await new Promise(r => { im.onload = r; im.src = u; }); g.drawImage(im, (i % 6) * cw, Math.floor(i / 6) * ch, cw, ch); g.fillStyle = '#ffd84a'; g.font = 'bold 22px sans-serif'; g.fillText(ts[i] + 's', (i % 6) * cw + 6, Math.floor(i / 6) * ch + 24); }
      return c.toDataURL('image/jpeg', 0.85); }, times); fs.writeFileSync(outFile, Buffer.from(d.split(',')[1], 'base64')); }
  finally { clearTimeout(kill); await b.close().catch(() => {}); srv.close(); } }
(async () => { for (const st of styles) for (const [name, file] of Object.entries(SCRIPTS)) { if (keep ? !keep.includes(name) : name === 'tiles') continue; const key = `${st}_${name}`; const dir = path.join(ROOT, 'work', 'bench', label, key); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    try { const spec = MK.toSpec(JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')), st); spec.tts = 'edge'; fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
      const r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(dir, 'spec.json'), '--sheet-only'], { encoding: 'utf8', timeout: 400000 }); if (r.status !== 0) { console.log('FAIL build', key, (r.stderr || '').slice(-300)); continue; }
      const jpg = path.join(OUT, key + '.jpg'); await grab(dir, jpg); console.log('ok', key);
      if (base) { const bj = path.join(ROOT, 'work', 'bench', base, key + '.jpg'); if (fs.existsSync(bj)) execFileSync(FF, ['-y', '-v', 'error', '-i', bj, '-i', jpg, '-filter_complex', 'vstack=inputs=2', path.join(OUT, 'cmp_' + key + '.jpg')]); } }
    catch (e) { console.log('FAIL', key, e.message.slice(0, 200)); } } })();
