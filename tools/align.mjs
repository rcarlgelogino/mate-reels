// Word timestamps for a WAV via local Whisper (transformers.js). usage: node tools/align.mjs <audio.f32 (16 kHz mono float32 LE)> [lang]
// prints JSON [{w, t, e}] to stdout
import fs from 'node:fs';
import { pipeline, env } from '@huggingface/transformers';
env.allowLocalModels = false;
const [f32, lang = 'spanish'] = process.argv.slice(2);
const buf = fs.readFileSync(f32); const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const MODEL = process.env.WHISPER_MODEL || 'onnx-community/whisper-small_timestamped';
const asr = await pipeline('automatic-speech-recognition', MODEL, { dtype: 'fp32', device: 'cpu' });
const out = await asr(audio, { language: lang, task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
const words = (out.chunks || []).map(c => ({ w: c.text.trim(), t: c.timestamp[0], e: c.timestamp[1] ?? c.timestamp[0] + 0.2 })).filter(x => x.w);
process.stdout.write(JSON.stringify(words));
