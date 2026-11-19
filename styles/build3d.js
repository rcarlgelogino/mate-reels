// build3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the sunny 3D garden (template build).
// Model: the "how X becomes Y" reels: one world, cartoon people with arms and legs, an object on the table, a cut or camera move every ~1.5 s,
// one word at a time in the middle, technical names as yellow labels, failures as red stamps.
const flat2d = require('./flat2d');
const { norm, person, FACE, ACTS, hashN, placeOf, propsFor } = require('./toy3d').helpers;
// fewer hard cuts, more moving cameras on the person (wemakebuild: 6 cuts/min, follow/chase with a wide lens; WATCHTIME 11-12)
const CAMS = ['drone', 'push', 'orbit', 'low', 'follow', 'crash'], FACECAMS = ['face', 'low'];
function chooser(seed) { let k = hashN(seed, 97), last = null; return pool => { let c; let n = 0; do { c = pool[(k++) % pool.length]; n++; } while (c === last && n < 5); last = c; return c; }; }
// toy3d look -> cartoon person
function toon(pp, i) { const o = person(pp, i); const q = { shirt: o.shirt, hairColor: o.hairColor, glasses: !!o.glasses, mustache: !!o.mustache, hair: o.hair === 'bob' || o.hair === 'long' ? 'long' : o.hair === 'bun' ? 'bun' : 'short', face: o.face || 'happy' };
  if (o.hat === 'boina' || o.hat === 'cap' || o.hat === 'sombrero') { q.hat = o.hat; q.hatColor = o.hatColor; } if (o.scarf) q.scarf = o.scarf; if (o.apron) q.apron = o.apron; if (o.scale) q.scale = o.scale;
  const d = norm(pp.does); q.pose = o.act === 'drink' ? 'drink' : o.act === 'pour' ? 'present' : d === 'pass' || d === 'offer' ? 'present' : d === 'receive' ? 'present' : ['think', 'point', 'shrug', 'wave', 'cheer', 'laugh', 'shock', 'walk', 'push', 'run', 'dance', 'fly', 'talk'].includes(d) ? d : d === 'no' ? 'shrug' : d === 'jump' ? 'cheer' : d === 'sit' ? 'idle' : o.gest && ['think', 'point', 'shrug'].includes(o.gest) ? o.gest : 'idle';
  if (q.pose === 'drink' || ['mate', 'both', 'termo_brazo'].includes(o.hold)) q.holds = 'mate'; else if (o.hold === 'termo') q.holds = 'termo'; else if (o.hold === 'yerba') q.holds = 'yerba'; else if (o.hold === 'pava') q.holds = 'pava';
  if (d === 'pour' && !q.holds) q.holds = 'pava';
  if (!q.holds && (o.item === 'celular' || o.act === 'phone' || /phone|celu|film/.test(d))) { q.holds = 'celular'; if (/film|foto|photo/.test(d)) q.pose = 'present'; }
  if ((d === 'sit' || /^sit_/.test(d) || o.sit) && q.pose === 'idle') q.sit = true;
  if (pp.mood && FACE[norm(pp.mood)]) q.face = FACE[norm(pp.mood)]; if (q.pose === 'shock') q.face = 'shock'; if (q.pose === 'laugh') q.face = 'laugh'; return q; }
// slapstick for funny sentences (the reels may be silly): a gag that hits a person, the others laugh until they cry
const GAGS = ['trip', 'spit', 'derp', 'hop'];
function gagActs(kind, ppl, busy) { const n = ppl.length, others = k => ppl.map((q, i) => i).filter(i => i !== k).map(i => ({ who: i, pose: 'laugh', face: 'crylaugh', at: 1.0 }));
  if (kind === 'spit' && busy >= 0) return [{ who: busy, pose: 'shock', face: 'crazy', at: 1.1 }, { fx: 'spit', at: 1.15, from: 'mouth', who: busy }, ...others(busy)];
  if (kind === 'trip') return [{ who: 0, walk: [(ppl[0].x ?? 0) - 1.1, ppl[0].x ?? 0], t0: 0.05, t1: 0.6, run: true }, { who: 0, fall: 0.65 }, { fx: 'dust', at: 0.8, from: 'feet', who: 0 }, { fx: 'stars', at: 0.85, from: 'head', who: 0 }, { who: 0, face: 'dizzy', at: 0.95 }, ...others(0)];
  if (kind === 'hop') return [{ who: 0, hop: 0.35 }, { who: 0, hop: 0.9 }, { who: 0, pose: 'dance', face: 'starstruck', at: 0.3 }, { fx: 'confetti', t0: 0.35, t1: 1.6, from: 'head', who: 0 }, ...ppl.slice(1).map((q, i) => ({ who: i + 1, pose: 'cheer', face: 'laugh', at: 0.6 }))];
  return [{ who: 0, face: 'derp', at: 0.25 }, { fx: 'stars', at: 0.3, from: 'head', who: 0 }, ...others(0)]; }
function stageOf(v) { const it = norm(v.item || 'mate'), va = norm(v.variant), an = norm(v.animate); if (it === 'mate' || it === 'cuia' || /^mate_/.test(it)) return { obj: 'mate', st: va === 'con_moho' ? 'seca' : 'mate', spin: true };
  if (it === 'calabaza_planta') return { obj: 'calabaza', st: 'planta', table: false, size: 1.3 }; if (/termo/.test(it)) return { obj: 'termo', spin: true }; if (/yerba/.test(it)) return { obj: 'yerba', spin: true }; if (/pava|kettle/.test(it)) return { obj: 'pava', spin: true }; return { obj: 'mate', st: 'mate', spin: true }; }
function toSpec(script) {
  const base = flat2d.toSpec(script, { plain: true }); base.segments.forEach(g => (g.callouts || []).forEach(c => { if (c.early) c.y = 1400; })); const pick = chooser(script.id || 'reel'); let gagN = 0; const firstScene = script.segments.map(g => (g.visuals || [g.visual])).flat().find(v => v && v.type === 'scene') || {}; let place = placeOf(firstScene.place);
  const where = (p, v) => { if (place !== 'prado') p.place = place; const pr = v && v.type === 'scene' ? propsFor(v, place) : []; if (pr.length) p.props = pr;
    // sitting people: on the sofa of the living room (it stands at the back wall), elsewhere they stand
    (p.people || []).forEach(q => { if (!q.sit) return; delete q.sit; if (place === 'living' && !p.stage) { q.pose = q.pose === 'idle' ? 'sit' : q.pose; q.y = 0.27; q.z = -1.62; q.ry = 0; q._seat = 1; } });
    // seated people only change their face in a gag (no jumping on the sofa)
    const seated = (p.people || []).map((q, i) => q._seat ? i : -1).filter(i => i >= 0); (p.people || []).forEach(q => delete q._seat); if (p.acts && seated.length) p.acts = p.acts.filter(a => !seated.includes(a.who) || (!a.walk && a.fall == null && !a.hop)).map(a => seated.includes(a.who) && a.pose ? { ...a, pose: 'sit' } : a); return p; }; let lastPeople = [{ shirt: '#e5483a', hat: 'boina', mustache: true, face: 'happy', pose: 'idle' }];
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length; const n = Math.max(1, Math.min(2, Math.round(words / 6)));
    // boards (cards, lists, poll) float over the 3D world: the people of the reel stand behind them, the camera drifts slowly
    const toBuild = s => { if (!s || s.tpl !== 'board' || !s.p || (s.p.kind === 'title' && !s.p.text)) return s; const { bg, scene, time, tableY, ...board } = s.p; return { tpl: 'build', p: where({ people: lastPeople.map(q => ({ ...q, pose: 'idle', y: 0, z: undefined })), cam: 'orbit', board, dim: 0.45, seed: si * 7 }) }; };
    if (script.poll && si === script.segments.length - 1) { seg.shots = seg.shots.map(toBuild); return; }
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k]; if (!v) return out.push(s);
      if (v.type === 'scene' && v.place) place = placeOf(v.place); const push = (p, m = 1) => { where(p, v); for (let j = 0; j < m; j++) out.push({ tpl: 'build', p: { ...JSON.parse(JSON.stringify(p)), cam: j === 0 ? p.cam : (p.people && p.people.length ? pick(j % 2 ? FACECAMS : CAMS) : pick(['orbit', 'crash', 'push'])), seed: si * 7 + j } }); };
      if (v.type === 'scene' || v.type === 'mistake') { const sc = v.type === 'mistake' ? (v.over || { people: [{ role: 'friend', does: 'no' }] }) : v; const ppl = (sc.people || []).slice(0, 4).map(toon); if (v.type === 'mistake') ppl.forEach(q => { q.pose = 'shrug'; q.face = 'worried'; });
        // a failure hits the person: the first one falls over, stars over the head, the others react
        const gag = v.type === 'mistake' && ppl.length ? [{ who: 0, pose: 'shock', face: 'scared', at: 0.3 }, { who: 0, fall: 0.9 }, { fx: 'stars', at: 1.2, from: 'head', who: 0 }, { who: 0, face: 'dizzy', at: 1.4 }, ...ppl.slice(1).map((q, k) => ({ who: k + 1, pose: 'laugh', face: 'crylaugh', at: 1.0 }))] : null; if (ppl.length) lastPeople = ppl;
        const busy = ppl.findIndex(q => q.pose === 'drink'); const fun = !gag && si > 0 && gagN < 3 && (sg.emo === 'funny' || /funny|laugh/.test(String((sc.people || []).map(q => q.mood).join(' ')))) && ppl.length; const gk = fun ? (busy >= 0 && gagN % 2 === 0 ? 'spit' : GAGS[(gagN + hashN(script.id || 'r', 13)) % GAGS.length]) : null; if (fun) gagN++;
        const p = { people: ppl.length ? ppl : lastPeople, cam: gag ? 'low' : gk === 'trip' ? 'follow' : busy >= 0 ? 'push' : si === 0 ? 'drone' : pick(CAMS), focus: busy >= 0 ? 'face' : null, who: Math.max(0, busy) }; if (gag) p.acts = gag; else if (gk) { p.acts = gagActs(gk === 'spit' && busy < 0 ? 'derp' : gk, p.people, busy); if (gk === 'spit' && busy >= 0) p.cam = 'face'; }
        if (ppl.length === 1) { p.people[0].x = 0; p.people[0].ry = 0; } return push(p, busy >= 0 ? 1 : n); }
      if (v.type === 'reaction') { const q = { ...(lastPeople[(v.who || 0) % lastPeople.length] || lastPeople[0]), x: 0, ry: 0, holds: null, y: 0, z: undefined }; if (q.pose === 'sit') q.pose = 'idle'; const e = FACE[norm(v.emotion)] || 'surprised'; q.face = e === 'surprised' ? (si % 2 ? 'mindblown' : 'shock') : e === 'laugh' ? 'crylaugh' : e; const a = norm(v.act); q.pose = a === 'think' ? 'think' : a === 'point' ? 'point' : a === 'shrug' ? 'shrug' : e === 'surprised' || a === 'shock' ? 'shock' : ACTS.includes(a) ? (a === 'laugh' ? 'laugh' : a === 'cheer' ? 'cheer' : 'idle') : 'idle';
        return push({ people: [q], cam: 'face', who: 0 }); }
      if (v.type === 'object') return push({ stage: stageOf(v), cam: pick(['orbit', 'crash', 'push']), people: [] }, Math.min(2, n));
      if (v.type === 'compare') { const a = stageOf(v.left || {}), b = stageOf(v.right || {}); return push({ stage: { ...a, tools: [b.obj === 'mate' ? 'termo' : b.obj] }, cam: 'orbit', people: [] }); }
      if (v.type === 'title' || v.type === 'number' || v.type === 'map') { const text = String(v.type === 'number' ? v.value : v.text || (v.countries || []).join(' · ')).toUpperCase(); seg.callouts = [...(seg.callouts || []).filter(c => c.type !== 'big'), { type: 'big', text: text.slice(0, 22), ...(v.type === 'number' ? { size: 300 } : {}), sub: v.sub ? String(v.sub).toUpperCase().slice(0, 40) : undefined, at: String(sg.text).split(/\s+/)[0] }];
        return push({ people: lastPeople.map(q => ({ ...q, pose: 'point', y: 0, z: undefined })), cam: 'drone' }); }
      out.push(toBuild(s)); }); seg.shots = out; });
  return { ...base, preset: 'build3d', ab: script.ab || 'style build3d', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'build3d', toSpec };
