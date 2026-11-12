const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs=require('fs'),path=require('path');
const lines=require('./lines.json'); const voice=process.argv[2]||'en-US-AndrewNeural';
const out=path.join(__dirname,'..','audio'); fs.mkdirSync(out,{recursive:true});
async function one(text,file){ const tts=new MsEdgeTTS(); await tts.setMetadata(voice,OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const chunks=[]; const {audioStream}=tts.toStream(text);
  await new Promise((res,rej)=>{audioStream.on('data',c=>chunks.push(c));audioStream.on('end',res);audioStream.on('close',res);audioStream.on('error',rej);});
  try{tts.close();}catch{} const b=Buffer.concat(chunks); if(b.length<5000) throw new Error('short'); fs.writeFileSync(file,b); return b.length; }
(async()=>{ for(let i=0;i<lines.length;i++){ const f=path.join(out,`vo_${i+1}.mp3`); for(let a=1;a<=4;a++){ try{ console.log(f, await one(lines[i],f)); break; }catch(e){ console.log('retry',i+1,a,e.message.slice(0,60)); await new Promise(r=>setTimeout(r,1500)); } } } process.exit(0); })();
process.on('uncaughtException',e=>console.log('uncaught',e.message.slice(0,80)));
