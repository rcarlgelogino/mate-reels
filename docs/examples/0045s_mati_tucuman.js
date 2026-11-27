// Generator for docs/examples/0045s_mati_tucuman.json — "¿Sabías que…?" over-specific condition gag (text of the user, 2026-11-27):
// "¿Sabías que si sos de Tucumán y tomás un mate radiactivo un jueves de sol, te morís? Seguime para más datos de mate."
// Every condition gets its own tick (TUCUMÁN ✔, MATE RADIACTIVO ✔, JUEVES ✔, SOL ✔), then he drops.
// Run: node docs/examples/0045s_mati_tucuman.js
const fs = require('fs'), path = require('path');
const LOOK = { skin: '#f6d7bb', hair: '#2a1a10', hairStyle: 'curly', shirt: '#f2a922', pants: '#3b5b9a' };
const SEAT = { x: 0, z: -0.75 };
const mati = (k0 = {}, extra = []) => ({ id: 'mati', look: LOOK, keys: [{ u: 0, px: SEAT.x, pz: SEAT.z, faceTo: 'center', sit: true, s: 520, hold: 'mate', R: [45, -300], L: [-45, -235], face: 'happy', look: 'cam', ...k0 }, ...extra] });
const casa = o => ({ world: 'casita', light: 'sun', noTruck: true, sunDisc: true, seats: [SEAT], props: [], fx: [], sounds: [], ...o });
const camFace = (r = 2.6) => [{ u: 0, on: 'mati.head', a: 0, r, h: 0, ax: 0, ay: -0.2, az: 0 }, { u: 1, r: r - 0.3, dur: 1 }];
const fallen = (extra = {}) => mati({ sit: false, lean: 1.5, face: 'derp', mateGlow: true, ...extra });
const camFloor = (r = 3.2, h = 3.0) => [{ u: 0, a: 25, r, h, ax: 0.8, ay: 0.2, az: -0.8 }, { u: 1, r: r - 0.5, dur: 1 }];
const S = []; const say = (text, emo, ...shots) => S.push({ text, emo, shots });

say('¿Sabías que si sos de Tucumán', 'neutral',
  { f: 1, direction: 'Wide dollhouse kitchen on a sunny day: a young man from Tucumán, dark curly hair, yellow shirt, sits at the table with his mate and smiles. Label TUCUMÁN ✔.',
    anim: casa({ people: [mati()], labels: [{ u0: 0.3, text: 'TUCUMÁN ✔', at: 'mati.head', dy: -190, big: true }],
      cam3: [{ u: 0, a: 6, r: 4.6, h: 2.4, ax: 0, ay: 0.7, az: -0.6 }, { u: 1, r: 4.0, h: 2.1, dur: 1 }], sounds: [{ u: 0.3, type: 'lib:correct_1', gain: 0.6 }] }) });
say('y tomás un mate radiactivo', 'tense',
  { f: 1.1, direction: 'Close on the gourd: it glows bright green, green bubbles rise out of it, a Geiger counter crackles. He looks at it, delighted. Label MATE RADIACTIVO ✔.',
    anim: casa({ people: [mati({ mateGlow: true, face: 'starstruck', look: 'center' })], fx: [{ kind: 'bubbles', u0: 0, u1: 1, at: 'mati.mate', n: 6, r: 9, rise: 160, speed: 0.8 }],
      labels: [{ u0: 0.15, text: 'TUCUMÁN ✔', xy: [520, 560] }, { u0: 0.3, text: 'MATE RADIACTIVO ✔', at: 'mati.mate', dy: -170, big: true }],
      cam3: [{ u: 0, on: 'mati.mate', a: 10, r: 1.9, h: 0.3, ax: 0, ay: 0.18, az: 0 }, { u: 1, r: 1.6, dur: 1 }],
      sounds: [{ u: 0.05, type: 'lib:scanning_1', gain: 0.6 }, { u: 0.3, type: 'lib:correct_1', gain: 0.6 }] }) });
say('un jueves de sol,', 'tense',
  { f: 1, direction: 'Camera tilts up from the kitchen to the sky: a big cartoon sun with turning rays shines over the house. Labels JUEVES ✔ and SOL ✔ pop in one after the other.',
    anim: casa({ people: [mati({ mateGlow: true, act: 'drink', face: 'sip', look: 'center' })],
      labels: [{ u0: 0.2, text: 'JUEVES ✔', xy: [520, 820], big: true }, { u0: 0.5, text: 'SOL ✔', at: 'sun', dy: 160, big: true }],
      cam3: [{ u: 0, a: 20, r: 6, h: 1.6, ax: 0, ay: 1.2, az: -0.8 }, { u: 1, a: 25, r: 7, h: 1.2, ay: 9, az: -6, dur: 1 }],
      sounds: [{ u: 0.2, type: 'lib:correct_1', gain: 0.6 }, { u: 0.5, type: 'lib:correct_1', gain: 0.6 }] }) });
say('te morís?', 'surprised',
  { f: 1.1, direction: 'Back down: he goes stiff and falls sideways off the chair onto the floor, crossed eyes, stars, the gourd still glowing next to him. Label Q.E.P.D.',
    anim: casa({ people: [mati({ mateGlow: true, face: 'shock', look: 'cam' }, [{ u: 0.12, sit: false, lean: 1.5, dur: 0.18, face: 'derp' }])], fx: [{ kind: 'stars', u0: 0.35, u1: 1, at: 'mati.head' }],
      labels: [{ u0: 0.4, text: 'Q.E.P.D.', xy: [520, 760], big: true }], shake: [{ u0: 0.28, u1: 0.4, a: 4 }],
      cam3: camFloor(3.2, 3.0), sounds: [{ u: 0.28, type: 'lib:body_thud_1' }, { u: 0.42, type: 'lib:death_fortnite_1', gain: 0.7 }] }) });
say('Seguime para más datos de mate.', 'funny',
  { f: 1, direction: 'Close on him on the floor, the green gourd pulsing beside him, the four ticks stacked above: TUCUMÁN ✔, MATE RADIACTIVO ✔, JUEVES ✔, SOL ✔. Slow push-in.',
    anim: casa({ people: [fallen()], fx: [{ kind: 'stars', u0: 0, u1: 1, at: 'mati.head' }],
      labels: [{ u0: 0.05, text: 'TUCUMÁN ✔', xy: [520, 560] }, { u0: 0.12, text: 'MATE RADIACTIVO ✔', xy: [520, 660] }, { u0: 0.19, text: 'JUEVES ✔', xy: [520, 760] }, { u0: 0.26, text: 'SOL ✔', xy: [520, 860] }],
      cam3: camFloor(2.8, 2.6), sounds: [{ u: 0.05, type: 'lib:bruh_1', gain: 0.7 }] }) });

const j = { id: '0045s_mati_tucuman', title: 'Mate radiactivo en Tucumán', thumb: { lines: ['TUCUMÁN + JUEVES', 'MATE RADIACTIVO'] },
  caption: '¿Sabías que si sos de Tucumán y tomás un mate radiactivo un jueves de sol, te morís? ☢️🧉☀️\nSeguime para más datos de mate.', hashtags: ['#mate', '#tucuman', '#argentina', '#humor', '#sabiasque'],
  story: { logline: 'An absurdly over-specific "did you know": four conditions (Tucumán, radioactive mate, Thursday, sun) each get a tick, then he drops.' },
  cast: { mati: 'a young man from Tucumán: dark curly hair, yellow shirt, jeans' }, segments: S };
fs.writeFileSync(path.join(__dirname, '0045s_mati_tucuman.json'), JSON.stringify(j, null, 2) + '\n'); console.log('written', S.length, 'segments');
