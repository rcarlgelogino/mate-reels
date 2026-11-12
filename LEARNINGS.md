# Learnings (read before writing specs; max 40 lines; update in step 0b)

## Hook
- The hook callout must hit on the 1st or 2nd word (by 0.4 s). Frame 0 is the thumbnail: without a headline it shows only a small caption. (2026-11-11: t25_A callout came at 0.84 s.)

## Retention
- Plan re-hooks by time, not by segment count: an `impact` callout every 8 to 10 s. With 13 segments that means re-hooks at about segments 4, 8 and 11. (2026-11-11: gaps of 12 to 17 s in both topics.)
- About half of the runtime had no callout on screen (secondsBare 17 to 19 s of 38). Add a second callout on long segments or a `check`/`cross` on the key noun.

## Elements
- Never put the same template + params in two consecutive shots, even with a different zoom (review.js flags it). Example: jungle wide at the end of one segment and the start of the next.
- Years: `big` callout, not `counter` (counter shows "2,014").

## Tone (user wish 2026-11-11)
- Spanish only, and a bit more emotional: the 2026-11-11 reels were factual lists with little feeling. Each reel needs a sensory image, a human moment and an emotional payoff (see RUN.md "Tone").

## Emotion + clean look (user wish 2026-11-11, second round)
- More emotion in picture AND voice: set `emo` on every segment, a `react` close-up at least every third segment, the mate mascot as recurring host. Clean cards (`look: clean`), max 2 callouts per segment. Reference: outbox/2026-11-12 (t01, t17).

## Spanish (es-AR-TomasNeural only; user rejected es-UY-MateoNeural 2026-11-12)
- Spanish at +14% is faster than English: 13 segments of about 8 words gave only 34.5 s. Plan 14 to 15 segments (105 to 120 words).
- `at` regex: short unaccented prefix ("naci", "az", "cumplea"); never a number or a word starting with ¿.

## Sound (user wish 2026-11-11)
- Voice must be much louder than music and SFX. The mix in build.js boosts + compresses the voice (voiceGain 2.0), music 0.12, sfx 0.35, master -12 LUFS. Never raise musicVol/sfxVol above these defaults.

## 3D logic (user wish 2026-11-11)
- In every sheet.png check that 3D elements are arranged logically: objects stand on surfaces (no floating mate, termo or pack), nothing clips through people or furniture, the mate is in a hand or on the table, the termo pours into the gourd, labels sit next to their part, and the shot matches the sentence. A violation counts as a hard error (rebuild with another template/params).
- Voice quality (user 2026-11-11 "Stimme ist low quality"): free Edge TTS is capped at 24 kHz MP3. build.js now cleans it (EQ, exciter, de-esser, gentle compression) and keeps emotion pitch offsets small (max ~10 Hz). Never raise the EMO pitch offsets again; carry emotion with rate, punctuation and wording.

## Reference reels (user 2026-11-12, 8 viral explainer reels)
- Patterns: curiosity hook ("¿Por qué...?", "Antes de X, ..."), one hero object on a solid dark background, small karaoke captions at the top with one highlighted word, infographics (numbered cards, dot grids, checklists, timelines, scoreboards), loop ending = first frame, comment poll at the end ("¿Vos cuál...? Contalo en los comentarios"). Comments punished a non-Argentine (Spain) AI voice: keep es-AR.
- Running A/B tests (outbox/2026-11-15): t30 = style (clean toy vs explainer look, same script); t18 = narrative (statement hook vs "¿Por qué...?" hook + poll ending). Read the results before choosing the default style.
