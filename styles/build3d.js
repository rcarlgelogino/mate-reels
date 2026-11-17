// build3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the sunny 3D garden (template build).
// Model: the "how X becomes Y" reels: one world, cartoon people with arms and legs, an object on the table, a cut or camera move every ~1.5 s,
// one word at a time in the middle, technical names as yellow labels, failures as red stamps.
const flat2d = require('./flat2d');
const { norm, person, FACE, ACTS, hashN } = require('./toy3d').helpers;
const CAMS = ['drone', 'push', 'orbit', 'low', 'whip', 'crash'], FACECAMS = ['face', 'push'];
function chooser(seed) { let k = hashN(seed, 97), last = null; return pool => { let c; let n = 0; do { c = pool[(k++) % pool.length]; n++; } while (c === last && n < 5); last = c; return c; }; }
// toy3d look -> cartoon person
function toon(pp, i) { const o = person(pp, i); const q = { shirt: o.shirt, hairColor: o.hairColor, glasses: !!o.glasses, mustache: !!o.mustache, hair: o.hair === 'bob' || o.hair === 'long' ? 'long' : o.hair === 'bun' ? 'bun' : 'short', face: o.face || 'happy' };
  if (o.hat === 'boina' || o.hat === 'cap' || o.hat === 'sombrero') { q.hat = o.hat; q.hatColor = o.hatColor; } if (o.scarf) q.scarf = o.scarf; if (o.apron) q.apron = o.apron; if (o.scale) q.scale = o.scale;
  const d = norm(pp.does); q.pose = o.act === 'drink' ? 'drink' : o.act === 'pour' ? 'present' : d === 'pass' || d === 'offer' ? 'present' : d === 'receive' ? 'present' : ['think', 'point', 'shrug', 'wave', 'cheer', 'laugh', 'shock', 'walk', 'push', 'run', 'dance', 'fly', 'talk'].includes(d) ? d : d === 'no' ? 'shrug' : d === 'jump' ? 'cheer' : d === 'sit' ? 'idle' : o.gest && ['think', 'point', 'shrug'].includes(o.gest) ? o.gest : 'idle';
  if (q.pose === 'drink' || ['mate', 'both', 'termo_brazo'].includes(o.hold)) q.holds = 'mate'; else if (o.hold === 'termo') q.holds = 'termo'; else if (o.hold === 'yerba') q.holds = 'yerba'; else if (o.hold === 'pava') q.holds = 'pava';
  if (pp.mood && FACE[norm(pp.mood)]) q.face = FACE[norm(pp.mood)]; if (q.pose === 'shock') q.face = 'shock'; if (q.pose === 'laugh') q.face = 'laugh'; return q; }
function stageOf(v) { const it = norm(v.item || 'mate'), va = norm(v.variant), an = norm(v.animate); if (it === 'mate' || it === 'cuia' || /^mate_/.test(it)) return { obj: 'mate', st: va === 'con_moho' ? 'seca' : 'mate', spin: true };
  if (it === 'calabaza_planta') return { obj: 'calabaza', st: 'planta', table: false, size: 1.3 }; if (/termo/.test(it)) return { obj: 'termo', spin: true }; if (/yerba/.test(it)) return { obj: 'yerba', spin: true }; if (/pava|kettle/.test(it)) return { obj: 'pava', spin: true }; return { obj: 'mate', st: 'mate', spin: true }; }
function toSpec(script) {
  const base = flat2d.toSpec(script, { plain: true }); const pick = chooser(script.id || 'reel'); let lastPeople = [{ shirt: '#e5483a', hat: 'boina', mustache: true, face: 'happy', pose: 'idle' }];
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length; const n = Math.max(1, Math.min(3, Math.round(words / 4)));
    if (script.poll && si === script.segments.length - 1) return; // the poll board stays
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k]; if (!v) return out.push(s);
      const push = (p, m = 1) => { for (let j = 0; j < m; j++) out.push({ tpl: 'build', p: { ...JSON.parse(JSON.stringify(p)), cam: j === 0 ? p.cam : (p.people && p.people.length ? pick(j % 2 ? FACECAMS : CAMS) : pick(['orbit', 'crash', 'push'])), seed: si * 7 + j } }); };
      if (v.type === 'scene' || v.type === 'mistake') { const sc = v.type === 'mistake' ? (v.over || { people: [{ role: 'friend', does: 'no' }] }) : v; const ppl = (sc.people || []).slice(0, 4).map(toon); if (v.type === 'mistake') ppl.forEach(q => { q.pose = 'shrug'; q.face = 'worried'; }); if (ppl.length) lastPeople = ppl;
        const busy = ppl.findIndex(q => q.pose === 'drink'); const p = { people: ppl.length ? ppl : lastPeople, cam: busy >= 0 ? 'push' : si === 0 ? 'drone' : pick(CAMS), focus: busy >= 0 ? 'face' : null, who: Math.max(0, busy) };
        if (ppl.length === 1) { p.people[0].x = 0; p.people[0].ry = 0; } return push(p, busy >= 0 ? 1 : n); }
      if (v.type === 'reaction') { const q = { ...(lastPeople[(v.who || 0) % lastPeople.length] || lastPeople[0]), x: 0, ry: 0, holds: null }; const e = FACE[norm(v.emotion)] || 'surprised'; q.face = e === 'surprised' ? 'shock' : e; const a = norm(v.act); q.pose = a === 'think' ? 'think' : a === 'point' ? 'point' : a === 'shrug' ? 'shrug' : e === 'surprised' || a === 'shock' ? 'shock' : ACTS.includes(a) ? (a === 'laugh' ? 'laugh' : a === 'cheer' ? 'cheer' : 'idle') : 'idle';
        return push({ people: [q], cam: 'face', who: 0 }); }
      if (v.type === 'object') return push({ stage: stageOf(v), cam: pick(['orbit', 'crash', 'push']), people: [] }, Math.min(2, n));
      if (v.type === 'compare') { const a = stageOf(v.left || {}), b = stageOf(v.right || {}); return push({ stage: { ...a, tools: [b.obj === 'mate' ? 'termo' : b.obj] }, cam: 'orbit', people: [] }); }
      if (v.type === 'title' || v.type === 'number' || v.type === 'map') { const text = String(v.type === 'number' ? v.value : v.text || (v.countries || []).join(' · ')).toUpperCase(); seg.callouts = [...(seg.callouts || []).filter(c => c.type !== 'big'), { type: 'big', text: text.slice(0, 22), sub: v.sub ? String(v.sub).toUpperCase().slice(0, 40) : undefined, at: String(sg.text).split(/\s+/)[0] }];
        return push({ people: lastPeople.map(q => ({ ...q, pose: 'point' })), cam: 'drone' }); }
      out.push(s); }); seg.shots = out; });
  return { ...base, preset: 'build3d', ab: script.ab || 'style build3d', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'build3d', toSpec };
