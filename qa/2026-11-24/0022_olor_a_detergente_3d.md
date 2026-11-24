# Visual analysis: 0022_olor_a_detergente

style build3d · duration 34.6s · loudness -12.1 LUFS, peak -0.9 dBFS · voice gemini · vision gemini-3.5-flash-lite

The reel effectively uses a consistent 3D style and humorous character expressions to match the script's educational tone about cleaning a mate. However, several physical inconsistencies occur, such as a character collapsing through the floor in early shots and floating objects during washing sequences.

## Scores
visual_logic 6/10 · graphics 7/10 · overall 6/10

## Visual logic
**clean**
- Consistent character model and kitchen background layout across most shots.
- Correct visual depiction of the gourd and bombilla in later handling steps.
**unclean**
- shot 1: The character is shown lying down unnaturally on the floor after previously standing.
- shot 10: Water drops appear to float or detach unnaturally from the rinsing action.

## Graphics
**clean**
- Captions are clear and well-placed in the central text area.
- Red and green stamps provide helpful visual reinforcement for correct/incorrect actions.
**unclean**
- shot 3: A giant plant sprouts out of the gourd which exaggerates scale incorrectly for the narration.

## Issues
- [high] scene shot 1: Character suddenly falls to the floor without physical transition. → Ensure character remains standing or uses a clear sitting animation.
- [medium] scale shot 3: Gourd sprouts an unrealistically large plant relative to its size. → Keep the plant scale proportional to the gourd object.
- [medium] objects shot 10: Water droplets float detached while rinsing the mate. → Anchor particle effects directly to the pouring stream and gourd opening.
- [medium] objects: "detergente" is named but build3d has no drawing for it → add a detergente drawing to build3d and its column in styles/lexicon.js
- [medium] objects: "esponja" is named but build3d has no drawing for it → add a esponja drawing to build3d and its column in styles/lexicon.js
- [low] guard shot 1: camera too close (backed off by the guard) in 1 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)

## Visual learnings for the next run
- DO (scene): Maintain consistent character positioning and grounding across sequential shots.
- AVOID (scale): Avoid exaggerated object scaling that distorts the physical logic of everyday items.
