// Machine tracks for docs/examples/0022s_detergente.json (2D stage). Run: node docs/examples/0022s_anim.js  -> writes "draw" into the set and "anim" into every shot.
// Coordinates: x/y = fractions of the 1080x1920 frame (feet / bottom centre). Arm targets L/R are in body units (shoulders at ±50,-306; feet at 0,0; counter top ≈ -269).
const fs = require('fs'), path = require('path'); const F = path.join(__dirname, '0022s_detergente.json'); const j = JSON.parse(fs.readFileSync(F, 'utf8'));
const CT = 0.77; // counter top line (hip height of the people)
const FEET = 0.875; // feet behind the counter
const look = {
  mama: { skin: '#f3cba6', hair: '#3a2416', hairStyle: 'bun', pencil: true, shirt: '#b9a3e3', dress: '#b9a3e3', pants: '#b9a3e3', shorts: true, apron: '#ffe27a', gloves: '#ff8fb3', shoes: '#ff9ec4' },
  mama2: { skin: '#f3cba6', hair: '#3a2416', hairStyle: 'bun', pencil: true, shirt: '#9cc9ef', dress: '#9cc9ef', pants: '#9cc9ef', shorts: true, apron: '#ffe27a', gloves: '#ff8fb3', shoes: '#ff9ec4' },
  vos: { skin: '#f6d7bb', hair: '#3a2416', hairStyle: 'curly', shirt: '#9aa3ad', pants: '#3b5b9a', shoes: '#f6d7bb', termo: '#2f9e44', longSleeves: true },
  abuela: { skin: '#f2c9a4', hair: '#c9c9c9', hairStyle: 'bun', glasses: true, longSleeves: true, shirt: '#3f6b4a', dress: '#8a8f96', pants: '#8a8f96', shorts: true, shoes: '#1d1d22' }
};
const kitchen = (o = {}) => ({ elements: [
  { kind: 'wall', paint: '#cfe3c6', tile: '#f3ead6', tileTop: 0.42 },
  { kind: 'floor', y: 0.9 },
  { kind: 'uppers', x0: 0.52, x1: 0.8, y: 0.36, h: 300 },
  { kind: 'frame', x: 0.08, y: 0.4 },
  { kind: 'calendar', x: 0.58, y: 0.66 },
  { kind: 'rail', x: 0.13, y: 0.5, w: 220 },
  { kind: 'socket', x: 0.66, y: 0.7 },
  { id: 'lamp', kind: 'lamp', x: 0.55, y: 0.07, on: o.lamp },
  { id: 'window', kind: 'window', x: 0.33, y: 0.6, w: 360, h: 340, tree: true, wind: o.wind ?? 1 },
  { kind: 'sun', x: 0.33, y: 0.45, r: 420 },
  { id: 'shelf', kind: 'shelf', x: 0.7, y: 0.5, w: 240 },
  { id: 'clock', kind: 'clock', x: 0.9, y: 0.3, r: 50, time: o.time || '8:00' },
  { id: 'door', kind: 'door', x: 0.84, y: 0.88, w: 210, h: 760, open: o.door ?? 0.55 },
  { id: 'fridge', kind: 'fridge', x: 1.02, y: 0.88, w: 300, h: 840, top: o.fridgeTop || [], layer: o.fridgeFront ? 'front' : 'back' },
  { id: 'sill', kind: 'sill', x: 0.33, y: 0.6, w: 400, on: o.sill || [], layer: 'back' },
  { id: 'counter', kind: 'counter', y: CT, x0: o.counterX0 ?? 0, x1: 0.92, layer: 'front' },
  { id: 'under', kind: 'under', x: 0.36, y: CT + 0.016, open: !!o.under, layer: 'front' },
  { id: 'sink', kind: 'sink', x: 0.36, y: CT + 0.004, w: 330, foam: o.foam || 0, yerba: !!o.yerba, layer: 'front' },
  { kind: 'sinkLip', x: 0.36, y: CT + 0.004, w: 330, layer: 'top' },
  { id: 'rack', kind: 'rack', x: 0.56, y: CT, on: o.rack || [], layer: 'front' },
  ...(o.pot ? [{ kind: 'pot', x: 0.5, y: CT + 0.002, s: 0.8, layer: 'front' }] : []),
  ...(o.plate ? [{ kind: 'plate', x: 0.84, y: CT + 0.002, napkin: true, layer: 'front' }] : []),
  { kind: 'stove', x: 0.12, y: CT + 0.004, w: 260, steam: !!o.steam, layer: 'front' },
  { kind: 'roll', x: 0.9, y: CT + 0.004, layer: 'front' },

  { id: 'chair', kind: 'chair', x: o.chairX ?? 0.1, y: o.chairY ?? 1.06, s: o.chairS ?? 1.1, layer: o.chairBack ? 'back' : 'front' }
] });
const F2 = (eyes, brows, mouth, extra = {}) => ({ eyes, brows, mouth, ...extra });
const termo = (x, y, extra = {}) => ({ id: 'termo', kind: 'termo', keys: [{ u: 0, x, y, front: true, ...extra }] });
const yerba = { id: 'yerba', kind: 'yerba', keys: [{ u: 0, x: 0.8, y: CT + 0.002, front: true }] };
const anims = [];

// 1 — mamá washes your mate with detergent, proud ("Tu mamá lavó tu mate con detergente, re orgullosa. Y lo arruinó.")
anims.push({ set: kitchen({ time: '8:00', rack: [] }), light: 'morning', sunPatch: [0.18, 0.42], state: { rack: [{ u: 0, on: [] }, { u: 0.3, on: ['bombilla'] }], sink: [{ u: 0 }, { u: 0.38, yerba: true }] },
  people: [{ id: 'mama', look: look.mama, keys: [
    { u: 0, x: 0.25, y: 0.8, hold: 'mate', R: [110, -440], L: [-70, -262], face: F2('shine', 'high', 'closedSmile') },
    { u: 0.22, R: [105, -300], face: F2('dot', 'down', 'tongueTip'), dur: 0.12 },
    { u: 0.24, mateNoBomb: true }, { u: 0.26, act: 'shake' }, { u: 0.38, act: null, mateEmpty: true },
    { u: 0.4, R: [140, -258], dur: 0.12 },
    { u: 0.44, hold: null, R: [70, -250] },
    { u: 0.5, L: [118, -312], dur: 0.08 },
    { u: 0.58, L: [72, -436], R: [96, -470], press: ['R'], face: F2('squeeze', 'down', 'line'), dur: 0.06 },
    { u: 0.86, L: [100, -280], R: [60, -262], press: [], face: F2('half', 'down', 'closedSmile'), dur: 0.08 } ] }],
  props: [
    { id: 'mate', kind: 'mate', keys: [{ u: 0, hide: true }, { u: 0.44, hide: false, x: 0.385, y: CT + 0.013, empty: true, nobomb: true, front: true }] },
    { id: 'bottle', kind: 'bottle', keys: [{ u: 0, x: 0.47, y: CT + 0.004, s: 0.95, front: true }, { u: 0.52, at: 'mama.L', center: true, frontGrip: true, front: true }, { u: 0.58, rot: 2.75, dur: 0.06 }, { u: 0.84, rot: 0, dur: 0.02 }, { u: 0.86, at: '', x: 0.47, y: CT + 0.004, dent: true, rot: 0, front: true }] },
    { id: 'sponge', kind: 'sponge', keys: [{ u: 0, x: 0.52, y: CT + 0.004, s: 0.9, front: true }] },
    termo(0.72, CT + 0.002), yerba ],
  fx: [ { kind: 'lump', u0: 0.29, u1: 0.38, x: 0.335, y: CT - 0.028, fall: 45 }, { kind: 'stream', u0: 0.6, u1: 0.84, at: 'bottle.top', to: 'mate.top', color: '#4fc25e', w: 12 },
    { kind: 'bubbles', u0: 0.62, u1: 1, x: 0.352, y: CT - 0.03, n: 3, r: 16, rise: 220, spread: 50 } ],
  cam: [ { u: 0, z: 1.7, c: [0.36, 0.56] }, { u: 0.58, z: 1.7, c: [0.36, 0.56] }, { u: 0.75, z: 2.0, c: [0.37, 0.6], dur: 0.17 } ],
  sounds: [ { u: 0.3, type: 'pop' }, { u: 0.6, type: 'swish' }, { u: 0.86, type: 'tick' } ] });

// 2 — she scrubs it like a burnt pot
anims.push({ set: kitchen({ time: '8:01', rack: ['bombilla'], pot: true, yerba: true }), light: 'morning', sunPatch: [0.18, 0.42],
  state: { sink: [{ u: 0, foam: 0.2 }, { u: 0.7, foam: 1.15, dur: 0.7 }] },
  people: [{ id: 'mama', look: look.mama, keys: [
    { u: 0, x: 0.25, y: 0.8, lean: 0.04, L: [-50, -345], R: [62, -352], wiggleR: 9, face: F2('squeeze', 'down', 'teeth') },
    { u: 0.18, face: F2('sideR', 'down', 'teeth') }, { u: 0.28, face: F2('squeeze', 'down', 'teeth') },
    { u: 0.45, face: F2('squeeze', 'down', 'puff') }, { u: 0.55, face: F2('squeeze', 'down', 'teeth') },
    { u: 0.66, wiggleR: 0 },
    { u: 0.7, lean: 0, L: [84, -440], R: [70, -262], face: F2('wink', 'one', 'line'), dur: 0.1 },
    { u: 0.84, face: F2('half', 'flat', 'closedSmile') },
    { u: 0.9, L: [130, -300], dur: 0.06 } ] }],
  props: [
    { id: 'mate', kind: 'mate', keys: [{ u: 0, at: 'mama.L', center: true, dx: 42, rot: 0.1, foam: 0.6, empty: true, nobomb: true, front: true }, { u: 0.7, at: 'mama.L', center: true, dx: 42, rot: 0, foam: 0.5, empty: true, nobomb: true, front: true }, { u: 0.92, at: '', x: 0.6, y: CT, rot: Math.PI, foam: 0, empty: true, nobomb: true, front: true }] },
    { id: 'sponge', kind: 'sponge', keys: [{ u: 0, at: 'mama.R', center: true, dx: -30, rot: -0.2, s: 0.8, front: true }, { u: 0.66, at: '', x: 0.43, y: CT + 0.004, rot: 0, wiggle: 0, front: true }] },
    { id: 'bottle', kind: 'bottle', keys: [{ u: 0, x: 0.47, y: CT + 0.004, dent: true, s: 0.95, front: true }] },
    termo(0.72, CT + 0.002) ],
  fx: [ { kind: 'bubbles', u0: 0, u1: 0.7, x: 0.3, y: CT - 0.1, n: 7, r: 14, rise: 260, spread: 120, speed: 1.1, behind: true }, { kind: 'drops', u0: 0.05, u1: 0.65, at: 'mama.L', n: 3, fall: 120 },
    { kind: 'bigbubble', u0: 0.72, u1: 0.9, x: 0.4, y: CT - 0.1, r: 58, rise: 160, dx: -0.06 }, { kind: 'drops', u0: 0.7, u1: 0.9, at: 'mama.L', n: 4, fall: 80 } ],
  shake: [ { u0: 0.02, u1: 0.66, a: 3 } ],
  cam: [ { u: 0, z: 2.2, c: [0.36, 0.58] }, { u: 0.66, z: 2.2, c: [0.36, 0.58] }, { u: 0.8, z: 2.0, c: [0.38, 0.52], dur: 0.14 } ],
  sounds: [ { u: 0.05, type: 'swish' }, { u: 0.3, type: 'swish' }, { u: 0.55, type: 'swish' }, { u: 0.86, type: 'pop' } ] });

// 3 — next morning, half asleep, the mate foams over
anims.push({ set: kitchen({ time: '7:30', lamp: true, rack: ['mate', 'bombilla'], plate: true, wind: 0 }), light: 'early', state: { rack: [{ u: 0, on: ['mate', 'bombilla'] }, { u: 0.2, on: [] }] },
  people: [{ id: 'vos', look: look.vos, keys: [
    { u: 0, x: 0.43, y: 0.8, lean: -0.04, L: [70, -262], R: [120, -300], face: F2('closed', 'flat', 'yawn', { mark: true }) },
    { u: 0.12, R: [60, -250], L: [-40, -262], dur: 0.1 },
    { u: 0.22, lean: 0.04, hold: 'mate', R: [40, -240], dur: 0.08, face: F2('closed', 'flat', 'line', { mark: true }) },
    { u: 0.3, hold: 'both', act: 'pour', face: F2('closed', 'flat', 'closedSmile', { mark: true }) },
    { u: 0.5, lean: 0.08, dur: 0.06 }, { u: 0.56, lean: 0, dur: 0.04 },
    { u: 0.6, act: null, hold: 'termo', R: [40, -330], L: [-78, -296], face: F2('big', 'high', 'o', { mark: true }), lean: -0.06, dur: 0.04 } ] }],
  props: [ { id: 'mateR', kind: 'mate', keys: [{ u: 0, hide: true }, { u: 0.6, hide: false, at: 'vos.R', dx: -23, dy: 27, gy: 27, foam: 0, front: true }, { u: 0.95, foam: 1, dur: 0.35 }] },
    { id: 'yerba', kind: 'yerba', keys: [{ u: 0, x: 0.62, y: CT + 0.002, front: true }] } ],
  fx: [ { kind: 'bubbles', u0: 0.66, u1: 1, at: 'vos.R', n: 2, r: 12, rise: 300, spread: 40 }, { kind: 'drops', u0: 0.75, u1: 1, at: 'vos.R', n: 3, fall: 100 } ],
  cam: [ { u: 0, z: 1.65, c: [0.45, 0.58] }, { u: 0.58, z: 1.65, c: [0.45, 0.58] }, { u: 0.7, z: 2.1, c: [0.45, 0.58], dur: 0.12 } ],
  sounds: [ { u: 0.3, type: 'swish' }, { u: 0.6, type: 'boomSoft' } ] });

// 4 — tastes it anyway: lemon and bleach, soap bubbles out of the mouth
anims.push({ set: kitchen({ time: '7:31', lamp: true, rack: ['bombilla'], plate: true, wind: 0 }), light: 'early',
  people: [{ id: 'vos', look: look.vos, keys: [
    { u: 0, x: 0.43, y: 0.8, hold: 'mate', R: [36, -232], L: [-70, -262], face: F2('dot', 'one', 'line', { mark: true }), tilt: -0.1 },
    { u: 0.1, act: 'drink', face: F2('closed', 'flat', 'sip', { mark: true }) },
    { u: 0.3, act: null, R: [36, -232], face: F2('closed', 'flat', 'line', { mark: true }) },
    { u: 0.36, L: [-150, -270], face: F2('squeeze', 'down', 'side', { mark: true, nose: 'wrinkle' }), lean: 0.03 },
    { u: 0.44, lean: -0.03 }, { u: 0.5, lean: 0 },
    { u: 0.6, face: F2('crossed', 'worried', 'tongue', { mark: true }) },
    { u: 0.8, hold: null, R: [150, -262], dur: 0.08 }, { u: 0.9, R: [20, -380], face: F2('half', 'worried', 'tongue', { mark: true }), dur: 0.08 } ] }],
  props: [ { id: 'mate', kind: 'mate', keys: [{ u: 0, hide: true }, { u: 0.84, hide: false, x: 0.66, y: CT + 0.004, foam: 0.4, front: true }] }, termo(0.78, CT + 0.002) ],
  fx: [ { kind: 'wavy', u0: 0.38, u1: 0.6, at: 'vos.head', dx: 120 }, { kind: 'bigbubble', u0: 0.6, u1: 0.72, at: 'vos.mouth', r: 22, rise: 180 }, { kind: 'bigbubble', u0: 0.66, u1: 0.8, at: 'vos.mouth', r: 32, rise: 220, dx: 0.04 }, { kind: 'bigbubble', u0: 0.72, u1: 0.92, at: 'vos.mouth', r: 46, rise: 260, dx: -0.03, lemon: true } ],
  shake: [ { u0: 0.36, u1: 0.42, a: 6 } ],
  cam: [ { u: 0, z: 2.6, c: [0.43, 0.5] }, { u: 0.78, z: 2.6, c: [0.43, 0.5] }, { u: 0.9, z: 2.1, c: [0.5, 0.55], dur: 0.12 } ],
  sounds: [ { u: 0.1, type: 'pop' }, { u: 0.36, type: 'buzz' }, { u: 0.62, type: 'pop' }, { u: 0.7, type: 'pop' }, { u: 0.8, type: 'pop' } ] });

// 5 — cutaway: the gourd soaks soap like a sponge (the mate on the counter, cut open)
anims.push({ light: 'early', cut: { size: 640 }, set: kitchen({ time: '7:31', lamp: true, plate: true }),
  props: [ { id: 'bigsponge', kind: 'bigsponge', keys: [{ u: 0, x: 0.2, y: 0.72, s: 0.9 }] } ],
  fx: [ { kind: 'sparkle', u0: 0.18, u1: 0.3, x: 0.2, y: 0.62, s: 40 }, { kind: 'sparkle', u0: 0.18, u1: 0.3, x: 0.6, y: 0.5, s: 40 } ],
  cam: [ { u: 0, z: 1.0, c: [0.5, 0.5] }, { u: 1, z: 1.12, c: [0.52, 0.52], dur: 1 } ],
  sounds: [ { u: 0.08, type: 'swish' }, { u: 0.35, type: 'tick' }, { u: 0.45, type: 'tick' }, { u: 0.8, type: 'popBig' } ] });

// 6 — the abuela comes in, smells it, telenovela faint onto the chair
anims.push({ set: kitchen({ time: '7:40', lamp: true, plate: true, door: 0.75, chairBack: true, counterX0: 0.32, chairX: 0.15, chairY: 0.9, chairS: 1.0 }), light: 'morning', sunPatch: [0.2, 0.44],
  people: [
    { id: 'abuela', look: look.abuela, keys: [
      { u: 0, x: 0.86, y: 0.8, s: 470, flip: true, hold: 'mate', R: [36, -232], L: [-70, -180], face: F2('happy', 'flat', 'smile') },
      { u: 0.25, x: 0.72, dur: 0.25 },
      { u: 0.3, lean: -0.1, face: F2('half', 'down', 'line', { nose: 'wrinkle' }), dur: 0.06 },
      { u: 0.5, lean: 0.06, L: [-40, -330], R: [90, -470], face: F2('big', 'high', 'scream'), dur: 0.04 },
      { u: 0.7, lean: 0.2, x: 0.16, y: 0.85, dur: 0.18 },
      { u: 0.86, sit: true, lean: 0.1, L: [-20, -440], R: [100, -480], face: F2('closed', 'worried', 'bigO') },
      { u: 0.93, face: F2('wink', 'worried', 'bigO') } ] },
    { id: 'vos', look: look.vos, keys: [
      { u: 0, x: 0.44, y: 0.8, hold: 'mate', R: [140, -300], L: [-20, -420], face: F2('dot', 'worried', 'side', { mark: true }) },
      { u: 0.7, x: 0.38, L: [-150, -300], face: F2('big', 'high', 'bigO', { mark: true }), dur: 0.1 } ] } ],
  props: [ termo(0.72, CT + 0.002), yerba ],
  fx: [ { kind: 'stars', u0: 0.5, u1: 1, at: 'abuela.head' } ],
  cam: [ { u: 0, z: 1.25, c: [0.55, 0.55] }, { u: 0.66, z: 1.25, c: [0.55, 0.55] }, { u: 0.86, z: 1.25, c: [0.45, 0.58], dur: 0.2 } ],
  sounds: [ { u: 0.3, type: 'tick' }, { u: 0.36, type: 'tick' }, { u: 0.5, type: 'boom' }, { u: 0.86, type: 'pop' } ] });

// 7 — water only, dry in the air; the detergent goes up on the fridge
anims.push({ set: kitchen({ time: '7:41', plate: true, wind: 1 }), light: 'sun', sunPatch: [0.2, 0.46],
  state: { under: [{ u: 0, open: true }, { u: 0.2, open: false }], fridge: [{ u: 0, top: ['onions'] }, { u: 0.32, top: ['onions', 'bottle'] }], sill: [{ u: 0, on: [] }, { u: 0.78, on: ['mate', 'bombilla'] }] },
  people: [
    { id: 'abuela', look: look.abuela, keys: [
      { u: 0, x: 0.27, y: 0.8, s: 470, hold: 'mate', R: [110, -150], L: [80, -200], face: F2('half', 'down', 'line') },
      { u: 0.16, hold: null, R: [40, -232], L: [-70, -180] },
      { u: 0.2, x: 0.86, flip: false, R: [120, -330], dur: 0.12 },
      { u: 0.3, R: [120, -520], dur: 0.06 },
      { u: 0.4, x: 0.3, R: [60, -262], dur: 0.1 },
      { u: 0.45, hold: 'mate', R: [132, -322], mateEmpty: true, mateNoBomb: true },
      { u: 0.62, R: [136, -330] }, { u: 0.66, R: [126, -316] }, { u: 0.7, R: [136, -330] },
      { u: 0.74, R: [100, -470], dur: 0.06 }, { u: 0.79, hold: null, R: [40, -232] },
      { u: 0.86, flip: true, R: [120, -440], face: F2('dot', 'high', 'line') } ] },
    { id: 'vos', look: look.vos, keys: [
      { u: 0, x: 0.56, y: 0.81, s: 480, flip: true, L: [-40, -200], R: [40, -200], face: F2('dot', 'flat', 'o', { mark: true }) },
      { u: 0.86, L: [-60, -160], R: [60, -160], face: F2('big', 'high', 'line', { mark: true }) } ] } ],
  props: [ { id: 'bottle', kind: 'bottle', keys: [{ u: 0, x: 0.47, y: CT + 0.004, dent: true, s: 0.95, front: true }, { u: 0.2, at: 'abuela.R', dy: 70, gy: 70 }, { u: 0.32, hide: true }] }, yerba ],
  fx: [ { kind: 'lump', u0: 0.05, u1: 0.15, x: 0.36, y: CT + 0.01, fall: 60 }, { kind: 'stream', u0: 0.46, u1: 0.62, x: 0.409, y: CT - 0.04, to: 'abuela.mate', color: 'rgba(170,220,255,0.9)', w: 12 }, { kind: 'drops', u0: 0.62, u1: 0.74, at: 'abuela.R', n: 5, fall: 90 }, { kind: 'sparkle', u0: 0.8, u1: 0.95, x: 0.37, y: 0.57, s: 36 }, { kind: 'sparkle', u0: 0.3, u1: 0.4, x: 1.0, y: 0.43, s: 30 } ],
  cam: [ { u: 0, z: 1.5, c: [0.38, 0.6] }, { u: 0.18, z: 1.35, c: [0.7, 0.5], dur: 0.12 }, { u: 0.4, z: 1.5, c: [0.38, 0.58], dur: 0.1 }, { u: 0.86, z: 1.3, c: [0.52, 0.56], dur: 0.12 } ],
  sounds: [ { u: 0.06, type: 'tick' }, { u: 0.1, type: 'tick' }, { u: 0.32, type: 'pop' }, { u: 0.46, type: 'swish' }, { u: 0.66, type: 'tick' }, { u: 0.9, type: 'ding' } ] });

// 8 — mamá comes back, whistling, the bottle badly hidden behind her back; poll
anims.push({ set: kitchen({ time: '7:43', plate: true, fridgeTop: ['onions'], sill: ['mate', 'bombilla'], fridgeFront: true }), light: 'sun', sunPatch: [0.2, 0.46],
  people: [{ id: 'mama', look: look.mama2, keys: [
    { u: 0, x: 0.9, y: 0.8, L: [-60, -260], R: [96, -250], face: F2('side', 'up', 'whistle') },
    { u: 0.15, face: F2('sideR', 'up', 'whistle') }, { u: 0.28, face: F2('side', 'up', 'whistle') },
    { u: 0.4, x: 0.66, face: F2('up', 'up', 'whistle'), dur: 0.12 },
    { u: 0.75, R: [150, -120], y: 0.83, face: F2('big', 'high', 'o'), dur: 0.04 },
    { u: 0.82, R: [96, -250], y: 0.8, face: F2('up', 'up', 'closedSmile'), dur: 0.05 },
    { u: 0.9, face: F2('dot', 'one', 'closedSmile') } ] }],
  props: [ { id: 'bottle', kind: 'bottle', keys: [{ u: 0, at: 'mama.R', dx: 30, dy: 70, gy: 70, s: 0.9 }] }, termo(0.6, CT + 0.002), yerba ],
  fx: [ { kind: 'notes', u0: 0, u1: 1, at: 'mama.mouth' } ],
  cam: [ { u: 0, z: 1.55, c: [0.7, 0.55] }, { u: 0.74, z: 1.55, c: [0.66, 0.56] }, { u: 0.78, z: 1.55, c: [0.66, 0.6], dur: 0.04 }, { u: 0.84, z: 1.55, c: [0.66, 0.56], dur: 0.05 } ],
  poll: { u: 0.62, question: j.poll.question, options: j.poll.options },
  sounds: [ { u: 0.4, type: 'tick' }, { u: 0.75, type: 'swish' }, { u: 0.8, type: 'pop' } ] });

// proportions: people stand with the counter at their hips (feet at FEET, size 600); arm targets were written for the old high counter, so they move down by 90 body units; the camera looks a bit lower
const SZ = { 520: 600, 470: 545, 480: 560 };
anims.forEach(a => { if (a.cut) return; (a.people || []).forEach(q => q.keys.forEach(k => { if (k.y === 0.8) k.y = FEET; else if (k.y === 0.79) k.y = FEET - 0.01; else if (k.y === 0.83) k.y = FEET + 0.03;
    if (k.u === 0) k.s = SZ[k.s || 520] || k.s; for (const h of ['L', 'R']) if (Array.isArray(k[h])) k[h] = [k[h][0], k[h][1] + 90]; }));
  (a.cam || []).forEach(k => { if (k.c) k.c = [k.c[0], +(k.c[1] + 0.08).toFixed(3)]; }); });
j.segments.forEach((sg, i) => { sg.shots[0].anim = anims[i]; });
fs.writeFileSync(F, JSON.stringify(j, null, 2) + '\n'); console.log('anim written for', anims.length, 'shots');
