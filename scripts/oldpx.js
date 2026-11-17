// Rebuilds an already posted reel in another style with its own posted voice take (no new Gemini call).
// usage: node scripts/oldpx.js <name> [style]   needs work/oldpx/<name>/take.wav (sound of the posted reel) -> work/oldpx/<name>/final.mp4
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process'); const ROOT = path.join(__dirname, '..'); const MK = require('./make.js');
const [name, style = 'pixel8'] = process.argv.slice(2); const day = fs.readdirSync(path.join(ROOT, 'done')).find(d => fs.existsSync(path.join(ROOT, 'done', d, name + '.json'))); if (!day) { console.error('no script', name); process.exit(2); }
const takeDir = path.join(ROOT, 'work', 'oldpx', name), dir = style === 'pixel8' ? takeDir : takeDir + '_' + style; fs.mkdirSync(dir, { recursive: true }); const script = JSON.parse(fs.readFileSync(path.join(ROOT, 'done', day, name + '.json'), 'utf8'));
const spec = MK.toSpec(script, style); spec.takeFile = path.join(takeDir, 'take.wav'); spec.style = { ...(spec.style || {}), musicVol: 0, sfxVol: 0.18 }; if (process.env.PX_LIGHT) spec.style.light = process.env.PX_LIGHT; // the posted sound already has its music
fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1));
const r = spawnSync(process.execPath, [path.join(ROOT, 'pipeline', 'build.js'), path.join(dir, 'spec.json')], { stdio: 'inherit' }); process.exit(r.status);
