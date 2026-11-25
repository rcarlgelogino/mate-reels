# Directing scripts (v2, 2026-11-25)

A script is a full shooting script. It describes every picture down to the smallest movement and the smallest background detail, so a style only has to draw what is written. Nothing is left to defaults. Example: `docs/examples/0022s_detergente.json`.

## The few principles (everything else is free)
1. **A story from everyday life**, with people, a conflict and a turn. Not a list of facts.
2. **Every sentence is something you can see.** If a sentence cannot be shown, rewrite it until it can.
3. **One surprise and at least one laugh.** Absurd is welcome.
4. **The end** lands on a laugh or a question to the viewer.
5. Facts must be true; rioplatense voseo.
7. **Full freedom for new elements.** More detail means more elements: any person, look, object, place, animal, vehicle, effect or movement the story needs is written into the script, and the style builds it. "The style cannot draw it yet" is never a reason to leave it out (2026-11-25).
6. **Logic over rules.** The script decides, the style only draws. If the sentence speaks about several people, all of them are in the picture; if the story is in two places, there are two sets. No style default, layout limit or check may change what the script says (2026-11-25: "one person shown although several are talked about", "only one background").

No fixed number of sentences, no fixed beats, no forced poll, no fixed length (about 20–45 s). A shot may run over several sentences, so an action has time to happen. Places may change when the story needs it. Text on screen: subtitles only (and a poll if the script asks for one).

## From the reference reels of 2026-11-25
- **Hook = context + curiosity + snapback** (kallawaymarketing, 46k likes): the first sentence and picture make the situation clear at once, open a question, and turn the expectation ("re orgullosa… y lo arruinó"). Delayed context = more skips.
- **Layer the hook** (robertmckeaveney, 48k likes): each added detail makes the question stronger (tu mamá → tu mate → con detergente → re orgullosa → y lo arruinó). Write the payoff first and build the hook backwards from it, so every layer gets answered and nobody feels baited.
- **One world, one line of tension** (bigshortmedia): the whole reel lives in one connected world that the camera travels through; tension rises over the reel with clear peaks; nothing is a loose single picture.
- **Shot plan first** (toonwright.click): a typed line alone gives a dull clip; a written shot-by-shot plan (camera pushes in, he walks and talks, camera follows, close on the face) gives a story with a beginning and a payoff. That is this format.

## From the code-built AI reels (2026-11-25; video-generator reels do not count; details: docs/research/reels-ai-animation.md)
- **Frame 0 shows the premise and the threat; the story runs If → But → So; every step lands on its word.**
- **Density:** a new picture about every 1–2 s (morrow, Claude Code: 75 shots and ~100 sound effects in 60 s). A shot may be one beat of a longer action.
- **Light:** one key + one warm practical light, a bright focus spot, the rest darker. Never even light everywhere.
- **Motion:** anticipation before big moves, ease, overshoot and settle; nothing at constant speed; motion fits the material (vinyl toys hop and settle).
- **Camera by feeling:** push in = tension, over the shoulder = conversation, POV = be the hero, static wide = a build or a gag that must read.
- **Proven shapes (code-built):** serial with a viewer vote (end on a dilemma, the next episode follows the majority); build time-lapse ("how X becomes Y"); what-if with a running counter; counter escalation on one object; cutaway / section view (the viewer knows more than the characters); true-story shorts; isometric dioramas.
- **Consistency:** a series bible with a character sheet and an expression set, fixed before the first episode; every frame checked.

## "¿Sabías que…?" format (2026-11-26, details: docs/research/sabias-que-format.md)
Everyday mate action → "y no" + an absurd but real, named, mate-world alternative → 3–4 real numbers, each on its word, as pill labels / counter / gauge on the object → the consequence as three losses ("sin X, sin Y y sin Z"), each its own destruction beat → "Seguime para más datos de mate." About 20–25 s, a picture every 1.5–2 s with fast bursts in the escalation.

## Story logic (written before any shot)
Every script starts with a `story` block, and every shot must agree with it:
- **logline**: the whole story in one sentence (who wants what, what goes wrong, how it ends).
- **timeline**: when each scene happens (day, hour) and how much time passes between scenes; the clock, the light and the clothes follow it.
- **links**: for each scene, why it follows the one before (cause → effect). No scene may appear without a reason, no person may appear without coming in, no object may appear or vanish without someone moving it.
- **objects**: the state of every important object after each scene (full, empty, foamy, washed, where it stands, in whose hand).
- **knowledge**: who knows what at each point (the mother does not know she did wrong; the grandma finds out in scene 6) so reactions make sense.
- **places**: every place the story uses, with how people get from one to the other (doors, streets).
Check before writing the shots: read the scenes in order and ask "could this really happen like this?". Fix the story, not the picture.

## Format
```
{
  "id", "title", "caption", "hashtags", "poll"?,            // poll only if the story ends on a choice
  "cast": { "<name>": { "role", "age", "body", "hair", "clothes", "shoes", "extras", "personality" } },
  "sets": { "<name>": { "desc", "light", "time",
            "elements": [ { "what", "where", "size"?, "detail"?, "state"? } ] } },   // every visible thing, back to front
  "segments": [ { "text", "emo",
      "shots": [ {
        "dur": "sentence" | seconds | "sentence+next",    // a shot may span sentences
        "set": "<name>", "changes"?: [ set element changes for this shot ],
        "camera": { "frame": "wide|full|medium|close|extreme close", "angle": "eye height|low|high|top", "on": "<what is centred>",
                    "move": "still|slow push-in|pan left ...", "why": "<why this framing>" },
        "positions": { "<cast>": { "x": 0..1 (left..right), "depth": "front|middle|back", "facing": "camera|left|right|<cast>", "pose": "stand|sit|lean ..." } },
        "props": [ { "what", "where" (in whose hand / on what), "state" } ],
        "beats": [ { "at": 0..1 (share of the shot), "who", "body"?, "arms"?, "hands"?, "head"?, "face"?, "eyes"?, "mouth"?, "says"? } ],
        "fx": [ { "at", "what" } ],          // steam, foam, sweat drops, stars ... only when motivated
        "sound": [ { "at", "what" } ],
        "gag"?: "<what is funny here>"
      } ] } ]
}
```
**`direction`** (one per shot, about 1000 words as an orientation, not a fixed number): the full director's text for this shot in plain prose, second by second. It covers, in this order:
1. What the viewer must understand without sound, and why this picture.
2. The set as seen in this shot: every visible element back to front, its colour, size next to the people, its state, what moves in it (curtain, steam, clock hand), light direction and shadows.
3. Each person: where they stand, how they stand, what they wear in this moment, and every movement from the first to the last frame: body, head, each arm, each hand and finger, legs and feet, eyes, brows, mouth, breathing, small idle moves of the ones who only listen.
4. Every object: where it is, who touches it, how it moves, how it ends up (state carried to the next shot).
5. Camera: framing at start and end, height, how and why it moves, what stays in focus, what must never leave the frame.
6. Timing: what happens on which word of the sentence.
7. Effects and sounds with their exact moment and size.
8. The gag or the feeling: what exactly makes it funny or touching, and how big the reaction is.
9. Continuity: what must match the shot before and after.

Rules for writing beats:
- One beat per change. Name the side ("right hand"), the target ("to the mouth", "on the counter edge"), the speed ("slowly", "in one jerk") and the end position.
- Every person in the shot has at least one beat, also the ones only reacting (eyes, small nods, breathing).
- Faces: name the brows, eyes and mouth, not just "happy".
- Objects keep their state across shots (an emptied mate stays empty; foam stays until someone rinses it).
