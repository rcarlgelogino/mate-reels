# Improvement requests and progress

Every improvement request the user sends is counted here, with the topic it belongs to. A topic that comes back after a fix means the fix did not hold. Progress is read in two ways: fewer repeats per topic, and the Instagram numbers (insights/latest.json).

## Requests per day (counted from the chat, 2026-11-24)
| day | requests | main topics |
|---|---|---|
| 11-10 | 1 | pace, effects |
| 11-11 | 3 | voice emotion, voice volume, voice quality |
| 11-12 | 5 | closer to examples, light, image quality, cleaner, voice |
| 11-13 | 5 | 2D proportions/detail, 3D sun + figures, drinking |
| 11-14 | 4 | bad old voice, repetitive, more cameras, last reel |
| 11-16 | 6 | thumbnails, pixel effects, depth, mate to mouth, too much text, safe zone |
| 11-17 | 22 | 3D faces, joints, life, hands, mate to mouth (3x), particles, falling, pixel depth/zooms/map, last reel bad |
| 11-18 | 1 | not clean: backgrounds unreadable, zooms, dolly |
| 11-19 | 2 | 3D boring, cheap, no interaction |
| 11-20 | 3 | subtitles ugly, subtitles doubled, framed mate |
| 11-21 | 1 | more detail (bus) |
| 11-23 | 7 | critical review, arms (2x), linear growth |
| 11-24 | 3 | last pixel reel, last 3D reel, measure progress |
| 11-25 | 8 | still very unhappy; cause = rules + scripts; scripts must detail every movement and background; rules fight the script (one person shown for several, one background) ; first stage reel: faces a bit strange, object interactions bad, object sizes odd, background needs more detail |
| **total** | **71** | |

## Topics that keep coming back (no fix held)
| topic | times asked | days | still in the last uploads (11-24) |
|---|---|---|---|
| arms and hands | 6 | 11-17, 11-23 | partly (3D fists in front of chest, built before the arms fix) |
| mate / bombilla to the mouth, holding | 6 | 11-13 – 11-17 | yes (stirring is a shake, bombilla not readable) |
| no life, repetitive, boring, no interaction | 5 | 11-14 – 11-19 | yes (people stand, one figure per shot, no gag) |
| text over the picture / subtitles | 4 | 11-16 – 11-20 | yes (pills over figures, poll over faces, lines end on "la", "a", "que") |
| backgrounds / detail unreadable | 7 | 11-13 – 11-21 | yes (pixel calabaza looks like a lamp, poros frame) |
| safe zone | 1 + found again | 11-16 | yes (pixel compare labels below y 1460) |
| particles in the air | 1 + found again | 11-17 | yes (white dots all over the 3D patio) |
| camera / zoom | 3 | 11-17 – 11-18 | partly |

## Instagram numbers (median per week, insights/latest.json)
| week | reels | median views | median avg watch time |
|---|---|---|---|
| 11-13 – 11-18 | 21 | 1495 | 16.7 s |
| 11-19 – 11-24 | 16 | 1814 | 18.6 s |

Small gain (+21 % views, +1.9 s watch time), but the two outliers (primer mate 9.6k, suegra 69k) came from the topic, not from the look. The look has not measurably improved: the same faults return.

## Rule from now on
- Each new request gets a row above (day, topic). A topic asked twice is fixed at the root and gets a lint or bench check, so it cannot come back unnoticed.
- After each change, the next posted reel of that style is checked for that topic; the result goes into the table.

## Fixes and their checks
| date | topic | fix (root) | check | proven |
|---|---|---|---|---|
| 11-24 | text over the picture | engine draws no headline, ✓/✗ or pill tile on a picture shot (boards, title cards, poll stay); dropped tiles are logged as guard `text_over_picture` | `node scripts/bench.js <label> --scripts tiles --base <label>` (script 0028 has three ✓ tiles) | yes: tiles gone in pixel and 2D, figures free |
| 11-24 | subtitles end on small words, single words | engine: a line never ends on la/de/que/a/cada …, a lone last word joins the line before, focus frames never on small words; pixel shrinks to one line before wrapping | bench captions (story, list, tiles) | yes: "tres segundos para decidir", "tapada con el pulgar" in one line |
| 11-24 | particles in the air (3D) | butterflies and motes off (`AMBIENT=false`); effects on actions stay | not in the bench places (indoor); check the next 3D patio/meadow upload | open |
| 11-24 | safe zone | object labels and pixel tags are clamped into SAFE; pixel compare uses a still, whole-frame camera | next pixel compare in an upload | open |
