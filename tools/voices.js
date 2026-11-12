// Lists the voices in your ElevenLabs account (name, accent, voice ID) so you can put one into .env.
// Usage: node tools/voices.js            (needs ELEVENLABS_API_KEY in .env; prints no secrets)
//        node tools/voices.js test <id>  (speaks a short Spanish test line with that voice into voice_test_<id>.mp3)
const fs = require('fs'), path = require('path');
const EL = require('../pipeline/eleven');
(async () => {
  if (!EL.ENV.ELEVENLABS_API_KEY) { console.log('No ELEVENLABS_API_KEY in .env yet.'); process.exit(1); }
  if (process.argv[2] === 'test') {
    const id = process.argv[3]; if (!id) { console.log('usage: node tools/voices.js test <voice_id>'); process.exit(2); }
    EL.ENV.ELEVENLABS_VOICE_ID = id; const file = path.join(__dirname, '..', `voice_test_${id}.mp3`);
    const words = await EL.tts({ text: '¡Che, nunca digas gracias cuando te pasan un mate! Porque el mate nunca se toma solo.', emo: 'excited' }, null, null, file);
    console.log('wrote', file, words.length, 'words'); return;
  }
  const vs = await EL.listVoices();
  for (const v of vs) console.log(`${v.id}  ${v.name}  ${[v.labels?.language, v.labels?.accent, v.labels?.gender, v.labels?.age].filter(Boolean).join(' / ')}`);
  console.log(`\n${vs.length} voices. Add Argentine/Rioplatense voices to "My Voices" in the ElevenLabs Voice Library first, then put one ID into .env as ELEVENLABS_VOICE_ID.`);
})().catch(e => { console.error(e.message); process.exit(1); });
