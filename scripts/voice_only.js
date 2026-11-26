// Records only the Charon voice for a script (no video): node scripts/voice_only.js <script.json> [style]
// Writes voice/<id>/take.wav + take.wav.json (Gemini take + Whisper word times). A local build then uses it with spec.takeFile,
// so the video renders here on the PC and only the voice comes from GitHub (where GEMINI_API_KEY lives).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const src = path.resolve(process.argv[2]); const style = process.argv[3] || 'build3d';
const work = path.join(ROOT, 'work', 'voice_only'); fs.mkdirSync(work, { recursive: true });
execFileSync('node', [path.join(ROOT, 'scripts/make.js'), src, work, '--style', style], { stdio: 'inherit' });
const spec = JSON.parse(fs.readFileSync(path.join(work, 'spec.json'), 'utf8'));
const out = path.join(ROOT, 'voice', spec.id); fs.mkdirSync(out, { recursive: true });
(async () => { const GEM = require(path.join(ROOT, 'pipeline/gemini.js'));
  await GEM.narrate(spec, work, (...a) => console.log(...a));
  const take = fs.readdirSync(work).find(f => /^gem_[0-9a-f]+\.wav$/.test(f)); if (!take) throw new Error('no take written');
  fs.copyFileSync(path.join(work, take), path.join(out, 'take.wav')); fs.copyFileSync(path.join(work, take.replace(/\.wav$/, '.json')), path.join(out, 'take.wav.json'));
  fs.writeFileSync(path.join(out, 'text.txt'), spec.segments.map(s => s.say || s.text).join('\n') + '\n');
  console.log('voice ->', path.relative(ROOT, out)); })().catch(e => { console.error(e); process.exit(1); });
