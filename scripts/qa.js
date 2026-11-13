// Post-build analysis of one reel: VISUAL representation only. usage: node scripts/qa.js <workdir> [--style flat2d]
// It never blocks anything: every reel is released and posted as usual. The analysis is only for learning.
// Pacing, hook, wording and sound are NOT judged here (those rules come from the reference reels, docs/WATCHTIME.md).
// 1. a few technical checks (black frames, length, voice fallback) are logged as info only
// 2. Gemini vision (free tier, model picked automatically by scripts/gemini_text.js) looks at two frames per shot with
//    the sentence spoken during it and the style's QA checklist: where is the visual logic clean / unclean
//    (hands, arms, holding, drinking, passing, proportions, overlaps, floating objects, picture vs sentence),
//    where are the graphics clean / unclean, plus concrete issues and visual learnings for the next run.
// Writes <workdir>/qa.json, qa.md and qa_frames.jpg. Exit code is always 0.
const fs = require('fs'), path = require('path'); const { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const FF = require(path.join(ROOT, 'tools', 'node_modules', 'ffmpeg-static'));
const G = require('./gemini_text');
const dir = path.resolve(process.argv[2] || ''); const si = process.argv.indexOf('--style'); const STYLE = si > 0 ? process.argv[si + 1] : null;
const log = (...a) => console.log('[qa]', ...a);
(async () => {
  const mp4 = path.join(dir, 'final.mp4'); if (!fs.existsSync(mp4)) { console.error('no final.mp4 in', dir); process.exit(0); }
  const res = JSON.parse(fs.readFileSync(path.join(dir, 'result.json'), 'utf8')); const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')); const style = STYLE || spec.style_used || spec.preset || 'flat2d';
  // ---- 1. technical info (not a judgement, not a learning)
  const tech = [`duration ${res.duration}s`, `loudness ${res.loudness}`, `voice ${res.voice}`];
  if (res.voice !== 'gemini') tech.push('voice fell back from Charon (Gemini quota or key)');
  try { const r = spawnSync(FF, ['-v', 'info', '-i', mp4, '-vf', 'fps=1,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 24 });
    const dark = [...(r.stderr || '').matchAll(/YAVG=([\d.]+)/g)].map(m => +m[1]).filter(v => v < 12).length; if (dark >= 2) tech.push(`${dark} nearly black seconds`); } catch {}
  // ---- 2. frame grid: two frames per shot, in order, left to right, top to bottom
  const shots = tl.shots; const frames = []; shots.forEach((s, i) => { for (const f of [0.35, 0.85]) frames.push({ t: +(s.start + s.dur * f).toFixed(2), i }); });
  const sel = frames.map(f => `between(t\\,${(f.t - 0.017).toFixed(3)}\\,${(f.t + 0.017).toFixed(3)})`).join('+'); const cols = 6, rows = Math.ceil(frames.length / cols);
  const grid = path.join(dir, 'qa_frames.jpg');
  try { execFileSync(FF, ['-y', '-v', 'error', '-i', mp4, '-vf', `select='${sel}',scale=360:640,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', grid]); } catch (e) { log('frame grid failed', e.message.slice(0, 100)); }
  // ---- 3. vision analysis (visual only)
  let A = null, model = null;
  if (!G.hasKey()) log('vision skipped (no GEMINI_API_KEY)'); else if (!fs.existsSync(grid)) log('vision skipped (no frame grid)');
  else {
    let guide = ''; try { const g = fs.readFileSync(path.join(ROOT, 'styles', style + '.md'), 'utf8'); const k = g.indexOf('## QA checklist'); guide = k >= 0 ? g.slice(k) : g.slice(0, 3000); } catch {}
    const words = tl.words || []; const lines = shots.map((s, i) => { const sent = words.filter(w => w.seg === s.seg).map(w => w.w).join(' '); return `shot ${i} (grid cells ${i * 2 + 1} and ${i * 2 + 2}, ${s.start.toFixed(1)}-${(s.start + s.dur).toFixed(1)}s, template ${s.tpl}): "${sent}"`; });
    const prompt = `You inspect the VISUAL representation of a finished 2D/3D explainer reel (vertical 9:16, about mate, style "${style}") so the next reel looks better. Only judge what is drawn: do NOT judge pacing, hook, wording, story or sound.
The image is a grid of ${frames.length} frames, ${cols} per row, read left to right, top to bottom: two frames per shot, in order.
Shots and the sentence spoken during each (only to check that the picture shows what is said):
${lines.join('\n')}

Style QA checklist:
${guide.slice(0, 3500)}

Look at every figure and object down to the smallest detail and ask "does this make physical sense?":
- hands and arms: does the arm reach the object, is the hand connected to the arm, does the hand really grasp the object (a hand holding a gourd wraps around its side, it is not hidden behind it with loose fingers pasted on the front, and not a flat disc in the middle of it), are arms bent plausibly, do two hands appear where there should be one
- drinking: straw (bombilla) at the mouth, gourd below the chin; passing: the gourd travels from hand to hand, never floats
- objects: floating, clipping through bodies or furniture, wrong scale (gourd ~ a hand, thermos ~ forearm), wrong layer order (behind/in front)
- people: overlapping, cut off at frame edges, tiny or giant compared to the room, standing in the air, faces/expressions fitting
- scene: proportions of furniture and background, perspective, empty or cluttered frames, details that are wrong or missing
- on-screen text and labels as graphics: covering faces/hands, cut off, overlapping other elements, pointing at the wrong thing
- picture vs sentence: the frame shows something different from what is said
Ignore the progress bar at the very top and transition blur. Do not invent problems you cannot see; say which shot.
Answer ONLY with JSON in English:
{"summary":"<2 sentences on the visual quality>",
 "scores":{"visual_logic":1-10,"graphics":1-10,"overall":1-10},
 "logic":{"clean":["<what is drawn plausibly>"],"unclean":["<shot N: what does not make physical sense>"]},
 "graphics":{"clean":["..."],"unclean":["shot N: ..."]},
 "issues":[{"shot":<number>,"severity":"low|medium|high","category":"hands|arms|objects|people|scene|layering|scale|labels|match","problem":"<short>","fix":"<short, actionable for the style/engine or for which visual to choose>"}],
 "learnings":[{"type":"do|avoid","area":"hands|arms|objects|people|scene|layering|scale|labels|match","rule":"<one general visual rule for the next reels>"}]}`;
    try { const r = await G.generate([{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(grid).toString('base64') } }], { temperature: 0.2 }); A = r.data; model = r.model; }
    catch (e) { log('vision failed:', e.message.slice(0, 160)); }
  }
  const L = A || {};
  const issues = (L.issues || []).map(x => ({ severity: x.severity || 'low', category: x.category || 'visual', problem: x.problem, fix: x.fix, shot: x.shot, time: shots[x.shot] ? +(shots[x.shot].start).toFixed(1) : null, template: shots[x.shot]?.tpl }));
  const order = { high: 0, medium: 1, low: 2 }; issues.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  const out = { reel: spec.id, style, technical: tech, vision: { ran: !!A, model }, summary: L.summary || '', scores: L.scores || {},
    logic: L.logic || {}, graphics: L.graphics || {}, issues, learnings: L.learnings || [], checked: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'qa.json'), JSON.stringify(out, null, 1));
  const li = a => (a && a.length ? a.map(x => '- ' + x).join('\n') : '- –');
  const md = [`# Visual analysis: ${out.reel}`, '', `style ${style} · ${tech.join(' · ')} · ${A ? 'vision ' + model : 'no vision'}`, '', out.summary,
    '', '## Scores', Object.entries(out.scores).map(([k, v]) => `${k} ${v}/10`).join(' · ') || '–',
    '', '## Visual logic', '**clean**', li(out.logic.clean), '**unclean**', li(out.logic.unclean),
    '', '## Graphics', '**clean**', li(out.graphics.clean), '**unclean**', li(out.graphics.unclean),
    '', '## Issues', li(issues.map(x => `[${x.severity}] ${x.category}${x.shot != null ? ' shot ' + x.shot : ''}: ${x.problem} → ${x.fix || ''}`)),
    '', '## Visual learnings for the next run', li(out.learnings.map(x => `${x.type === 'avoid' ? 'AVOID' : 'DO'} (${x.area}): ${x.rule}`))].join('\n');
  fs.writeFileSync(path.join(dir, 'qa.md'), md + '\n');
  log(`${spec.id}: ${issues.length} visual issue(s), ${out.learnings.length} learning(s)`, A ? `vision ${model}` : 'no vision', out.scores.overall ? `overall ${out.scores.overall}/10` : '');
  issues.slice(0, 12).forEach(x => log(` - [${x.severity}] ${x.category}${x.shot != null ? ' shot ' + x.shot : ''}: ${x.problem}`));
})().catch(e => { console.error('[qa] failed:', e.message); process.exit(0); });
