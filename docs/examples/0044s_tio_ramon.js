// Generator for docs/examples/0044s_tio_ramon.json — chain reaction: you move the bombilla, your gaucho uncle drops dead of shock,
// he was the only one with the key of the Yacyretá dam, the Paraná floods Misiones' yerba fields, a pack of yerba costs a million pesos,
// 47 million Argentines without mate; twist: Tomás puts the bombilla back, everything rewinds, the uncle gets up.
// Facts kept true: Yacyretá is a dam on the Paraná (Corrientes / Paraguay); almost all Argentine yerba comes from Misiones and Corrientes; Argentina has about 47 million people.
// Run: node docs/examples/0044s_tio_ramon.js
const fs = require('fs'), path = require('path');
const rad = d => d * Math.PI / 180, at = (r, deg) => ({ x: +(r * Math.sin(rad(deg))).toFixed(3), z: +(r * Math.cos(rad(deg))).toFixed(3) });
const VOS = at(0.95, 165), TIO = at(1.75, 215); const tioFace = +(Math.atan2(VOS.x - TIO.x, VOS.z - TIO.z) * 180 / Math.PI).toFixed(1);
const look = { vos: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'short', shirt: '#8fc3ea', pants: '#d8c39a' },
  tio: { skin: '#e9b98f', hair: '#5a4636', hairStyle: 'short', hat: 'sombrero', hatColor: '#2b2b2b', mustache: true, scarf: '#d43a3a', shirt: '#f2ece0', pants: '#2b2b2b' } };
const vos = (k0 = {}, extra = []) => ({ id: 'vos', look: look.vos, keys: [{ u: 0, px: VOS.x, pz: VOS.z, faceTo: 'center', sit: true, s: 520, hold: 'mate', R: [45, -300], L: [-45, -235], face: 'happy', look: 'cam', ...k0 }, ...extra] });
const tio = (k0 = {}, extra = []) => ({ id: 'tio', look: look.tio, keys: [{ u: 0, px: TIO.x, pz: TIO.z, faceTo: 'vos', s: 560, L: [-60, -240], R: [60, -240], face: 'proud', look: 'vos', ...k0 }, ...extra] });
const patio = o => ({ world: 'patio', light: 'sun', seats: [VOS], props: [], fx: [], sounds: [], ...o });
const S = []; const say = (text, emo, ...shots) => S.push({ text, emo, shots });

say('¿Sabías que si movés la bombilla del mate,', 'tense',
  { f: 1, direction: 'Close on Tomás at the patio table, the gourd in his right hand. His left hand reaches for the bombilla and stirs it, round and round. The forbidden move. A small click.',
    anim: patio({ people: [vos({ face: 'sly' }, [{ u: 0.2, L: 'vos.mate', dur: 0.2, wiggleL: 4 }]), tio({ face: 'proud', look: 'center' })],
      labels: [{ u0: 0.45, text: 'BOMBILLA', at: 'vos.mate', dy: -150 }],
      cam3: [{ u: 0, on: 'vos.mate', a: -15, r: 1.9, h: 0.25, ax: 0, ay: 0.2, az: 0 }, { u: 1, r: 1.6, dur: 1 }],
      sounds: [{ u: 0.3, type: 'lib:click_1' }, { u: 0.5, type: 'lib:click_1' }, { u: 0.45, type: 'lib:pop_1' }] }) });
say('tu tío Ramón, el gaucho, lo ve', 'tense',
  { f: 1, direction: 'Uncle Ramón, a gaucho with a black flat hat, a thick moustache and a red scarf, stands next to the table. His head snaps to the bombilla, his eyes go wide. Slow push-in on his face. Label TÍO RAMÓN · GAUCHO.',
    anim: patio({ people: [vos({ L: 'vos.mate', face: 'sly' }), tio({ face: 'neutral', look: 'vos' }, [{ u: 0.35, face: 'shock' }])],
      labels: [{ u0: 0.15, text: 'TÍO RAMÓN · GAUCHO', at: 'tio.head', dy: -190 }],
      cam3: [{ u: 0, on: 'tio.head', a: tioFace + 25, r: 3.6, h: -0.2, ax: 0, ay: -0.15, az: 0 }, { u: 1, r: 2.8, dur: 1 }],
      sounds: [{ u: 0.35, type: 'lib:record_scratch_1', gain: 0.8 }] }) });
say('y cae muerto del susto.', 'surprised',
  { f: 1, direction: 'Ramón goes stiff and falls sideways like a plank, flat on the bricks; crossed eyes, stars circle over him. The dog lifts its head. Label Q.E.P.D. TÍO RAMÓN.',
    anim: patio({ people: [vos({ L: [-45, -235], face: 'shock', look: 'tio' }), tio({ face: 'shock' }, [{ u: 0.12, lean: 1.5, dur: 0.18, face: 'derp' }])], dogUp: 0.3,
      fx: [{ kind: 'stars', u0: 0.35, u1: 1, at: 'tio.head' }], labels: [{ u0: 0.4, text: 'Q.E.P.D. TÍO RAMÓN', xy: [520, 760], big: true }], shake: [{ u0: 0.28, u1: 0.4, a: 4 }],
      cam3: [{ u: 0, a: tioFace + 20, r: 4.2, h: 1.4, ax: TIO.x, ay: 0.6, az: TIO.z }],
      sounds: [{ u: 0.3, type: 'lib:body_thud_1' }, { u: 0.45, type: 'lib:undertaker_bell_1', gain: 0.7 }] }) });
say('Pero Ramón era el único que tenía la llave de la represa de Yacyretá.', 'tense',
  { f: 1, direction: 'Cut to a huge concrete dam across a river, YACYRETÁ written on it, a steel gate in the middle with a red wheel, a little guard hut on top: empty. Label REPRESA DE YACYRETÁ, then LLAVE: SOLO RAMÓN.',
    anim: { world: 'represa', light: 'sun', people: [], props: [], fx: [], agent: [{ u: 0, ak: 0 }],
      labels: [{ u0: 0.1, text: 'REPRESA DE YACYRETÁ', at: 'agent.label', dy: -60, big: true }, { u0: 0.55, text: 'LLAVE: SOLO RAMÓN', xy: [520, 1150] }],
      cam3: [{ u: 0, a: 10, r: 48, h: 9, ax: 0, ay: 4, az: 0 }, { u: 1, r: 42, dur: 1 }],
      sounds: [{ u: 0.1, type: 'lib:suspense_1', gain: 0.7 }, { u: 0.55, type: 'lib:pop_2' }] } });
say('Sin él, nadie cierra la compuerta, y el río Paraná se desborda.', 'excited',
  { f: 1.1, direction: 'The gate bursts: three huge jets of water shoot out, then a wall of water rolls down the river towards the camera. Camera shake.',
    anim: { world: 'represa', light: 'sun', people: [], props: [], fx: [], agent: [{ u: 0, ak: 0.2 }, { u: 0.3, ak: 0.35, dur: 0.1 }, { u: 1, ak: 1, dur: 0.7 }],
      labels: [{ u0: 0.45, text: 'RÍO PARANÁ', xy: [520, 1200] }], shake: [{ u0: 0.3, u1: 1, a: 4 }],
      cam3: [{ u: 0, a: 35, r: 42, h: 14, ax: 0, ay: 2, az: 8 }, { u: 1, a: 40, r: 46, h: 16, dur: 1 }],
      sounds: [{ u: 0.28, type: 'lib:explosion_1', gain: 0.8 }, { u: 0.5, type: 'lib:boom_2', gain: 0.7 }] } });
say('La ola llega a Misiones y se lleva todos los yerbales.', 'excited',
  { f: 1.1, direction: 'Red earth of Misiones, neat rows of yerba bushes, a sign YERBALES · MISIONES. A brown wave rolls through and the bushes fly up and away row by row. Label CASI TODA LA YERBA DEL PAÍS.',
    anim: { world: 'yerbal', light: 'sun', people: [], props: [], fx: [], agent: [{ u: 0, ak: 0 }, { u: 1, ak: 1, dur: 1 }],
      labels: [{ u0: 0.35, text: 'CASI TODA LA YERBA DEL PAÍS', xy: [520, 1150] }],
      cam3: [{ u: 0, a: 25, r: 34, h: 20, ax: 0, ay: 2, az: -10 }, { u: 1, a: 35, r: 32, h: 18, dur: 1 }],
      sounds: [{ u: 0.05, type: 'lib:whoosh_2' }, { u: 0.4, type: 'lib:lego_breaking_1', gain: 0.6 }] } });
say('El paquete de yerba pasa a costar un millón de pesos.', 'surprised',
  { f: 1, direction: 'Back in the little kitchen: one yerba pack on the table. A yellow price counter runs from 4.000 to $ 1.000.000. Tomás stares at it, sweating.',
    anim: { world: 'casita', light: 'sun', noTruck: true, seats: [{ x: 0, z: -0.75 }], props: [], sounds: [],
      people: [{ id: 'vos', look: look.vos, keys: [{ u: 0, px: 0, pz: -0.75, faceTo: 'center', sit: true, s: 520, L: [-60, -260], R: [60, -260], face: 'shock', look: 'center' }] }],
      fx: [{ kind: 'sweat', u0: 0.2, u1: 1, at: 'vos.head' }], counter: { u0: 0.12, u1: 0.8, from: 4000, to: 1000000, prefix: '$ ', label: 'PAQUETE DE YERBA' },
      cam3: [{ u: 0, a: 8, r: 3.6, h: 1.6, ax: 0, ay: 0.6, az: -0.4 }, { u: 1, r: 3.1, dur: 1 }],
      sounds: [{ u: 0.12, type: 'lib:cash_3', gain: 0.7 }, { u: 0.8, type: 'lib:cash_1', gain: 0.7 }] } });
say('Y cuarenta y siete millones de argentinos se quedan sin mate.', 'sad',
  { f: 1, direction: 'Aerial over a packed stadium, red and white fans as far as you can see. Label 47 MILLONES SIN MATE. Slow orbit.',
    anim: { world: 'cancha', light: 'sun', people: [], props: [], fx: [], labels: [{ u0: 0.15, text: '47 MILLONES SIN MATE', at: [0, 7.5, 0], big: true }],
      cam3: [{ u: 0, a: 10, r: 52, h: 46, ax: 0, ay: 0, az: -3 }, { u: 1, a: 30, r: 48, h: 42, dur: 1 }],
      sounds: [{ u: 0.15, type: 'lib:disappointed_1', gain: 0.7 }] } });
say('Todo por mover la bombilla.', 'sad',
  { f: 0.9, direction: 'Back in the patio: Ramón still flat on the floor, Tomás frozen with the gourd, the bombilla still in his fingers. Guilty face. Slow push-in.',
    anim: patio({ people: [vos({ L: 'vos.mate', face: 'worried', look: 'tio' }), tio({ lean: 1.5, face: 'derp' })], fx: [{ kind: 'stars', u0: 0, u1: 1, at: 'tio.head' }],
      cam3: [{ u: 0, a: -5, r: 4.4, h: 1.5, ax: -0.3, ay: 0.7, az: -0.8 }, { u: 1, r: 3.8, dur: 1 }], sounds: [{ u: 0.5, type: 'lib:awkward_pause_3', gain: 0.6 }] }) });
say('Así que, por las dudas, la dejás donde estaba.', 'funny',
  { f: 1.3, direction: 'Rewind: tape lines and ◀◀ on screen. Tomás puts the bombilla back exactly where it was, Ramón springs back up from the floor to standing, the stars fly back into his head. Both smile as if nothing happened.',
    anim: patio({ rewind: { u0: 0, u1: 0.55 }, people: [vos({ L: 'vos.mate', face: 'worried', look: 'tio' }, [{ u: 0.35, L: [-45, -235], dur: 0.15, face: 'happy', look: 'cam' }]), tio({ lean: 1.5, face: 'derp' }, [{ u: 0.2, lean: 0, dur: 0.3, face: 'proud' }, { u: 0.6, look: 'cam', face: 'happy' }])],
      cam3: [{ u: 0, a: -5, r: 4.4, h: 1.5, ax: -0.3, ay: 0.7, az: -0.8 }],
      sounds: [{ u: 0.02, type: 'lib:tape_rewind_1' }, { u: 0.55, type: 'lib:ding_2' }] }) });

const j = { id: '0044s_tio_ramon', title: 'Mover la bombilla', thumb: { lines: ['NUNCA MUEVAS', 'LA BOMBILLA'] },
  caption: '¿Sabías que si movés la bombilla del mate, pasa esto? 🧉😱\nSeguime para más datos de mate.', hashtags: ['#mate', '#bombilla', '#argentina', '#humor', '#sabiasque'],
  story: { logline: 'Chain reaction from one forbidden move: stirring the bombilla kills the gaucho uncle of shock, the only keeper of the Yacyretá dam key; the Paraná floods the yerba fields, yerba costs a million, the country has no mate; rewind: bombilla back, uncle back.',
    facts: ['Yacyretá is a hydroelectric dam on the Paraná river (Argentina / Paraguay).', 'Almost all Argentine yerba mate is grown in Misiones and the north of Corrientes.', 'Argentina has about 47 million inhabitants.'],
    places: { patio: 'family patio', represa: 'the Yacyretá dam', yerbal: 'yerba fields in Misiones', casita: 'the small kitchen', cancha: 'a stadium for the whole country' } },
  cast: { vos: 'Tomás', tio: 'tío Ramón, gaucho: black flat hat, moustache, red scarf, white shirt, black trousers' }, segments: S };
fs.writeFileSync(path.join(__dirname, '0044s_tio_ramon.json'), JSON.stringify(j, null, 2) + '\n'); console.log('written', S.length, 'segments');
