// Silent build3d example (no narrator, music + sound effects + text): "Así una calabaza se convierte en mate".
// usage: node samples/build3d_calabaza.js  -> work/b3_calabaza/spec.json ; then node pipeline/build.js work/b3_calabaza/spec.json
const fs = require('fs'), path = require('path');
const G = { shirt: '#e5483a', hat: 'boina', mustache: true, face: 'happy' }, F = { shirt: '#2f9e44', hair: 'long', face: 'happy' };
const seg = (text, dur, shots, callouts = []) => ({ text, dur, shots: shots.map(p => ({ tpl: 'build', p: { ...p, dur: dur / shots.length } })), callouts });
const T = (st, o = {}) => ({ obj: 'calabaza', st, ...o });
const segments = [
  seg('Así una calabaza se convierte en mate', 4, [
    { cam: 'drone', stage: T('planta', { table: false, size: 1.4 }), acts: [{ grow: [0.2, 1.6] }] },
    { cam: 'follow', who: 0, people: [{ ...G, x: -3 }], acts: [{ who: 0, walk: [-3, -0.6], t0: 0, t1: 0.9, run: true, then: 'point' }, { who: 0, hop: 1.1 }, { fx: 'dust', at: 0.9, from: 'feet', who: 0 }] }]),
  seg('La cortás arriba... ¡demasiado fuerte!', 4, [
    { cam: 'diorama', stage: T('cortada', { capOn: true }), people: [{ ...G, pose: 'saw', face: 'rage' }], acts: [{ shake: [0.2, 1.6] }, { capoff: 1.7 }, { fx: 'shards', at: 1.7 }, { fx: 'stars', at: 1.75 }, { who: 0, pose: 'shock', face: 'mindblown', at: 1.8 }, { who: 0, fall: 2.4 }, { who: 0, face: 'dizzy', at: 2.9 }, { fx: 'dust', at: 2.6, from: 'feet', who: 0 }] }],
    [{ type: 'big', text: '¡CRAC!', at: 'fuerte', color: '#ff3b30', rot: -8 }]),
  seg('Segundo intento: corte prolijo', 3.5, [
    { cam: 'push', stage: T('cortada', { capOn: true }), people: [{ ...G, pose: 'saw', face: 'neutral' }], acts: [{ capoff: 1.5 }, { who: 0, pose: 'cheer', face: 'laugh', at: 1.7 }, { fx: 'stars', at: 1.55 }] }],
    [{ type: 'big', text: 'CORTE', at: 'corte' }]),
  seg('Le sacás todas las semillas', 3.5, [
    { cam: 'diorama', stage: T('vacia', { tools: ['cuchara'] }), people: [{ ...F, pose: 'saw', face: 'happy' }], acts: [{ fx: 'seeds', t0: 0.3, t1: 2.9 }] }]),
  seg('Al sol, un mes entero', 4, [
    { cam: 'orbit', stage: T('seca'), people: [{ ...G, pose: 'sit', face: 'bored', x: -1.3 }], acts: [{ color: ['#c8b45a', '#b8803a', 0.3, 3.6] }, { timelapse: [0, 3.9], turns: 3 }] }],
    [{ type: 'big', text: 'SECADO', at: 'sol' }]),
  seg('¿Tomamos ya? ¡Puaj, amarguísimo!', 4, [
    { cam: 'diorama', people: [{ ...G, pose: 'drink', holds: 'mate', x: 0, ry: 0 }] },
    { cam: 'face', who: 0, people: [{ ...G, pose: 'shock', face: 'crazy', x: 0, ry: 0 }], acts: [{ fx: 'spit', at: 0.25, from: 'mouth', who: 0 }, { fx: 'stars', at: 0.3, pos: [0, 2.05, 0.4] }] }],
    [{ type: 'big', text: '¡AMARGO!', at: 'amarguísimo', color: '#ff3b30', rot: 6 }]),
  seg('Primero hay que curarlo con yerba', 4, [
    { cam: 'diorama', stage: T('mate'), people: [{ ...F, pose: 'present', face: 'proud' }], acts: [{ fill: [0.5, 1.6] }, { insert: [99, 100] }, { timelapse: [1.8, 3.9], turns: 1 }, { fx: 'steam', t0: 0.6, t1: 1.8 }] }],
    [{ type: 'big', text: 'CURADO', at: 'curarlo' }]),
  seg('Virola de metal, ¡clic!', 3.5, [
    { cam: 'push', stage: T('curada'), people: [], acts: [{ obj: 'ring', drop: [0.6, 1.3] }, { fx: 'stars', at: 1.3 }] }],
    [{ type: 'big', text: 'VIROLA', at: 'Virola' }]),
  seg('Bombilla y agua a setenta y cinco grados', 4, [
    { cam: 'diorama', stage: T('mate'), people: [{ ...F, pose: 'idle', face: 'happy', x: 0.75, ry: -0.5 }], acts: [{ insert: [0.2, 0.8] }, { fx: 'pour', who: 0, t0: 1.1, t1: 3.4 }, { fx: 'steam', t0: 2.0, t1: 3.9 }] }],
    [{ type: 'big', text: '75°', at: 'setenta' }]),
  seg('¡Ahora sí: tu primer mate!', 5, [
    { cam: 'push', focus: 'face', who: 0, people: [{ ...G, pose: 'drink', holds: 'mate', x: 0, ry: 0 }], acts: [{ fx: 'hearts', at: 1.6, from: 'head', who: 0 }, { who: 0, face: 'starstruck', at: 2.0 }] },
    { cam: 'low', people: [{ ...G, pose: 'cheer', face: 'laugh', x: -0.9, ry: 0.2 }, { ...F, x: 3, ry: -0.2 }], acts: [{ who: 1, walk: [3, 0.9], t0: 0, t1: 0.7, run: true, then: 'cheer' }, { who: 1, face: 'laugh', at: 0.7 }, { fx: 'confetti', t0: 0.4, t1: 2.3, pos: [0, 1.4, 0.3] }] }]) ];
const spec = { id: 'b3_calabaza', topic: 'calabaza a mate (build3d, silent)', preset: 'build3d', silent: true, follow: false, segments, caption: 'Así una calabaza se convierte en mate 🧉', hashtags: ['#mate', '#animacion'] };
const dir = path.join(__dirname, '..', 'work', 'b3_calabaza'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('ok', segments.reduce((a, s) => a + s.dur, 0), 's');
