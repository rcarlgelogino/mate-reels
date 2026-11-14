// toy3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the sunny 3D meadow (template prado).
// Text, headlines, callouts, boards and the poll are taken 1:1 from flat2d, so an A/B pair differs only in the pictures.
// The camera is chosen here: 14 set-ups and 15 moves, never the same twice in a row, long sentences get a cut in the middle.
const flat2d = require('./flat2d');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ROLE = { cebador: { who: 0, shirt: '#e5483a', hair: 'short' }, friend: { who: 1, shirt: '#2f6fd0', hair: 'side' }, stranger: { who: 2, shirt: '#f2a922', hair: 'bob' }, you: { who: 3, shirt: '#2f9e6e', hair: 'short' },
  grandma: { who: 4, shirt: '#8a4fd0', hair: 'bun', hairColor: '#c9c2b8', glasses: true }, grandpa: { who: 5, shirt: '#2f6b8a', hair: 'short', hairColor: '#c9c2b8', glasses: true, mustache: true },
  kid: { who: 2, scale: 0.72, shirt: '#ef7a3a', hair: 'side', hat: 'cap', hatColor: '#2f6fd0' }, worker: { who: 1, shirt: '#f08a24', hair: 'short', hat: 'hardhat' },
  // nations: the flag is printed on the shirt
  argentino: { who: 0, shirt: '#8cc4ee', flag: 'ar', hair: 'short' }, uruguayo: { who: 1, shirt: '#f4f6f8', flag: 'uy', hair: 'side' }, paraguayo: { who: 2, shirt: '#d43a3a', flag: 'py', hair: 'short' },
  brasileno: { who: 3, shirt: '#f6c800', pants: '#1f8a3b', flag: 'br', hair: 'side' }, chileno: { who: 4, shirt: '#1f3f8f', flag: 'cl', hair: 'short' }, aleman: { who: 5, shirt: '#2b2b2b', flag: 'de', hair: 'side', glasses: true },
  // more characters
  gaucho: { who: 0, shirt: '#e9dfc8', pants: '#5a4636', hat: 'boina', hatColor: '#2b2b2b', scarf: '#d43a3a', mustache: true }, oficinista: { who: 1, shirt: '#f4f6f8', pants: '#34425a', tie: '#c0392b', hair: 'side' },
  estudiante: { who: 2, shirt: '#3fa7a0', backpack: '#e5483a', hair: 'long' }, turista: { who: 3, shirt: '#ff8a5a', hat: 'cap', hatColor: '#f4f6f8', camera: true }, abuela: null, abuelo: null };
const ALIAS = { abuela: 'grandma', abuelo: 'grandpa', amigo: 'friend', amiga: 'friend', nino: 'kid', nina: 'kid', chico: 'kid', obrero: 'worker', trabajador: 'worker', argentina: 'argentino', uruguaya: 'uruguayo', paraguaya: 'paraguayo',
  brasilero: 'brasileno', brasilera: 'brasileno', brasilena: 'brasileno', brasileiro: 'brasileno', chilena: 'chileno', alemana: 'aleman', german: 'aleman', student: 'estudiante', tourist: 'turista', office: 'oficinista', oficina: 'oficinista' };
const ITEMS = ['celular', 'facturas', 'azucarera', 'bizcochitos', 'matera', 'termometro']; const BOMB = ['recta', 'curva', 'pico_loro', 'resorte', 'paleta', 'cana', 'alpaca']; const CARS = ['auto', 'camioneta', 'colectivo'];
const DOES = { idle: {}, hold_mate: { hold: 'mate' }, hold_termo: { hold: 'termo' }, hold_both: { hold: 'both' }, hold_yerba: { hold: 'yerba' }, hold_pava: { hold: 'pava' }, hold_bombilla: { hold: 'bombilla', item: 'recta' },
  drink: { hold: 'mate', act: 'drink' }, pour: { hold: 'both', act: 'pour' }, pass: { hold: 'mate' }, receive: {} };
const ACTS = ['wave', 'cheer', 'jump', 'no', 'nod', 'shock', 'laugh', 'sigh', 'hug']; // whole-body actions, played by the engine on top of the pose
const FACE = { neutral: 'neutral', smile: 'smile', happy: 'happy', surprised: 'surprised', sad: 'sad', angry: 'angry', proud: 'proud', love: 'love', laugh: 'laugh', excited: 'happy', worried: 'sad', confused: 'surprised', outraged: 'outraged', bored: 'bored',
  // Spanish and German words work too
  sonriente: 'smile', feliz: 'happy', enojado: 'angry', sauer: 'angry', indignado: 'outraged', empoert: 'outraged', aburrido: 'bored', gelangweilt: 'bored', triste: 'sad', traurig: 'sad', sorprendido: 'surprised', orgulloso: 'proud' };
const MATES = { mate_madera: 'madera', madera: 'madera', imperial: 'imperial', acero: 'acero', mate_acero: 'acero' };
const hashN = (s, n) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % n; };
const SHIRTS = ['#e5483a', '#2f6fd0', '#f2a922', '#2f9e6e', '#8a4fd0', '#ef7a3a', '#2f6b8a', '#d94f8a'];
// new roles (any character the story needs) get a stable look of their own
function look(role) { const k = norm(role); const r = ROLE[k] || ROLE[ALIAS[k]]; if (r) return { ...r };
  return role ? { who: hashN(k, 6), shirt: SHIRTS[hashN(k + '#', SHIRTS.length)], hair: ['short', 'side', 'bob', 'bun', 'long'][hashN(k + '~', 5)] } : null; }
function person(pp, i) { const d = norm(pp.does); let does = DOES[d] || {}; if (!DOES[d] && d.startsWith('hold_')) { const it = d.slice(5); does = ITEMS.includes(it) ? { hold: 'item', item: it } : BOMB.includes(it) ? { hold: 'bombilla', item: it } : { hold: 'mate' }; }
  const o = { ...(look(pp.role) || { who: i }), ...does }; if (pp.mood) o.face = FACE[norm(pp.mood)] || 'smile'; if (pp.termo && o.hold === 'mate') o.hold = 'both'; if (pp.mate && MATES[pp.mate]) o.mate = MATES[pp.mate]; return o; }

// ---- camera choice ----
const SOLO = ['close', 'sideL', 'orbitL', 'face', 'low', 'dollyR', 'pushin', 'sideR', 'high', 'craneUp', 'dutch', 'orbitR', 'dollyL', 'lowpush', 'pullout'];
const SOLO_HOLD = ['close', 'hands', 'sideL', 'tiltUp', 'orbitL', 'low', 'top', 'pushin', 'sideR', 'dollyR', 'tiltDown', 'high', 'craneUp', 'orbitR', 'face', 'dutch', 'dollyL', 'lowpush'];
const GROUP = ['wide', 'flow', 'pan', 'widelow', 'dollyL', 'craneDown', 'far', 'arcTop', 'pullout', 'dollyR'];
const REACT = ['face', 'crash', 'pushin', 'low', 'dutch', 'sideL', 'sideR', 'lowpush'];
const HERO = ['orbitL', 'pushin', 'high', 'tiltUp', 'orbitR', 'sideL', 'arcTop', 'low', 'close', 'craneUp', 'hands', 'dollyR'];
const DRINK = ['pushin', 'close', 'sideR', 'low', 'orbitL', 'face']; const POUR = ['hands', 'close', 'top', 'sideL', 'craneDown', 'high'];
function chooser(seed) { const used = {}; let last = null, k = hashN(seed, 97);
  return (pool, avoid) => { let best = null, bs = 1e9; pool.forEach((c, i) => { if (c === last || c === avoid) return; const sc = (used[c] || 0) * 100 + ((i + k) % pool.length); if (sc < bs) { bs = sc; best = c; } });
    best = best || pool[0]; used[best] = (used[best] || 0) + 1; last = best; k += 7; return best; }; }
const PROPS = [[/calle|ruta|auto|viaje|estacion|carretera/, ['auto']], [/colectivo|bus|parada|bondi/, [{ type: 'colectivo', drive: true }]], [/patio|picnic|mesa|asado/, ['mesa']], [/plaza|park|parque|banco/, ['banco']], [/camioneta|campo|estancia/, ['camioneta']]];
function sceneShots(v, si, pick, words) {
  const src = (v.people || []).slice(0, 6); const people = src.map(person); if (!people.length) people.push({ who: 0, hold: 'mate' });
  const acts = src.map(pp => ACTS.includes(norm(pp.does)) ? norm(pp.does) : null); const n = people.length; const busy = people.findIndex(p => p.act); const focus = v.focus ?? (busy >= 0 ? busy : v.pass ? v.pass[0] : 0);
  const props = (v.props || []).concat(...PROPS.filter(([re]) => re.test(norm(v.place))).map(q => q[1]));
  const base = { people, focus }; if (props.length) base.props = props;
  const emo = acts.some(Boolean) ? { act: acts.find(Boolean), who: acts.map((a, k) => a ? k : -1).filter(k => k >= 0) } : null;
  const act = busy >= 0 ? people[busy].act : null; const holds = !!people[focus].hold;
  const solo = act === 'drink' ? DRINK : act === 'pour' ? POUR : holds ? SOLO_HOLD : SOLO; const group = n === 2 ? GROUP.concat(['duo', 'ots']) : GROUP;
  const mk = cam => { const p = { ...base, shot: cam }; if (cam === 'duo' || cam === 'ots') { const o = focus === 0 ? 1 : 0; p.pair = [focus, o]; if (cam === 'ots') p.turnK = 1; } const sh = { tpl: 'prado', p }; if (emo) sh.emo = emo; return sh; };
  if (v.camera) return [mk(v.camera)];
  const first = pick(n <= 1 || act ? solo : si === 0 ? ['flow', 'crash', 'pushin'] : group);
  // a long sentence gets a second angle (never while someone drinks or pours: the action would start again)
  if (words >= 9 && !act) return [mk(first), mk(pick(n <= 1 ? solo : (holds ? SOLO_HOLD : SOLO).filter(c => !['top', 'hands', 'tiltUp', 'tiltDown'].includes(c) || holds), first))];
  return [mk(first)];
}
function reactionShot(v, si, pick) { const who = v.who ?? (si % 6); const base = Object.values(ROLE).find(r => r && r.who === who && !r.flag && !r.hat) || { who }; const pp = { ...base, face: FACE[norm(v.emotion)] || 'surprised' }; delete pp.scale;
  const sh = { tpl: 'prado', p: { people: [pp], shot: v.camera || pick(REACT), focus: 0 } }; const act = v.act || (v.emotion === 'surprised' ? 'shock' : null); if (act) sh.emo = { act, face: pp.face }; return sh; }
// object visuals: the thing itself, big on a small table (unknown things fall back to the name card of flat2d)
function objectShot(v, pick) { const it = norm(v.item || 'mate'); let hero = null;
  if (it === 'mate' || MATES[it]) hero = { item: 'mate', type: MATES[it] || 'calabaza', face: v.mascot ? 'smile' : null };
  else if (['termo', 'yerba', 'pava'].includes(it)) hero = { item: it }; else if (it === 'kettle') hero = { item: 'pava' };
  else if (it === 'bombilla' || it === 'bombillas') hero = v.kind && BOMB.includes(norm(v.kind)) ? { item: 'bombilla', kind: norm(v.kind) } : { item: 'bombillas', kinds: v.kinds };
  else if (BOMB.includes(it) || BOMB.includes(it.replace(/^bombilla_/, ''))) hero = { item: 'bombilla', kind: it.replace(/^bombilla_/, '') };
  else if (ITEMS.includes(it) || CARS.includes(it)) hero = { item: it };
  return hero ? { tpl: 'prado', p: { hero, shot: v.camera || pick(HERO) } } : null; }
function toSpec(script) {
  const base = flat2d.toSpec(script); const pick = chooser(script.id || 'reel');
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length;
    if (script.poll && si === script.segments.length - 1) return; // poll board stays
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k]; if (!v) return out.push(s);
      if (v.type === 'scene') return out.push(...sceneShots(v, si, pick, vis.length > 1 ? 0 : words)); if (v.type === 'reaction') return out.push(reactionShot(v, si, pick)); if (v.type === 'object') return out.push(objectShot(v, pick) || s);
      if (v.type === 'mistake') { const sh = sceneShots(v.over || { type: 'scene', people: [{ role: 'friend', does: 'no' }] }, si, pick, 0)[0]; sh.emo = { act: 'no' }; return out.push(sh); }
      out.push(s); }); seg.shots = out; });
  return { ...base, preset: 'toy3d', ab: script.ab || 'style toy3d', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'toy3d', toSpec };
