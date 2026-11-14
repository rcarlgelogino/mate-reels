// flat2d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the 2D vector look (templates flat + board)
const ROLE = { // appearance per role (who = palette index in the engine)
  cebador: { who: 0 }, friend: { who: 3 }, stranger: { who: 2 }, you: { who: 5 },
  grandma: { who: 4, hairStyle: 'bun', hair: '#bdb6ac', shirt: '#7c3aed', glasses: true },
  grandpa: { who: 1, hairStyle: 'short', hair: '#c9c2b8', shirt: '#2f6b8a', beard: true, glasses: true },
  kid: { who: 2, scale: 0.72 }, worker: { who: 1, hairStyle: 'cap', capColor: '#ffc21a', shirt: '#2f6fd0' } };
const DOES = { idle: {}, hold_mate: { hold: 'mate' }, hold_termo: { hold: 'termo' }, hold_both: { hold: 'both' }, drink: { act: 'drink' }, pass: { act: 'pass' }, receive: {},
  wave: { act: 'wave' }, point: { act: 'point' }, hug: { act: 'hug' }, cheer: { act: 'cheer' }, jump: { act: 'jump' }, no: { act: 'no' }, nod: { act: 'nod' }, shock: { act: 'shock' }, laugh: { act: 'laugh' }, sigh: { act: 'sigh' } };
const PLACE = { kitchen: 'kitchen', home: 'kitchen', park: 'park', plaza: 'plaza', patio: 'patio', beach: 'beach' };
const BG = { red: '#e5483a', purple: '#7c3aed', blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', teal: '#0ea5a4', navy: '#16233a' };
const REACT_COLORS = ['#7c3aed', '#e5483a', '#3b82f6', '#10b981', '#f59e0b'];
const NAVY = '#132033';
// x positions / sizes by number of people (feet y in 0..1 of the frame)
function layout(n, place) { if (place === 'kitchen') return layoutBase(n, 0.9).map(p => ({ ...p, s: Math.round(p.s * 1.28) })); return layoutBase(n, place === 'patio' || place === 'beach' ? 0.86 : 0.8); }
function layoutBase(n, ky) {
  if (n === 1) return [{ x: 0.5, y: ky + 0.06, s: 720 }];
  if (n === 2) return [{ x: 0.28, y: ky, s: 580 }, { x: 0.74, y: ky, s: 580 }];
  if (n === 3) return [{ x: 0.2, y: ky, s: 520 }, { x: 0.5, y: ky + 0.01, s: 540 }, { x: 0.8, y: ky, s: 520 }];
  return Array.from({ length: n }, (_, i) => i < 3 ? { x: [0.18, 0.5, 0.82][i], y: ky + 0.02, s: 480 } : { x: [0.34, 0.66, 0.5][i - 3], y: ky - 0.04, s: 400, back: true }); }
const hashN = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
const INDOOR = /casa|cocina|home|living|oficina|office|bar|caf|escuela|school|aula|cuarto|room|mesa|colectivo|bus|tren|auto/i;
function sceneShot(v, si) {
  // new places get the closest existing look, new roles a stable look of their own
  const place = PLACE[v.place] || (v.place && !INDOOR.test(v.place) ? 'park' : 'kitchen'); const ppl = v.people || []; const L = layout(ppl.length, place);
  const people = ppl.map((pp, i) => { const r = { ...(ROLE[pp.role] || { who: pp.role ? hashN(pp.role, 6) : i }) }; const sc = r.scale || 1; delete r.scale; const d = DOES[pp.does] || {};
    const pos = L[i]; const o = { ...r, ...d, x: pos.x, y: pos.y, s: Math.round(pos.s * sc), back: pos.back };
    if (pp.mood) o.face = { outraged: 'angry', bored: 'neutral' }[pp.mood] || pp.mood; if (pp.mate) o.mate = { mate_madera: 'madera' }[pp.mate] || pp.mate; if (pos.x > 0.55 && ppl.length === 2) o.flip = true; if (d.hold === 'mate' || d.hold === 'both' || pp.does === 'drink') o.steam = true; return o; });
  if (ppl.length === 1 && ppl[0].does === 'drink') { people[0].s = 900; people[0].y = place === 'kitchen' ? 0.92 : 0.95; }
  const p = { scene: place, people };
  if (place === 'kitchen') { const f0 = people.filter(q => !q.back)[0] || people[0]; p.tableY = f0 ? +(f0.y - 0.34 * f0.s / 1920).toFixed(3) : 0.62; } // counter at hip height (the figures have short cartoon legs: hip at ~1/3 of the height)
  if (v.pass) { p.pass = { from: v.pass[0], to: v.pass[1] }; const A = people[v.pass[0]], B = people[v.pass[1]]; A.act = 'pass';
    // hand to hand: the two stand close enough that their hands meet, and face each other
    if (A && B && Math.abs(A.x - B.x) > 0.32) { const m = (A.x + B.x) / 2, dir = Math.sign(B.x - A.x) || 1; A.x = +(m - dir * 0.16).toFixed(3); B.x = +(m + dir * 0.16).toFixed(3); }
    if (A && B) { A.flip = B.x < A.x; B.flip = A.x < B.x; } }
  if (v.time) p.time = v.time;
  if (v.label) { const on = people[v.label.on || 0]; const headY = on.y - on.s * 0.92 / 1920; p.labels = [{ text: v.label.text, x: on.x, y: headY, ty: Math.max(0.3, headY - 0.08) }]; }
  return { tpl: 'flat', p };
}
function objectShot(v, si) {
  const item = v.item || 'mate'; const known = { mate: 'calabaza', mate_madera: 'madera', imperial: 'imperial', acero: 'acero', termo: 'termo', yerba: 'yerba', bombilla: 'bombilla', pava: 'pava', kettle: 'pava' }; const type = known[item] || 'calabaza';
  if (!known[item]) return boardShot({ type: 'title', text: String(item).replace(/_/g, ' ').toUpperCase(), sub: v.labels && v.labels[0] }); // a new object is named on a card until it has its own drawing (never a mate in disguise)
  const objs = []; const solo = !(v.with && v.with.length);
  const main = { type, x: solo ? 0.5 : 0.62, y: 0.7, s: type === 'termo' ? 680 : type === 'pava' ? 620 : type === 'yerba' ? 520 : type === 'bombilla' ? 760 : (solo ? 640 : 480), steam: ['calabaza', 'madera', 'imperial', 'acero'].includes(type), bob: !!v.mascot };
  if (v.mascot) main.face = v.mascot; objs.push(main);
  (v.with || []).forEach((w, i) => objs.push({ type: w === 'termo' ? 'termo' : w === 'yerba' ? 'yerba' : 'calabaza', x: 0.22, y: 0.78, s: w === 'termo' ? 560 : 400, delay: 0.15 + i * 0.1 }));
  const p = { scene: v.bg ? 'solid' : 'navygrid', bg: BG[v.bg] || v.bg || NAVY, objs };
  const anchors = { calabaza: [[0.58, 0.39, 0.74, 0.3], [0.4, 0.6, 0.27, 0.5]], termo: [[0.5, 0.42, 0.72, 0.33], [0.5, 0.62, 0.28, 0.56]] };
  if (v.labels) p.labels = v.labels.map((t, i) => { const a = (anchors[type] || anchors.calabaza)[i % 2]; return { text: t, x: a[0], y: a[1], tx: a[2], ty: a[3] }; });
  if (v.mascot && v.heart) objs.push({ type: 'heart', x: 0.74, y: 0.36, s: 160, delay: 0.4 });
  return { tpl: 'flat', p };
}
function reactionShot(v, si) { const bg = BG[v.color] || v.color || REACT_COLORS[si % REACT_COLORS.length];
  return { tpl: 'flat', p: { scene: 'solid', bg, people: [{ who: v.who ?? (si % 6), x: 0.5, y: 1.34, s: 1500, act: v.act || (v.emotion === 'surprised' ? 'shock' : null), face: v.emotion || 'surprised' }] } }; }
function boardShot(v) { const b = { bg: NAVY };
  if (v.type === 'title') return { tpl: 'board', p: { ...b, kind: 'title', text: v.text, sub: v.sub } };
  if (v.type === 'number') return { tpl: 'board', p: { ...b, kind: 'title', text: v.value, sub: v.sub } };
  if (v.type === 'list') return { tpl: 'board', p: { ...b, kind: 'cards', items: v.items.map((it, i) => ({ n: it.n ?? i + 1, title: it.title, sub: it.sub, ok: it.ok })) } };
  if (v.type === 'checklist') return { tpl: 'board', p: { ...b, kind: 'checklist', rows: v.rows } };
  if (v.type === 'dots') return { tpl: 'board', p: { ...b, kind: 'dots', total: v.total || 100, on: v.on, cols: v.cols || 10, label: v.label, sub: v.sub } };
  if (v.type === 'timeline') return { tpl: 'board', p: { ...b, kind: 'timeline', items: v.items } };
  return null; }
function shotFor(v, si) {
  if (!v) return boardShot({ type: 'title', text: '' });
  if (v.type === 'scene') return sceneShot(v, si); if (v.type === 'object') return objectShot(v, si); if (v.type === 'reaction') return reactionShot(v, si);
  if (v.type === 'mistake') return sceneShot(v.over || { type: 'scene', place: 'kitchen', people: [{ role: 'friend', does: 'no' }] }, si);
  return boardShot(v) || boardShot({ type: 'title', text: v.text || '' }); }
const AT = text => { const w = text.replace(/[¿¡]/g, '').split(/\s+/).map(x => x.replace(/[^\p{L}]/gu, '')).filter(x => x.length > 3 && !/^\d/.test(x)); const pick = (w[1] || w[0] || '').toLowerCase(); const cut = pick.search(/[^a-zñ]/); return (cut > 1 ? pick.slice(0, cut) : pick).slice(0, 5); };
function toSpec(script) {
  const segs = script.segments.map((sg, si) => {
    const vis = sg.visuals || [sg.visual]; const shots = vis.map((v, k) => { const s = shotFor(v, si); if (k % 2 === 1) s.zoom = 1.12; return s; });
    const callouts = [];
    if (sg.headline) { const at = sg.headlineAt || AT(sg.text); const t = sg.headlineType || 'big'; callouts.push({ type: t, text: sg.headline, at, ...(sg.impact ? { impact: true } : {}), ...(sg.headlineSub ? { sub: sg.headlineSub } : {}) }); }
    if (sg.visual && sg.visual.type === 'mistake') callouts.push({ type: 'xmark', text: sg.visual.text, at: sg.visual.at || AT(sg.text), y: 820, size: 300 });
    return { text: sg.text, say: sg.say, emo: sg.emo || 'neutral', shots, callouts };
  });
  if (script.poll) { const last = segs[segs.length - 1]; last.shots = [{ tpl: 'board', p: { kind: 'poll', bg: NAVY, question: script.poll.question, options: script.poll.options, top: 600, cta: false } }]; last.callouts = []; }
  return { id: script.id, topic: script.topic, preset: 'flat2d', ab: script.ab || 'style flat2d', segments: segs, caption: script.caption, hashtags: script.hashtags,
    ...(script.followSub ? { followSub: script.followSub } : {}) };
}
module.exports = { name: 'flat2d', toSpec };
