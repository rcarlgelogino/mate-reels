// stage2d: plays a shooting script (docs/DIRECTING.md) in 2D. Every shot carries its "anim" track (positions, arm targets, faces, props, camera, effects),
// written together with the shot's "direction" text; this translator only passes it to the engine template "stage". Captions and voice as flat2d.
function toSpec(script, style) { const d3 = style === 'build3d' || style === 'toy3d';
  const segs = (script.segments || []).map(sg => {
    const shots = (sg.shots || []).map(sh => { if (!sh.anim) throw new Error('stage2d: shot without anim track in "' + sg.text + '"'); return { tpl: d3 ? 'stage3d' : 'stage', p: sh.anim, ...(sh.f ? { f: sh.f } : {}) }; });
    return { text: sg.text, say: sg.say, emo: sg.emo || 'neutral', shots, callouts: [] };
  });
  return { id: script.id, topic: script.topic, preset: d3 ? 'build3d' : 'flat2d', ab: d3 ? 'style stage3d' : 'style stage2d', segments: segs, caption: script.caption, hashtags: script.hashtags };
}
const isShootingScript = j => Array.isArray(j.segments) && j.segments.some(s => Array.isArray(s.shots) && s.shots.some(x => x.direction || x.anim));
module.exports = { name: 'stage2d', toSpec, isShootingScript };
