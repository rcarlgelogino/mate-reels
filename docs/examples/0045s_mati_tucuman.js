// Generator for docs/examples/0045s_mati_tucuman.json — "¿Sabías que…?" over-specific condition gag (idea of the user, 2026-11-27):
// "si sos de Tucumán, te llamás Mati y tomás un mate radiactivo, te morís" — each condition gets its own tick; the anticlimax: "y si te llamás Juan, también".
// Fact kept true: around 4–5 sieverts at once kill about half of the people exposed (LD50).
// Run: node docs/examples/0045s_mati_tucuman.js
const fs = require('fs'), path = require('path');
const LOOK = { skin: '#f6d7bb', hair: '#2a1a10', hairStyle: 'curly', shirt: '#f2a922', pants: '#3b5b9a' };
const SEAT = { x: 0, z: -0.75 };
const mati = (k0 = {}, extra = []) => ({ id: 'mati', look: LOOK, keys: [{ u: 0, px: SEAT.x, pz: SEAT.z, faceTo: 'center', sit: true, s: 520, hold: 'mate', R: [45, -300], L: [-45, -235], face: 'happy', look: 'cam', ...k0 }, ...extra] });
const casa = o => ({ world: 'casita', light: 'sun', noTruck: true, seats: [SEAT], props: [], fx: [], sounds: [], ...o });
const camFace = (r = 2.6) => [{ u: 0, on: 'mati.head', a: 0, r, h: 0, ax: 0, ay: -0.2, az: 0 }, { u: 1, r: r - 0.3, dur: 1 }];
const S = []; const say = (text, emo, ...shots) => S.push({ text, emo, shots });

say('¿Sabías que si sos de Tucumán,', 'neutral',
  { f: 1, direction: 'Wide dollhouse kitchen: a young man with dark curly hair and a yellow shirt sits at the table with his mate. A label pops up: TUCUMÁN ✔.',
    anim: casa({ people: [mati()], labels: [{ u0: 0.3, text: 'TUCUMÁN ✔', at: 'mati.head', dy: -190, big: true }],
      cam3: [{ u: 0, a: 6, r: 4.6, h: 2.4, ax: 0, ay: 0.7, az: -0.6 }, { u: 1, r: 4.0, h: 2.1, dur: 1 }], sounds: [{ u: 0.3, type: 'lib:correct_1', gain: 0.6 }] }) });
say('te llamás Mati', 'neutral',
  { f: 0.9, direction: 'He waves at the camera with his free hand, big smile. Label MATI ✔.',
    anim: casa({ people: [mati({}, [{ u: 0.1, L: [-80, -560], dur: 0.12, wiggleL: 6 }])], labels: [{ u0: 0.15, text: 'TUCUMÁN ✔', at: 'mati.head', dy: -260 }, { u0: 0.3, text: 'MATI ✔', at: 'mati.head', dy: -170, big: true }],
      cam3: camFace(2.8), sounds: [{ u: 0.3, type: 'lib:correct_1', gain: 0.6 }] }) });
say('y tomás un mate radiactivo,', 'tense',
  { f: 1.1, direction: 'Close on the gourd: it glows bright green, green bubbles rise out of it, a Geiger counter starts to crackle. Label MATE RADIACTIVO ✔.',
    anim: casa({ people: [mati({ mateGlow: true, face: 'starstruck', look: 'center' })], fx: [{ kind: 'bubbles', u0: 0, u1: 1, at: 'mati.mate', n: 6, r: 9, rise: 160, speed: 0.8 }],
      labels: [{ u0: 0.3, text: 'MATE RADIACTIVO ✔', at: 'mati.mate', dy: -170, big: true }],
      cam3: [{ u: 0, on: 'mati.mate', a: 10, r: 1.9, h: 0.3, ax: 0, ay: 0.18, az: 0 }, { u: 1, r: 1.6, dur: 1 }],
      sounds: [{ u: 0.1, type: 'lib:scanning_1', gain: 0.6 }, { u: 0.3, type: 'lib:correct_1', gain: 0.6 }] }) });
say('con unos cinco sieverts adentro,', 'tense',
  { f: 1, direction: 'He drinks the glowing mate anyway. A yellow Geiger counter runs up to 5 Sv, label DOSIS: MORTAL. The bubbles turn into green sparks.',
    anim: casa({ people: [mati({ mateGlow: true, act: 'drink', face: 'sip', look: 'center' })], fx: [{ kind: 'bubbles', u0: 0, u1: 1, at: 'mati.mate', n: 6, r: 9, rise: 160, speed: 0.8 }],
      counter: { u0: 0.1, u1: 0.8, from: 0, to: 5, unit: 'Sv', label: 'DOSIS: MORTAL', lin: true },
      cam3: camFace(2.7), sounds: [{ u: 0.1, type: 'lib:lie_detector_1', gain: 0.6 }, { u: 0.8, type: 'lib:beep_1', gain: 0.6 }] }) });
say('te morís?', 'surprised',
  { f: 1, direction: 'Mati goes stiff and falls sideways off his chair onto the floor, crossed eyes, the gourd still glowing next to him. Label Q.E.P.D. MATI.',
    anim: casa({ people: [mati({ mateGlow: true, face: 'shock', look: 'cam' }, [{ u: 0.15, sit: false, lean: 1.5, dur: 0.18, face: 'derp' }])], fx: [{ kind: 'stars', u0: 0.35, u1: 1, at: 'mati.head' }],
      labels: [{ u0: 0.4, text: 'Q.E.P.D. MATI', xy: [520, 760], big: true }], shake: [{ u0: 0.3, u1: 0.42, a: 4 }],
      cam3: [{ u: 0, a: 25, r: 3.2, h: 3.0, ax: 0.8, ay: 0.2, az: -0.8 }],
      sounds: [{ u: 0.3, type: 'lib:body_thud_1' }, { u: 0.45, type: 'lib:death_fortnite_1', gain: 0.7 }] }) });
say('Y si te llamás Juan, también.', 'funny',
  { f: 1, direction: 'Same picture, Mati still on the floor. A new label pops in: JUAN: TAMBIÉN. Silence, crickets.',
    anim: casa({ people: [mati({ sit: false, lean: 1.5, face: 'derp', mateGlow: true })], fx: [{ kind: 'stars', u0: 0, u1: 1, at: 'mati.head' }],
      labels: [{ u0: 0, text: 'Q.E.P.D. MATI', xy: [520, 760] }, { u0: 0.3, text: 'JUAN: TAMBIÉN', xy: [520, 900], big: true }],
      cam3: [{ u: 0, a: 25, r: 3.2, h: 3.0, ax: 0.8, ay: 0.2, az: -0.8 }, { u: 1, r: 4.0, dur: 1 }],
      sounds: [{ u: 0.3, type: 'lib:huh_cat_1', gain: 0.7 }] }) });
say('Seguime para más datos de mate.', 'funny',
  { f: 1, direction: 'The glowing gourd on the floor next to Mati, slow push-in on it, it pulses green.',
    anim: casa({ people: [mati({ sit: false, lean: 1.5, face: 'derp', mateGlow: true })],
      labels: [{ u0: 0.1, text: 'TUCUMÁN ✔', xy: [520, 620] }, { u0: 0.18, text: 'MATI ✔', xy: [520, 720] }, { u0: 0.26, text: 'MATE RADIACTIVO ✔', xy: [520, 820] }],
      cam3: [{ u: 0, a: 25, r: 2.8, h: 2.6, ax: 0.8, ay: 0.2, az: -0.8 }, { u: 1, r: 2.3, dur: 1 }], sounds: [{ u: 0.05, type: 'lib:bruh_1', gain: 0.7 }] }) });

const j = { id: '0045s_mati_tucuman', title: 'Mati de Tucumán', thumb: { lines: ['MATI DE TUCUMÁN', 'MATE RADIACTIVO'] },
  caption: '¿Sabías que si sos de Tucumán, te llamás Mati y tomás un mate radiactivo, te morís? ☢️🧉\nSeguime para más datos de mate.', hashtags: ['#mate', '#tucuman', '#argentina', '#humor', '#sabiasque'],
  story: { logline: 'An absurdly over-specific "did you know": three conditions (Tucumán, named Mati, radioactive mate) each get a tick, he dies, and the anticlimax: if you are called Juan, too.',
    facts: ['A dose of about 4–5 sieverts at once kills about half of the people exposed (LD50).'] },
  cast: { mati: 'Mati, about 25, from Tucumán: dark curly hair, yellow shirt, jeans' }, segments: S };
fs.writeFileSync(path.join(__dirname, '0045s_mati_tucuman.json'), JSON.stringify(j, null, 2) + '\n'); console.log('written', S.length, 'segments');
