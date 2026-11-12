// Mixes voice + ducked music + sfx and muxes with rendered frames into mate-secret-reel-v2.mp4
const { execFileSync } = require('child_process'); const path = require('path');
const root = path.join(__dirname, '..'); const tl = require('../timeline.json');
const ff = require(path.join(__dirname, 'node_modules', 'ffmpeg-static'));
const args = ['-y', '-v', 'error', '-framerate', String(tl.fps), '-i', 'shots/g_%05d.jpg'];
tl.voice.forEach(v => args.push('-i', v.file));
args.push('-i', 'audio/v2/music.wav', '-i', 'audio/v2/sfx.wav');
const nv = tl.voice.length, mi = nv + 1, si = nv + 2;
let fc = tl.voice.map((v, k) => `[${k + 1}]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(v.at * 1000)}:all=1[v${k}]`).join(';');
fc += `;${tl.voice.map((_, k) => `[v${k}]`).join('')}amix=inputs=${nv}:normalize=0,volume=1.0,asplit=2[vo][sc]`;
fc += `;[${mi}]volume=0.22[mus];[mus][sc]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=250[duck]`;
fc += `;[${si}]volume=0.55[fx]`;
fc += `;[vo][duck][fx]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.0:LRA=9,aresample=48000[a]`;
args.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(tl.fps),
  '-c:a', 'aac', '-b:a', '192k', '-t', String(tl.total), '-movflags', '+faststart', 'mate-secret-reel-v2.mp4');
execFileSync(ff, args, { cwd: root, stdio: 'inherit' });
console.log('ok');
