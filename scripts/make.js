// script (docs/SCRIPT.md) or spec -> spec.json for the active style. usage: node scripts/make.js <script.json> [outDir] [--style name] [--build]
const fs = require('fs'), path = require('path'); const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
function activeStyle(override) { if (override) return override; if (process.env.REEL_STYLE) return process.env.REEL_STYLE; try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'styles', 'active.json'), 'utf8')).style; } catch { return 'flat2d'; } }
function isScript(j) { return Array.isArray(j.segments) && j.segments.some(s => s.visual || s.visuals); }
// a reaction may name its person by role ({ type: 'reaction', role: 'suegra' }): it becomes the index of that role in the last scene
function withReactionRoles(j0) { const j = JSON.parse(JSON.stringify(j0)); let last = [];
  (j.segments || []).forEach(sg => (sg.visuals || [sg.visual]).filter(Boolean).forEach(v => { const sc = v.type === 'mistake' ? v.over : v; if (sc && sc.type === 'scene' && (sc.people || []).length) last = sc.people.map(p => p.role);
    if (sc && sc.type === 'scene' && !sc.pass && !sc.label && !sc.focus && (sc.people || []).length > 1) { const t = String(sg.text || '').toLowerCase(); const RW = require(path.join(ROOT, 'styles', 'lexicon.js')).ROLE_WORDS; const hit = RW.filter(([re]) => re.test(t)).map(([re, rs]) => ({ at: t.search(re), rs })).sort((a, b) => a.at - b.at)[0]; if (hit) { const i = sc.people.findIndex(p => hit.rs.includes(p.role)); if (i > 0) sc.people.unshift(sc.people.splice(i, 1)[0]); } if (sc.people.length) last = sc.people.map(p => p.role); }
    if (v.type === 'reaction' && v.role && v.who == null) { const i = last.indexOf(v.role); if (i >= 0) v.who = i; } })); return j; }
function toSpec(j, styleName) { if (!isScript(j)) return j; const mod = path.join(ROOT, 'styles', styleName + '.js'); if (!fs.existsSync(mod)) throw new Error('style ' + styleName + ' has no translator styles/' + styleName + '.js');
  j = withReactionRoles(j); const lx = require(path.join(ROOT, 'styles', 'lexicon.js')).applyLexicon(j, styleName); const spec = require(mod).toSpec(lx.script); spec.style_used = styleName; if (lx.missing.length) spec.missing = lx.missing;
  // designed thumbnail (cover): the script's thumb (lines in big letters) or its first headline + title
  spec.thumb = j.thumb || { lines: [((j.segments || [])[0] || {}).headline || j.title || ''].filter(Boolean) }; spec.title = spec.title || j.title; return spec; }
module.exports = { activeStyle, isScript, toSpec };
if (require.main === module) {
  const a = process.argv.slice(2); const si = a.indexOf('--style'); const style = activeStyle(si >= 0 ? a[si + 1] : null); const build = a.includes('--build');
  const src = a[0]; const j = JSON.parse(fs.readFileSync(src, 'utf8')); const out = a[1] && !a[1].startsWith('--') ? a[1] : path.join(ROOT, 'work', path.basename(src, '.json') + '_' + style);
  fs.mkdirSync(out, { recursive: true }); const spec = toSpec(j, style); fs.writeFileSync(path.join(out, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('spec ->', path.join(out, 'spec.json'), '(style ' + style + ')');
  if (build) { const r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(out, 'spec.json')], { stdio: 'inherit' }); process.exit(r.status || 0); }
}
