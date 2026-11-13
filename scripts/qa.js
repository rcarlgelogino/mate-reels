// Quality check for one built reel. usage: node scripts/qa.js <workdir> [--style flat2d]
// 1. metrics (tools/review.js + result.json): length, loudness, hook, re-hooks, silences, bare stretches, repeated shots
// 2. vision review with Gemini (free tier, GEMINI_API_KEY): two frames per shot + the spoken sentence, checked
//    against the style's QA checklist (styles/<style>.md) -> concrete logic / visual issues
// Writes <workdir>/qa.json and qa_frames.jpg. Exit code 0 always; qa.json.hold = true means "do not post".
const fs = require('fs'), path = require('path'); const { execFileSync, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..'); const FF = require(path.join(ROOT, 'tools', 'node_modules', 'ffmpeg-static'));
const dir = path.resolve(process.argv[2] || ''); const si = process.argv.indexOf('--style'); const STYLE = si > 0 ? process.argv[si + 1] : null;
const log = (...a) => console.log('[qa]', ...a);
function envKey(name) { if (process.env[name]) return process.env[name]; const f = path.join(ROOT, '.env'); if (!fs.existsSync(f)) return null;
  for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && m[1] === name) return m[2].replace(/^["']|["']$/g, '').trim() || null; } return null; }
const issues = []; const add = (severity, category, problem, fix, extra = {}) => issues.push({ source: 'metrics', severity, category, problem, fix, ...extra });
(async () => {
  const mp4 = path.join(dir, 'final.mp4'); if (!fs.existsSync(mp4)) { console.error('no final.mp4 in', dir); process.exit(0); }
  const res = JSON.parse(fs.readFileSync(path.join(dir, 'result.json'), 'utf8')); const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')); const style = STYLE || spec.style_used || spec.preset || 'flat2d';
  // ---- 1. metrics
  spawnSync(process.execPath, [path.join(ROOT, 'tools', 'review.js'), dir], { stdio: 'ignore' });
  let rv = {}; try { rv = JSON.parse(fs.readFileSync(path.join(dir, 'review.json'), 'utf8')); } catch {}
  const d = res.duration, lufs = parseFloat(String(res.loudness)); let hold = false;
  if (!(d >= 30 && d <= 47)) { add('high', 'length', `duration ${d}s is outside 30-47 s`, 'add or cut a segment'); hold = true; }
  else if (!(d >= 35 && d <= 45)) add('low', 'length', `duration ${d}s is outside the 35-45 s target`, d < 35 ? 'plan ~105-115 words' : 'cut one body segment');
  if (!(lufs > -18)) { add('high', 'sound', `loudness ${res.loudness} is far too quiet or missing`, 'check the mix'); hold = true; }
  if (res.voice !== 'gemini') add('medium', 'voice', `voice was ${res.voice}, not Charon (Gemini quota or key problem)`, 'check GEMINI_API_KEY / daily quota');
  if (rv.hook && rv.hook.firstCallout > 0.6) add('medium', 'hook', `first headline at ${rv.hook.firstCallout}s (should be ≤0.4 s, frame 0 is the thumbnail)`, 'headlineAt on word 1-2 of segment 1');
  if (rv.rehooks && rv.rehooks.over10s) add('low', 'pace', `${rv.rehooks.over10s} gap(s) over 10 s without a re-hook (${(rv.rehooks.gaps || []).join(', ')})`, 'add impact:true to a headline in the middle');
  if (rv.pace && rv.pace.maxShot > 4.5) add('low', 'pace', `one shot runs ${rv.pace.maxShot}s without a cut`, 'split the sentence into two visuals');
  if (rv.callouts && rv.callouts.longestBare > 6) add('low', 'text', `${rv.callouts.longestBare}s without any headline`, 'add a headline');
  if (rv.sameShotBackToBack && rv.sameShotBackToBack.length) add('low', 'visual', `same shot twice in a row: ${JSON.stringify(rv.sameShotBackToBack).slice(0, 120)}`, 'change place, people or zoom');
  if (rv.sound && rv.sound.silences && rv.sound.silences.length) add('medium', 'sound', `silent gaps: ${JSON.stringify(rv.sound.silences).slice(0, 120)}`, 'check the narration cut');
  // black / empty frames: mean luma per shot middle
  try { const r = spawnSync(FF, ['-v', 'info', '-i', mp4, '-vf', 'fps=1,signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 24 });
    const vals = [...(r.stderr || '').matchAll(/YAVG=([\d.]+)/g)].map(m => +m[1]); const dark = vals.filter(v => v < 12).length; if (dark >= 2) { add('high', 'visual', `${dark} nearly black seconds`, 'check the render'); hold = true; } } catch {}
  // ---- 2. vision review (Gemini, free tier)
  const shots = tl.shots; const frames = []; shots.forEach((s, i) => { for (const f of [0.35, 0.85]) frames.push({ t: +(s.start + s.dur * f).toFixed(2), i }); });
  const sel = frames.map(f => `between(t\\,${(f.t - 0.017).toFixed(3)}\\,${(f.t + 0.017).toFixed(3)})`).join('+'); const cols = 8, rows = Math.ceil(frames.length / cols);
  const grid = path.join(dir, 'qa_frames.jpg');
  try { execFileSync(FF, ['-y', '-v', 'error', '-i', mp4, '-vf', `select='${sel}',scale=240:426,drawtext=text='%{n}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '4', grid]); }
  catch { try { execFileSync(FF, ['-y', '-v', 'error', '-i', mp4, '-vf', `select='${sel}',scale=240:426,tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '4', grid]); } catch (e) { log('frame grid failed', e.message.slice(0, 100)); } }
  const KEY = envKey('GEMINI_API_KEY'); let vision = { ran: false };
  if (KEY && fs.existsSync(grid)) {
    let guide = ''; try { const g = fs.readFileSync(path.join(ROOT, 'styles', style + '.md'), 'utf8'); const k = g.indexOf('## QA checklist'); guide = k >= 0 ? g.slice(k) : g.slice(0, 3000); } catch {}
    const words = tl.words || []; const lines = shots.map((s, i) => { const sent = words.filter(w => w.seg === s.seg).map(w => w.w).join(' '); return `shot ${i} (frames ${i * 2} and ${i * 2 + 1}, ${s.start.toFixed(1)}-${(s.start + s.dur).toFixed(1)}s, template ${s.tpl}): "${sent}"`; }).filter((l, i, a) => a.indexOf(l) === i);
    const prompt = `You are a strict quality reviewer for short vertical explainer reels (Instagram, Spanish/rioplatense, style "${style}").\nThe image is a grid of frames, numbered in yellow from 0, two frames per shot, left to right, top to bottom.\nShots and the sentence spoken during each:\n${lines.join('\n')}\n\nStyle QA checklist:\n${guide.slice(0, 3500)}\n\nFind every concrete logic or visual error, even small ones: hands not holding objects, floating or clipping objects, wrong proportions, people overlapping, text cut off or outside the frame, text covering faces or hands, unreadable text, misspelled on-screen Spanish, picture not matching the sentence, empty or confusing frames, repeated pictures. Ignore the progress bar at the very top and transition blur. Do not invent problems you cannot see.\nAnswer ONLY with JSON: {"issues":[{"frame":<number>,"shot":<number>,"severity":"low|medium|high","category":"logic|visual|text|match","problem":"<short English>","fix":"<short English, actionable for the style or the script>"}],"overall":"<one sentence>"}`;
    const body = { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(grid).toString('base64') } }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } };
    for (const model of [process.env.GEMINI_QA_MODEL, 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].filter(Boolean)) {
      try { const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body) });
        const j = await r.json(); if (!r.ok) { log('vision', model, r.status, (j.error && j.error.message || '').slice(0, 120)); continue; }
        const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '{}'; const out = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1));
        (out.issues || []).forEach(x => issues.push({ source: 'vision', severity: x.severity || 'low', category: x.category || 'visual', problem: x.problem, fix: x.fix, shot: x.shot, frame: x.frame, time: shots[x.shot] ? +(shots[x.shot].start).toFixed(1) : null, template: shots[x.shot]?.tpl }));
        vision = { ran: true, model, overall: out.overall || '' }; break;
      } catch (e) { log('vision error', e.message.slice(0, 120)); }
    }
  } else log('vision skipped', KEY ? '(no frame grid)' : '(no GEMINI_API_KEY)');
  const order = { high: 0, medium: 1, low: 2 }; issues.sort((a, b) => order[a.severity] - order[b.severity]);
  const out = { reel: spec.id, style, duration: d, loudness: res.loudness, voice: res.voice, hold, vision, issues, checked: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'qa.json'), JSON.stringify(out, null, 1));
  log(`${spec.id}: ${issues.length} issue(s)`, hold ? 'HOLD (not posted)' : '', vision.ran ? `vision ${vision.model}` : 'no vision');
  issues.slice(0, 12).forEach(x => log(` - [${x.severity}] ${x.category}${x.shot != null ? ' shot ' + x.shot : ''}: ${x.problem}`));
})().catch(e => { console.error('[qa] failed:', e.message); process.exit(0); });
