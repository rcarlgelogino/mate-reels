// Silent 3D hook tests (3-5 s, no text, no sound): pushed off a roof, a gang running at you, a bus that nearly hits someone (the picture
// freezes just before), being laughed at, jumping out of a plane, struck by lightning. Normal and POV versions.
// usage: node samples/hooks3d.js [name ...] -> work/hook_<name>/spec.json ; then node pipeline/build.js work/hook_<name>/spec.json
const fs = require('fs'), path = require('path');
const DARK = ['#2b2f3a', '#3a2a2a', '#1f2a3a', '#4a1f1f', '#2f2f2f', '#3b3346', '#26323a'];
const gang = n => Array.from({ length: n }, (_, i) => ({ shirt: DARK[i % DARK.length], pants: '#1d1d22', hat: i % 3 === 0 ? 'cap' : undefined, hatColor: '#151515', glasses: i % 2 === 1, mustache: i % 4 === 2, face: 'angry' }));
const crowd = n => Array.from({ length: n }, (_, i) => ({ shirt: ['#e5483a', '#2f9e44', '#f2c23a', '#9a5ac8', '#2f7fd1', '#e88a3a'][i % 6], hair: ['short', 'long', 'curly', 'ponytail', 'short', 'bun'][i % 6], hat: i === 3 ? 'cap' : undefined, face: 'laugh' }));
const HOOKS = {
  roof: { dur: 4.2, stunt: { kind: 'roof' }, people: [{ shirt: '#2f7fd1', holds: 'celular', face: 'happy' }, { shirt: '#2b2f3a', glasses: true, hat: 'cap', hatColor: '#151515', face: 'sly' }] },
  roof_pov: { dur: 4.2, stunt: { kind: 'roof', pov: true }, people: [{ shirt: '#2b2f3a', glasses: true, hat: 'cap', hatColor: '#151515', mustache: true, face: 'outraged' }] },
  mob_pov: { dur: 3.8, stunt: { kind: 'mob', pov: true }, people: gang(7) },
  bus: { dur: 3.3, stunt: { kind: 'bus' }, people: [{ shirt: '#e5483a', holds: 'celular', face: 'happy' }, { shirt: '#2f9e44', hair: 'long', face: 'neutral' }, { shirt: '#9a5ac8', hat: 'cap', hatColor: '#2f7fd1', face: 'neutral' }] },
  bus_pov: { dur: 3.1, stunt: { kind: 'bus', pov: true }, people: [] },
  laugh: { dur: 4.0, stunt: { kind: 'laugh' }, people: [{ shirt: '#8a9aa8', face: 'worried' }, ...crowd(5)] },
  laugh_pov: { dur: 4.0, stunt: { kind: 'laugh', pov: true }, people: crowd(6) },
  sky: { dur: 4.5, stunt: { kind: 'sky' }, people: [{ shirt: '#e5483a', glasses: true, hat: 'cap', hatColor: '#f2c23a', face: 'scream' }, { shirt: '#2f7fd1', hat: 'cap', hatColor: '#151515', face: 'laugh' }] },
  sky_pov: { dur: 4.5, stunt: { kind: 'sky', pov: true }, people: [{ shirt: '#2f7fd1', hat: 'cap', hatColor: '#151515', glasses: true, face: 'laugh' }] },
  storm: { dur: 4.0, stunt: { kind: 'storm' }, people: [{ shirt: '#6f8a4a', holds: 'mate', face: 'worried' }], acts: [{ fx: 'steam', t0: 1.6, t1: 3.9, from: 'head', who: 0 }, { fx: 'stars', at: 2.9, from: 'head', who: 0 }] } };
const want = process.argv.slice(2); const names = want.length ? want : Object.keys(HOOKS);
for (const n of names) { const h = HOOKS[n]; if (!h) throw new Error('unknown hook ' + n);
  const spec = { id: 'hook_' + n, topic: 'hook test (build3d, silent)', preset: 'build3d', silent: true, follow: false, tts: 'edge',
    segments: [{ text: '', dur: h.dur, shots: [{ tpl: 'build', p: { cam: 'stunt', dur: h.dur, people: h.people, stunt: h.stunt, ...(h.acts ? { acts: h.acts } : {}) } }], callouts: [] }], caption: 'hook test', hashtags: [] };
  const dir = path.join(__dirname, '..', 'work', 'hook_' + n); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1)); console.log('ok', n, h.dur + ' s'); }
