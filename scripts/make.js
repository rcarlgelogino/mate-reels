// script (docs/SCRIPT.md) or spec -> spec.json for the active style. usage: node scripts/make.js <script.json> [outDir] [--style name] [--build]
const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
function activeStyle(override) { if (override) return override; if (process.env.REEL_STYLE) return process.env.REEL_STYLE; try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'active.json'), 'utf8')).style; } catch { return 'flat2d'; } }
function isScript(j) { return Array.isArray(j.segments) && j.segments.some(s => s.visual || s.visuals); }
function toSpec(j, styleName) { if (!isScript(j)) return j; const mod = path.join(ROOT, 'styles', styleName + '.js'); if (!fs.existsSync(mod)) throw new Error('style ' + styleName + ' has no translator styles/' + styleName + '.js');
  const spec = require(mod).toSpec(j); spec.style_used = styleName; return spec; }
module.exports = { activeStyle, isScript, toSpec };
if (require.main === module) {
  const a = process.argv.slice(2); const si = a.indexOf('--style'); const style = activeStyle(si >= 0 ? a[si + 1] : null); const build = a.includes('--build');
  const src = a[0]; const j = JSON.parse(fs.readFileSync(src, 'utf8')); const out = a[1] && !a[1].startsWith('--') ? a[1] : path.join(ROOT, 'work', path.basename(src, '.json') + '_' + style);
  fs.mkdirSync(out, { recursive: true }); const spec = toSpec(j, style); fs.writeFileSync(path.join(out, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('spec ->', path.join(out, 'spec.json'), '(style ' + style + ')');
  if (build) { const r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(out, 'spec.json')], { stdio: 'inherit' }); process.exit(r.status || 0); }
}
