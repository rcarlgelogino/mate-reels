// build3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the 3D world (template build).
// Model: wemakebuild: cartoon people who DO things with their hands and with each other, real places, a cut or camera move every ~1.5 s.
// Every verb of the scripts ("does") has its own action below (VERBS); scripts/lint.js reports verbs that have none.
const flat2d = require('./flat2d');
const { norm, person, FACE, ACTS, hashN, placeOf, propsFor } = require('./toy3d').helpers;
const CAMS = ['drone', 'push', 'orbit', 'low', 'follow', 'crash'], FACECAMS = ['face', 'low'];
function chooser(seed) { let k = hashN(seed, 97), last = null; return pool => { let c; let n = 0; do { c = pool[(k++) % pool.length]; n++; } while (c === last && n < 5); last = c; return c; }; }
// the look of a role (toy3d ROLE table) -> cartoon person; every accessory of the role is kept (tie, flag, necklace, backpack, beard ...)
const HAIR = { bob: 'long', long: 'long', bun: 'bun', side: 'short', short: 'short', curly: 'curly', ponytail: 'ponytail', none: 'none' };
const LOOK_KEYS = ['shirt', 'pants', 'hairColor', 'tie', 'necklace', 'flag', 'backpack', 'camera', 'dress', 'belt', 'headscarf', 'band', 'feather', 'shades', 'beard', 'scarf', 'apron', 'scale', 'belly', 'skin'];
function toon(pp, i) { const o = person(pp, i); const q = { glasses: !!o.glasses, mustache: !!o.mustache, hair: HAIR[o.hair] || 'short', face: o.face || 'happy' };
  LOOK_KEYS.forEach(k => { if (o[k] != null && o[k] !== false) q[k] = o[k]; }); if (pp.look) Object.assign(q, pp.look);
  if (['boina', 'cap', 'sombrero', 'hardhat'].includes(o.hat)) { q.hat = o.hat; q.hatColor = o.hatColor; }
  const d = norm(pp.does); q.does = d; q.pose = 'idle';
  if (['think', 'point', 'shrug', 'wave', 'cheer', 'laugh', 'shock', 'walk', 'push', 'run', 'dance', 'talk'].includes(d)) q.pose = d;
  if (/^sit/.test(d) || o.sit) q.sit = true;
  if (pp.mood && FACE[norm(pp.mood)]) q.face = FACE[norm(pp.mood)]; if (q.pose === 'shock') q.face = 'shock'; if (q.pose === 'laugh') q.face = 'laugh'; return q; }
// slapstick for funny sentences (the reels may be silly): a gag that hits a person, the others laugh until they cry
const GAGS = ['trip', 'spit', 'derp', 'hop'];
function gagActs(kind, ppl, busy) { const others = k => ppl.map((q, i) => i).filter(i => i !== k).map(i => ({ who: i, pose: 'laugh', face: 'crylaugh', at: 1.0 }));
  if (kind === 'spit' && busy >= 0) return [{ who: busy, pose: 'shock', face: 'crazy', at: 1.1 }, { fx: 'spit', at: 1.15, from: 'mouth', who: busy }, ...others(busy)];
  if (kind === 'trip') return [{ who: 0, walk: [(ppl[0].x ?? 0) - 1.1, ppl[0].x ?? 0], t0: 0.05, t1: 0.6, run: true }, { who: 0, fall: 0.65 }, { fx: 'dust', at: 0.8, from: 'feet', who: 0 }, { fx: 'stars', at: 0.85, from: 'head', who: 0 }, { who: 0, face: 'dizzy', at: 0.95 }, ...others(0)];
  if (kind === 'hop') return [{ who: 0, hop: 0.35 }, { who: 0, hop: 0.9 }, { who: 0, pose: 'dance', face: 'starstruck', at: 0.3 }, { fx: 'confetti', t0: 0.35, t1: 1.6, from: 'head', who: 0 }, ...ppl.slice(1).map((q, i) => ({ who: i + 1, pose: 'cheer', face: 'laugh', at: 0.6 }))];
  return [{ who: 0, face: 'derp', at: 0.25 }, { fx: 'stars', at: 0.3, from: 'head', who: 0 }, ...others(0)]; }
function stageOf(v) { const it = norm(v.item || 'mate'), va = norm(v.variant); if (it === 'mate' || /^mate_/.test(it)) return { obj: 'mate', st: va === 'con_moho' ? 'seca' : 'mate', spin: true };
  if (it === 'calabaza_planta') return { obj: 'calabaza', st: 'planta', table: false, size: 1.3 }; for (const k of ['termo', 'yerba', 'pava_electrica', 'pava', 'cuia', 'guampa', 'olla', 'mortero', 'bolsa', 'bombilla', 'laptop', 'celular']) if (it.includes(k)) return { obj: k, spin: true };
  if (/kettle/.test(it)) return { obj: 'pava', spin: true }; if (/nylon/.test(it)) return { obj: 'bolsa', spin: true }; return { obj: 'mate', st: 'mate', spin: true }; }
const HOT = /hirv|quem|calient|fuego|humo|lengua/;
// ---- the verbs. Each one: what the person holds, the pose, and what happens in the shot (acts, t in seconds). C = shot context.
const MATE_TOP = [0, 1.75, 0.3];
const VERBS = [
  // interactions between two people
  [/^(pass|offer|receive)$/, null], // handled as a pair below (give)
  [/^hug$|abraz/, (i, C) => { const o = C.partner(i); if (o < 0) { C.p[i].pose = 'cheer'; C.acts.push({ fx: 'hearts', at: 0.6, from: 'head', who: i }); return; } C.p[i].x = -0.75; C.p[o].x = 0.75;
    C.acts.push({ who: i, walk: [-0.75, -0.3], t0: 0.2, t1: 0.85, then: 'carry', ry: 1.2 }, { who: o, walk: [0.75, 0.3], t0: 0.2, t1: 0.85, then: 'carry', ry: -1.2 }, { who: i, face: 'love', at: 0.85 }, { who: o, face: 'happy', at: 0.85 }, { fx: 'hearts', at: 0.95, from: 'head', who: i }); C.cam('orbit'); }],
  [/whisper|secreto/, (i, C) => { const o = C.partner(i); if (o < 0) return; C.p[i].x = -0.8; C.p[o].x = 0.45; C.acts.push({ who: i, walk: [-0.8, 0.05], t0: 0.1, t1: 0.6, then: 'talk', ry: 1.3 }, { who: o, face: 'surprised', at: 1.0 }, { who: o, hop: 1.05 }); C.p[i].talk = true; C.cam('orbit'); }],
  [/defend|discut|argue|pelea/, (i, C) => { const o = C.partner(i); C.p[i].pose = 'point'; C.p[i].talk = true; C.p[i].face = 'angry'; C.acts.push({ who: i, walk: [C.x(i), C.x(i) + 0.35], t0: 0.3, t1: 0.7, then: 'point' }); if (o >= 0) C.acts.push({ look: [i, o], at: 0 }, { look: [o, i], at: 0.2 }, { who: o, face: 'outraged', at: 0.9 }); }],
  [/reach_bombilla|toca.*bombilla|mueve.*bombilla/, (i, C) => { const o = C.partner(i); C.p[i].pose = 'point'; if (o >= 0) { C.p[o].holds = 'mate'; C.acts.push({ who: i, walk: [C.x(i), C.x(o) - 0.75], t0: 0.2, t1: 0.8, then: 'point', ry: 1.1 }, { who: o, face: 'outraged', at: 1.0 }, { who: o, hop: 1.1 }, { fx: 'stars', at: 1.1, from: 'head', who: o }); } else C.acts.push({ who: i, face: 'proud', at: 0.4 }); }],
  // pouring and preparing (the mate stands on the table)
  [/^pour|^ceba|use_pava_electrica|pava_electrica/, (i, C) => { const d = C.p[i].does; C.stage({ obj: 'mate', st: 'mate' }); C.p[i].holds = null; C.acts.push({ fx: 'pour', who: i, t0: 0.55, t1: 2.1 });
    if (/cold|fria|frio/.test(d)) C.acts.push({ fx: 'splash', at: 2.1, pos: MATE_TOP }, { who: i, face: 'proud', at: 1.0 }); else if (/lukewarm|tibia/.test(d)) C.acts.push({ fx: 'steam', t0: 1.2, t1: 1.8, pos: MATE_TOP }); else C.acts.push({ fx: 'steam', t0: 1.0, t1: 2.8, pos: MATE_TOP });
    if (/olla/.test(d)) C.p[i].holdsL = 'olla'; if (/electrica/.test(d)) C.stageTool('pava_electrica'); C.cam('orbit'); }],
  [/fill_yerba|llena|cargar_yerba/, (i, C) => { C.stage({ obj: 'mate', st: 'vacia' }); C.p[i].holds = 'yerba'; C.p[i].pose = 'present'; C.acts.push({ fill: [0.5, 2.0] }, { fx: 'seeds', t0: 0.5, t1: 2.0, from: 'hand', who: i }, { who: i, tilt: [0.3, 0.6], ang: -1.6 }); C.cam('push'); }],
  [/scrape_spoon|cuchar/, (i, C) => { C.stage({ obj: 'mate', st: 'mate' }); C.p[i].holds = 'cuchara'; C.p[i].pose = 'saw'; C.acts.push({ fx: 'seeds', t0: 0.4, t1: 2.0, pos: MATE_TOP }, { who: i, face: 'disgusted', at: 0.8 }); C.cam('push'); }],
  [/grind|mortar|mortero|pis/, (i, C) => { C.stage({ obj: 'mortero', spin: false }); C.p[i].pose = 'saw'; C.acts.push({ pound: [0.3, 3] }, { fx: 'dust', at: 0.6, pos: [0, 1.15, 0.3] }, { fx: 'dust', at: 1.3, pos: [0, 1.15, 0.3] }, { fx: 'dust', at: 2.0, pos: [0, 1.15, 0.3] }); C.cam('push'); }],
  [/harvest|cosech|tarefa|corta/, (i, C) => { C.p[i].holds = 'machete'; C.p[i].pose = 'saw'; C.acts.push({ fx: 'shards', at: 0.5, from: 'hand', who: i }, { fx: 'shards', at: 1.2, from: 'hand', who: i }, { fx: 'shards', at: 1.9, from: 'hand', who: i }); C.cam('low'); }],
  [/^type$|typ|escrib|compu/, (i, C) => { C.stage({ obj: 'laptop', spin: false }); C.p[i].pose = 'hold'; C.acts.push({ who: i, face: 'bored', at: 0 }, { who: i, face: 'surprised', at: 1.6 }); C.cam('push'); }],
  // drinking
  [/^drink/, (i, C) => { const d = C.p[i].does; C.p[i].holds = /guampa/.test(d) ? 'guampa' : /cuia/.test(d) ? 'cuia' : 'mate'; C.p[i].pose = 'drink'; C.busy(i);
    if (/tapado|tapa/.test(d)) C.acts.push({ who: i, face: 'angry', at: 0.9 }, { who: i, pose: 'saw', at: 1.1 }, { fx: 'stars', at: 1.2, from: 'head', who: i });
    else if (/sin_bombilla/.test(d)) C.acts.push({ who: i, face: 'disgusted', at: 1.0 }, { fx: 'seeds', t0: 1.0, t1: 1.4, from: 'mouth', who: i });
    else if (C.hot || ['pain', 'dolor', 'quemado'].includes(norm(C.mood(i)))) { C.acts.push({ who: i, pose: 'shock', face: 'scream', at: 1.0 }, { fx: 'steam', t0: 1.0, t1: 1.9, from: 'mouth', who: i }, { who: i, hop: 1.15 }, { who: i, hop: 1.6 }); C.others(i).forEach(o => C.acts.push({ who: o, pose: 'laugh', face: 'crylaugh', at: 1.25 }, { look: [o, i], at: 0.2 })); C.cam('orbit'); }
    else { C.acts.push({ fx: 'steam', t0: 0.1, t1: 1.2, from: 'hand', who: i }, { who: i, face: 'happy', at: 1.3 }); C.others(i).forEach(o => C.acts.push({ look: [o, i], at: 0.2 })); } }],
  [/blow|sopl/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].pose = 'hold'; for (const t0 of [0.4, 1.1, 1.8]) C.acts.push({ fx: 'steam', t0, t1: t0 + 0.35, from: 'mouth', who: i }); C.acts.push({ who: i, face: 'worried', at: 0 }); C.others(i).forEach(o => C.acts.push({ look: [o, i], at: 0.3 })); }],
  // doing something with the mate in the hand
  [/empty_mate|vaci|tira/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].pose = 'present'; C.acts.push({ who: i, tilt: [0.5, 0.9], ang: 2.7 }, { fx: 'seeds', t0: 0.85, t1: 1.6, from: 'hand', who: i }, { who: i, face: 'proud', at: 1.2 }); }],
  [/shake_mate|sacud/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].pose = 'saw'; C.acts.push({ fx: 'seeds', t0: 0.3, t1: 1.8, from: 'hand', who: i }, { who: i, face: 'proud', at: 0.4 }); }],
  [/rinse|wash|lava|enjuag/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].pose = 'present'; C.acts.push({ fx: 'leak', t0: 0.4, t1: 1.6, from: 'hand', who: i }, { fx: 'splash', at: 1.0, from: 'hand', who: i }, { who: i, tilt: [0.4, 0.8], ang: 1.2 }); }],
  [/film|foto|photo/, (i, C) => { C.bringOthers(i); C.p[i].holds = 'celular'; C.p[i].pose = 'film'; C.p[i].x = 1.25; C.p[i].ry = -1.0; C.p.forEach((q, k) => { if (k !== i) { q.x = -1.1 + k * 0.9; q.ry = 0.5; } }); C.cam('orbit'); }],
  [/sit_phone|phone|celu/, (i, C) => { C.p[i].holds = 'celular'; C.acts.push({ who: i, face: 'bored', at: 0 }, { who: i, face: 'laugh', at: 1.3 }); }],
  [/hug_mate/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].pose = 'carry'; C.acts.push({ who: i, face: 'love', at: 0.3 }, { fx: 'hearts', at: 0.5, from: 'head', who: i }); }],
  [/hold_both|carry_termo|carry_all|termo_brazo/, (i, C) => { C.p[i].holds = 'mate'; C.p[i].holdsL = 'termo'; if (/carry_all|walk/.test(C.p[i].does) || C.p.length === 1) C.acts.push({ who: i, walk: [C.x(i) - 1.2, C.x(i)], t0: 0, t1: 0.9 }); }],
  [/hold_mate|hold_cuia|hold_guampa|cuia|guampa/, (i, C) => { const d = C.p[i].does; C.p[i].holds = /guampa/.test(d) ? 'guampa' : /cuia/.test(d) ? 'cuia' : 'mate'; }],
  [/hold_yerba/, (i, C) => { C.p[i].holds = 'yerba'; C.p[i].pose = 'present'; }],
  [/hold_termo/, (i, C) => { C.p[i].holds = 'termo'; }],
  [/hold_pava/, (i, C) => { C.p[i].holds = 'pava'; C.acts.push({ fx: 'steam', t0: 0.2, t1: 2, from: 'hand', who: i }); }],
  [/bolsa|nylon/, (i, C) => { C.p[i].holds = 'bolsa'; C.p[i].pose = 'present'; C.acts.push({ who: i, face: 'proud', at: 0.3 }); C.others(i).forEach(o => C.acts.push({ look: [o, i], at: 0.3 }, { who: o, face: 'disgusted', at: 1.0 })); }],
  [/hold_bombilla|bombilla/, (i, C) => { C.p[i].holds = 'bombilla'; C.p[i].pose = 'present'; }],
  // body: the whole person moves
  [/^run/, (i, C) => { C.acts.push({ who: i, walk: [C.x(i) - 1.6, C.x(i) + 0.4], t0: 0, t1: 1.0, run: true }); C.cam('follow'); }],
  [/^walk|camina|llega/, (i, C) => { C.acts.push({ who: i, walk: [C.x(i) - 1.4, C.x(i)], t0: 0, t1: 1.1 }); }],
  [/^jump|salta/, (i, C) => { C.acts.push({ who: i, hop: 0.4 }, { who: i, hop: 1.0 }, { who: i, pose: 'cheer', face: 'happy', at: 0.3 }); }],
  [/^cheer|festej/, (i, C) => { C.p[i].pose = 'cheer'; C.acts.push({ who: i, hop: 0.5 }, { fx: 'confetti', t0: 0.4, t1: 1.6, from: 'head', who: i }); }],
  [/^shock|asust/, (i, C) => { C.acts.push({ who: i, pose: 'shock', face: 'shock', at: 0.5 }, { who: i, hop: 0.55 }, { fx: 'stars', at: 0.6, from: 'head', who: i }); }],
  [/^laugh|rie/, (i, C) => { C.p[i].pose = 'laugh'; C.p[i].face = 'crylaugh'; const t = C.target(i); if (t >= 0) C.acts.push({ look: [i, t], at: 0.1 }); }],
  [/^wave|saluda/, (i, C) => { C.p[i].pose = 'wave'; C.acts.push({ who: i, face: 'happy', at: 0.2 }); }],
  [/^point|senala/, (i, C) => { C.p[i].pose = 'point'; const t = C.target(i); if (t >= 0) C.acts.push({ look: [i, t], at: 0.1 }); }],
  [/^no$|niega/, (i, C) => { C.p[i].pose = 'shrug'; C.acts.push({ who: i, face: 'angry', at: 0.2 }); const t = C.target(i); if (t >= 0) C.acts.push({ look: [i, t], at: 0 }); }],
  [/^nod|asiente/, (i, C) => { C.p[i].pose = 'talk'; C.acts.push({ who: i, face: 'happy', at: 0.2 }, { who: i, hop: 0.6 }); }],
  [/^talk|habla|cuenta/, (i, C) => { C.p[i].pose = 'talk'; C.p[i].talk = true; C.others(i).forEach((o, k) => C.acts.push({ look: [o, i], at: 0.15 + k * 0.12 }, { who: o, face: k % 2 ? 'surprised' : 'happy', at: 0.9 + k * 0.2 })); }],
  [/^shrug|no_se/, (i, C) => { C.p[i].pose = 'shrug'; C.acts.push({ who: i, face: 'confused', at: 0.2 }); const t = C.target(i); if (t >= 0) C.acts.push({ look: [i, t], at: 0 }); }],
  [/^sigh|suspira/, (i, C) => { C.p[i].face = 'bored'; const t = C.target(i); if (t >= 0) C.acts.push({ look: [i, t], at: 0 }); C.acts.push({ who: i, face: 'sad', at: 0.8 }); }],
  [/^think|piensa/, (i, C) => { C.p[i].pose = 'think'; C.acts.push({ who: i, face: 'confused', at: 0 }, { who: i, face: 'surprised', at: 1.4 }); }],
  // yerba work (secadero, factory)
  [/zapec|toast|fuego_vivo/, (i, C) => { C.p[i].holds = 'machete'; C.p[i].pose = 'saw'; for (const t0 of [0.2, 0.9, 1.6]) C.acts.push({ fx: 'steam', t0, t1: t0 + 0.6, from: 'hand', who: i }); C.acts.push({ who: i, face: 'proud', at: 0.5 }); C.cam('low'); }],
  [/stir|revuelv|dry_yerba|secar/, (i, C) => { C.p[i].pose = 'saw'; C.acts.push({ fx: 'steam', t0: 0.2, t1: 2.6, pos: [0.4, 0.6, 0.6] }, { fx: 'dust', at: 0.8, pos: [0.4, 0.2, 0.6] }, { who: i, face: 'bored', at: 0 }, { who: i, face: 'happy', at: 1.5 }); }],
  [/pack|empaquet|grind_yerba|muele/, (i, C) => { C.p[i].holds = 'yerba'; C.p[i].pose = 'present'; C.acts.push({ fx: 'seeds', t0: 0.3, t1: 1.5, from: 'hand', who: i }, { who: i, tilt: [0.3, 0.6], ang: -1.2 }, { who: i, face: 'proud', at: 1.4 }); }],
  [/^sit/, (i, C) => { if (/hold_both/.test(C.p[i].does)) { C.p[i].holds = 'mate'; C.p[i].holdsL = 'termo'; } }],
  [/^idle$|^$/, null]];
const verbOf = d => VERBS.find(([re]) => re.test(d || ''));
// every script verb that has no action (lint uses it)
const missingVerbs = list => [...new Set(list.map(norm))].filter(d => d && !verbOf(d));
// the shot: run the verbs of all people, then the hand-over pair; a scene where nobody does anything gets a ronda or a conversation
function direct(sc, ppl, sg, prevPeople) { const acts = []; let cam = null, stage = null, single = false, busy = -1; const text = norm(sg.text);
  const others = k => ppl.map((q, i) => i).filter(i => i !== k);
  const C = { p: ppl, acts, hot: HOT.test(text), mood: i => (sc.people[i] || {}).mood, others, x: i => ppl[i].x ?? (ppl.length === 1 ? 0 : (i - (ppl.length - 1) / 2) * 0.95),
    partner: i => (ppl.length > 1 ? (i === 0 ? 1 : 0) : -1), target: i => { const t = ppl.findIndex((q, k) => k !== i && /drink|blow|sopl|pass|receive/.test(q.does || '')); return t >= 0 ? t : C.partner(i); },
    cam: c => { cam = c; single = true; }, stage: s => { stage = s; single = true; }, stageTool: k => { stage = { obj: 'mate', st: 'mate', tools: [k] }; }, busy: i => { busy = i; },
    bringOthers: i => { if (ppl.length > 1) return; const extra = prevPeople.filter(q => q !== ppl[i] && q.shirt !== ppl[i].shirt).slice(0, 2).map(q => ({ ...q, pose: 'idle', does: '', holds: q.holds === 'celular' ? null : q.holds, holdsL: null, y: 0, z: undefined, x: undefined, ry: undefined })); ppl.push(...extra); } };
  ppl.slice().forEach((q, i) => { const v = verbOf(q.does); if (v && v[1]) v[1](i, C); });
  // hand-over: the giver walks to the receiver, the mate changes hands
  const does = ppl.map(q => q.does || ''); let from = -1, to = -1; if (Array.isArray(sc.pass)) { from = sc.pass[0]; to = sc.pass[1]; } else { from = does.findIndex(d => d === 'pass' || d === 'offer'); to = does.findIndex(d => d === 'receive'); if (from >= 0 && to < 0 && ppl.length > 1) to = from === 0 ? 1 : 0; if (to >= 0 && from < 0 && ppl.length > 1) from = to === 0 ? 1 : 0; }
  if (from >= 0 && to >= 0 && ppl[from] && ppl[to] && from !== to) { ppl[from].holds = ppl[from].holds && ppl[from].holds !== 'celular' ? ppl[from].holds : 'mate'; ppl[from].pose = 'idle'; ppl[to].holds = null; ppl[to].pose = 'idle'; acts.push({ give: [from, to], at: 1.15, dur: 0.85 }); if (C.hot) acts.push({ fx: 'steam', t0: 0.2, t1: 2.4, from: 'hand', who: from }); acts.push({ who: to, face: ppl[to].face === 'worried' ? 'scared' : 'surprised', at: 1.2 }); others(from).filter(i => i !== to).forEach(i => acts.push({ look: [i, from], at: 0.3 })); cam = 'orbit'; single = true; }
  // nobody does anything: the mate goes round (ronda) or somebody tells something and the others listen
  if (!acts.length && !stage) { const holder = ppl.findIndex(q => q.holds === 'mate');
    if (holder >= 0 && ppl.length > 1) { const t2 = holder + 1 < ppl.length ? holder + 1 : holder - 1; ppl[t2].holds = null; acts.push({ give: [holder, t2], at: 1.2, dur: 0.85 }, { who: t2, face: 'happy', at: 1.25 }); others(holder).filter(i => i !== t2).forEach(i => acts.push({ look: [i, holder], at: 0.3 })); cam = 'orbit'; single = true; }
    else if (ppl.length > 1) { const sp = 0; ppl[sp].talk = true; if (ppl[sp].pose === 'idle') ppl[sp].pose = 'talk'; others(sp).forEach((i, k) => acts.push({ look: [i, sp], at: 0.15 + k * 0.12 }, { who: i, face: k % 2 ? 'surprised' : 'happy', at: 0.9 + k * 0.2 })); }
    else if (ppl.length === 1 && !ppl[0].sit) acts.push({ who: 0, walk: [-1.3, 0], t0: 0, t1: 0.75, ry: 0 }); }
  ppl.forEach(q => { if (q.pose === 'drink' && !q.holds) q.holds = 'mate'; });
  return { acts, cam, single, stage, busy, plain: !acts.length }; }
// people of the place in the background (they walk past, sip, chat) so the world is alive
const EXTRA_LOOKS = [{ shirt: '#3fa7a0', hair: 'ponytail', hairColor: '#6a3a1f' }, { shirt: '#f2a922', hair: 'curly', hairColor: '#2b1a10' }, { shirt: '#5a6b8a', hair: 'short', beard: true, hairColor: '#3a2618' }, { shirt: '#d94f8a', hair: 'long', hairColor: '#8a5a2a', dress: '#d94f8a' }, { shirt: '#8a4fd0', hat: 'cap', hatColor: '#2b2b2b', backpack: '#2f6fd0' }, { shirt: '#e9dfc8', hat: 'boina', hatColor: '#2b2b2b', mustache: true, belly: true }];
const EXTRA_PLACES = { plaza: 3, patio: 2, playa: 3, mercado: 3, oficina: 2, yerbal: 2, prado: 2, ruta: 1, super: 2, selva: 1 };
function extrasFor(place, seed, nPeople) { const n = Math.max(0, (EXTRA_PLACES[place] || 0) - (nPeople > 2 ? 1 : 0)); const out = [];
  for (let k = 0; k < n; k++) { const L = EXTRA_LOOKS[(seed + k * 2) % EXTRA_LOOKS.length]; const kind = (seed + k) % 3;
    out.push({ ...L, z: -2.4 - k * 0.7, ...(kind === 0 ? { walk: k % 2 ? [3.2, -3.2] : [-3.2, 3.2], speed: 0.6 + k * 0.1 } : kind === 1 ? { x: (k % 2 ? 1 : -1) * (2.0 + k * 0.4), holds: 'mate', pose: 'drink' } : { x: (k % 2 ? -1 : 1) * (2.3 + k * 0.3), pose: 'talk', ph: k }) }); }
  return out; }
// ---- POV: "you" is the camera (eye height, own hands in the frame); the verb of "you" is what the hands do
const isYou = pp => /^(you|vos|yo|tu)$/.test(norm(pp && pp.role));
function povOf(sc, sg) { const all = sc.people || []; const yi = all.findIndex(isYou); if (yi < 0) return null;
  const me = all[yi], yd = norm(me.does), look = toon(me, yi); const others = all.filter((q, i) => i !== yi).slice(0, 4).map(q => ({ ...q }));
  const gi = others.findIndex(q => /^(pass|offer)$/.test(norm(q.does))), ri = others.findIndex(q => norm(q.does) === 'receive');
  const pov = { shirt: look.shirt, skin: look.skin }; const hot = HOT.test(norm(sg.text)) || ['pain', 'dolor', 'quemado'].includes(norm(me.mood));
  if (yd === 'receive' || (gi >= 0 && !/^(pass|offer)$/.test(yd))) { pov.act = 'receive'; pov.from = gi >= 0 ? gi : 0; if (others[pov.from]) others[pov.from].does = 'hold_mate'; }
  else if (/^(pass|offer)$/.test(yd)) { pov.act = 'give'; pov.to = ri >= 0 ? ri : 0; if (others[pov.to]) others[pov.to].does = 'idle'; }
  else if (/^drink/.test(yd)) { pov.act = 'drink'; pov.holds = /guampa/.test(yd) ? 'guampa' : /cuia/.test(yd) ? 'cuia' : 'mate'; pov.burn = hot; }
  else if (/blow|sopl/.test(yd)) pov.act = 'blow';
  else if (/hold_both|carry|termo_brazo/.test(yd)) { pov.act = 'hold'; pov.holds = 'mate'; pov.holdsL = 'termo'; }
  else if (/film|phone|celu|foto/.test(yd)) { pov.act = 'phone'; pov.holds = 'celular'; }
  else if (/hold_termo/.test(yd)) { pov.act = 'hold'; pov.holds = 'termo'; } else if (/hold_pava/.test(yd)) { pov.act = 'hold'; pov.holds = 'pava'; } else if (/hold_yerba|bolsa/.test(yd)) { pov.act = 'hold'; pov.holds = /bolsa/.test(yd) ? 'bolsa' : 'yerba'; }
  else if (/hold_|hug_mate|mate$/.test(yd)) { pov.act = 'hold'; pov.holds = /guampa/.test(yd) ? 'guampa' : /cuia/.test(yd) ? 'cuia' : 'mate'; }
  else if (/^(walk|run)|llega|camina/.test(yd)) pov.act = 'walk'; else if (/shock|asust|no$|niega/.test(yd)) pov.act = 'shock'; else pov.act = 'look';
  return { pov, others }; }
function toSpec(script) {
  const base = flat2d.toSpec(script, { plain: true }); base.segments.forEach(g => (g.callouts || []).forEach(c => { if (c.early) c.y = 1400; })); const pick = chooser(script.id || 'reel'); let gagN = 0; const firstScene = script.segments.map(g => (g.visuals || [g.visual])).flat().find(v => v && v.type === 'scene') || {}; let place = placeOf(firstScene.place);
  const where = (p, v, si) => { if (place !== 'prado') p.place = place; const pr = v && v.type === 'scene' ? propsFor(v, place) : []; if (pr.length) p.props = pr;
    if (!p.board && !p.focus && p.cam !== 'face') { const ex = extrasFor(place, hashN((script.id || '') + si, 97), (p.people || []).length); if (ex.length) p.extras = ex; }
    // sitting people: on the sofa of the living room (it stands at the back wall), elsewhere they stand
    (p.people || []).forEach(q => { if (!q.sit) return; delete q.sit; if (place === 'living' && !p.stage) { q.pose = q.pose === 'idle' ? 'sit' : q.pose; q.y = 0.27; q.z = -1.62; q.ry = 0; q._seat = 1; } });
    // seated people only change their face in a gag (no jumping on the sofa)
    const seated = (p.people || []).map((q, i) => q._seat ? i : -1).filter(i => i >= 0); (p.people || []).forEach(q => { delete q._seat; delete q.does; }); if (p.acts && seated.length) p.acts = p.acts.filter(a => !seated.includes(a.who) || (!a.walk && a.fall == null && !a.hop && !a.give)).map(a => seated.includes(a.who) && a.pose ? { ...a, pose: 'sit' } : a); return p; };
  let lastPeople = [{ shirt: '#e5483a', hat: 'boina', mustache: true, face: 'happy', pose: 'idle' }], lastP = null;
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual]; const words = String(sg.text || '').split(/\s+/).filter(Boolean).length; const n = Math.max(1, Math.min(2, Math.round(words / 6)));
    // boards (cards, lists, poll) float over the 3D world: the people of the reel stand behind them, the camera drifts slowly
    const toBuild = s => { if (!s || s.tpl !== 'board' || !s.p || (s.p.kind === 'title' && !s.p.text)) return s; const { bg, scene, time, tableY, ...board } = s.p; return { tpl: 'build', p: where({ people: lastPeople.map(q => ({ ...q, pose: 'idle', y: 0, z: undefined })), cam: 'orbit', board, dim: 0.45, seed: si * 7, ...(board.kind === 'poll' ? { lift: 1.0 } : {}) }, null, si) }; };
    if (script.poll && si === script.segments.length - 1) { seg.shots = seg.shots.map(toBuild); return; }
    const out = []; seg.shots.forEach((s, k) => { const v = vis[k];
      // extra shots of the 2D style (montage, reaction close-up) never stay 2D: a close-up of one of the people of the last 3D shot
      if (!v) { if (s.tpl === 'board') return out.push(toBuild(s)); if (lastP) { const ppl0 = (lastP.people || []).filter(q => q.pose !== 'sit'); const q = { ...(ppl0[k % Math.max(1, ppl0.length)] || lastPeople[0]), x: 0, ry: 0, y: 0, z: undefined }; return out.push({ tpl: 'build', p: where({ people: [q], cam: 'face', who: 0, focus: 'face', acts: [{ who: 0, face: k % 2 ? 'surprised' : 'happy', at: 0.4 }], seed: si * 7 + k }, null, si) }); } return out.push(s); }
      const place0 = place; if (v.type === 'scene' && v.place) place = placeOf(v.place); const push = (p, m = 1) => { where(p, v, si); lastP = p; for (let j = 0; j < m; j++) out.push({ tpl: 'build', p: { ...JSON.parse(JSON.stringify(p)), cam: j === 0 ? p.cam : (p.people && p.people.length ? pick(j % 2 ? FACECAMS : CAMS) : pick(['orbit', 'crash', 'push'])), seed: si * 7 + j } }); };
      if (script.pov && v.type === 'scene' && (v.people || []).some(isYou)) { const pv = povOf(v, sg); const sc2 = { ...v, people: pv.others }; delete sc2.pass; const ppl = pv.others.map(toon); const prevPeople = lastPeople; if (ppl.length) lastPeople = ppl;
        const D = ppl.length ? direct(sc2, ppl, sg, prevPeople) : { acts: [], stage: null }; let acts = D.acts.filter(a => !a.give); const P = pv.pov;
        if (P.act === 'drink') ppl.forEach((q, i) => acts.push(P.burn ? { who: i, pose: 'laugh', face: 'crylaugh', at: 1.15 } : { who: i, face: 'happy', at: 1.0 }));
        if (P.act === 'drink' || P.act === 'blow') { acts.push({ fx: 'steam', t0: P.act === 'blow' ? 0.5 : 0.2, t1: 2.6, from: 'pov' }); if (P.burn) acts.push({ fx: 'steam', t0: 1.0, t1: 1.8, from: 'pov' }); }
        if (P.act === 'receive' && ppl[P.from]) { ppl[P.from].pose = 'idle'; acts.push({ who: P.from, face: 'happy', at: 0.2 }); ppl.forEach((q, i) => { if (i !== P.from) acts.push({ look: [i, P.from], at: 0.3 }); }); if (HOT.test(norm(sg.text))) acts.push({ fx: 'steam', t0: 0.2, t1: 2.4, from: 'hand', who: P.from }); }
        if (P.act === 'give' && ppl[P.to]) { ppl[P.to].pose = 'idle'; acts.push({ who: P.to, face: 'happy', at: 1.3 }); }
        if (P.act === 'shock') ppl.forEach((q, i) => acts.push({ who: i, face: 'surprised', at: 0.5 }));
        const p = { people: ppl, cam: 'pov1', pov: P, ...(acts.length ? { acts } : {}), ...(D.stage ? { stage: D.stage } : {}) }; where(p, v, si); lastP = p; out.push({ tpl: 'build', p: { ...JSON.parse(JSON.stringify(p)), seed: si * 7 } });
        // long sentences: a second shot, the person in front of you in a close-up, looking into the lens
        if (n > 1 && ppl.length && !['receive', 'give', 'drink', 'blow'].includes(P.act)) { const k0 = P.act === 'receive' ? P.from : P.act === 'give' ? P.to : 0; const q = { ...ppl[k0], x: 0, ry: 0, y: 0, z: undefined, pose: ppl[k0].pose === 'walk' ? 'idle' : ppl[k0].pose }; out.push({ tpl: 'build', p: where({ people: [q], cam: 'face', who: 0, focus: 'face', acts: [{ who: 0, face: P.burn ? 'crylaugh' : 'happy', at: 0.3 }], seed: si * 7 + 1 }, null, si) }); }
        return; }
      if (script.pov && v.type === 'reaction') { const e = FACE[norm(v.emotion)] || 'surprised'; const ppl = lastPeople.map(q => ({ ...q, pose: q.pose === 'sit' ? 'sit' : 'idle', holds: null, holdsL: null, y: 0, z: undefined, x: undefined, ry: undefined }));
        const act = ['surprised', 'shock', 'scared', 'angry', 'outraged'].includes(e) ? 'shock' : 'look'; const acts = ppl.map((q, i) => ({ who: i, face: e === 'laugh' || e === 'crylaugh' ? 'crylaugh' : act === 'shock' ? 'surprised' : 'happy', at: 0.3 }));
        const p = { people: ppl, cam: 'pov1', pov: { act }, acts }; where(p, null, si); lastP = p; return out.push({ tpl: 'build', p }); }
      if (v.type === 'scene' || v.type === 'mistake') { const sc = v.type === 'mistake' ? (v.over || { people: [{ role: 'friend', does: 'no' }] }) : v; const ppl = (sc.people || []).slice(0, 4).map(toon); if (v.type === 'mistake') ppl.forEach(q => { q.pose = 'shrug'; q.face = 'worried'; });
        // a failure hits the person: the first one falls over, stars over the head, the others react
        const gag = v.type === 'mistake' && ppl.length ? [{ who: 0, pose: 'shock', face: 'scared', at: 0.3 }, { who: 0, fall: 0.9 }, { fx: 'stars', at: 1.2, from: 'head', who: 0 }, { who: 0, face: 'dizzy', at: 1.4 }, ...ppl.slice(1).map((q, k) => ({ who: k + 1, pose: 'laugh', face: 'crylaugh', at: 1.0 }))] : null; const prevPeople = lastPeople; if (ppl.length) lastPeople = ppl;
        const D = v.type === 'scene' && !gag ? direct(sc, ppl, sg, prevPeople) : { acts: [], busy: -1, plain: true }; const busy = D.busy;
        const fun = !gag && D.plain && si > 0 && gagN < 3 && (sg.emo === 'funny' || /funny|laugh/.test(String((sc.people || []).map(q => q.mood).join(' ')))) && ppl.length; const gk = fun ? GAGS[(gagN + hashN(script.id || 'r', 13)) % GAGS.length] : null; if (fun) gagN++;
        const p = { people: ppl.length ? ppl : lastPeople, cam: gag ? 'low' : gk === 'trip' ? 'follow' : busy >= 0 ? 'push' : si === 0 || sg.beat === 'hook' ? 'push' : sg.beat === 'payoff' ? 'crash' : sg.beat === 'rehook' ? 'low' : (v.place && placeOf(v.place) !== place0) ? 'orbit' : pick(['push', 'orbit', 'low', 'follow']), focus: busy >= 0 && !D.cam ? 'face' : null, who: Math.max(0, busy) };
        if (D.acts.length) { p.acts = D.acts; if (D.cam) p.cam = D.cam; if (D.stage) p.stage = D.stage; } else if (gag) p.acts = gag; else if (gk) p.acts = gagActs(gk === 'spit' ? 'derp' : gk, p.people, -1);
        if (ppl.length === 1 && p.people[0].x == null) { p.people[0].x = 0; p.people[0].ry = 0; } return push(p, busy >= 0 || D.single ? 1 : n); }
      if (v.type === 'reaction') { const q = { ...(lastPeople[(v.who || 0) % lastPeople.length] || lastPeople[0]), x: 0, ry: 0, holds: null, holdsL: null, y: 0, z: undefined }; if (q.pose === 'sit') q.pose = 'idle'; const e = FACE[norm(v.emotion)] || 'surprised'; q.face = e === 'surprised' ? (si % 2 ? 'mindblown' : 'shock') : e === 'laugh' ? 'crylaugh' : e; const a = norm(v.act); q.pose = a === 'think' ? 'think' : a === 'point' ? 'point' : a === 'shrug' ? 'shrug' : e === 'surprised' || a === 'shock' ? 'shock' : ACTS.includes(a) ? (a === 'laugh' ? 'laugh' : a === 'cheer' ? 'cheer' : 'idle') : 'idle';
        // a reaction is a movement too: a jump for shock and joy, stars for surprise
        const ra = q.pose === 'shock' ? [{ who: 0, hop: 0.35 }, { fx: 'stars', at: 0.4, from: 'head', who: 0 }] : q.pose === 'cheer' ? [{ who: 0, hop: 0.3 }, { fx: 'confetti', t0: 0.3, t1: 1.2, from: 'head', who: 0 }] : q.pose === 'laugh' ? [{ fx: 'hearts', at: 0.5, from: 'head', who: 0 }] : [];
        return push({ people: [q], cam: 'face', who: 0, ...(ra.length ? { acts: ra } : {}) }); }
      if (v.type === 'object') { const an = norm(v.animate), hot = /humo|steam|vapor|hirv/.test(an) || HOT.test(norm(sg.text)); const oa = hot ? [{ fx: 'steam', t0: 0, t1: 3.2, pos: MATE_TOP }, { fx: 'steam', t0: 0.15, t1: 3.2, pos: [0.05, 1.8, 0.3] }, ...(/fuerte|locomot|mucho/.test(an + norm(sg.text)) ? [{ shake: [0.5, 3.2] }] : [])] : [];
        return push({ stage: stageOf(v), cam: pick(['orbit', 'crash', 'push']), people: [], ...(oa.length ? { acts: oa } : {}) }, Math.min(2, n)); }
      if (v.type === 'compare') { const a = stageOf(v.left || {}), b = stageOf(v.right || {}); return push({ stage: { ...a, tools: [b.obj === 'mate' ? 'termo' : b.obj] }, cam: 'orbit', people: [] }); }
      if ((v.type === 'title' || v.type === 'number') && si < script.segments.length - 1) { return push({ people: lastPeople.map(q => ({ ...q, pose: q.pose === 'sit' ? 'sit' : 'shock', y: 0, z: undefined })), cam: 'push' }); } // text cards mid-reel: the people react, the words sit framed in the subtitle line (no tile)
      if (v.type === 'title' || v.type === 'number' || v.type === 'map') { const text = String(v.type === 'number' ? v.value : v.text || (v.countries || []).join(' · ')).toUpperCase(); seg.callouts = [...(seg.callouts || []).filter(c => c.type !== 'big'), { type: 'big', keep: true, text: text.slice(0, 22), ...(v.type === 'number' ? { size: 300 } : {}), sub: v.sub ? String(v.sub).toUpperCase().slice(0, 40) : undefined, at: String(sg.text).split(/\s+/)[0] }];
        return push({ people: lastPeople.map(q => ({ ...q, pose: 'point', y: 0, z: undefined })), cam: 'drone' }); }
      out.push(toBuild(s)); }); seg.shots = out; });
  // never the same camera move twice in a row: a repeated move gets the next one from its list (face, pov1 and chase stay)
  { const ALT = { orbit: ['push', 'low'], push: ['orbit', 'low'], drone: ['push', 'orbit'], low: ['push', 'orbit'], follow: ['low', 'push'], crash: ['orbit', 'push'], whip: ['push', 'orbit'], diorama: ['push', 'orbit'] }; let prev = null;
    base.segments.forEach(g => (g.shots || []).forEach(sh => { const p = sh && sh.tpl === 'build' && sh.p; if (!p || !p.cam) { prev = null; return; }
      if (p.cam === prev && ALT[p.cam]) { const nx = ALT[p.cam].find(c => c !== prev); p.cam = nx; if (nx !== 'push' && p.focus === 'face') p.focus = null; }
      prev = p.cam; })); }
  base.segments.forEach(g => (g.shots || []).forEach(sh => { const p = sh && sh.tpl === 'build' && sh.p; if (!p || p.board || p.stage || p.lift || !(p.people || []).length || ['face', 'pov1', 'chase'].includes(p.cam)) return; p.lift = 0.14; }));
  return { ...base, preset: 'build3d', ab: script.ab || 'style build3d', ...(script.follow === false ? { follow: false } : {}) };
}
module.exports = { name: 'build3d', toSpec, VERBS, verbOf, missingVerbs };
