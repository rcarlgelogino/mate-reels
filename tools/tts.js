// Generates vo_1..vo_4.mp3 with a male neural English voice (Microsoft Edge read-aloud service).
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs'), path = require('path');
const lines = [
  "This little cup has a five-hundred-year-old secret.",
  "Long before Europeans arrived, the Guaraní people were already drinking these leaves.",
  "Today Argentina processes almost 900 million kilos of green leaf a year. It takes about three kilos of leaves to make one kilo of yerba.",
  "Argentines drink about six kilos each per year, and exports just hit a record. Follow for more stories about mate."
];
const voice = process.argv[2] || 'en-US-AndrewNeural';
const out = path.join(__dirname, '..', 'audio'); fs.mkdirSync(out, { recursive: true });
(async () => {
  for (let i = 0; i < lines.length; i++) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(lines[i]);
    const file = path.join(out, `vo_${i + 1}.mp3`);
    await new Promise((res, rej) => { const w = fs.createWriteStream(file); audioStream.pipe(w); audioStream.on('close', res); audioStream.on('end', res); audioStream.on('error', rej); });
    await new Promise(r => setTimeout(r, 300));
    tts.close();
    console.log(file, fs.statSync(file).size);
  }
})().catch(e => { console.error(e); process.exit(1); });
