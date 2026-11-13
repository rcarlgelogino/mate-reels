# Reel script format (style-neutral)

A **script** says *what* a reel tells and shows. It never names templates, colours or camera moves.
The active **style** (`styles/active.json`) turns it into a render spec (`styles/<style>.js` → `toSpec(script)`).
So the same scripts can be built as 2D this week and 3D next week.

Layers:
1. **Watch-time rules** – `docs/WATCHTIME.md` (how a reel is structured). Applies to every script.
2. **Scripts** – `queue/*.json` (this format). Topics and facts live here.
3. **Styles** – `styles/<name>.json` (look settings) + `styles/<name>.js` (visual translator) + `styles/<name>.md` (notes). Switch with one line in `styles/active.json`.

## File

```json
{
  "id": "0001_cebador",
  "topic": "t03",
  "title": "El cebador",
  "caption": "Hook line 🧉 value line.\nCall to save/share 👇",
  "hashtags": ["#mate", "#argentina"],
  "segments": [
    { "text": "Una sola persona manda en la ronda de mate.", "emo": "surprised", "beat": "hook",
      "visual": { "type": "scene", "place": "kitchen", "people": [ { "role": "cebador", "does": "hold_mate" }, { "role": "friend" }, { "role": "grandma" } ], "label": { "text": "EL QUE MANDA", "on": 0 } },
      "headline": "MANDA UNO" }
  ],
  "poll": { "question": "¿Vos qué sos?", "options": ["CEBADOR", "ESPERO MI MATE", "DIGO GRACIAS"] }
}
```

### Segment fields
- `text` – one spoken sentence, 6–12 words, rioplatense Spanish. `emo`: excited, surprised, warm, nostalgic, proud, tense, funny, sad, angry, love, neutral.
- `beat` – hook | loop (open loop) | body | rehook | payoff | cta. Used for checks and by styles for emphasis.
- `headline` – short on-screen text (max 3 words). Optional `headlineType`: big (default) | check | cross. `impact: true` adds a hit + shake (hook, re-hooks, payoff).
- `visual` – one of the types below. A segment may have `visuals: [..]` (2 shots) instead.

### Visual types
| type | fields | meaning |
|---|---|---|
| scene | place: kitchen, park, plaza, patio, beach, home · people: [{role, does, mood}] · pass: [from, to] · label: {text, on} | people in a place |
| reaction | emotion, act, color | close-up of one person reacting |
| object | item: mate, mate_madera, imperial, termo, yerba, bombilla · mascot: emotion (mate gets a face) · with: [items] · labels: [text] | hero object |
| title | text, sub | big text card |
| list | items: [{title, sub}] | numbered cards |
| checklist | rows: [{text, ok}] | do / don't |
| number | value, sub | one big number |
| dots | on, total, label, sub | x out of y |
| timeline | items: [{label, text}] | steps in time |
| mistake | text, over: (a scene visual) | big red X over a scene |

Roles: cebador, friend, grandma, grandpa, stranger, kid, worker, you. `does`: idle, hold_mate, hold_termo, hold_both, drink, pass, receive, wave, point, hug, cheer, jump, no, nod, shock, laugh, sigh. `mood`: happy, smile, surprised, sad, angry, love, laugh, proud, neutral.

The last segment gets the comment poll automatically when `poll` is set.
