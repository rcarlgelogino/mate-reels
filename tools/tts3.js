// Fast narration with word timings: audio/v2/vo_N.mp3 + audio/v2/words_N.json
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs'), path = require('path');
const lines = require(process.argv[4] || './lines.json'); const names = (process.argv[5] || '1,2,3,4').split(',');
const voice = process.argv[2] || 'en-US-AndrewNeural';
const rate = process.argv[3] || '+14%';
const out = path.join(__dirname, '..', 'audio', 'v2'); fs.mkdirSync(out, { recursive: true });
async function one(text, i) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
  const { audioStream, metadataStream } = tts.toStream(text, { rate });
  const chunks = [], meta = [];
  if (metadataStream) metadataStream.on('data', c => meta.push(c.toString()));
  await new Promise((res, rej) => { audioStream.on('data', c => chunks.push(c)); audioStream.on('end', res); audioStream.on('close', res); audioStream.on('error', rej); });
  await new Promise(r => setTimeout(r, 200));
  try { tts.close(); } catch {}
  const b = Buffer.concat(chunks); if (b.length < 5000) throw new Error('short audio');
  const words = [];
  for (const m of meta) {
    for (const part of m.split(/(?<=\})\s*(?=\{"Metadata")/)) {
      try { for (const x of JSON.parse(part).Metadata) if (x.Type === 'WordBoundary') words.push({ w: x.Data.text.Text, t: x.Data.Offset / 1e7, d: x.Data.Duration / 1e7 }); } catch {}
    }
  }
  if (!words.length) throw new Error('no word timings');
  fs.writeFileSync(path.join(out, `vo_${names[i]}.mp3`), b);
  fs.writeFileSync(path.join(out, `words_${names[i]}.json`), JSON.stringify(words, null, 1));
  return `${b.length} bytes, ${words.length} words`;
}
(async () => {
  for (let i = 0; i < lines.length; i++) {
    for (let a = 1; a <= 5; a++) {
      try { console.log(i + 1, await one(lines[i], i)); break; }
      catch (e) { console.log('retry', i + 1, a, e.message.slice(0, 70)); await new Promise(r => setTimeout(r, 1500)); }
    }
  }
  process.exit(0);
})();
process.on('uncaughtException', e => console.log('uncaught', e.message.slice(0, 80)));
