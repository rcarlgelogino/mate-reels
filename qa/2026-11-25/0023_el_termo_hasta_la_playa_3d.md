# Visual analysis: 0023_el_termo_hasta_la_playa

style build3d · duration 39.734s · loudness -12.1 LUFS, peak -0.8 dBFS · voice gemini · vision gemini-3.6-flash

The visual style delivers a clean, consistent 3D beach environment with stylized characters. However, multiple shots fail to illustrate the spoken actions, relying on static props rather than active character interaction.

## Scores
visual_logic 4/10 · graphics 6/10 · overall 5/10

## Visual logic
**clean**
- Shot 0-3: Consistent character rendering and beach background environments.
- Shot 9: Character seated at table interacting with the mate gourd.
**unclean**
- Shot 4: Characters stand empty-handed despite dialogue listing items being carried.
- Shot 5-6: Thermos sits isolated on a table instead of being held in hand as spoken.
- Shot 11-12: No visual representation of wind or yerba blowing into the character's face.

## Graphics
**clean**
- Consistent color palette, lighting, and 3D asset aesthetic throughout.
- Text overlay placement is clear and legible.
**unclean**
- Shot 14: End card UI buttons partially obscure character figures.

## Issues
- [high] match shot 5: Text states thermos goes in hand, but scene shows thermos stationary on a table. → Animate character holding the thermos in hand.
- [medium] objects shot 4: Dialogue mentions carrying cooler and thermos, but characters are empty-handed. → Add 3D props of cooler and thermos to character hands.
- [medium] match shot 11: Dialogue describes wind blowing yerba on face, but no particle effect or reaction is drawn. → Add wind particle effects and yerba flying toward character face.
- [medium] guard shot 9: person cut or head under the subtitle, guard could not fix in 1 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)
- [low] labels shot 14: Interactive poll UI elements cover character heads at the bottom. → Adjust camera angle slightly upward to keep faces clear of UI buttons.
- [low] guard shot 0: camera too close (backed off by the guard) in 4 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)
- [low] guard shot 9: people stood too close (spread by the guard) in 1 shot(s) → fix it at the source in the style (layout, camera plan, visual choice)

## Visual learnings for the next run
- DO (match): Ensure literal visual actions directly depict key nouns and verbs spoken in the voiceover.
- AVOID (objects): Avoid showing isolated static props on tables when text explicitly describes active handling.
