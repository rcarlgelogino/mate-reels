# Visual analysis: 0026_el_mate_nunca_se_toma_solo

style pixel8 · duration 35.667s · loudness -12.4 LUFS, peak -0.8 dBFS · voice gemini · vision gemini-3.6-flash

The pixel art style is consistent throughout the reel with clear character designs. However, several shots suffer from missing characters, text mismatch, and poor framing.

## Scores
visual_logic 5/10 · graphics 6/10 · overall 5/10

## Visual logic
**clean**
- Character poses and mate holding match basic pixel style rules.
**unclean**
- Shot 8: Figure cut off at edge of screen.
- Shot 9: Yaguarete action is represented by a static small sprite rather than an attack.
- Shot 12: Scene is empty of characters during the gift revelation.
- Shot 14: Sentence spoken does not match the on-screen text.

## Graphics
**clean**
- Pixel fonts and color palettes fit the pixel8 aesthetic.
**unclean**
- Shot 14: On-screen text graphics display text from an earlier shot.

## Issues
- [medium] people shot 8: Moon character is sliced at the right edge. → Keep character sprites within canvas margins.
- [medium] match shot 9: Jaguar attack visual lacks motion or clear interaction. → Add animated attack frame or larger sprite interaction.
- [medium] scene shot 12: Frame shows only background trees without subject. → Include character or explicit gift visual centrally.
- [medium] labels shot 14: Text overlays show repeated lines from previous shot. → Sync text engine to spoken line array.

## Visual learnings for the next run
- AVOID (labels): Avoid text overlay desynchronization with audio transcript.
- DO (people): Keep main figures centered away from vertical edge boundaries.
