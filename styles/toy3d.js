// toy3d style translator: style-neutral script (docs/SCRIPT.md) -> render spec for the sunny 3D meadow (template prado).
// Text, headlines, callouts, boards and the poll are taken 1:1 from flat2d, so an A/B pair differs only in the pictures.
const flat2d = require('./flat2d');
const ROLE = { cebador: { who: 0, shirt: '#e5483a', hair: 'short' }, friend: { who: 1, shirt: '#2f6fd0', hair: 'side' }, stranger: { who: 2, shirt: '#f2a922', hair: 'bob' }, you: { who: 3, shirt: '#2f9e6e', hair: 'short' },
  grandma: { who: 4, shirt: '#8a4fd0', hair: 'bun', hairColor: '#c9c2b8', glasses: true }, grandpa: { who: 5, shirt: '#2f6b8a', hair: 'short', hairColor: '#c9c2b8', glasses: true },
  kid: { who: 2, scale: 0.72, shirt: '#ef7a3a', hair: 'side' }, worker: { who: 1, shirt: '#2f6fd0', hair: 'short' } };
const DOES = { idle: {}, hold_mate: { hold: 'mate' }, hold_termo: { hold: 'termo' }, hold_both: { hold: 'both' }, hold_yerba: { hold: 'yerba' }, drink: { hold: 'mate', act: 'drink' }, pour: { hold: 'both', act: 'pour' },
  pass: { hold: 'mate' }, receive: {} };
const ACTS = ['wave', 'cheer', 'jump', 'no', 'nod', 'shock', 'laugh', 'sigh', 'hug']; // whole-body actions, played by the engine on top of the pose
const FACE = { neutral: 'neutral', smile: 'smile', happy: 'happy', surprised: 'surprised', sad: 'sad', angry: 'angry', proud: 'proud', love: 'love', laugh: 'laugh', excited: 'happy', worried: 'sad', confused: 'surprised' };
const ITEM = { mate: 'mate', mate_madera: 'mate', imperial: 'mate', acero: 'mate', bombilla: 'mate', termo: 'termo', yerba: 'yerba' };
function person(pp, i) { const o = { ...(ROLE[pp.role] || { who: i }), ...(DOES[pp.does] || {}) }; if (pp.mood) o.face = FACE[pp.mood] || 'smile';
  if (pp.mate && ['madera', 'mate_madera', 'imperial', 'acero'].includes(pp.mate)) o.mate = { mate_madera: 'madera' }[pp.mate] || pp.mate; return o; }
function sceneShot(v, si) {
  const ppl = (v.people || []).slice(0, 5); const people = ppl.map(person); const acts = ppl.map(pp => ACTS.includes(pp.does) ? pp.does : null);
  const n = people.length; const busy = people.findIndex(p => p.act); const focus = v.focus ?? (busy >= 0 ? busy : v.pass ? v.pass[0] : 0);
  const shot = v.camera || (n <= 1 || people.some(p => p.act) ? 'close' : si === 0 ? 'flow' : si % 2 ? 'wide' : 'flow');
  const sh = { tpl: 'prado', p: { people: people.length ? people : [{ who: 0, hold: 'mate' }], shot, focus } };
  const ai = acts.findIndex(Boolean); if (ai >= 0) sh.emo = { act: acts[ai], who: acts.map((a, k) => a ? k : -1).filter(k => k >= 0) };
  return sh;
}
function reactionShot(v, si) { const who = v.who ?? (si % 6); const pp = { ...(Object.values(ROLE).find(r => r.who === who) || { who }), face: FACE[v.emotion] || 'surprised' }; delete pp.scale;
  const sh = { tpl: 'prado', p: { people: [pp], shot: 'close', focus: 0 } }; const act = v.act || (v.emotion === 'surprised' ? 'shock' : null); if (act) sh.emo = { act, face: pp.face }; return sh; }
function objectShot(v) { const hold = ITEM[v.item] || 'mate'; const pp = { ...ROLE.cebador, hold, face: v.mascot ? 'happy' : 'smile' }; if (['madera', 'mate_madera', 'imperial', 'acero'].includes(v.item)) pp.mate = { mate_madera: 'madera' }[v.item] || v.item;
  return { tpl: 'prado', p: { people: [pp], shot: 'close', focus: 0 } }; }
function toSpec(script) {
  const base = flat2d.toSpec(script);
  base.segments.forEach((seg, si) => { const sg = script.segments[si]; const vis = sg.visuals || [sg.visual];
    if (script.poll && si === script.segments.length - 1) return; // poll board stays
    seg.shots = seg.shots.map((s, k) => { const v = vis[k]; if (!v) return s;
      if (v.type === 'scene') return sceneShot(v, si); if (v.type === 'reaction') return reactionShot(v, si); if (v.type === 'object') return objectShot(v);
      if (v.type === 'mistake') { const sh = sceneShot(v.over || { type: 'scene', people: [{ role: 'friend', does: 'no' }] }, si); sh.emo = { act: 'no' }; return sh; }
      return s; }); });
  return { ...base, preset: 'toy3d', ab: script.ab || 'style toy3d' };
}
module.exports = { name: 'toy3d', toSpec };
