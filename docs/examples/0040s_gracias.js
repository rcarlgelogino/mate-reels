// Generator for docs/examples/0040s_gracias.json: a shooting script made for 3D (a ronda in a circle in a patio, a camera that moves around it).
// Run: node docs/examples/0040s_gracias.js   (directions are read from 0040s_directions/N.md; anim tracks are built here with real positions in metres)
const fs = require('fs'), path = require('path');
const D = n => fs.readFileSync(path.join(__dirname, '0040s_directions', n + '.md'), 'utf8').trim();
const rad = d => d * Math.PI / 180, at = (r, deg) => ({ x: +(r * Math.sin(rad(deg))).toFixed(3), z: +(r * Math.cos(rad(deg))).toFixed(3) });
// seats around the round table (0 deg = towards the camera), the cebador walks on an outer circle
const RS = 0.95, RW = 1.38; const SEAT = { vos: 165, abuela: 118, novia: 212, cunado: 268 }; // vos at the back facing the camera, the abuela next to him; the camera side stays free
const seat = id => at(RS, SEAT[id]); const serveDeg = id => SEAT[id] + 28; const serve = id => at(RW, serveDeg(id));
// which hand of a seated person faces the cebador at its serve point (local x of the person who faces the centre)
const side = id => { const p = seat(id), q = serve(id); const ry = Math.atan2(-p.x, -p.z); const lx = (q.x - p.x) * Math.cos(ry) - (q.z - p.z) * Math.sin(ry); return lx >= 0 ? 'R' : 'L'; };
const reach = id => side(id) === 'R' ? [128, -268] : [-128, -268];
const look = {
  vos: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'short', shirt: '#8fc3ea', pants: '#d8c39a' },
  suegro: { skin: '#f2c9a4', hair: '#6b5a4a', hairStyle: 'short', hat: 'boina', hatColor: '#2b2b2b', mustache: true, shirt: '#a8323a', pants: '#6f7682', termo: '#2f9e44' },
  abuela: { skin: '#f3cba6', hair: '#cfcfcf', hairStyle: 'bun', glasses: true, shirt: '#7c5a9e', dress: '#8a8f96', pants: '#8a8f96' },
  novia: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'ponytail', shirt: '#f2c53d', pants: '#3b5b9a' },
  cunado: { skin: '#f1c6a0', hair: '#2a1a10', hairStyle: 'curly', shirt: '#2f9e44', pants: '#2b2f3a' }
};
const sitter = (id, extra = []) => ({ id, look: look[id], keys: [{ u: 0, px: seat(id).x, pz: seat(id).z, faceTo: 'center', sit: true, s: id === 'abuela' ? 500 : 520, face: 'smile' }, ...extra] });
// the cebador: standing, termo in the left hand; walk(fromDeg,toDeg,u0,u1) adds keys along the outer circle so he never walks through the table
const walk = (keys, from, to, u0, u1) => { const n = Math.max(2, Math.ceil(Math.abs(to - from) / 25)); for (let i = 1; i <= n; i++) { const d = from + (to - from) * i / n, p = at(RW, d); keys.push({ u: +(u0 + (u1 - u0) * i / n).toFixed(3), px: p.x, pz: p.z, faceTo: 'center', turn: to > from ? -Math.PI / 2 : Math.PI / 2, act: 'walk', dur: (u1 - u0) / n }); } };
const stopAt = (keys, id, u) => { const p = serve(id); keys.push({ u, px: p.x, pz: p.z, faceTo: id, turn: 0, act: null, dur: 0.04 }); };
// the gourd passes hand to hand: give(keys, id, uGive, uBack)
const give = (mk, id, ug, ub) => { mk.push({ u: ug, at: id + '.' + side(id), pass: true, dur: 0.07, center: true }); mk.push({ u: ub, at: 'suegro.R', pass: true, dur: 0.07, center: true }); };
const anims = [];

// 1 — hook: wide, high; the mate goes to vos, he drinks and gives it back with a nod; eyebrow and looks
{ const sk = [{ u: 0, ...(() => { const p = serve('vos'); return { px: p.x, pz: p.z }; })(), faceTo: 'vos', hold: 'termo', R: [70, -270], L: [-40, -230], face: 'proud' }, { u: 0.12, R: [120, -290] }, { u: 0.3, R: [70, -270] }, { u: 0.75, R: [110, -290], face: 'sly' }, { u: 0.85, R: [70, -270] }];
  const vk = [{ u: 0.12, [side('vos')]: reach('vos'), look: 'suegro', face: 'smile' }, { u: 0.3, act: 'drink', drinkL: side('vos') === 'L', face: 'sip' }, { u: 0.6, act: null, [side('vos')]: reach('vos'), face: 'happy', bow: 0.25 }, { u: 0.7, bow: 0, dur: 0.1 }];
  const mk = [{ u: 0, at: 'suegro.R', center: true }]; give(mk, 'vos', 0.22, 0.78);
  anims.push({ world: 'patio', light: 'sun', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: sk }, sitter('vos', vk), sitter('abuela', [{ u: 0.1, look: 'vos' }, { u: 0.78, look: 'cunado', face: 'sly' }]), sitter('novia', [{ u: 0.1, look: 'vos', face: 'happy' }, { u: 0.8, face: 'surprised' }]), sitter('cunado', [{ u: 0.1, look: 'vos', face: 'sly' }, { u: 0.78, look: 'abuela' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: mk }], dogUp: 0.88,
    fx: [],
    cam3: [{ u: 0, a: -10, r: 4.6, h: 3.2, ax: 0, ay: 0.5, az: 0 }, { u: 1, a: 8, r: 3.2, h: 2.1, ax: 0.15, ay: 0.75, az: -0.5, dur: 1 }],
    sounds: [{ u: 0.3, type: 'pop' }, { u: 0.78, type: 'buzz' }] }); }

// 2 — everyone looks at him; sweat; the dog lifts its head
{ const p = serve('vos'); const vs = seat('vos');
  anims.push({ world: 'patio', light: 'sun', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, px: p.x, pz: p.z, faceTo: 'vos', hold: 'termo', L: [-40, -230], look: 'vos', face: 'neutral' }] },
      sitter('vos', [{ u: 0, [side('vos')]: [side('vos') === 'L' ? -60 : 60, -250], face: 'worried', look: 'cam' }, { u: 0.25, look: 'abuela' }, { u: 0.4, look: 'novia' }, { u: 0.55, look: 'cunado' }, { u: 0.72, look: 'cam', face: 'scared' }]),
      sitter('abuela', [{ u: 0, look: 'vos', face: 'confused' }]), sitter('novia', [{ u: 0, look: 'vos', face: 'happy' }]), sitter('cunado', [{ u: 0, look: 'vos', face: 'sly' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: [{ u: 0, at: 'vos.' + side('vos'), center: true }] }], dogUp: 0.5,
    fx: [{ kind: 'sweat', u0: 0.2, u1: 1, at: 'vos.head' }],
    cam3: [{ u: 0, a: 350, r: 3.2, h: 1.5, ax: vs.x, ay: 1.05, az: vs.z }, { u: 1, r: 2.7, dur: 1 }],
    sounds: [{ u: 0.5, type: 'tick' }, { u: 0.75, type: 'pop' }] }); }

// 3 — drinks, gives it back, nods: gracias; eyebrow; the exchanged look
{ const p = serve('vos'); const vs = seat('vos');
  const mk = [{ u: 0, at: 'vos.' + side('vos'), center: true }, { u: 0.62, at: 'suegro.R', pass: true, dur: 0.08, center: true }];
  anims.push({ world: 'patio', light: 'sun', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, px: p.x, pz: p.z, faceTo: 'vos', hold: 'termo', L: [-40, -230], R: [60, -260], look: 'vos', face: 'neutral' }, { u: 0.5, R: [115, -290] }, { u: 0.66, R: [70, -270], face: 'sly' }] },
      sitter('vos', [{ u: 0, act: 'drink', drinkL: side('vos') === 'L', face: 'sip', look: 'center' }, { u: 0.4, act: null, [side('vos')]: [side('vos') === 'L' ? -60 : 60, -260], face: 'happy', look: 'cam' }, { u: 0.52, [side('vos')]: reach('vos'), bow: 0.3 }, { u: 0.6, bow: 0, dur: 0.06 }, { u: 0.66, bow: 0.3, dur: 0.05 }, { u: 0.74, bow: 0, dur: 0.06 }, { u: 0.8, face: 'happy', look: 'center' }]),
      sitter('abuela', [{ u: 0, look: 'vos', face: 'smile' }, { u: 0.75, look: 'cunado', face: 'sly' }]), sitter('novia', [{ u: 0, look: 'vos', face: 'happy' }, { u: 0.72, face: 'scared' }]), sitter('cunado', [{ u: 0, look: 'vos', face: 'neutral' }, { u: 0.75, look: 'abuela', face: 'sly' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: mk }],
    cam3: [{ u: 0, a: 6, r: 3.6, h: 1.6, ax: (vs.x + p.x) / 2, ay: 1.0, az: (vs.z + p.z) / 2 }, { u: 1, a: -4, dur: 1 }],
    sounds: [{ u: 0.1, type: 'pop' }, { u: 0.68, type: 'buzz' }] }); }

// 4 — the round goes on and walks right past him
{ const sk = []; const s0 = serve('novia'); sk.push({ u: 0, px: s0.x, pz: s0.z, faceTo: 'novia', hold: 'termo', L: [-40, -230], R: [70, -270], face: 'happy', pour: 0 }, { u: 0.05, pour: 0.55, dur: 0.05 }, { u: 0.12, pour: 0, dur: 0.04 });
  walk(sk, serveDeg('novia'), serveDeg('cunado'), 0.24, 0.34); stopAt(sk, 'cunado', 0.36); sk.push({ u: 0.4, pour: 0.55, dur: 0.04 }, { u: 0.44, pour: 0, dur: 0.03 });
  walk(sk, serveDeg('cunado'), serveDeg('abuela') + 360, 0.52, 0.7); stopAt(sk, 'abuela', 0.72); sk.push({ u: 0.75, pour: 0.55, dur: 0.03 }, { u: 0.79, pour: 0, dur: 0.03 });
  sk.forEach(k => { if (k.px != null && Math.abs(k.px) > 0 && k.faceTo === 'center') { } });
  const mk = [{ u: 0, at: 'suegro.R', center: true }]; give(mk, 'novia', 0.14, 0.22); give(mk, 'cunado', 0.46, 0.52); give(mk, 'abuela', 0.82, 0.95);
  anims.push({ world: 'patio', light: 'sun', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: sk },
      sitter('vos', [{ u: 0, look: 'suegro', face: 'worried' }, { u: 0.55, [side('vos') === 'L' ? 'L' : 'R']: side('vos') === 'L' ? [-70, -430] : [70, -430], face: 'happy' }, { u: 0.7, L: null, R: null, face: 'sad', bow: 0.25 }]),
      sitter('abuela', [{ u: 0, look: 'suegro' }, { u: 0.82, [side('abuela')]: reach('abuela') }, { u: 0.86, act: 'drink', drinkL: side('abuela') === 'L', face: 'sip' }, { u: 0.93, act: null }]),
      sitter('novia', [{ u: 0, look: 'suegro', [side('novia')]: reach('novia') }, { u: 0.15, act: 'drink', drinkL: side('novia') === 'L', face: 'sip' }, { u: 0.21, act: null, face: 'happy' }]),
      sitter('cunado', [{ u: 0, look: 'suegro' }, { u: 0.44, [side('cunado')]: reach('cunado') }, { u: 0.47, act: 'drink', drinkL: side('cunado') === 'L', face: 'sip' }, { u: 0.51, act: null, face: 'proud' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: mk }],
    fx: [{ kind: 'stream', u0: 0.05, u1: 0.11, at: 'suegro.spout', to: 'mate.top', color: '#cfeeff', w: 8 }, { kind: 'stream', u0: 0.4, u1: 0.44, at: 'suegro.spout', to: 'mate.top', color: '#cfeeff', w: 8 }, { kind: 'stream', u0: 0.75, u1: 0.79, at: 'suegro.spout', to: 'mate.top', color: '#cfeeff', w: 8 }],
    cam3: [{ u: 0, a: 300, r: 3.6, h: 2.5, ax: 0, ay: 0.7, az: 0 }, { u: 1, a: 400, dur: 1 }],
    sounds: [{ u: 0.05, type: 'swish' }, { u: 0.55, type: 'pop' }, { u: 0.7, type: 'buzz' }] }); }

// 5 — time-lapse from above, dusk, two rounds without him; the termo is empty: one drop
{ const sk = []; const s0 = at(RW, 170); sk.push({ u: 0, px: s0.x, pz: s0.z, faceTo: 'center', hold: 'termo', L: [-40, -230], R: [70, -270], face: 'happy' });
  walk(sk, 170, 170 + 360, 0.02, 0.36); walk(sk, 170 + 360, 170 + 720, 0.38, 0.7); stopAt(sk, 'novia', 0.72); sk.push({ u: 0.76, pour: 1.6, dur: 0.06, face: 'confused' }, { u: 0.86, pour: 1.4, dur: 0.03 }, { u: 0.9, pour: 1.6, dur: 0.03 });
  const mk = [{ u: 0, at: 'suegro.R', center: true }];
  anims.push({ world: 'patio', light: 'dusk', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: sk },
      sitter('vos', [{ u: 0, face: 'sad', bow: 0.1 }, { u: 0.5, bow: 0.35, dur: 0.5 }, { u: 0.8, look: 'suegro' }]), sitter('abuela', [{ u: 0, face: 'happy' }]), sitter('novia', [{ u: 0, face: 'happy' }]), sitter('cunado', [{ u: 0, face: 'proud' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: mk }],
    fx: [{ kind: 'drops', u0: 0.82, u1: 0.98, at: 'suegro.spout', n: 1, fall: 90 }],
    cam3: [{ u: 0, a: 10, r: 1.2, h: 4.6, ax: 0, ay: 0.4, az: 0 }, { u: 0.6, a: 30, r: 1.6, h: 4.2, dur: 0.6 }, { u: 1, a: 50, r: 3.0, h: 3.0, ax: -0.2, ay: 0.7, az: -0.4, dur: 0.4 }],
    sounds: [{ u: 0.1, type: 'tick' }, { u: 0.4, type: 'tick' }, { u: 0.86, type: 'pop' }] }); }

// 6 — the abuela whispers the rule into his ear
{ const vs = seat('vos'), ab = seat('abuela');
  anims.push({ world: 'patio', light: 'dusk', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, ...(() => { const q = at(RW, 240); return { px: q.x, pz: q.z }; })(), faceTo: 'center', hold: 'termo', L: [-40, -230], face: 'neutral' }] },
      sitter('vos', [{ u: 0, face: 'sad', bow: 0.3, look: 'center' }, { u: 0.35, look: 'abuela', bow: 0.1, dur: 0.2 }, { u: 0.65, face: 'surprised', bow: 0, dur: 0.1 }]),
      sitter('abuela', [{ u: 0, look: 'vos', face: 'neutral' }, { u: 0.15, faceTo: 'vos', bow: 0.35, dur: 0.15, L: [-30, -400], face: 'sly' }, { u: 0.8, face: 'proud', bow: 0.2 }, { u: 0.88, bow: 0.35, dur: 0.05 }, { u: 0.94, bow: 0.2, dur: 0.05 }]),
      sitter('novia', [{ u: 0, face: 'happy', look: 'cunado' }]), sitter('cunado', [{ u: 0, face: 'laugh', look: 'novia' }]) ],
    props: [], fx: [],
    cam3: [{ u: 0, a: 340, r: 2.9, h: 1.45, ax: (vs.x + ab.x) / 2, ay: 1.1, az: (vs.z + ab.z) / 2 }, { u: 1, r: 2.5, dur: 1 }],
    sounds: [{ u: 0.3, type: 'swish' }, { u: 0.65, type: 'ding' }] }); }

// 7 — he climbs onto the chair and shouts; everyone jumps; the dog jumps up
{ const vs = seat('vos');
  anims.push({ world: 'patio', light: 'dusk', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, ...(() => { const q = at(RW, 240); return { px: q.x, pz: q.z }; })(), faceTo: 'vos', hold: 'termo', L: [-40, -230], look: 'vos', face: 'neutral' }, { u: 0.35, face: 'shock', jump: 0.08 }, { u: 0.6, jump: 0 }] },
      { id: 'vos', look: look.vos, keys: [{ u: 0, px: vs.x, pz: vs.z, faceTo: 'center', sit: true, face: 'determined' }, { u: 0.08, sit: false, py: 0 }, { u: 0.15, py: 0.3, dur: 0.07, faceTo: 'cam' }, { u: 0.3, L: [-90, -580], R: [90, -580], face: 'scream' }] },
      sitter('abuela', [{ u: 0, look: 'vos' }, { u: 0.35, face: 'shock', jump: 0.07 }, { u: 0.6, jump: 0 }]), sitter('novia', [{ u: 0, look: 'vos' }, { u: 0.35, face: 'shock', jump: 0.07 }, { u: 0.6, jump: 0 }]), sitter('cunado', [{ u: 0, look: 'vos' }, { u: 0.35, face: 'shock', jump: 0.07 }, { u: 0.6, jump: 0 }]) ],
    props: [], fx: [], dogUp: 0.48, shake: [{ u0: 0.3, u1: 0.42, a: 5 }],
    cam3: [{ u: 0, a: 352, r: 3.4, h: 0.75, ax: vs.x, ay: 1.2, az: vs.z }, { u: 0.3, ay: 1.6, dur: 0.15 }],
    sounds: [{ u: 0.1, type: 'swish' }, { u: 0.3, type: 'boom' }, { u: 0.5, type: 'buzz' }] }); }

// 8 — the suegro, with a second (red) termo, serves him one after the other
{ const p = serve('vos'), vs = seat('vos');
  const mk = [{ u: 0, at: 'suegro.R', center: true }]; give(mk, 'vos', 0.1, 0.3); give(mk, 'vos', 0.4, 0.58); give(mk, 'vos', 0.66, 0.84);
  const vk = []; [0.1, 0.4, 0.66].forEach(u0 => { vk.push({ u: u0, [side('vos')]: reach('vos'), face: 'happy' }, { u: u0 + 0.05, act: 'drink', drinkL: side('vos') === 'L', face: 'sip' }, { u: u0 + 0.16, act: null, face: 'happy' }); }); vk.push({ u: 0.9, [side('vos') === 'L' ? 'R' : 'L']: [side('vos') === 'L' ? 60 : -60, -430], face: 'derp' });
  anims.push({ world: 'patio', light: 'dusk', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, px: p.x, pz: p.z, faceTo: 'vos', hold: 'termo', termoColor: '#d63c2f', L: [-40, -230], R: [70, -270], look: 'vos', face: 'laugh' }] },
      sitter('vos', [{ u: 0, look: 'suegro', face: 'happy' }, ...vk]),
      sitter('abuela', [{ u: 0, face: 'laugh', look: 'vos' }]), sitter('novia', [{ u: 0, face: 'laugh', look: 'vos' }]), sitter('cunado', [{ u: 0, face: 'laugh', look: 'vos', jump: 0.03 }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: mk }], fx: [],
    cam3: [{ u: 0, a: 4, r: 3.3, h: 1.5, ax: (vs.x + p.x) / 2, ay: 1.0, az: (vs.z + p.z) / 2 }, { u: 1, a: -6, dur: 1 }],
    sounds: [{ u: 0.15, type: 'pop' }, { u: 0.45, type: 'pop' }, { u: 0.71, type: 'pop' }] }); }

// 9 — the whole family laughs; pull back; poll
{ const p = serve('vos');
  anims.push({ world: 'patio', light: 'dusk', seats: Object.keys(SEAT).map(seat),
    people: [ { id: 'suegro', look: look.suegro, keys: [{ u: 0, px: p.x, pz: p.z, faceTo: 'vos', hold: 'termo', termoColor: '#d63c2f', L: [-40, -230], R: [60, -330], face: 'laugh' }] },
      sitter('vos', [{ u: 0, face: 'happy', look: 'suegro' }]), sitter('abuela', [{ u: 0, face: 'laugh' }]), sitter('novia', [{ u: 0, face: 'laugh' }]), sitter('cunado', [{ u: 0, face: 'laugh' }]) ],
    props: [{ id: 'mate', kind: 'mate', keys: [{ u: 0, at: 'vos.' + side('vos'), center: true }] }], fx: [], dogUp: 0.2,
    poll: { u: 0.55, question: '¿Te pasó?', options: ['ME PASÓ', 'LO SABÍA', 'SOY EL SUEGRO'] },
    cam3: [{ u: 0, a: -5, r: 3.5, h: 2.0, ax: 0, ay: 0.7, az: -0.3 }, { u: 1, a: 20, r: 5.5, h: 3.5, dur: 1 }],
    sounds: [{ u: 0.55, type: 'pop' }] }); }

const texts = [
  ['En una ronda de mate, decir gracias es lo peor que podés hacer.', 'surprised'],
  ['Primera vez en lo de tu novia: toda la familia te está mirando.', 'tense'],
  ['Tomás, devolvés el mate y, educado, decís: gracias.', 'neutral'],
  ['Y desde ese momento, el mate te esquiva.', 'sad'],
  ['Pasa una vuelta, pasan dos, y se termina el termo.', 'sad'],
  ['Hasta que la abuela te dice al oído: gracias es que no querés más.', 'surprised'],
  ['Te subís a la silla y gritás: ¡no, gracias no, quiero más!', 'funny'],
  ['Y ahora tu suegro te ceba uno atrás del otro.', 'funny'],
  ['¿A vos también te pasó? Contalo en los comentarios.', 'funny']];
const j = { id: '0040s_gracias', title: 'Decir gracias en la ronda', caption: 'En una ronda de mate, decir "gracias" es lo peor que podés hacer 🧉😅\n¿A vos también te pasó? Contalo 👇', hashtags: ['#mate', '#ronda', '#argentina', '#suegro', '#humor'],
  poll: { question: '¿Te pasó?', options: ['ME PASÓ', 'LO SABÍA', 'SOY EL SUEGRO'] },
  story: { logline: 'On his first visit to his girlfriend\'s family, a young man politely says "gracias" when he returns the mate; the cebador (her father) takes it as "no more" and skips him round after round until the grandmother whispers the rule; he jumps onto his chair and shouts that he wants more, and the suegro serves him mate after mate.',
    timeline: ['Shots 1-4: a Sunday afternoon about 16:00, sun.', 'Shot 5: time-lapse, about an hour later, 17:30, dusk light; the termo is empty.', 'Shots 6-9: right after, dusk; shot 8 with a second termo (red) the suegro fetched.'],
    links: ['1 is a wide preview of the moment told in 2-3.', '2 -> 3: he holds the mate, then drinks and gives it back saying gracias.', '3 -> 4: the cebador reads gracias as "no more" and skips him.', '4 -> 5: the round goes on for an hour until the termo is empty.', '5 -> 6: the abuela, sitting next to him, has watched and tells him the rule.', '6 -> 7: he understands and shouts that he wants more.', '7 -> 8: the suegro gets the second termo and serves him again and again.', '8 -> 9: everybody laughs; he is part of the ronda now.'],
    places: { patio: 'one patio; round table in the middle; seated: vos (front right), abuela (to his right, back right), novia (back left), cuñado (front left); the cebador walks on an outer circle around the chairs' },
    knowledge: ['vos does not know the rule until shot 6.', 'The family knows from shot 3 what his gracias means.'] },
  cast: { vos: { role: 'you', age: 'about 25', looks: 'short neat dark hair, light blue shirt, beige trousers' }, suegro: { role: 'cebador', age: 'about 58', looks: 'black boina, thick moustache, dark red polo, grey trousers, green termo (red one later)' }, abuela: { role: 'grandma', age: 'about 82', looks: 'grey bun, round glasses, purple cardigan, grey skirt' }, novia: { role: 'novia', age: 'about 24', looks: 'dark ponytail, yellow T-shirt, jeans' }, cunado: { role: 'cunado', age: 'about 30', looks: 'dark curly hair, green football shirt' } },
  sets: { patio: { desc: 'family patio: brick floor circle, grass, white back wall with bushes, lemon tree, parrilla with smoke, side wall with door, string lights, round table with white cloth, yerba pack and medialunas, four low chairs, a sleeping dog, plant pots', light: 'shots 1-4 sun from the front left; 5-9 dusk, orange, glowing bulbs' } },
  segments: texts.map(([text, emo], i) => ({ text, emo, shots: [{ direction: D(i + 1), anim: anims[i] }] })) };
fs.writeFileSync(path.join(__dirname, '0040s_gracias.json'), JSON.stringify(j, null, 2) + '\n'); console.log('written, sides:', Object.keys(SEAT).map(id => id + ':' + side(id)).join(' '));
