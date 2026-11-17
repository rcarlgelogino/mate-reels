// Pixel camera + light examples after the science_in_8bit lighthouse reel: pull back, dolly zoom, crane up, land… and the light.
// usage: node samples/pixel_cine.js -> work/px_faro, work/px_muelle, work/px_pan (spec.json each); then node pipeline/build.js <dir>/spec.json (SWIFTSHADER=1)
const fs = require('fs'), path = require('path');
const MATERO = { kind: 'person', shirt: '#e5483a', hair: 'short', hold: 'mate', act: 'drink', face: 'happy' }, AMIGA = { kind: 'person', shirt: '#2f9e44', hair: 'long', face: 'happy' };
const shot = (p, dur) => ({ tpl: 'pix', p: { place: 'costa', ...p }, dur });
const seg = (text, dur, shots) => ({ text, dur, shots: shots.map(s => ({ tpl: s.tpl, p: { ...s.p, dur: s.dur || dur / shots.length } })), callouts: [] });
const reels = {
  px_faro: [
    seg('Un mate al atardecer…', 4, [shot({ cast: [{ ...MATERO, x: 150, y: 732, s: 110 }], cam: { z0: 2.3, z1: 0.62, c0: [310, 520], c1: [270, 640] }, fx: { rays: [310, 526] } })]),
    seg('El mundo se estira detrás del faro.', 4, [shot({ cast: [{ ...MATERO, x: 150, y: 732, s: 110 }], cam: { z0: 1.25, z1: 1.25, c0: [400, 470], c1: [400, 470], dz: 0.9 }, fx: { rays: [310, 526] } })]),
    seg('Subimos hasta arriba…', 4, [shot({ cam: { z0: 1.7, z1: 1.75, c0: [430, 660], c1: [430, 300] }, fx: { rays: [310, 526] } })]),
    seg('…y esperá la luz.', 4.5, [shot({ cam: { z0: 1.8, z1: 2.4, c0: [430, 300], c1: [430, 285] }, fx: { lamp: { x: 430, y: 273, on: 0.35, a0: Math.PI * 1.05 }, rays: [310, 526] } })]) ],
  px_muelle: [
    seg('De noche, en el muelle.', 5, [shot({ night: true, faro: true, cast: [{ ...MATERO, hold: null, act: undefined, gest: 'offer', x: 120, y: 732, s: 110 }, { ...AMIGA, gest: 'receive', x: 200, y: 732, s: 110 }], pass: [0, 1], cam: { z0: 1.0, z1: 1.55, c0: [300, 240], c1: [170, 690] }, fx: { lamp: { x: 430, y: 273, on: -1, a0: Math.PI * 1.1 }, glow: [{ f: 0.45, x: 380, y: 200, r: 36, rgb: '220,230,255' }] } })]),
    seg('Un mate pasa de mano en mano.', 4.5, [shot({ night: true, cast: [{ ...MATERO, hold: null, act: undefined, gest: 'offer', x: 120, y: 732, s: 110 }, { ...AMIGA, gest: 'receive', x: 200, y: 732, s: 110 }], pass: [0, 1], cam: { z0: 1.5, z1: 2.1, c0: [160, 690], c1: [165, 680], dz: -0.5 }, fx: { lamp: { x: 430, y: 273, on: -1, a0: Math.PI * 1.1 }, glow: [{ f: 0.45, x: 380, y: 200, r: 36, rgb: '220,230,255' }] } })]) ],
  px_mapa: [
    seg('En la plaza, la ronda de siempre…', 3.5, [{ tpl: 'pix', p: { place: 'plaza', cast: [{ ...MATERO, x: 200, y: 738, s: 130 }, { ...AMIGA, x: 340, y: 738, s: 130 }], cam: { z0: 1.15, z1: 1.2, c0: [140, 600], c1: [400, 610] }, fx: { rays: 'sun' } } }]),
    seg('…pero el mate no es solo de acá.', 3, [{ tpl: 'pix', p: { place: 'plaza', cast: [{ ...MATERO, x: 200, y: 738, s: 130 }, { ...AMIGA, x: 340, y: 738, s: 130 }], cam: { z0: 1.25, z1: 1.3, c0: [270, 660], c1: [290, 330] }, fx: { rays: 'sun' } } }]),
    seg('Se toma en cuatro países.', 5, [{ tpl: 'pix', p: { place: 'mapa', lit: [{ c: 'ar', u: 0.5 }, { c: 'uy', u: 0.6 }, { c: 'py', u: 0.7 }, { c: 'br', u: 0.8 }], cam: { z0: 2.4, z1: 0.56, from: 'ar', c1: [270, 480], sp: 0.55 } } }]) ],
  px_pan: [
    seg('Del pueblo…', 3.5, [shot({ cast: [{ ...MATERO, x: 150, y: 732, s: 110 }], cam: { z0: 1.35, z1: 1.35, c0: [120, 560], c1: [270, 600] }, fx: { rays: [310, 526] } })]),
    seg('…al mar y al faro.', 4.5, [shot({ cast: [{ ...MATERO, x: 150, y: 732, s: 110 }], cam: { z0: 1.35, z1: 1.2, c0: [270, 600], c1: [420, 520] }, fx: { rays: [310, 526], lamp: { x: 430, y: 273, on: 0.55, a0: Math.PI * 1.05 } } })]) ] };
for (const [id, segments] of Object.entries(reels)) { const spec = { id, preset: 'pixel8', silent: true, follow: false, segments, caption: '', hashtags: [] };
  const dir = path.join(__dirname, '..', 'work', id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'spec.json'), JSON.stringify(spec, null, 1)); console.log(id, segments.reduce((a, s) => a + s.dur, 0), 's'); }
