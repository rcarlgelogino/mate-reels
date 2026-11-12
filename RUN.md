# Daily mate reel run (nightly, week 1)

You are producing tomorrow's Instagram reels about the Argentine mate tradition. Work in this folder. Be economical: no exploration, no redesign of the engine. Follow these steps exactly.

## 0. Which day

- Run window: **2026-11-12 to 2026-11-18** (7 post days, normally produced at 02:00). Start date = the run date when the run starts before 06:00 local time, otherwise the run date + 1 day.
- **Post date = the first day from the start date onward (up to 2026-11-18) whose two topics are not both finished** (`outbox/<day>/<topic>_A/final.mp4` and `_B/final.mp4` exist). Reels are sometimes built ahead by hand, so always skip finished days instead of stopping.
- Day index = (post date − 2026-11-12) in days, 0 to 6. If no unfinished day is left in the window, stop and write `outbox/STOPPED.txt` saying the week is done. Do nothing else.
- Topics for the day: `topics.json` → `week1[index]` (two topic ids). Skip a variant whose `final.mp4` already exists (resume after a crash).

## 0b. Review the last video first (every run)

- Run `node tools/review.js` (no argument = the newest `final.mp4` in `outbox`). It writes `review_hook.png` (frames 0 to 2.5 s), `review_strip.png` (one frame every 3 s) and `review.json` (hook timing, cut pace, re-hook gaps, payoff time, seconds without callout, repeated shots, sound cues, silent gaps) into that video's folder.
- Look at both PNGs once, read `review.json` and that video's `spec.json`. Write `outbox/<post date>/REVIEW.md`: for each of **Logik, Aufbau, Retention, Elemente, Animationen, Effekte, Sounds** one line "gut:" and one line "schlecht:", concrete (time, segment, template). Sounds: judge from `review.json` (cues, silences) and the loudness in `result.json`; you cannot listen.
- Add 1 to 3 new concrete rules to `LEARNINGS.md` (no duplicates, keep it under 40 lines; merge or delete outdated rules). Read all of `LEARNINGS.md` and apply it to today's specs.

## Language: castellano rioplatense

- All reels are in Argentine Spanish (voseo: "esperá", "seguinos", "guardalo"). Voice (user choice 2026-11-12): **Gemini TTS, voice Charon**, used automatically when `GEMINI_API_KEY` is set (env or `.env`; never read, print or edit `.env`). The whole reel is spoken in one request with a rioplatense style prompt, local Whisper aligns the words for the captions (pipeline/gemini.js). If Gemini fails, the build falls back to Edge `es-AR-TomasNeural` (+14%) automatically; keep `"voice": "es-AR-TomasNeural"` in every spec. Charon speaks slower than Edge: plan 12 to 14 segments (about 100 to 110 words) so the reel stays under 45 s. Free tier limits (checked 2026-11-12): 10 requests per day, 3 per minute; one request per reel, so at most ~8 new reels per day. The daily quota resets at 09:00 German time (midnight Pacific). Never set up billing. `result.json` → `voice` shows the provider; note "edge" in REPORT.md.
- Captions on screen, callouts, `caption`, hashtags: Spanish. Set `"followText": "SEGUINOS PARA MÁS"` and a Spanish `followSub`; the last segment starts with "Seguinos para más ..." (the pill then appears 1.8 s before the end).
- `at` regex: use a short unaccented prefix of the word ("naci" for "nació", "az" for "azúcar"); never point `at` at a number or a word starting with ¿ or ¡.
- Facts: no "feriado" for the Día del Mate (it is not a public holiday).
- **Only Spanish.** No English versions, no English words on screen (except proper names).

## Visual style (from 2026-11-12): flat explainer styles from the reference reels

Copy the structure of the approved style tests exactly: `runs/styletest/noche_t07/spec.json`, `runs/styletest/pop_t28/spec.json`, `runs/styletest/visor_t13/spec.json` (style blocks, backgrounds, board shots, callout positions, followY, poll ending).
- **A = "noche"**: `"style": {"accent": "#3fd0c9", "look": "explainer", "render": "flat"}`, `followY` 1500; navy `#16233a` everywhere (gourd/object `bg: studio`, `color` + `floor` navy; react `bg` navy, `ring` teal or red); `board` shots (title, cards, checklist, timeline, dots) on navy; `xmark` callouts for mistakes; compare lineups with labels (callout `y` 1580 on segments with a 3-4 item compare).
- **B = "pop"**: same script and voice as A, only visuals change: `"style": {"accent": "#ffd400", "look": "outline", "render": "flat", "captionY": 1420, "captionSize": 104, "wordsPerCaption": 2}`, `followY` 1600; every callout `y` 280 (yellow headline at the top); a different bright solid background per shot (#3b82f6, #7c3aed, #ef4444, #10b981, #f59e0b) on react (`ring` = `bg`), board and compare (`bg` + `floor`); board `top` 400-420.
- For process / how-to topics (production, preparation) A may use **"visor"** instead of "noche": `"style": {"accent": "#ffcc33", "look": "explainer", "render": "flat", "viewfinder": true}` with board shots on `#1f2a36`. Never use factory `secado` (camera too close); use `line`, `sapecado`, `estacionamiento`, `molienda`.
- Every reel ends with a comment poll board ("¿Vos cuál ...? Contalo en los comentarios.") with 3-5 short options, `cta: false`, plus "Seguinos para más" in the last sentence. Hook = curiosity ("¿Por qué...?", "Tu X, en realidad, es...", "Antes de...").
- `spec.ab` = "STYLE: noche vs pop" (or "visor vs pop").

## Tone: a bit more emotional

- Warm, personal, a little proud and nostalgic, like a friend from Buenos Aires telling you this over a mate. Talk to "vos".
- Every reel has 2 to 3 emotional sentences (not more, no kitsch):
  - a **sensory image**: el ruido de la bombilla al final, el termo bajo el brazo, el vapor en una mañana fría, la yerba mojada;
  - a **human moment**: la abuela que ceba, los amigos en la plaza, un desconocido que te convida un mate;
  - a **feeling word in the payoff**: orgullo, compartir, hogar, nunca solo ("Porque el mate nunca se toma solo.").
- Emotion comes from the framing, never from invented facts: numbers and history stay verified. No health claims.
- The payoff and the loop ending land on the emotion, not on a dry fact. One callout per reel may carry a feeling word (for example "COMPARTIR", "ORGULLO").
- Music: `mood` "latin" or "major" for warm topics; "minor" only for history or mystery hooks.
- **Emotion in the voice:** every segment gets an `emo` (excited, surprised, warm, nostalgic, proud, tense, funny, sad, angry, love, neutral). It changes the speaking rate and pitch of that sentence and sets the default face of every figure in its shots. Vary it: never the same `emo` three times in a row; hook = surprised/excited/funny, re-hooks = excited/tense, payoff = proud/love. Write with real punctuation (¡…!, ¿…?) because it shapes the intonation.
- **Emotion in the picture:** at least every third segment has a `react` close-up (a figure or the mate mascot with a clear face + act), and shot-level `emo` ({face, act, who}) on ronda/places shots. Faces: neutral, smile, happy, laugh, surprised, sad, angry, proud, love. Acts: jump, cheer, no, nod, shock, laugh, sigh, wave, hug. The mate mascot (`gourd` with `face`, or `react` with `mascot: true`) is the recurring host: use it 1 to 3 times per reel.
- **Clean look:** `style.look` "clean" (white callout cards, accent pill on the active caption word). Max 2 callouts per segment, short texts (max 3 words + sub). `react` backgrounds: soft pastel `bg` + `ring` in the accent or a flag color.

## 1. Facts (per topic, max 3 web searches, standard mode)

- Read the topic in `topics.json` (`title`, `angle`, `verify`).
- For each `verify` item do one search. Keep only numbers you can source. If a number cannot be confirmed, phrase it without the number ("one of the highest in the world"). Never make health claims. Write the facts with source URLs to `outbox/<post date>/<topic>_facts.md`.

## 2. Write two specs per topic: A and B

Path: `outbox/<post date>/<topic>_A/spec.json` and `..._B/spec.json`. Format: see `SPEC.md`. Rules:
- **Length: every reel must be 35 to 45 seconds** (`result.json` → `duration`). At the fast voice rate that is about 95 to 120 spoken words: **12 to 16 segments**, each ONE short sentence of **6 to 12 words** (long sentences break the TTS).
- Years and other 4-digit numbers: use a `big` callout, not `counter` (counter renders "2,014").
- **Retention structure (in this order):**
  1. **Hook, 0 to 2 s:** segment 1 states a surprising claim, a common mistake or a direct "you" question in under 8 words, with an `impact` callout. No intro, no greeting.
  2. **Open loop, by second 5:** segment 2 or 3 promises a payoff that comes later ("and number 3 shocks every tourist", "the last one is the reason why").
  3. **Body:** numbered points or steps. A new visual every 1.5 to 2.5 s (2 to 3 shots per segment, different templates or mate types, `zoom` punch-ins on alternate shots). Every segment has a callout; numbers use `counter`, do/don't use `check`/`cross`, comparisons use `ratio` or a `compare` shot.
  4. **Re-hook every 8 to 10 s:** a short pattern break sentence ("But here is the twist.", "Wait, it gets stranger.") with an `impact` callout.
  5. **Payoff at 30 to 38 s:** deliver the promised point with the strongest visual (`impact`, `counter` or `compare`).
  6. **Loop ending:** the last segment ends with "Follow for more ..." (pill added automatically) and its final words lead back into the hook, so the replay feels seamless.
- Never repeat a template + parameters combination twice in a row. Keep sentences concrete: one fact per sentence.
- **A/B difference (keep everything else identical):** A and B use the same script, voice, emo and facts; only the visual style differs (see "Visual style": A = noche or visor, B = pop). Note the hypothesis in `spec.ab`.
- Caption: one hook line, one value line, a call to save or share, then 5 to 8 hashtags. No website, no health claims.

## 3. Build

For each spec: `node pipeline/build.js <spec.json>` (takes a few minutes; run them one after another). If it fails with "word /x/ not found", fix the `at` regex in the spec; if TTS fails repeatedly, shorten that sentence. Then rerun.

## 4. Check (cheap)

- Read `sheet.png` (one frame per shot) once per video. Fix only hard errors: wrong template for the sentence, text cut off, empty or black frame, or 3D elements arranged illogically (floating or clipping objects, mate not in a hand or on a surface, termo not pouring into the gourd, labels away from their part). Max one rebuild per video.
- Read `result.json`: `inTarget` must be true (duration 35 to 45 s), loudness around -12 LUFS. Too short: add a segment before the payoff. Too long: cut a body segment. Rebuild (narration is cached, so only changed sentences are re-spoken).
- Run `node tools/review.js outbox/<post date>/<folder>` for each video (numbers only, no need to open the PNGs) and note rule violations (re-hook gap over 10 s, same shot back to back, payoff outside 30 to 38 s) in REPORT.md. They count toward the same max one rebuild.

## 4b. Collect finished videos

- After all builds: `node tools/fertig.js`. It copies every new or rebuilt `final.mp4` (and its caption) to `fertig/v###_<post date>_<folder>.mp4` with a running version number and updates `fertig/index.json`. Never rename or delete files in `fertig/`.

## 5. Outbox

Write `outbox/<post date>/schedule.json`:
```json
[{"time":"08:00","file":"<topicX>_A/final.mp4","caption":"<topicX>_A/caption.txt"},
 {"time":"12:30","file":"<topicY>_A/final.mp4","caption":"<topicY>_A/caption.txt"},
 {"time":"17:30","file":"<topicX>_B/final.mp4","caption":"<topicX>_B/caption.txt"},
 {"time":"20:30","file":"<topicY>_B/final.mp4","caption":"<topicY>_B/caption.txt"}]
```
Upload: there is no Instagram connection yet. Do NOT try to log in anywhere. If `pipeline/upload.js` and a filled `.env` exist, run `node pipeline/upload.js outbox/<post date>/schedule.json`; otherwise leave the files for manual scheduling.

Finish with a 3-line summary in `outbox/<post date>/REPORT.md`: topics, A/B hypothesis per topic, any problems.
