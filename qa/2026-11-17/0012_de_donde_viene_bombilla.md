# Visual analysis: 0012_de_donde_viene_bombilla

style pixel8 · duration 40.9s · loudness -12.0 LUFS, peak -0.8 dBFS · voice gemini · vision gemini-3.7-flash

The pixel8 aesthetic is consistent, with clean pixel outlines, coherent character geometry, and fitting typography throughout. However, several shots contradict their narration by displaying bombillas when describing drinking without one, and characters suffer awkward edge cropping in shots 2 and 3.

## Scores
visual_logic 6/10 · graphics 8/10 · overall 7/10

## Visual logic
**clean**
- Drinking pose properly aligns the bombilla tip to the mouth opening in shots 8 and 11.
- The red-shirt character in shot 4 visibly displays green yerba stuck in the teeth matching the spoken line.
- Poll layout in shot 12 uses clean pixelated buttons aligned with the style guide.
**unclean**
- shot 0: Character is drinking through a bombilla despite the narration stating 'Antes de la bombilla'.
- shot 3: The gourd in frame 8 clearly has a straw sticking out, contradicting 'tomaban la yerba directo de la calabaza'.
- shot 7: Static bombillas on ground fail to illustrate water rising or a pumping mechanism as narrated ('porque sube el agua hasta tu boca').

## Graphics
**clean**
- Faithful pixel8 aesthetic with consistent dark outlines, floating hands, and round head geometry.
- Appropriate background shifts across outdoor jungle, kitchen interior, and night settings.
**unclean**
- shot 2: Secondary character on the right edge is awkwardly halved by the frame border.
- shot 3: Characters in frame 7 are pushed into the far left and right edges, partially cut off.
- shot 1: The prompt banner '¿VOS QUÉ DECÍS?' appears too early in shot 1 instead of an interactive outro.

## Issues
- [high] match shot 0: Character drinks with a bombilla when narration says before the bombilla existed. → Remove the straw and depict the character sipping directly from the rim of the gourd.
- [high] match shot 3: Gourd has a straw inserted while the voiceover specifies drinking straight from the gourd. → Remove the bombilla sprite from the gourd asset for pre-bombilla Guarani scenes.
- [medium] people shot 2: Right character is cut off by the edge of the 9:16 frame. → Center the Guarani figures or cluster them closer together away from screen boundaries.
- [medium] match shot 7: Reused bombilla lineup shows no water movement or pump action to explain the etymology. → Animate water particles or an arrow rising up the tube into a mouth.

## Visual learnings for the next run
- AVOID (match): Avoid showing modern mate props (straws/bombillas) during historical origins scenes explaining life before them.
- DO (people): Keep floating-hand characters within the inner safe zone to prevent edge cropping on narrow 9:16 vertical viewports.
