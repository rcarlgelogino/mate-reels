// Static check of a 3D shooting script (no rendering): node scripts/check_script.js <script.json> [...]
// Used by the "¿Sabías que?" writer routine (docs/sabias/WRITER.md) before it pushes. Prints every problem; exit 1 if any.
const fs = require('fs'), path = require('path'); const ROOT = path.join(__dirname, '..');
const WORLDS = ['casita', 'patio', 'represa', 'yerbal', 'mapa', 'cancha'];
const FACES = 'neutral smile happy laugh proud sly surprised shock scream angry outraged rage sad worried scared confused disgusted derp dizzy starstruck sip suck determined cry crylaugh mindblown bored pain love wink crazy sleepy'.split(' ');
const FX = ['stream', 'bubbles', 'bigbubble', 'stars', 'notes', 'wavy', 'sparkle', 'sweat', 'drops', 'lump', 'burst', 'debris', 'flood', 'rocket'];
const BUILTIN = ['whoosh', 'hit', 'boomSoft', 'snap', 'pop', 'popBig', 'beep', 'shutter', 'tick', 'ding', 'buzz', 'sparkle', 'blip', 'rise', 'suck', 'bag', 'swish', 'rustle', 'pour', 'hiss', 'shake', 'clink', 'clank', 'birds'];
const libs = new Set(fs.readdirSync(path.join(ROOT, 'assets', 'sfx')).map(f => f.replace(/\.wav$/, '')));
let bad = 0;
for (const file of process.argv.slice(2)) {
  let fb = 0; const E = m => { bad++; fb++; console.log(`${path.basename(file)}: ${m}`); };
  let j; try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { E('not valid JSON: ' + e.message); continue; }
  if (!j.id || !/^[\w-]+$/.test(j.id)) E('id missing or not ascii');
  if (!j.caption || !/Seguime/i.test(j.caption)) E('caption missing or without "Seguime para más datos de mate"');
  const segs = j.segments || []; if (segs.length < 3 || segs.length > 14) E(`${segs.length} segments (3-14)`);
  const words = segs.reduce((a, s) => a + String(s.text || '').split(/\s+/).filter(Boolean).length, 0); const secs = words / 2.8;
  if (secs < 10 || secs > 40) E(`about ${secs.toFixed(0)} s of voice (${words} words); aim for 15-30 s`);
  if (!/seguime/i.test(String((segs[segs.length - 1] || {}).text))) E('last sentence should be "Seguime para más datos de mate."');
  if (/\d/.test(segs.map(s => s.text).join(' '))) E('digits in the spoken text: write numbers in words');
  segs.forEach((sg, si) => { const where = `segment ${si + 1}`;
    if (!sg.text || !String(sg.text).trim()) E(`${where}: no text`);
    if (!Array.isArray(sg.shots) || !sg.shots.length) return E(`${where}: no shots`);
    sg.shots.forEach((sh, k) => { const w = `${where} shot ${k + 1}`; const a = sh.anim; if (!sh.direction || sh.direction.length < 60) E(`${w}: direction missing or too short`);
      if (!a) return E(`${w}: no anim`); if (!WORLDS.includes(a.world)) E(`${w}: world "${a.world}" unknown (${WORLDS.join(', ')})`);
      if (!Array.isArray(a.cam3) || !a.cam3.length) E(`${w}: no cam3`);
      const ids = new Set(); (a.people || []).forEach(p => { if (ids.has(p.id)) E(`${w}: person id ${p.id} twice`); ids.add(p.id); const k0 = (p.keys || [])[0] || {};
        if (k0.u !== 0) E(`${w}: ${p.id} first key must have u: 0`); if (k0.px == null && k0.x == null) E(`${w}: ${p.id} has no position (px/pz)`);
        (p.keys || []).forEach(k => { if (k.face && typeof k.face === 'string' && !FACES.includes(k.face)) E(`${w}: face "${k.face}" unknown`); }); });
      (a.fx || []).forEach(f => { if (!FX.includes(f.kind)) E(`${w}: fx "${f.kind}" unknown`); });
      (a.sounds || []).forEach(s => { const t = String(s.type || 'pop'); if (t.startsWith('lib:')) { if (!libs.has(t.slice(4))) E(`${w}: sound ${t} not in assets/sfx`); } else if (!BUILTIN.includes(t)) E(`${w}: sound "${t}" unknown`); });
      (a.labels || []).forEach(L => { if (!L.text) E(`${w}: label without text`); else if (L.text.length > 28) E(`${w}: label "${L.text}" longer than 28`); if (L.at == null && !L.xy) E(`${w}: label "${L.text}" needs at or xy`); });
      if (a.counter && !(typeof a.counter.to === 'number')) E(`${w}: counter.to must be a number`); if (a.gauge && !(typeof a.gauge.to === 'number')) E(`${w}: gauge.to must be a number`); }); });
  try { require(path.join(ROOT, 'styles', 'stage2d.js')).toSpec(j, 'build3d'); } catch (e) { E('cannot be turned into a spec: ' + e.message); }
  if (!fb) console.log(`${path.basename(file)}: ok (${segs.length} segments, ~${secs.toFixed(0)} s)`);
}
process.exit(bad ? 1 : 0);
