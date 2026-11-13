// Reel engine: parameterized toy-3D scene templates + 2D composer (captions, callouts, labels, FX).
// API: window.__engine.init(timeline) -> {total, cues}; window.__engine.frame(T) draws into the composer canvas;
//      window.__engine.jpeg(T, q) -> dataURL.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const W = 1080, H = 1920;
const P = { green:'#7aa35e', dgreen:'#4f7d48', lgreen:'#9cc070', terra:'#c96a4b', dterra:'#9c4a33', beige:'#ead9bb', dbeige:'#d2b48c', sky:'#9fcbe8',
  wood:'#b37c50', dwood:'#7a5233', earth:'#b0583b', skin1:'#e2b48f', skin2:'#b8805a', skin3:'#8a5a3c', black:'#2a2320', metal:'#bdb8b0', yerba:'#8aa955' };

// ---------------- helpers ----------------
const matCache = new Map();
const matte = c => { if (!matCache.has(c)) matCache.set(c, new THREE.MeshStandardMaterial({ color:c, roughness:0.88, metalness:0 })); return matCache.get(c); };
const metalM = new THREE.MeshStandardMaterial({ color:P.metal, roughness:0.4, metalness:0.65 });
const steelM = new THREE.MeshStandardMaterial({ color:'#cfd3d8', roughness:0.3, metalness:0.75 });
function mesh(geo, mat, cast=true, receive=true){ const m=new THREE.Mesh(geo,mat); m.castShadow=cast; m.receiveShadow=receive; return m; }
function put(parent,obj,x=0,y=0,z=0){ obj.position.set(x,y,z); parent.add(obj); return obj; }
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const easeBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const lerp=(a,b,t)=>a+(b-a)*t;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function sun(s,color,intensity,pos,half=6){ const l=new THREE.DirectionalLight(color,intensity); l.position.copy(pos); l.castShadow=true; l.shadow.mapSize.set(2048,2048);
  const c=l.shadow.camera; c.left=-half;c.right=half;c.top=half;c.bottom=-half;c.near=0.5;c.far=80; l.shadow.bias=-0.0004; l.shadow.normalBias=0.02; s.add(l); s.add(l.target); return l; }
function newScene(bg,near,far){ const s=new THREE.Scene(); s.background=new THREE.Color(bg); s.fog=new THREE.Fog(bg,near,far); return s; }
function newCam(fov){ return new THREE.PerspectiveCamera(fov,W/H,0.1,200); }
function ground(s,color,size=80){ const g=put(s,mesh(new THREE.PlaneGeometry(size,size),matte(color),false,true)); g.rotation.x=-Math.PI/2; return g; }
const lathe=(pts,mat,seg=48)=>mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg),mat);

// ---------------- faces & emotions ----------------
const FACES=['neutral','smile','happy','surprised','sad','angry','proud','love','laugh','sip'];
function makeFace(head,eyes,skin,opt={}){
  const z=opt.z??0.238, sc=opt.scale??1; const dark=matte('#3a1712'), browM=matte(opt.brow||'#2a1d18'), blushM=new THREE.MeshStandardMaterial({color:'#ff8f8f',roughness:1,transparent:true,opacity:0.55});
  const g=new THREE.Group(); head.add(g); g.scale.setScalar(sc);
  const m={};
  m.smile=put(g,mesh(new THREE.TorusGeometry(0.062,0.013,8,20,Math.PI),dark,false),0,-0.075,z); m.smile.rotation.set(-0.35,0,Math.PI);
  m.frown=put(g,mesh(new THREE.TorusGeometry(0.055,0.013,8,20,Math.PI),dark,false),0,-0.13,z-0.006); m.frown.rotation.set(-0.45,0,0);
  m.open=put(g,mesh(new THREE.CircleGeometry(0.072,24,Math.PI,Math.PI),new THREE.MeshStandardMaterial({color:'#5a1e1e',roughness:1,side:THREE.DoubleSide}),false),0,-0.07,z+0.008); m.open.rotation.x=-0.32;
  m.tongue=put(m.open,mesh(new THREE.CircleGeometry(0.035,16,Math.PI,Math.PI),new THREE.MeshStandardMaterial({color:'#e56b6b',roughness:1,side:THREE.DoubleSide}),false),0,-0.03,0.002);
  m.o=put(g,mesh(new THREE.CircleGeometry(0.04,20),new THREE.MeshStandardMaterial({color:'#5a1e1e',roughness:1,side:THREE.DoubleSide}),false),0,-0.105,z+0.004); m.o.rotation.x=opt.oTilt??-0.42; m.o.scale.y=1.35; if(opt.oScale) m.o.scale.set(opt.oScale,opt.oScale,1);
  m.flat=put(g,mesh(new THREE.BoxGeometry(0.085,0.014,0.01),dark,false),0,-0.1,z+0.002); m.flat.rotation.x=-0.4;
  const brows=[-1,1].map(sx=>{ const b=put(g,mesh(new THREE.BoxGeometry(0.085,0.018,0.02),browM,false),sx*0.09,0.125,z-0.012); b.userData.sx=sx; return b; });
  const blush=[-1,1].map(sx=>{ const b=put(g,mesh(new THREE.CircleGeometry(0.045,18),blushM,false),sx*0.15,-0.035,z-0.03); b.rotation.y=sx*0.55; return b; });
  let cur='smile';
  const api={ set(name){ cur=FACES.includes(name)?name:'smile'; Object.values(m).forEach(x=>{ if(x!==m.tongue) x.visible=false; });
      const mouth={neutral:'flat',smile:'smile',happy:'open',laugh:'open',surprised:'o',sad:'frown',angry:'flat',proud:'smile',love:'open',sip:'o'}[cur]; m[mouth].visible=true;
      blush.forEach(b=>b.visible=['happy','proud','love','laugh'].includes(cur));
      brows.forEach(b=>{ const sx=b.userData.sx; b.position.y=0.125; b.rotation.z=0;
        if(cur==='surprised'){ b.position.y=0.165; b.rotation.z=sx*0.12; }
        if(cur==='sad'){ b.rotation.z=sx*0.35; b.position.y=0.13; }
        if(cur==='angry'){ b.rotation.z=-sx*0.4; b.position.y=0.11; }
        if(cur==='happy'||cur==='laugh'||cur==='love'){ b.position.y=0.14; } });
      eyes.forEach(e=>{ e.scale.set(1,cur==='happy'||cur==='laugh'?0.45:1,1); e.scale.multiplyScalar(cur==='surprised'?1.35:1); }); },
    get(){ return cur; } };
  return api;
}
function applyAct(pp,act,t,u){
  const g=pp.g; if(g.userData.y0==null) g.userData.y0=g.position.y; const y0=g.userData.y0; g.position.y=y0; g.rotation.x=0;
  if(!act) return;
  if(act==='jump'){ g.position.y=y0+Math.abs(Math.sin(t*7))*0.22; pp.armR.rotation.x=pp.armL.rotation.x=-2.6+Math.sin(t*14)*0.2; }
  if(act==='cheer'){ pp.armR.rotation.x=-2.9+Math.sin(t*10)*0.25; pp.armL.rotation.x=-2.9+Math.cos(t*10)*0.25; pp.armR.rotation.z=0.4; pp.armL.rotation.z=-0.4; g.position.y=y0+Math.abs(Math.sin(t*5))*0.06; }
  if(act==='no'){ pp.head.rotation.y=Math.sin(t*11)*0.45; }
  if(act==='nod'){ pp.head.rotation.x=0.15+Math.sin(t*9)*0.2; }
  if(act==='shock'){ const k=clamp(u*6); g.rotation.x=-0.18*k; pp.armR.rotation.x=pp.armL.rotation.x=lerp(-0.1,-2.7,k); pp.armR.rotation.z=0.55*k; pp.armL.rotation.z=-0.55*k; }
  if(act==='laugh'){ g.position.y=y0+Math.abs(Math.sin(t*16))*0.03; pp.head.rotation.x=-0.15+Math.sin(t*16)*0.06; }
  if(act==='sigh'){ pp.head.rotation.x=0.35; pp.armR.rotation.x=pp.armL.rotation.x=-0.05; g.position.y=y0-0.03; }
  if(act==='wave'){ pp.armR.rotation.x=-2.7; pp.armR.rotation.z=0.3+Math.sin(t*12)*0.35; }
  if(act==='hug'){ pp.armR.rotation.x=pp.armL.rotation.x=-1.45; pp.armR.rotation.z=-0.5; pp.armL.rotation.z=0.5; }
}
// ---------------- props ----------------
function makePerson(o={}){
  const g=new THREE.Group();
  const skin=matte(o.skin||P.skin1), shirt=matte(o.shirt||P.terra), pants=matte(o.pants||P.dwood), hairM=matte(o.hairColor||P.black);
  const legs=[];
  for(const sx of [-1,1]){ const lp=put(g,new THREE.Group(),sx*0.12,0.42,0); put(lp,mesh(new THREE.CapsuleGeometry(0.1,0.3,4,10),pants),0,-0.17,0); legs.push(lp); }
  put(g,mesh(new THREE.CapsuleGeometry(0.28,0.36,6,18),shirt),0,0.82,0);
  const head=put(g,new THREE.Group(),0,1.38,0);
  head.add(mesh(new THREE.SphereGeometry(0.26,28,20),skin));
  const eyeM=matte('#1d1715');
  const eyes=[-1,1].map(sx=>put(head,mesh(new THREE.SphereGeometry(0.032,10,8),eyeM,false),sx*0.09,0.03,0.236));
  const face=makeFace(head,eyes,o.skin||P.skin1); face.set(o.face||'smile');
  const cap=len=>put(head,mesh(new THREE.SphereGeometry(0.278,28,16,0,Math.PI*2,0,len),hairM),0,0.015,0);
  switch(o.hair){
    case 'bob': cap(1.15); put(head,mesh(new THREE.SphereGeometry(0.282,28,16,Math.PI,Math.PI,0,2.25),hairM),0,0.01,-0.005); break;
    case 'curly': cap(1.05); for(let i=0;i<9;i++){const a=i/9*Math.PI*2; put(head,mesh(new THREE.SphereGeometry(0.095,12,10),hairM),Math.sin(a)*0.21,0.16+Math.cos(i)*0.02,Math.cos(a)*0.21-0.03);} put(head,mesh(new THREE.SphereGeometry(0.12,12,10),hairM),0,0.26,-0.02); break;
    case 'bun': cap(1.2); put(head,mesh(new THREE.SphereGeometry(0.115,14,12),hairM),0,0.2,-0.2); break;
    case 'none': break;
    default: cap(1.0);
  }
  const hatM=matte(o.hatColor||P.beige);
  if(o.hat==='hat'){ put(head,mesh(new THREE.CylinderGeometry(0.43,0.43,0.03,32),hatM),0,0.19,0); put(head,mesh(new THREE.CylinderGeometry(0.2,0.24,0.2,28),hatM),0,0.3,0); }
  if(o.hat==='cap'){ put(head,mesh(new THREE.SphereGeometry(0.285,28,14,0,Math.PI*2,0,1.1),hatM),0,0.03,0); const v=put(head,mesh(new THREE.BoxGeometry(0.3,0.025,0.2),hatM),0,0.14,0.27); v.rotation.x=0.15; }
  if(o.hat==='band'){ const b=put(head,mesh(new THREE.TorusGeometry(0.268,0.032,10,36),hatM),0,0.09,0); b.rotation.x=Math.PI/2; }
  if(o.glasses){ for(const sx of [-1,1]){ const r=put(head,mesh(new THREE.TorusGeometry(0.06,0.012,8,20),matte('#222')),sx*0.09,0.03,0.245); } }
  const arms=[];
  for(const sx of [-1,1]){ const piv=put(g,new THREE.Group(),sx*0.33,1.02,0); put(piv,mesh(new THREE.CapsuleGeometry(0.075,0.3,4,10),shirt),0,-0.2,0);
    const hand=put(piv,mesh(new THREE.SphereGeometry(0.085,12,10),skin),0,-0.42,0); piv.rotation.z=sx*0.1; arms.push({piv,hand}); }
  if(o.scale) g.scale.setScalar(o.scale);
  const api={g,head,face,armL:arms[0].piv,armR:arms[1].piv,handR:arms[1].hand,handL:arms[0].hand,legs,
    sit(seatY){ legs.forEach(l=>l.rotation.x=-Math.PI/2); g.position.y=seatY-0.42*(o.scale||1)+0.05; return api; },
    hold(mate,side='R'){ const piv=side==='R'?api.armR:api.armL; put(piv,mate,0,-0.5,0.02); api.held={mate,piv}; return api; },
    pose(armAngle){ api.armR.rotation.x=armAngle; if(api.held) api.held.mate.rotation.x=-api.held.piv.rotation.x; } };
  return api;
}
const PEOPLE=[
  {skin:P.skin1,shirt:P.terra,hair:'bob'}, {skin:P.skin2,shirt:P.sky,hair:'short',hat:'hat',hatColor:P.beige,scale:1.05},
  {skin:P.skin3,shirt:P.green,hair:'curly',hairColor:'#2b211c'}, {skin:P.skin1,shirt:P.beige,pants:P.dterra,hair:'bun',hairColor:'#6b4a32',scale:0.96},
  {skin:P.skin2,shirt:P.dterra,pants:'#4a3a32',hair:'short',hat:'cap',hatColor:P.dgreen,scale:1.02}, {skin:P.skin3,shirt:'#e0a458',hair:'bob',hairColor:'#3a2a20',glasses:true}
];

// Mate gourd types: calabaza | imperial | madera | acero | cuia | guampa ; returns {g, rimY, rimR, yerba}
function makeMate(type='calabaza', o={}){
  const g=new THREE.Group(); let rimY=0.76, rimR=0.28;
  const ds=c=>new THREE.MeshStandardMaterial({color:c,roughness:0.85,side:THREE.DoubleSide});
  if(type==='calabaza'||type==='imperial'){
    g.add(lathe([[0,0],[0.2,0.01],[0.33,0.08],[0.42,0.2],[0.45,0.34],[0.42,0.48],[0.35,0.6],[0.29,0.69],[0.28,0.76]],ds(type==='imperial'?'#5a3a28':P.terra)));
    if(type==='imperial'){ put(g,mesh(new THREE.CylinderGeometry(0.305,0.31,0.16,48,1,true),metalM),0,0.72,0); rimY=0.8; rimR=0.305;
      const base=put(g,mesh(new THREE.TorusGeometry(0.24,0.03,10,40),metalM),0,0.03,0); base.rotation.x=Math.PI/2; }
  } else if(type==='madera'){
    g.add(lathe([[0,0],[0.3,0],[0.35,0.06],[0.37,0.35],[0.35,0.6],[0.31,0.74]],ds('#c28a52'))); rimY=0.74; rimR=0.31;
    for(const [y,r] of [[0.22,0.372],[0.5,0.365]]){ const b=put(g,mesh(new THREE.TorusGeometry(r,0.015,8,40),matte('#7a4f2e')),0,y,0); b.rotation.x=Math.PI/2; }
  } else if(type==='acero'){
    g.add(lathe([[0,0],[0.31,0],[0.335,0.05],[0.34,0.7],[0.33,0.76]],new THREE.MeshStandardMaterial({color:'#cfd3d8',roughness:0.28,metalness:0.8,side:THREE.DoubleSide}))); rimR=0.33;
  } else if(type==='cuia'){
    g.add(lathe([[0,0],[0.18,0],[0.35,0.12],[0.5,0.35],[0.55,0.6],[0.52,0.85],[0.46,1.0]],ds('#7d6a3c'))); rimY=1.0; rimR=0.46;
  } else if(type==='guampa'){
    g.add(lathe([[0,0],[0.22,0],[0.235,0.4],[0.265,0.9],[0.28,1.05]],ds('#efe2c4'))); rimY=1.05; rimR=0.28;
    for(const [y,r] of [[0.18,0.235],[0.88,0.27]]){ const b=put(g,mesh(new THREE.TorusGeometry(r,0.03,10,40),matte('#6b3f22')),0,y,0); b.rotation.x=Math.PI/2; }
    const base=put(g,mesh(new THREE.TorusGeometry(0.22,0.025,10,40),metalM),0,0.02,0); base.rotation.x=Math.PI/2;
  }
  if(type!=='imperial'){ const rim=put(g,mesh(new THREE.TorusGeometry(rimR,0.03,12,48),type==='madera'?matte('#7a4f2e'):(type==='guampa'?matte('#6b3f22'):metalM)),0,rimY+0.005,0); rim.rotation.x=Math.PI/2; }
  // yerba surface (+ montañita slope)
  const yerba=new THREE.Group(); put(g,yerba,0,rimY-0.012,0);
  const yc=type==='cuia'?'#a9d36a':P.yerba;
  yerba.add(mesh(new THREE.CylinderGeometry(rimR-0.01,rimR-0.01,0.02,40),matte(yc)));
  if(o.mound!==false){ const m=put(yerba,mesh(new THREE.SphereGeometry(rimR*0.9,24,12,0,Math.PI*2,0,Math.PI/2),matte(yc)),-rimR*0.15,0,0); m.scale.y=type==='cuia'?0.55:0.35; }
  if(type==='guampa'||o.ice){ for(let i=0;i<4;i++){ const c=put(yerba,mesh(new THREE.BoxGeometry(0.11,0.11,0.11),new THREE.MeshStandardMaterial({color:'#dff3ff',roughness:0.15,transparent:true,opacity:0.75}),false),Math.cos(i*1.7)*0.12,0.07,Math.sin(i*1.7)*0.12); c.rotation.set(i,i*0.6,0); } }
  // bombilla
  if(o.bombilla!==false){ const b=put(g,new THREE.Group(),0.06,rimY*0.5,0.02); b.rotation.z=-0.2; b.rotation.x=0.08; const L=rimY*0.65+0.42;
    put(b,mesh(new THREE.CylinderGeometry(0.022,0.022,L,12),type==='acero'?steelM:metalM),0,L/2,0);
    const mp=put(b,mesh(new THREE.CylinderGeometry(0.03,0.026,0.06,12),metalM),0,L+0.02,0); mp.scale.x=1.5; g.userData.bombilla=b; }
  g.userData.yerba=yerba;
  let face=null; if(o.face){ const fh=put(g,new THREE.Group(),0,rimY*0.42,0); const fz=(type==='cuia'?0.5:type==='guampa'?0.25:type==='madera'||type==='acero'?0.36:0.445);
    const white=matte('#ffffff'), pupil=matte('#1d1715'); const eyes=[-1,1].map(sx=>{ const e=put(fh,mesh(new THREE.SphereGeometry(0.075,16,12),white,false),sx*0.13,0.08,fz-0.03); put(e,mesh(new THREE.SphereGeometry(0.042,12,10),pupil,false),0,0,0.05); return e; });
    face=makeFace(fh,eyes,null,{z:fz+0.01,scale:1.5,brow:'#3a2418'}); face.set(o.face); }
  g.userData.face=face;
  return {g,rimY,rimR,yerba,face};
}
function makeTermo(color='#2f3a3f'){
  const g=new THREE.Group(); const body=new THREE.MeshStandardMaterial({color,roughness:0.5,metalness:0.3});
  put(g,mesh(new THREE.CylinderGeometry(0.2,0.2,1.15,32),body),0,0.575,0);
  put(g,mesh(new THREE.CylinderGeometry(0.16,0.2,0.08,32),steelM),0,1.19,0);
  put(g,mesh(new THREE.CylinderGeometry(0.06,0.09,0.12,20),steelM),0,1.29,0);
  const cap=put(g,mesh(new THREE.CylinderGeometry(0.19,0.19,0.2,32),body),0,1.45,0); cap.visible=false; g.userData.cap=cap;
  put(g,mesh(new THREE.CylinderGeometry(0.205,0.205,0.06,32),steelM),0,0.03,0);
  return g;
}
function makeYerbaPack(color=P.dgreen){
  const g=new THREE.Group(); put(g,mesh(new THREE.BoxGeometry(0.5,0.75,0.3),matte(P.beige)),0,0.375,0);
  put(g,mesh(new THREE.BoxGeometry(0.515,0.22,0.315),matte(color)),0,0.4,0); put(g,mesh(new THREE.BoxGeometry(0.5,0.06,0.18),matte(P.dbeige)),0,0.78,0); return g;
}
function makeTree(r,x,z,s){ const g=new THREE.Group(); const h=(1.4+r()*1.8)*s; put(g,mesh(new THREE.CylinderGeometry(0.1*s,0.17*s,h,10),matte(P.dwood)),0,h/2,0);
  const cols=['#5f8f4a','#78a75a','#4f7d48','#8db866']; const n=1+Math.floor(r()*3);
  for(let i=0;i<n;i++){ const rad=(0.7+r()*0.6)*s; put(g,mesh(new THREE.SphereGeometry(rad,20,16),matte(cols[Math.floor(r()*cols.length)])),(r()-0.5)*0.8*s,h+rad*0.5+i*0.25*s,(r()-0.5)*0.6*s); }
  g.position.set(x,0,z); return g; }
function makeTruck(ghostMat){ const g=new THREE.Group(); const m=c=>ghostMat||matte(c); const sh=!ghostMat;
  put(g,mesh(new THREE.BoxGeometry(0.7,0.14,1.5),m('#4a3a32'),sh,sh),0,0.24,0); put(g,mesh(new THREE.BoxGeometry(0.76,0.6,0.5),m(P.terra),sh,sh),0,0.6,-0.5);
  put(g,mesh(new THREE.BoxGeometry(0.62,0.26,0.02),m(P.sky),false,false),0,0.72,-0.755); put(g,mesh(new THREE.BoxGeometry(0.8,0.68,0.95),m(P.beige),sh,sh),0,0.65,0.27);
  const wg=new THREE.CylinderGeometry(0.17,0.17,0.12,20); for(const x of [-0.38,0.38]) for(const z of [-0.48,0.45]){ const w=put(g,mesh(wg,m('#2c2622'),sh,sh),x,0.17,z); w.rotation.z=Math.PI/2; } return g; }
function steamSet(parent,n=8,base=V(0,0.8,0),spread=0.07){ const arr=[]; for(let i=0;i<n;i++){ const m=new THREE.MeshStandardMaterial({color:'#fff',roughness:1,transparent:true,opacity:0,depthWrite:false}); const s=mesh(new THREE.SphereGeometry(1,14,10),m,false,false); parent.add(s); arr.push(s); }
  return t=>arr.forEach((s,i)=>{ const p=(t*0.42+i/n)%1; s.position.set(base.x+Math.sin(p*7+i)*spread,base.y+p*0.95,base.z+Math.cos(p*5+i)*spread*0.6); s.scale.setScalar(0.04+p*0.13); s.material.opacity=Math.sin(p*Math.PI)*0.38; }); }
function interior(s,o={}){ // warm room: table + wall + window
  s.add(new THREE.HemisphereLight('#fff3dd','#8a6a50',0.9)); sun(s,o.sun||'#ffd9a8',2.6,V(-3,5,3),3.5);
  const fill=new THREE.DirectionalLight('#cfe6ff',0.45); fill.position.set(3,2,4); s.add(fill);
  put(s,mesh(new THREE.BoxGeometry(8,0.3,6),matte(o.table||P.wood),false,true),0,-0.15,-0.6);
  put(s,mesh(new THREE.PlaneGeometry(16,10),matte(o.wall||'#e3cba4'),false,true),0,2,-3.4);
  const win=put(s,mesh(new THREE.PlaneGeometry(1.5,1.9),new THREE.MeshStandardMaterial({color:'#d5ecf8',emissive:'#bfe0f5',emissiveIntensity:0.9,roughness:1}),false,false),-1.15,1.9,-3.38);
  for(const [w,h,x,y] of [[1.6,0.07,0,0.97],[1.6,0.07,0,-0.97],[0.07,1.95,0.78,0],[0.07,1.95,-0.78,0],[0.05,1.9,0,0],[1.5,0.05,0,0]]) put(win,mesh(new THREE.BoxGeometry(w,h,0.04),matte(P.beige),false,false),x,y,0.02);
  put(s,mesh(new THREE.CylinderGeometry(0.26,0.2,0.42,24),matte(P.terra)),-1.7,0.21,-1.9);
  for(const [x,y,z,r] of [[-1.7,0.62,-1.9,0.3],[-1.9,0.85,-1.95,0.24],[-1.5,0.8,-1.8,0.22]]) put(s,mesh(new THREE.SphereGeometry(r,18,14),matte(P.green)),x,y,z);
}
function camPath(cam,u,a,b,look){ const k=ease(u); cam.position.lerpVectors(a,b,k); cam.lookAt(look); }

// ---------------- templates ----------------
// Each returns {scene,camera,aperture,maxblur,update(u,t)->focusDist, labels?(), cues:[{u,type}]}
const T={};

// gourd: hero shot of one mate. p: mate, rec, steam, termo, pack, bg('kitchen'|'studio'|'outdoor'), move('pushin'|'orbit'|'pullout'), color
T.gourd=(p={})=>{
  const bg=p.bg||'kitchen'; const s=newScene(bg==='studio'?(p.color||'#e9d8bb'):bg==='outdoor'?'#cfe2c0':'#e6d3b4',6,18), cam=newCam(40); s.add(cam);
  if(bg==='kitchen') interior(s); else { s.add(new THREE.HemisphereLight('#fff3dd','#6a5a40',1.0)); sun(s,'#ffe0b0',2.4,V(-3,5,3),3.5); ground(s,bg==='outdoor'?P.green:(p.floor||'#d9c3a0'));
    if(bg==='outdoor'){ const r=rng(5); for(let i=0;i<14;i++) s.add(makeTree(r,(r()-0.5)*16,-4-r()*8,0.8)); } }
  const M=makeMate(p.mate||'calabaza',{face:p.face}); s.add(M.g); const scale=M.rimY>0.9?0.8:1; M.g.scale.setScalar(scale);
  let termo=null; if(p.termo){ termo=put(s,makeTermo(p.termoColor),1.15,0,-1.0); }
  if(p.pack) put(s,makeYerbaPack(),-1.1,0,-0.9).rotation.y=0.4;
  const steam=p.steam!==false&&p.mate!=='guampa'?steamSet(s,8,V(0.02,M.rimY*scale+0.04,0)):null;
  const center=V(0,0.55*scale+0.05,0);
  // REC frame
  const frame=new THREE.Group(); cam.add(frame); const fM=new THREE.MeshBasicMaterial({color:'#3f8cff',transparent:true,opacity:0,depthTest:false,toneMapped:false});
  const w=0.56,h=0.74,L=0.2,th=0.022;
  for(const sx of [-1,1]) for(const sy of [-1,1]){ put(frame,new THREE.Mesh(new THREE.PlaneGeometry(L,th),fM),sx*(w-L/2),sy*h,0); put(frame,new THREE.Mesh(new THREE.PlaneGeometry(th,L),fM),sx*w,sy*(h-L/2),0); }
  const recM=new THREE.MeshBasicMaterial({color:'#ff3b30',transparent:true,opacity:0,depthTest:false,toneMapped:false}); put(frame,new THREE.Mesh(new THREE.CircleGeometry(0.045,28),recM),-w+0.12,h-0.12,0);
  frame.traverse(o=>o.renderOrder=999); const tmp=new THREE.Vector3(); frame.visible=!!p.rec;
  const move=p.move||'pushin';
  return { scene:s, camera:cam, aperture:0.0032, maxblur:0.009, mates:[M], cues:p.rec?[{u:0.3,type:'beep'},{u:0.3,type:'shutter'}]:[],
    update(u,t){
      if(move==='orbit'){ const a=-0.5+u*1.0; cam.position.set(Math.sin(a)*3.6,1.3,Math.cos(a)*3.6); cam.lookAt(center); }
      else if(move==='pullout') camPath(cam,u,V(0.1,0.95,2.6),V(0.6,1.5,4.9),center);
      else camPath(cam,u,V(0.5,1.4,4.7),V(0.15,1.02,3.25),center);
      cam.updateMatrixWorld(); if(steam) steam(t);
      M.g.rotation.y=p.spin?t*0.6:0;
      if(p.rec){ tmp.copy(center); cam.worldToLocal(tmp); frame.position.copy(tmp); const a=clamp((u-0.28)/0.1); frame.scale.setScalar(1+0.35*(1-easeOut(a))); fM.opacity=a*0.95; recM.opacity=(a>0&&Math.floor(t*2.2)%2===0)?1:0; }
      return cam.position.distanceTo(center); } };
};

// prep: preparation steps. p: step('yerba'|'shake'|'tilt'|'water'|'cold'|'bombilla'|'stir'|'sugar'), mate
T.prep=(p={})=>{
  const s=newScene('#e6d3b4',6,18), cam=newCam(40); s.add(cam); interior(s);
  const step=p.step||'water'; const M=makeMate(p.mate||'calabaza',{bombilla:step!=='yerba'&&step!=='shake'&&step!=='tilt'&&step!=='bombilla'}); s.add(M.g);
  const termo=put(s,makeTermo(p.termoColor),0.95,0,-0.5); const pack=put(s,makeYerbaPack(),-1.0,0,-0.7); pack.rotation.y=0.35;
  const cues=[]; const center=V(0,0.5,0);
  // particles (yerba) / water stream
  const parts=[]; const pm=matte(P.yerba); for(let i=0;i<40;i++){ const b=mesh(new THREE.BoxGeometry(0.03,0.03,0.03),pm,false,false); b.visible=false; s.add(b); parts.push(b); }
  const waterM=new THREE.MeshStandardMaterial({color:step==='cold'?'#bfe6ff':'#e8f4ff',roughness:0.1,transparent:true,opacity:0.75});
  const stream=mesh(new THREE.CylinderGeometry(0.025,0.03,1,10),waterM,false,false); stream.visible=false; s.add(stream);
  const steam=step==='water'?steamSet(s,8,V(-0.05,0.82,0.05)):null;
  const wet=put(M.yerba,mesh(new THREE.CircleGeometry(0.1,24),matte('#4f6b33'),false,false),0.1,0.025,0); wet.rotation.x=-Math.PI/2; wet.visible=false;
  const hand=put(s,mesh(new THREE.SphereGeometry(0.2,18,14),matte(P.skin1)),0,2,0); hand.scale.set(1.2,0.5,1.2); hand.visible=false;
  const spoon=put(s,mesh(new THREE.CylinderGeometry(0.02,0.02,0.6,8),metalM),0,2,0); spoon.visible=false;
  const sugar=put(s,mesh(new THREE.CylinderGeometry(0.18,0.16,0.22,24),matte('#f4efe6')),-0.75,0.11,0.35);
  if(step==='yerba'){ M.yerba.scale.y=1; cues.push({u:0.1,type:'rustle'}); }
  if(step==='water'||step==='cold'){ cues.push({u:0.2,type:'pour'}); if(step==='water') cues.push({u:0.25,type:'hiss'}); }
  if(step==='shake'||step==='tilt') cues.push({u:0.2,type:'shake'});
  if(step==='bombilla') cues.push({u:0.6,type:'clink'});
  if(step==='stir') cues.push({u:0.3,type:'clink'},{u:0.55,type:'clink'});
  if(step==='sugar') cues.push({u:0.35,type:'rustle'});
  return { scene:s, camera:cam, aperture:0.003, maxblur:0.009, cues,
    update(u,t){
      camPath(cam,u,V(0.7,1.55,4.4),V(0.35,1.25,3.3),center);
      parts.forEach(b=>b.visible=false); stream.visible=false; hand.visible=false; spoon.visible=false; M.g.rotation.set(0,0,0); M.g.position.set(0,0,0);
      termo.position.set(0.95,0,-0.5); termo.rotation.set(0,0,0); pack.position.set(-1.0,0,-0.7); pack.rotation.set(0,0.35,0);
      if(step==='yerba'||step==='sugar'){ const src=step==='yerba'?pack:sugar; const k=ease(clamp(u/0.25));
        if(step==='yerba'){ pack.position.set(lerp(-1.0,-0.35,k),lerp(0,1.25,k),lerp(-0.7,0,k)); pack.rotation.set(0,0,lerp(0,-2.0,k)); }
        M.yerba.scale.y=1; M.yerba.position.y=lerp(M.rimY*0.45,M.rimY-0.012,clamp((u-0.2)/0.7));
        if(u>0.22&&u<0.92) parts.forEach((b,i)=>{ const q=(t*2.2+i/parts.length)%1; b.visible=true; b.position.set(step==='yerba'?-0.12+Math.sin(i)*0.04:-0.3+q*0.3, lerp(1.0,M.rimY,q), Math.cos(i*3)*0.04); b.rotation.set(i,t*3,i); b.material=step==='yerba'?pm:matte('#ffffff'); }); }
      if(step==='shake'||step==='tilt'){ hand.visible=u<0.75; hand.position.set(0,M.rimY+0.08,0); const sh=u<0.6?Math.sin(t*28)*0.08*(1-u/0.6):0; M.g.rotation.z=sh; M.g.position.x=sh*0.5; hand.position.x=sh*0.5;
        if(step==='tilt'||u>0.6){ const k=ease(clamp((u-0.6)/0.25)); M.g.rotation.z=lerp(0,0.6,k)*(k<1?Math.sin(k*Math.PI*0.5):1); if(u>0.85){ M.g.rotation.z=0.6*(1-ease(clamp((u-0.85)/0.15))); M.yerba.rotation.z=0.35*ease(clamp((u-0.85)/0.15)); } } }
      if(step==='water'||step==='cold'){ const k=ease(clamp(u/0.2)); termo.position.set(lerp(0.95,0.48,k),lerp(0,1.0,k),lerp(-0.5,0,k)); termo.rotation.z=lerp(0,1.9,k);
        if(u>0.18&&u<0.85){ stream.visible=true; const top=V(0.32,1.12,0), bot=V(0.12,M.rimY,0); stream.position.lerpVectors(top,bot,0.5); stream.scale.y=top.distanceTo(bot); stream.rotation.z=Math.atan2(top.x-bot.x,top.y-bot.y)*-1; }
        wet.visible=u>0.3; wet.scale.setScalar(0.5+clamp((u-0.3)*2)); if(steam) steam(t); }
      if(step==='bombilla'){ const b=M.g.userData.bombilla; }
      if(step==='stir'){ const bb=M.g.userData.bombilla; if(bb){ bb.rotation.z=-0.2+Math.sin(t*9)*0.25; bb.rotation.x=0.08+Math.cos(t*9)*0.25; } }
      return cam.position.distanceTo(center); } };
};
// bombilla insertion as its own step (needs bombilla object)
const _prep=T.prep; T.prep=(p={})=>{ const tpl=_prep(p); if(p.step!=='bombilla') return tpl;
  const b=new THREE.Group(); const L=0.92; put(b,mesh(new THREE.CylinderGeometry(0.022,0.022,L,12),metalM),0,L/2,0); const mp=put(b,mesh(new THREE.CylinderGeometry(0.03,0.026,0.06,12),metalM),0,L+0.02,0); mp.scale.x=1.5;
  const pal=put(b,mesh(new THREE.CylinderGeometry(0.07,0.07,0.02,20),metalM),0,0.02,0); pal.scale.set(1,1,0.6); tpl.scene.add(b);
  const up=tpl.update; tpl.update=(u,t)=>{ const d=up(u,t); const k=easeOut(clamp((u-0.2)/0.45)); b.position.set(0.08,lerp(1.6,0.34,k),0.02); b.rotation.z=-0.2; return d; }; return tpl; };

// ronda: people around a table/blanket passing one mate. p: people(3-6), time('evening'|'day'), setting('table'|'park'), mate, stop:index of person who says no
T.ronda=(p={})=>{
  const day=p.time==='day'||p.setting==='park'; const bg=day?'#cfe3ea':'#5b3e3e'; const s=newScene(bg,11,30), cam=newCam(45);
  s.add(new THREE.HemisphereLight(day?'#fff6e6':'#ffd2a0',day?'#6a8a50':'#3a2630',day?0.9:0.55)); sun(s,day?'#ffe8c0':'#ffa860',day?2.4:1.9,day?V(-4,8,3):V(5,4,2.5),6);
  const park=p.setting==='park';
  ground(s,park?P.green:'#c9a07c');
  const dashM=new THREE.MeshStandardMaterial({color:'#9fd3f2',emissive:'#7cc0ea',emissiveIntensity:0.6,roughness:1});
  const R0=2.7,N=40; if(p.ring!==false) for(let i=0;i<N;i++){ const a=(i+0.5)/N*Math.PI*2; const d=put(s,mesh(new THREE.BoxGeometry(0.06,0.012,2*Math.PI*R0/N*0.55),dashM,false,true),Math.sin(a)*R0,0.008,Math.cos(a)*R0); d.rotation.y=a+Math.PI/2; }
  let topY=0.78;
  if(park){ topY=0.05; const bl=put(s,mesh(new THREE.CylinderGeometry(1.25,1.25,0.03,40),matte(P.terra),false,true),0,0.015,0); const r=rng(9); for(let i=0;i<16;i++) s.add(makeTree(r,(r()-0.5)*22,-6-r()*10,0.9)); }
  else { put(s,mesh(new THREE.CylinderGeometry(1.15,1.15,0.08,48),matte(P.wood)),0,0.78,0); put(s,mesh(new THREE.CylinderGeometry(0.1,0.12,0.74,16),matte(P.dwood)),0,0.37,0);
    if(!day){ put(s,mesh(new THREE.ConeGeometry(0.45,0.32,32,1,true),new THREE.MeshStandardMaterial({color:P.terra,roughness:0.9,side:THREE.DoubleSide}),false,false),0,2.75,0);
      put(s,mesh(new THREE.SphereGeometry(0.1,16,12),new THREE.MeshStandardMaterial({color:'#fff3d6',emissive:'#ffd58a',emissiveIntensity:2.5}),false,false),0,2.6,0);
      put(s,mesh(new THREE.CylinderGeometry(0.01,0.01,3,6),matte(P.black),false,false),0,4.4,0); const lamp=new THREE.PointLight('#ffc27a',9,7,1.6); lamp.position.set(0,2.45,0); s.add(lamp); } }
  put(s,makeTermo(p.termoColor),0.35,topY,-0.3).scale.setScalar(0.5);
  const n=clamp(p.people||5,2,6), Rp=park?1.6:1.95, ang=i=>i/n*Math.PI*2+0.3;
  const people=[...Array(n)].map((_,i)=>{ const pp=makePerson(PEOPLE[i%PEOPLE.length]); pp.g.position.set(Math.sin(ang(i))*Rp,0,Math.cos(ang(i))*Rp); pp.g.lookAt(0,0,0); if(park) pp.sit(0.05); s.add(pp.g); return pp; });
  const M=makeMate(p.mate||'calabaza'); M.g.scale.setScalar(0.5); s.add(M.g);
  const cycle=p.cycle||1.55, hold=0.7, Rm=park?1.05:1.42, baseY=park?0.75:0.9; const look=V(0,park?0.4:0.45,0);
  const cues=[]; return { scene:s, camera:cam, aperture:0.0017, maxblur:0.008, cues, ronda:{cycle,hold}, people, mates:[M],
    update(u,t){
      const th=(p.angle||0.55)+t*0.075; const k=ease(u); const rr=p.close?lerp(4.6,4.1,k):lerp(6.4,5.8,k);
      cam.position.set(Math.sin(th)*rr,p.close?lerp(4.2,3.8,k):lerp(6.2,5.6,k),Math.cos(th)*rr); cam.lookAt(look);
      const c=Math.floor(t/cycle), loc=t-c*cycle, i=c%n, j=(i+1)%n; const travel=loc>hold, w2=travel?ease((loc-hold)/(cycle-hold)):0;
      const a=lerp(ang(i),ang(i)+Math.PI*2/n,w2), r2=Rm-Math.sin(w2*Math.PI)*0.25;
      M.g.position.set(Math.sin(a)*r2,baseY+Math.sin(w2*Math.PI)*0.28,Math.cos(a)*r2); M.g.rotation.y=a;
      people.forEach((pp,idx)=>{ let w=idx===i?(travel?1-w2:1):idx===j?w2:0; if(p.stop===idx&&idx===j) w*=0.2;
        pp.armR.rotation.x=-0.12-1.3*w; pp.armL.rotation.x=-0.12-1.2*w; pp.armR.rotation.z=0.1-0.25*w; pp.armL.rotation.z=-0.1+0.25*w;
        pp.head.rotation.x=0.12*w+Math.sin(t*1.4+idx)*0.04; pp.head.rotation.y=(p.stop===idx?Math.sin(t*8)*0.35:Math.sin(t*0.9+idx*1.7)*0.12); });
      return cam.position.distanceTo(look); } };
};

// jungle: Guarani figures pick and toast leaves. p: cam('wide'|'fire')
T.jungle=(p={})=>{
  const bg='#b5cc90'; const s=newScene(bg,9,28), cam=newCam(42);
  s.add(new THREE.HemisphereLight('#f4f0c8','#3f5a30',0.75)); sun(s,'#ffd48a',2.9,V(-6,9,4),8); ground(s,'#6f9a52',60);
  const r=rng(7); for(let i=0;i<70;i++){ const x=r()*26-13,z=r()*20-18; if(Math.abs(x)<3.3&&z>-3.2) continue; s.add(makeTree(r,x,z,0.9+r()*0.5)); }
  for(const [x,z,rad] of [[-2.9,3.0,0.75],[3.1,2.4,0.85],[-3.4,1.2,0.6],[2.6,-2.6,0.7],[-2.2,-2.8,0.8]]) put(s,mesh(new THREE.SphereGeometry(rad,20,16),matte(P.dgreen)),x,rad*0.6,z);
  const yt=put(s,new THREE.Group(),1.0,0,-0.95); put(yt,mesh(new THREE.CylinderGeometry(0.11,0.16,1.4,12),matte(P.dwood)),0,0.7,0);
  for(const [x,y,z,rad,c] of [[0,1.78,0,0.62,'#5e8f4a'],[-0.42,1.52,0.22,0.43,'#6c9c50'],[0.42,1.56,0.14,0.45,'#5a8746']]) put(yt,mesh(new THREE.SphereGeometry(rad,22,16),matte(c)),x,y,z);
  const leafG=new THREE.SphereGeometry(0.07,10,8), leafM=matte('#9cc86a'); const lr=rng(3);
  for(let i=0;i<26;i++){ const th=lr()*Math.PI*2,ph=lr()*1.2+0.3; const lf=put(yt,mesh(leafG,leafM,false),Math.sin(ph)*Math.cos(th)*0.63,1.78+Math.cos(ph)*0.63,Math.sin(ph)*Math.sin(th)*0.63); lf.scale.set(1,0.35,0.6); lf.rotation.set(lr()*3,lr()*3,0); }
  const A=makePerson({skin:P.skin3,shirt:'#efe2c6',pants:P.dbeige,hair:'bob',hat:'band',hatColor:P.terra}); A.g.position.set(1.6,0,0.3); A.g.lookAt(0.85,0,-0.6); s.add(A.g);
  put(s,mesh(new THREE.CylinderGeometry(0.21,0.16,0.24,20),matte('#c9a46a')),1.15,0.12,0.95);
  const B=makePerson({skin:P.skin3,shirt:P.beige,pants:P.dbeige,hair:'short',hat:'band',hatColor:P.dterra,scale:1.04}); B.g.position.set(-0.55,0,0.6); B.g.lookAt(0.37,0,1.52); s.add(B.g);
  const stick=put(B.armR,new THREE.Group(),0,-0.42,0); stick.rotation.x=1.35; const st=put(stick,mesh(new THREE.CylinderGeometry(0.018,0.018,0.95,8),matte(P.dwood)),0,0,0.47); st.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){ const lf=put(stick,mesh(leafG,matte(i%2?'#86b35c':'#6f9f4c')),Math.sin(i*1.7)*0.08,Math.cos(i*2.3)*0.05,0.9+i*0.025); lf.scale.set(1.3,0.4,0.9); lf.rotation.set(i,i*0.7,0); }
  const fire=put(s,new THREE.Group(),0.37,0,1.52);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; put(fire,mesh(new THREE.SphereGeometry(0.09,12,10),matte('#a59a8a')),Math.cos(a)*0.32,0.05,Math.sin(a)*0.32); }
  for(let i=0;i<3;i++){ const lg=put(fire,mesh(new THREE.CylinderGeometry(0.045,0.05,0.5,10),matte(P.dwood)),0,0.07,0); lg.rotation.order='YXZ'; lg.rotation.set(Math.PI/2,i*Math.PI/3,0); }
  const flames=[]; for(const [rad,hgt,c,e] of [[0.17,0.42,'#ff9a3d','#ff7a1a'],[0.11,0.3,'#ffd36b','#ffc23a'],[0.08,0.26,'#ffb347','#ff8a2a']]){ const f=put(fire,mesh(new THREE.ConeGeometry(rad,hgt,16),new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:1.8,roughness:1}),false,false),0,0.12+hgt/2,0); f.userData.h=hgt; flames.push(f); }
  flames[2].position.x=0.08; const fl=new THREE.PointLight('#ff9a4a',5,4.5,2); fl.position.set(0.37,0.55,1.52); s.add(fl);
  const shaftM=new THREE.MeshBasicMaterial({color:'#fff1b8',transparent:true,opacity:0.07,blending:THREE.AdditiveBlending,depthWrite:false});
  for(const [x,z,rad] of [[-3.5,-3.5,0.5],[-1.2,-4.5,0.35],[0.8,-2.8,0.6],[3.2,-4,0.45],[-0.3,-1.6,0.3]]){ const sh=put(s,mesh(new THREE.CylinderGeometry(rad,rad*1.4,12,16,1,true),shaftM,false,false),x,4.5,z); sh.rotation.z=-0.5; }
  const fly=mesh(leafG,leafM,false); fly.scale.set(1.3,0.4,0.8); s.add(fly); const crownPt=V(1.25,1.8,-0.55), basket=V(1.15,0.22,0.95), hp=new THREE.Vector3();
  const closeFire=p.cam==='fire'; const focusPt=closeFire?V(0.37,0.6,1.4):V(0.55,0.9,0.7);
  return { scene:s, camera:cam, aperture:0.0022, maxblur:0.009, cues:[], ambient:['crackle','birds'], people:[A,B],
    update(u,t){
      if(closeFire) camPath(cam,u,V(1.4,1.3,3.9),V(1.0,1.1,3.2),V(0.37,0.7,1.3)); else camPath(cam,u,V(-0.4,2.3,8.6),V(0.75,2.0,7.0),V(0.55,1.55,0.3));
      const q=(t%1.8)/1.8, up=-2.55, down=-0.55; A.armR.rotation.x=q<0.3?lerp(-1.0,up,ease(q/0.3)):q<0.45?up:q<0.8?lerp(up,down,ease((q-0.45)/0.35)):lerp(down,-1.0,ease((q-0.8)/0.2));
      A.head.rotation.x=-0.25+Math.sin(t)*0.04; s.updateMatrixWorld(); A.handR.getWorldPosition(hp);
      if(q<0.35){ fly.position.copy(crownPt); fly.visible=true; } else if(q<0.8){ fly.position.copy(hp); fly.visible=true; } else { const k=clamp((q-0.8)/0.12); fly.position.lerpVectors(hp,basket,k); fly.visible=k<1; }
      B.armR.rotation.x=-0.95+Math.sin(t*2.1)*0.12; B.armR.rotation.z=0.1+Math.sin(t*1.05)*0.12; B.armL.rotation.x=-0.45; B.head.rotation.x=0.22;
      flames.forEach((f,i)=>{ const k=1+Math.sin(t*13+i*2)*0.12+Math.sin(t*7.3+i)*0.08; f.scale.set(1/Math.sqrt(k),k,1/Math.sqrt(k)); f.position.y=0.12+f.userData.h*k/2; });
      fl.intensity=4.5+Math.sin(t*17)*0.6; return cam.position.distanceTo(focusPt); } };
};

// plantation: p.mode 'trucks'|'piles'|'aerial'|'harvest'
T.plantation=(p={})=>{
  const mode=p.mode||'aerial'; const bg='#cfe2ec'; const s=newScene(bg,16,48), cam=newCam(38);
  s.add(new THREE.HemisphereLight('#fff1dc','#7a3d28',0.85)); sun(s,'#ffe0b0',2.5,V(-8,16,8),16); ground(s,P.earth,90);
  put(s,mesh(new THREE.PlaneGeometry(2.6,90),matte('#c98a5e'),false,true),0,0.005,0).rotation.x=-Math.PI/2;
  const r=rng(11); const xs=[]; for(let i=1;i<=8;i++) xs.push(0.85+1.15*i,-(0.85+1.15*i)); const zs=[]; for(let z=-42;z<=14;z+=0.8) zs.push(z);
  const bush=new THREE.InstancedMesh(new THREE.SphereGeometry(0.48,16,12),new THREE.MeshStandardMaterial({roughness:0.9}),xs.length*zs.length); bush.castShadow=bush.receiveShadow=true;
  const Mx=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),pos=new THREE.Vector3(),col=new THREE.Color(); let n=0;
  for(const x of xs) for(const z of zs){ const f=0.85+r()*0.25; pos.set(x+(r()-0.5)*0.1,0.3*f,z+(r()-0.5)*0.15); sc.set(f,0.78*f,f); Mx.compose(pos,q,sc); bush.setMatrixAt(n,Mx); bush.setColorAt(n,col.set(r()<0.5?P.green:P.dgreen).offsetHSL(0,0,(r()-0.5)*0.05)); n++; }
  s.add(bush);
  const piles=[], pileX=[-0.78,0,0.78];
  for(const x of pileX){ const g=put(s,new THREE.Group(),x,0,3.6); put(g,mesh(new THREE.SphereGeometry(0.36,20,12,0,Math.PI*2,0,Math.PI/2),matte('#6e9f4b'))); for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; put(g,mesh(new THREE.SphereGeometry(0.13,12,10),matte(i%2?P.lgreen:'#5f9145')),Math.cos(a)*0.2,0.2+(i%2)*0.06,Math.sin(a)*0.2); } piles.push(g); g.visible=mode==='piles'; }
  const bag=put(s,makeYerbaPack(),0,0,3.6); bag.scale.setScalar(0.0001); bag.visible=mode==='piles';
  const truckZ=[1.3,-0.5,-2.3]; const trucks=truckZ.map(z=>{ const tr=put(s,makeTruck(),0,0,z); tr.visible=mode!=='harvest'; return tr; });
  const ghosts=[]; const lanes=[-2.3,2.3,-3.45,3.45,-4.6,4.6,-5.75,5.75];
  if(mode==='trucks') for(let k=0;k<24;k++){ const m=new THREE.MeshStandardMaterial({color:'#a8d8f5',emissive:'#6fb6e8',emissiveIntensity:0.45,roughness:0.6,transparent:true,opacity:0,depthWrite:false}); const g=makeTruck(m); g.visible=false; s.add(g); ghosts.push({g,m,src:k%3,lane:lanes[Math.floor(k/3)],dz:(r()-0.5)*0.8,u0:0.18+Math.floor(k/3)*0.075+(k%3)*0.015}); }
  const workers=[]; if(mode==='harvest'){ for(let i=0;i<4;i++){ const w=makePerson({...PEOPLE[i%PEOPLE.length],hat:'hat',hatColor:P.beige}); w.g.position.set(i%2?2.6:-2.6,0,2-i*1.6); w.g.rotation.y=i%2?-Math.PI/2:Math.PI/2; s.add(w.g);
    const sack=put(w.g,mesh(new THREE.SphereGeometry(0.32,16,12),matte('#e9dcc0')),0,0.9,-0.32); sack.scale.set(1,1.2,0.8); workers.push(w); } }
  const look=new THREE.Vector3(); const cues=[];
  if(mode==='trucks'){ ghosts.forEach((g,i)=>cues.push({u:g.u0,type:'blip',n:i})); cues.push({u:0,type:'rumble',d:1}); }
  if(mode==='piles') cues.push({u:0.2,type:'suck'},{u:0.6,type:'bag',impact:true});
  if(mode==='harvest') cues.push({u:0,type:'birds'});
  return { scene:s, camera:cam, aperture:0.0011, maxblur:0.007, cues, people:workers,
    update(u,t){
      if(mode==='trucks'){ const d=Math.max(0,u*7-0.3)*1.9; const lz=lerp(2.0,-0.5-d*0.85,ease(u)); look.set(0,0,lz); cam.position.set(lerp(2.4,4.2,ease(u)),lerp(6.6,11.5,ease(u)),lz+lerp(5.0,8.0,ease(u))); cam.lookAt(look);
        trucks.forEach((tr,i)=>{ tr.position.z=truckZ[i]-d; tr.position.y=d>0?Math.abs(Math.sin(t*14+i))*0.012:0; });
        ghosts.forEach(gh=>{ const a=clamp((u-gh.u0)/0.1); gh.g.visible=a>0; if(!a) return; const e=easeOut(a); const sz=trucks[gh.src].position.z; gh.g.position.set(lerp(0,gh.lane,e),lerp(0,0.55,e),sz+lerp(0,gh.dz+1.2+Math.abs(gh.lane)*0.35,e)); gh.m.opacity=0.5*e; gh.g.scale.setScalar(lerp(0.6,1,e)); }); }
      else if(mode==='piles'){ look.set(0,0,lerp(3.4,3.5,u)); cam.position.set(lerp(1.8,1.2,ease(u)),lerp(5.4,4.4,ease(u)),lerp(8.6,7.4,ease(u))); cam.lookAt(look);
        const m=ease(clamp((u-0.15)/0.45)); piles.forEach((g,i)=>{ g.position.x=lerp(pileX[i],0,m); g.scale.setScalar(lerp(1,0.25,m)); g.visible=m<0.98; });
        bag.scale.setScalar(Math.max(0.0001,easeBack(clamp((u-0.55)/0.18)))); bag.rotation.y=Math.sin(t*1.2)*0.08; }
      else if(mode==='harvest'){ look.set(2.6,0.8,0.4); cam.position.set(lerp(5.6,4.6,ease(u)),lerp(2.8,2.3,ease(u)),lerp(6.8,5.4,ease(u))); cam.lookAt(look);
        workers.forEach((w,i)=>{ w.armR.rotation.x=-1.6+Math.sin(t*4+i)*0.5; w.armL.rotation.x=-1.4+Math.cos(t*4+i)*0.5; w.head.rotation.x=0.2; }); }
      else { look.set(0,0,lerp(0,-6,u)); cam.position.set(lerp(-3,3,ease(u)),14,lerp(8,2,ease(u))); cam.lookAt(look); }
      return cam.position.distanceTo(look); } };
};

// factory: p.stage 'sapecado'|'secado'|'estacionamiento'|'molienda'|'envasado'|'line'
T.factory=(p={})=>{
  const s=newScene('#e9dcc6',12,40), cam=newCam(42); const stage=p.stage||'line';
  s.add(new THREE.HemisphereLight('#fff6e8','#8a6a50',0.9)); sun(s,'#ffe6c4',2.2,V(-4,10,6),12); ground(s,'#cdbb9c',60);
  put(s,mesh(new THREE.PlaneGeometry(60,14),matte('#e2d2b5'),false,true),0,7,-6);
  put(s,mesh(new THREE.BoxGeometry(22,0.12,1.0),matte('#4a3a32')),0,0.75,0); for(let x=-10;x<=10;x+=2) put(s,mesh(new THREE.BoxGeometry(0.1,0.75,0.9),matte('#6a5a50')),x,0.37,0);
  const N=70; const leafs=new THREE.InstancedMesh(new THREE.SphereGeometry(0.11,10,8),new THREE.MeshStandardMaterial({roughness:0.9}),N); leafs.castShadow=true; s.add(leafs);
  const drum=put(s,new THREE.Group(),-6,1.3,0); const dm=put(drum,mesh(new THREE.CylinderGeometry(0.9,0.9,2.4,32,1,true),new THREE.MeshStandardMaterial({color:'#8d8f93',roughness:0.4,metalness:0.6,side:THREE.DoubleSide})),0,0,0); dm.rotation.z=Math.PI/2;
  for(const x of [-1.2,1.2]){ const r=put(drum,mesh(new THREE.TorusGeometry(0.92,0.06,10,40),matte('#5a5c60')),x,0,0); r.rotation.y=Math.PI/2; }
  const flame=put(s,mesh(new THREE.ConeGeometry(0.35,0.7,16),new THREE.MeshStandardMaterial({color:'#ff9a3d',emissive:'#ff6a1a',emissiveIntensity:2,roughness:1}),false,false),-6,0.35,0.9); const fl=new THREE.PointLight('#ff8a3a',6,5,2); fl.position.set(-6,0.8,1.1); s.add(fl);
  const dryer=put(s,mesh(new THREE.BoxGeometry(2.6,2.4,1.6),matte(P.terra)),-1.5,1.6,0); put(s,mesh(new THREE.BoxGeometry(2.2,0.9,0.05),new THREE.MeshStandardMaterial({color:'#ffcf8a',emissive:'#ff9a40',emissiveIntensity:0.8})),-1.5,1.3,0.83);
  const heat=[]; for(let i=0;i<10;i++){ const h=mesh(new THREE.SphereGeometry(0.08,8,6),new THREE.MeshBasicMaterial({color:'#ffb060',transparent:true,opacity:0.5}),false,false); s.add(h); heat.push(h); }
  const shelves=put(s,new THREE.Group(),3.0,0,-2.2); for(let i=0;i<3;i++) for(let j=0;j<3;j++) for(let k=0;k<2;k++) put(shelves,mesh(new THREE.BoxGeometry(0.75,0.5,0.6),matte(k?P.beige:P.dbeige)),(i-1)*0.85,0.25+j*0.52,k*0.65);
  const clock=put(s,new THREE.Group(),3.0,3.2,-2.4); put(clock,mesh(new THREE.CylinderGeometry(0.45,0.45,0.06,32),matte('#fff8ee')),0,0,0).rotation.x=Math.PI/2; const hh=put(clock,mesh(new THREE.BoxGeometry(0.04,0.28,0.02),matte(P.black)),0,0.1,0.05), mh=put(clock,mesh(new THREE.BoxGeometry(0.03,0.38,0.02),matte(P.black)),0,0.15,0.06);
  const mill=put(s,new THREE.Group(),6.2,0,0); put(mill,mesh(new THREE.BoxGeometry(1.6,2.0,1.4),matte('#7f9aa8')),0,1.6,-0.1); const wheel=put(mill,mesh(new THREE.CylinderGeometry(0.55,0.55,0.15,20),matte('#4a5560')),0,1.8,0.65); wheel.rotation.x=Math.PI/2; for(let i=0;i<6;i++){ const sp=put(wheel,mesh(new THREE.BoxGeometry(0.06,1.0,0.17),matte('#2f363c')),0,0,0); sp.rotation.y=i*Math.PI/6; }
  const packs=[]; for(let i=0;i<6;i++){ const pk=put(s,makeYerbaPack(),9,0.81,0); pk.scale.setScalar(0.55); packs.push(pk); }
  const xOf={sapecado:-6,secado:-1.5,estacionamiento:3,molienda:6.2,envasado:9,line:1.5}; const fx=xOf[stage]??1.5; const look=V(fx,1.2,0); const M4=new THREE.Matrix4(), c=new THREE.Color();
  const cues=[{u:0,type:'hum',d:1}]; if(stage==='sapecado') cues.push({u:0,type:'crackle',d:1}); if(stage==='molienda') cues.push({u:0.1,type:'clank'},{u:0.4,type:'clank'},{u:0.7,type:'clank'}); if(stage==='estacionamiento') cues.push({u:0,type:'clock',d:1}); if(stage==='envasado') cues.push({u:0.3,type:'pop'},{u:0.6,type:'pop'});
  return { scene:s, camera:cam, aperture:0.0016, maxblur:0.008, cues,
    update(u,t){
      if(stage==='line') camPath(cam,u,V(-7,4.2,8.5),V(8,4.2,8.5),V(lerp(-6,8,ease(u)),1.0,0)), look.set(lerp(-6,8,ease(u)),1,0);
      else camPath(cam,u,V(fx+2.0,2.8,6.4),V(fx+0.8,2.3,5.0),look);
      for(let i=0;i<N;i++){ const x=-11+((t*1.1+i*(22/N))%22); M4.makeTranslation(x,0.86+Math.abs(Math.sin(i*7.1))*0.04,(Math.sin(i*3.3))*0.3); leafs.setMatrixAt(i,M4); leafs.setColorAt(i,c.set(x<-5?'#6faa4c':x<0?'#8eaa4c':x<5?'#a3a557':'#b7a86a')); }
      leafs.instanceMatrix.needsUpdate=true; leafs.instanceColor.needsUpdate=true;
      drum.rotation.x=t*2; flame.scale.y=1+Math.sin(t*14)*0.15; fl.intensity=5.5+Math.sin(t*17)*0.7; wheel.rotation.y=t*4;
      heat.forEach((h,i)=>{ const q=(t*0.6+i/heat.length)%1; h.position.set(-1.5+Math.sin(i*2.1)*0.9,2.8+q*1.4,0.3); h.material.opacity=0.45*(1-q); });
      const days=u*12; mh.rotation.z=-days*Math.PI*2; mh.position.set(Math.sin(-mh.rotation.z)*0.15*-1,Math.cos(mh.rotation.z)*0.15,0.06); hh.rotation.z=-days*Math.PI/6;
      packs.forEach((pk,i)=>{ const q=(t*0.5+i/packs.length)%1; pk.position.set(8+q*2.5,0.81,0); });
      return cam.position.distanceTo(look); } };
};

// compare: pedestals with country color bands; mates and/or growing bars. p.items:[{band:'AR'|'UY'|'BR'|'PY'|'X', mate, bar(0..1), label, value}], mode
const BANDS={AR:['#74acdf','#ffffff','#74acdf'],UY:['#ffffff','#2f5aa8','#ffffff','#2f5aa8'],BR:['#2f9e44','#ffd43b','#2f9e44'],PY:['#d52b1e','#ffffff','#0038a8'],SY:['#ce1126','#ffffff','#111111'],CL:['#ffffff','#d52b1e'],US:['#b22234','#ffffff','#3c3b6e'],ES:['#aa151b','#f1bf00','#aa151b'],X:['#e9d8bb','#d2b48c']};
T.compare=(p={})=>{
  const items=(p.items||[]).slice(0,5); const n=items.length||1; const s=newScene(p.bg||'#f1e4cc',10,28), cam=newCam(42);
  s.add(new THREE.HemisphereLight('#fff6e8','#9a7a5a',1.0)); sun(s,'#ffe6c4',2.2,V(-3,7,5),6); ground(s,p.floor||'#e2cfae');
  const bars=p.mode==='bars'; const gap=bars?1.05:1.5; const pos=i=>{ if(bars||n<=2||p.row) return [(i-(n-1)/2)*(p.row&&!bars?1.15:gap),0]; const row=Math.floor(i/2), inRow=Math.min(2,n-row*2); return [(i%2-(inRow-1)/2)*gap, -row*2.1+(n>2?1.05:0)]; };
  const objs=items.map((it,i)=>{ const [px,pz]=pos(i); const g=put(s,new THREE.Group(),px,0,pz);
    const cols=BANDS[it.band]||BANDS.X; const ped=new THREE.Group(); g.add(ped); const ph=0.5; cols.forEach((c,k)=>put(ped,mesh(new THREE.CylinderGeometry(0.42,0.42,ph/cols.length,32),matte(c)),0,ph/cols.length*(k+0.5),0));
    let bar=null; if(it.bar!=null){ bar=put(g,mesh(new THREE.BoxGeometry(0.5,1,0.5),matte(it.color||P.terra)),0,ph,0); bar.scale.y=0.001; }
    let mate=null; if(it.mate){ mate=makeMate(it.mate); mate.g.scale.setScalar(it.mate==='cuia'||it.mate==='guampa'?0.42:0.5); put(g,mate.g,0,ph,0); mate.g.userData.s=mate.g.scale.x; }
    return {g,bar,mate,it,ph}; });
  const maxBar=Math.max(1e-6,...items.map(i=>i.bar||0)); const barH=p.barH||1.6; const look=V(0,bars?1.2:0.55,bars?0:-0.1);
  const cues=[]; objs.forEach((o,i)=>cues.push({u:0.08+i*0.12,type:'rise',n:i}));
  const lab=new THREE.Vector3();
  return { scene:s, camera:cam, aperture:0.0012, maxblur:0.006, cues,
    update(u,t){ const dist=bars?(n>3?8.6:7.4):p.row?(n>3?7.4:6.2):(n>2?6.0:4.6); const grid=!bars&&!p.row&&n>2; camPath(cam,u,V(0.5,bars?2.8:grid?6.4:3.6,dist+0.8),V(0.2,bars?2.4:grid?5.8:3.2,dist),look);
      objs.forEach((o,i)=>{ const a=easeBack(clamp((u-0.08-i*0.12)/0.22)); if(o.bar){ const h=Math.max(0.001,(o.it.bar/maxBar)*barH*clamp(a,0,1.15)); o.bar.scale.y=h; o.bar.position.y=o.ph+h/2; if(o.mate) o.mate.g.position.y=o.ph+h; }
        if(o.mate){ o.mate.g.scale.setScalar(o.mate.g.userData.s*Math.max(0.001,a)); o.mate.g.rotation.y=Math.sin(t*0.8+i)*0.3; } });
      return cam.position.distanceTo(look); },
    labels(){ return objs.map((o,i)=>{ lab.set(o.g.position.x,-0.05,o.g.position.z+0.5); return o.it.label?{v:lab.clone(),text:o.it.label,value:o.it.value,i}:null; }).filter(Boolean); } };
};

// places: where people drink. p.place 'plaza'|'beach'|'office'|'kitchen'|'car', p.people 1|2, p.gesture 'sip'|'pass'|'carry'
T.places=(p={})=>{
  const place=p.place==='car'?'plaza':(p.place||'plaza'); const outdoor=place==='plaza'||place==='beach';
  const s=newScene(place==='beach'?'#bfe3f2':place==='plaza'?'#cfe3ea':'#ead9bf',10,30), cam=newCam(42); s.add(cam);
  s.add(new THREE.HemisphereLight('#fff6e6',outdoor?'#6a8a50':'#8a6a50',0.95)); sun(s,'#ffe6c0',2.5,V(-4,8,4),6);
  const r=rng(21); let seatY=0.45; const look=V(0,1.0,0);
  if(place==='plaza'){ ground(s,P.green); for(let i=0;i<14;i++){ const x=(r()-0.5)*18; s.add(makeTree(r,x,-3-r()*9,0.9)); }
    put(s,mesh(new THREE.PlaneGeometry(2.2,30),matte('#e2cfae'),false,true),-2.2,0.01,0).rotation.x=-Math.PI/2;
    put(s,mesh(new THREE.BoxGeometry(2.2,0.08,0.55),matte(P.wood)),0,0.45,0); put(s,mesh(new THREE.BoxGeometry(2.2,0.5,0.08),matte(P.wood)),0,0.75,-0.28); for(const x of [-0.95,0.95]) put(s,mesh(new THREE.BoxGeometry(0.08,0.45,0.5),matte('#4a3a32')),x,0.22,0); }
  if(place==='beach'){ ground(s,'#ecd6a8'); const sea=put(s,mesh(new THREE.PlaneGeometry(80,30),new THREE.MeshStandardMaterial({color:'#5fb3d6',roughness:0.3}),false,false),0,0.02,-18); sea.rotation.x=-Math.PI/2; s.userData.sea=sea;
    put(s,mesh(new THREE.CylinderGeometry(0.03,0.03,2.4,8),matte('#eee')),0.9,1.2,-0.6); put(s,mesh(new THREE.ConeGeometry(1.4,0.5,10,1,true),new THREE.MeshStandardMaterial({color:P.terra,side:THREE.DoubleSide,roughness:0.9})),0.9,2.3,-0.6);
    seatY=0.35; put(s,mesh(new THREE.BoxGeometry(0.8,0.06,0.7),matte(P.sky)),0,0.35,0); put(s,mesh(new THREE.BoxGeometry(0.8,0.7,0.06),matte(P.sky)),0,0.65,-0.36).rotation.x=-0.3; }
  if(place==='office'||place==='kitchen'){ interior(s,{wall:place==='office'?'#dfe6ea':'#e3cba4',table:place==='office'?'#d8c9b0':P.wood}); s.children.filter(c=>c.geometry&&c.geometry.type==='BoxGeometry'&&c.position.y===-0.15).forEach(c=>c.visible=false);
    ground(s,place==='office'?'#b9a68a':'#c9a07c'); put(s,mesh(new THREE.BoxGeometry(2.4,0.08,1.0),matte(place==='office'?'#e8dcc6':P.wood)),0,0.9,0.75); for(const x of [-1.1,1.1]) put(s,mesh(new THREE.BoxGeometry(0.08,0.9,0.9),matte('#6a5a50')),x,0.45,0.75);
    if(place==='office'){ const mon=put(s,mesh(new THREE.BoxGeometry(0.8,0.5,0.05),matte('#2b2f33')),1.0,1.25,0.6); mon.rotation.y=-0.6; put(s,mesh(new THREE.BoxGeometry(0.05,0.3,0.05),matte('#2b2f33')),1.0,1.0,0.6); put(s,mesh(new THREE.BoxGeometry(0.6,0.03,0.22),matte('#cfd3d8')),0.3,0.95,0.95); }
    seatY=0.5; put(s,mesh(new THREE.BoxGeometry(0.6,0.08,0.6),matte('#4a3a32')),0,0.5,1.75); }
  if(place==='car'){ ground(s,'#9aa0a6'); const r2=rng(4); for(let i=0;i<20;i++) s.add(makeTree(r2,(r2()<0.5?-1:1)*(4+r2()*6),-r2()*30,0.9));
    const car=put(s,new THREE.Group(),0,0,0); put(car,mesh(new THREE.BoxGeometry(1.8,0.6,3.4),matte(P.terra)),0,0.55,0); put(car,mesh(new THREE.BoxGeometry(1.6,0.6,1.8),matte(P.terra)),0,1.15,0.1);
    put(car,mesh(new THREE.BoxGeometry(1.5,0.45,0.05),matte(P.sky)),0,1.2,-0.82); s.userData.car=car; }
  const people=[]; const nP=clamp(p.people||1,1,2);
  for(let i=0;i<nP;i++){ const pp=makePerson(PEOPLE[(p.who??0)+i*2]); const x=nP===1?0:(i?0.5:-0.5);
    if(place==='car'){ pp.g.scale.setScalar(0.7); pp.g.position.set(i?0.4:-0.4,0.5,-0.3); pp.g.rotation.y=Math.PI; }
    else if(place==='office'||place==='kitchen'){ pp.g.position.set(x,0,1.75); pp.g.rotation.y=Math.PI; if(place==='office') pp.sit(seatY); }
    else { pp.g.position.set(x,0,0.05); pp.sit(seatY); if(nP===2) pp.g.rotation.y=i?-0.35:0.35; }
    s.add(pp.g); people.push(pp); }
  const mate=makeMate(p.mate||'calabaza'); mate.g.scale.setScalar(0.42); people[0].hold(mate.g);
  const termo=makeTermo(p.termoColor); termo.scale.setScalar(0.55);
  if(p.gesture==='carry'){ put(people[0].armL,termo,0.05,-0.35,0.05); termo.rotation.z=0.3; } else if(place==='office'||place==='kitchen') put(s,termo,-0.7,0.94,0.75); else put(s,termo,nP===1?0.75:1.1,0,0.35);
  if(place==='office'||place==='kitchen'){ cam.userData.a=V(-0.6,2.0,-2.4); cam.userData.b=V(-0.3,1.8,-1.3); look.set(0,1.15,1.6); }
  else if(place==='car'){ cam.userData.a=V(1.8,2.4,-5.5); cam.userData.b=V(1.0,1.8,-3.8); look.set(0,1.0,0); }
  else { cam.userData.a=V(0.9,1.9,6.2); cam.userData.b=V(0.4,1.6,4.8); look.set(0,0.95,0); }
  const cues=[]; if(place==='beach') cues.push({u:0,type:'waves',d:1}); if(place==='plaza') cues.push({u:0.1,type:'birds'}); if(place==='office') cues.push({u:0,type:'keys',d:1}); if(place==='car') cues.push({u:0,type:'rumble',d:1});
  return { scene:s, camera:cam, aperture:0.0025, maxblur:0.008, cues, people, mates:[mate],
    update(u,t){ camPath(cam,u,cam.userData.a,cam.userData.b,look);
      const q=(t%2.6)/2.6; const sip=p.gesture==='pass'?0:(q<0.25?ease(q/0.25):q<0.6?1:q<0.85?1-ease((q-0.6)/0.25):0);
      people[0].pose(lerp(-0.7,-1.75,sip)); people[0].head.rotation.x=-0.1*sip;
      if(p.gesture==='pass'&&people[1]){ const k=Math.sin(t*1.6)*0.5+0.5; people[0].pose(lerp(-0.8,-1.4,k)); people[1].armL.rotation.x=lerp(-0.2,-1.3,k); }
      if(people[1]&&p.gesture!=='pass'){ people[1].armR.rotation.x=-0.3+Math.sin(t*1.3)*0.08; people[1].head.rotation.y=-0.3+Math.sin(t*0.7)*0.15; }
      if(s.userData.sea) s.userData.sea.position.y=0.02+Math.sin(t*1.5)*0.02;
      if(s.userData.car){ s.children.forEach(c=>{ if(c.userData.tree) c.position.z=((c.userData.z0+t*8)%30)-25; }); s.userData.car.position.y=Math.abs(Math.sin(t*12))*0.01; }
      return cam.position.distanceTo(look); } };
};

// object: turntable of one object; p.obj 'bombilla'|'termo'|'yerba'|'mate', p.type (bombilla: 'paleta'|'resorte'|'chata'; mate type), p.explode, p.palo, p.color, p.labels[]
T.object=(p={})=>{
  const s=newScene(p.color||'#e9d8bb',8,22), cam=newCam(38); s.add(new THREE.HemisphereLight('#fff6e8','#9a7a5a',1.0)); sun(s,'#ffe6c4',2.4,V(-3,6,4),4); ground(s,p.floor||'#dcc6a2');
  put(s,mesh(new THREE.CylinderGeometry(1.1,1.15,0.18,48),matte('#fff3e0')),0,0.09,0);
  const root=put(s,new THREE.Group(),0,0.18,0); const parts=[]; const cues=[{u:0.05,type:'sparkle'}]; let look=V(0,1.0,0), scale=1, fil0=0;
  const obj=p.obj||'bombilla';
  if(obj==='bombilla'){ scale=1; const b=new THREE.Group(); root.add(b); b.rotation.z=0.25;
    const tube=put(b,mesh(new THREE.CylinderGeometry(0.075,0.075,2.0,16),metalM),0,1.2,0); fil0=1; const mp=put(b,mesh(new THREE.CylinderGeometry(0.07,0.06,0.14,16),metalM),0,2.25,0); mp.scale.x=1.6;
    const fil=new THREE.Group(); put(b,fil,0,0.2,0); fil.scale.setScalar(1.6);
    if((p.type||'paleta')==='resorte'){ for(let i=0;i<8;i++){ const r=put(fil,mesh(new THREE.TorusGeometry(0.1,0.018,8,24),metalM),0,i*0.045,0); r.rotation.x=Math.PI/2; } }
    else { const pal=put(fil,mesh(new THREE.CylinderGeometry(0.2,0.2,0.05,28),metalM),0,0,0); pal.rotation.x=Math.PI/2; pal.scale.set(1,1,(p.type==='chata')?0.7:1); for(let i=0;i<9;i++){ const h=put(fil,mesh(new THREE.CylinderGeometry(0.018,0.018,0.06,8),matte('#3a3a3a'),false),((i%3)-1)*0.09,Math.floor(i/3)*0.09-0.09,0.01); h.rotation.x=Math.PI/2; } }
    parts.push({o:mp,dy:0.5},{o:tube,dy:0},{o:fil,dy:-0.55}); look=V(0,1.25,0); }
  if(obj==='termo'){ const t=makeTermo(p.termoColor); t.scale.setScalar(1.3); root.add(t); const cap=t.userData.cap; cap.visible=true; const pico=t.children[2]; parts.push({o:cap,dy:0.6},{o:pico,dy:0.35}); look=V(0,1.1,0); }
  if(obj==='yerba'){ const pk=put(root,makeYerbaPack(),-0.5,0,-0.35); pk.scale.setScalar(1.05); pk.rotation.y=0.35; const pile=put(root,new THREE.Group(),0.55,0,0.25); const rr=rng(3);
    for(let i=0;i<90;i++){ const a=rr()*Math.PI*2, d=Math.sqrt(rr())*0.55, h=(0.55-d)*0.6; const isPalo=p.palo&&i%5===0; const m=isPalo?mesh(new THREE.CylinderGeometry(0.012,0.012,0.12,6),matte('#e8d7a8')):mesh(new THREE.BoxGeometry(0.06,0.02,0.05),matte(i%3?P.yerba:'#7a9a48')); put(pile,m,Math.cos(a)*d,rr()*h+0.02,Math.sin(a)*d); m.rotation.set(rr()*3,rr()*3,rr()*3); }
    look=V(0.1,0.7,0); cues.length=0; }
  if(obj==='mate'){ const M=makeMate(p.type||'calabaza'); root.add(M.g); M.g.scale.setScalar(1.25); look=V(0,0.75,0); if(M.g.userData.bombilla) parts.push({o:M.g.userData.bombilla,dy:0.6}); }
  parts.forEach(pp=>pp.y0=pp.o.position.y);
  const lab=new THREE.Vector3();
  return { scene:s, camera:cam, aperture:0.002, maxblur:0.007, cues,
    update(u,t){ camPath(cam,u,V(0.4,look.y+0.6,4.8),V(0.2,look.y+0.35,3.6),look); root.rotation.y=p.spin===false?0.3:t*0.7;
      const e=p.explode?easeBack(clamp((u-0.25)/0.3)):0; parts.forEach(pp=>pp.o.position.y=pp.y0+pp.dy*e); return cam.position.distanceTo(look); },
    labels(){ if(!p.labels||!p.explode) return []; return parts.slice(0,p.labels.length).map((pp,i)=>{ pp.o.getWorldPosition(lab); return {v:lab.clone(),text:p.labels[i],i,side:i%2?1:-1}; }); } };
};

// react: clean close-up of one character (or the mate mascot) showing an emotion. p: who, face, act, bg, ring, mascot, mate, hold
T.react=(p={})=>{
  const bg=p.bg||'#f3e3c7'; const s=newScene(bg,8,20), cam=newCam(32); s.add(new THREE.HemisphereLight('#fff8ee','#b89a78',1.1)); sun(s,'#fff0dc',2.0,V(-2,5,5),3);
  ground(s,bg); const ring=put(s,mesh(new THREE.CircleGeometry(1.25,64),new THREE.MeshBasicMaterial({color:p.ring||'#ffffff',transparent:true,opacity:0.55}),false,false),0,1.35,-1.6);
  const people=[], mates=[]; let look;
  if(p.mascot){ const M=makeMate(p.mate||'calabaza',{face:p.face||'happy'}); M.g.scale.setScalar(M.rimY>0.9?1.05:1.35); s.add(M.g); mates.push(M); look=V(0,0.95,0); ring.position.set(0,1.0,-1.6); }
  else { const pp=makePerson({...PEOPLE[(p.who??0)%PEOPLE.length],face:p.face||'smile'}); s.add(pp.g); people.push(pp); look=V(0,1.5,0);
    if(p.hold!==false){ const M=makeMate(p.mate||'calabaza',{face:p.mateFace}); M.g.scale.setScalar(0.42); pp.hold(M.g); mates.push(M); } }
  const t0=p.act; const cues=[]; if(['jump','cheer','laugh'].includes(t0)) cues.push({u:0.05,type:'sparkle'}); if(t0==='shock') cues.push({u:0.08,type:'boomSoft'}); if(t0==='no') cues.push({u:0.1,type:'buzz'});
  return { scene:s, camera:cam, aperture:0.0016, maxblur:0.006, cues, people, mates, emo:{face:p.face,act:p.act},
    update(u,t){ const k=ease(u); if(p.mascot){ cam.position.set(lerp(0.3,0.1,k),lerp(1.35,1.2,k),lerp(5.4,4.7,k)); mates[0].g.rotation.y=Math.sin(t*1.6)*0.25; mates[0].g.position.y=Math.abs(Math.sin(t*(t0==='jump'?7:2.4)))*(t0==='jump'?0.35:0.05); }
      else { cam.position.set(lerp(0.35,0.12,k),lerp(1.6,1.5,k),lerp(3.6,3.0,k)); people[0].pose(-0.75+Math.sin(t*1.5)*0.06); people[0].head.rotation.y=Math.sin(t*0.9)*0.08; }
      cam.lookAt(look); ring.scale.setScalar(1+Math.sin(t*2)*0.03); return cam.position.distanceTo(look); } };
};

// board: flat 2D infographic on a solid background (explainer style). p.kind: dots | cards | checklist | poll | timeline | title
// dots {total, on, cols, label, sub, color} · cards {items:[{n,title,sub,ok}]} · checklist {rows:[{text,ok}]} · poll {question, options[]} · timeline {items:[{label,text}]} · title {text, sub}
T.board=(p={})=>{
  const bg=p.bg||'#16233a'; const s=new THREE.Scene(); s.background=new THREE.Color(bg); const cam=newCam(40);
  const cues=[]; const k=p.kind||'title';
  const n=k==='cards'?(p.items||[]).length:k==='checklist'?(p.rows||[]).length:k==='poll'?(p.options||[]).length:k==='timeline'?(p.items||[]).length:0;
  for(let i=0;i<n;i++) cues.push({u:0.1+i*(0.75/Math.max(1,n)),type:k==='checklist'?((p.rows[i].ok)?'ding':'buzz'):'pop'});
  if(k==='dots') cues.push({u:0.1,type:'tick'},{u:0.55,type:'ding'});
  return { scene:s, camera:cam, aperture:0, maxblur:0, no3d:true, cues, update(){ return 5; }, overlay:(c,u,t)=>{ c.fillStyle=bg; c.fillRect(0,0,W,H); const bs0=p.scale??E.tl?.style?.boardScale??1, bs=p.kind==='cards'?Math.min(bs0,1.18):p.kind==='timeline'?Math.min(bs0,1):p.kind==='checklist'?Math.min(bs0,1.12):bs0; c.save(); c.translate(W/2,H*0.5); c.scale(bs,bs); c.translate(-W/2,-H*0.5); drawBoard(c,p,u,t); c.restore(); } };
};
function rr(c,x,y,w,h,r,fill){ c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=fill; c.fill(); }
function drawBoard(c,p,u,t){
  const k=p.kind||'title', acc=p.color||E.accent, W2=W/2, top=p.top??(k==='dots'?640:760); c.save(); c.textAlign='center'; c.textBaseline='middle';
  const g=c.createRadialGradient(W2,H*0.45,50,W2,H*0.45,H*0.6); g.addColorStop(0,'rgba(255,255,255,0.07)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
  const pop=(d)=>Math.max(0.001,easeOutBack(clamp(d/0.18)));
  if(k==='title'){ const bsc=p.scale??E.tl?.style?.boardScale??1, maxW=(W-120)/bsc; const fit=(w,sz,txt)=>{ c.font=w+' '+sz+'px Montserrat'; const m=c.measureText(txt).width; if(m>maxW){ sz=Math.floor(sz*maxW/m); c.font=w+' '+sz+'px Montserrat'; } return sz; }; fit(900,120,p.text||''); c.fillStyle='#fff'; const sc=pop(u*3); c.save(); c.translate(W2,H*0.42); c.scale(sc,sc); c.fillText(p.text||'',0,0); if(p.sub){ fit(800,52,p.sub); c.fillStyle=acc; c.fillText(p.sub,0,100);} c.restore(); }
  if(k==='dots'){ const total=p.total||100, cols=p.cols||10, on=p.on||0, rows=Math.ceil(total/cols), cell=Math.min(80,880/cols), r=cell*0.36; const x0=W2-cols*cell/2+cell/2, y0=top+40;
    const lit=Math.round(on*easeOut(clamp((u-0.08)/0.5)));
    for(let i=0;i<total;i++){ const x=x0+(i%cols)*cell, y=y0+Math.floor(i/cols)*cell; const a=clamp((u*1.6-i/total*0.4)*3); if(a<=0) continue; c.beginPath(); c.arc(x,y,r*a,0,Math.PI*2); c.fillStyle=i<lit?acc:'rgba(255,255,255,0.18)'; c.fill(); }
    const yl=y0+rows*cell+40; c.font='900 96px Montserrat'; c.fillStyle='#fff'; c.fillText(p.label||(lit+' / '+total),W2,yl+40); if(p.sub){ c.font='800 46px Montserrat'; c.fillStyle=acc; c.fillText(p.sub,W2,yl+120); } }
  if(k==='cards'){ const it=p.items||[], m=it.length, cw=Math.min(300,880/m-24), ch=cw*1.45, gap=24, x0=W2-(m*cw+(m-1)*gap)/2;
    it.forEach((q,i)=>{ const d=u-(0.1+i*0.75/m); if(d<0) return; const a=pop(d); const flip=clamp(d/0.25); const x=x0+i*(cw+gap)+cw/2, y=top+ch/2+60;
      c.save(); c.translate(x,y); c.scale(a*Math.max(0.05,Math.abs(Math.cos((1-flip)*Math.PI/2))),a); c.rotate((i-(m-1)/2)*0.04);
      rr(c,-cw/2,-ch/2,cw,ch,28,'#fffaf2'); c.lineWidth=6; c.strokeStyle=q.ok===false?'#d63c2f':q.ok===true?'#2f9e44':acc; c.stroke();
      c.font='900 '+Math.round(cw*0.42)+'px Montserrat'; c.fillStyle=q.ok===false?'#d63c2f':q.ok===true?'#2f9e44':'#1b120e'; c.fillText(q.n!=null?String(q.n):(q.ok===false?'✗':'✓'),0,-ch*0.18);
      let fsz=Math.round(cw*0.14); c.font='900 '+fsz+'px Montserrat'; while(c.measureText(q.title||'').width>cw-24&&fsz>18){ fsz-=2; c.font='900 '+fsz+'px Montserrat'; } c.fillStyle='#1b120e'; c.fillText(q.title||'',0,ch*0.18);
      if(q.sub){ c.font='800 '+Math.round(cw*0.085)+'px Montserrat'; c.fillStyle='#8a6a55'; c.fillText(q.sub,0,ch*0.32); } c.restore(); }); }
  if(k==='checklist'){ const rws=p.rows||[], m=rws.length, rh=Math.min(150,1000/m);
    rws.forEach((q,i)=>{ const d=u-(0.1+i*0.75/m); if(d<0) return; const a=easeOut(clamp(d/0.2)); const y=top+i*rh; c.save(); c.globalAlpha=a; c.translate((1-a)*-120,0);
      rr(c,110,y,W-220,rh-24,(rh-24)/2,'rgba(255,255,255,0.08)'); c.beginPath(); c.arc(110+(rh-24)/2,y+(rh-24)/2,(rh-24)/2-12,0,Math.PI*2); c.fillStyle=q.ok?'#2f9e44':'#d63c2f'; c.fill();
      c.fillStyle='#fff'; c.font='900 '+Math.round((rh-24)*0.45)+'px Montserrat'; c.fillText(q.ok?'✓':'✗',110+(rh-24)/2,y+(rh-24)/2+3);
      c.textAlign='left'; let fsz=Math.round((rh-24)*0.36); c.font='800 '+fsz+'px Montserrat'; while(c.measureText(q.text).width>W-220-(rh-24)-60&&fsz>20){ fsz-=2; c.font='800 '+fsz+'px Montserrat'; } c.fillText(q.text,110+(rh-24)+30,y+(rh-24)/2+2); c.restore(); }); }
  if(k==='poll'){ const op=p.options||[]; c.font='900 70px Montserrat'; c.fillStyle='#fff'; const qa=easeOut(clamp(u/0.15)); c.globalAlpha=qa; c.fillText(p.question||'',W2,top); c.globalAlpha=1;
    op.forEach((o,i)=>{ const d=u-(0.12+i*0.6/op.length); if(d<0) return; const a=pop(d); const y=top+150+i*150; c.save(); c.translate(W2,y); c.scale(a,a); c.font='900 60px Montserrat'; const w=c.measureText(o).width+120;
      rr(c,-w/2,-55,w,110,55,i===0?acc:'rgba(255,255,255,0.12)'); c.lineWidth=4; c.strokeStyle='rgba(255,255,255,0.5)'; c.stroke(); c.fillStyle=i===0?'#1b120e':'#fff'; c.fillText(o,0,4); c.restore(); });
    const hint=clamp((u-0.75)/0.1); if(hint>0&&p.cta!==false){ c.globalAlpha=hint; c.font='800 44px Montserrat'; c.fillStyle=acc; c.fillText('👇 '+(p.cta||'CONTALO EN LOS COMENTARIOS'),W2,top+150+op.length*150+30); c.globalAlpha=1; } }
  if(k==='timeline'){ const it=p.items||[], m=it.length, y=top+260; const prog=clamp((u-0.05)/0.8); c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=8; c.beginPath(); c.moveTo(140,y); c.lineTo(140+(W-280)*prog,y); c.stroke();
    it.forEach((q,i)=>{ const x=140+(W-280)*(m===1?0.5:i/(m-1)); const d=prog-(m===1?0.5:i/(m-1)); if(d<0) return; const a=pop(d*2); c.save(); c.translate(x,y); c.scale(a,a); c.beginPath(); c.arc(0,0,26,0,Math.PI*2); c.fillStyle=acc; c.fill();
      c.font='900 64px Montserrat'; c.fillStyle='#fff'; c.fillText(q.label,0,i%2?110:-100); c.font='800 38px Montserrat'; c.fillStyle=acc; const lines=String(q.text||'').split('\n'); lines.forEach((l,j)=>c.fillText(l,0,(i%2?170:-170)+j*44*(i%2?1:-1))); c.restore(); }); }
  c.restore();
}

// ---------------- flat 2D illustration (reference reel look) ----------------
// T.flat: a fully 2D vector scene drawn on the canvas: background scene, flat characters (big head, dot eyes), mate/termo props, label pills.
// p: scene (kitchen|park|plaza|patio|solid|navygrid), bg, people:[{x,y,s,skin,hair,hairStyle,shirt,stripe,stripes,pants,shorts,face,act,hold,look}],
//    objs:[{type:mate|madera|termo|bombilla|yerba|heart, x,y,s,color,bob,steam}], labels:[{text,x,y,tx,ty}], pass:{from,to}
const F2={ skins:['#f3cba6','#f6d7bb','#f1c6a0','#f5d2b2','#f6d7bb','#f2c9a4'], hairs:['#3a2416','#3a2416','#3a2416','#3a2416','#3a2416','#3a2416'],
  shirts:['#e5483a','#3b82f6','#2f9e44','#f59e0b','#7c3aed','#f4f1ea','#1f3b5c','#10b981'], styles:['short','long','curly','bun','short','cap'] };
function f2shade(hex,amt){ const n=parseInt(hex.slice(1),16); const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt))); return '#'+((1<<24)+(f(n>>16)<<16)+(f((n>>8)&255)<<8)+f(n&255)).toString(16).slice(1); }
function f2ell(c,x,y,rx,ry,fill){ c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fillStyle=fill; c.fill(); }
function f2scene(c,name,t,p){
  const bg=p.bg||'#16233a';
  if(name==='kitchen'){ c.fillStyle=p.wall||'#3f6577'; c.fillRect(0,0,W,H); c.fillStyle='rgba(0,0,0,0.10)'; for(let x=0;x<W;x+=72) c.fillRect(x,0,5,1300);
    c.fillStyle='#6b4428'; c.fillRect(0,330,W,26); c.fillStyle='#4e3019'; c.fillRect(0,356,W,10);
    [['#e5483a',90,70,96],['#f2c94c',220,56,120],['#9fd3f2',330,64,84],['#7fb069',820,58,110],['#f4f1ea',930,70,90]].forEach(([col,x,w,h])=>{ rr(c,x,330-h,w,h,10,col); rr(c,x+6,330-h-14,w-12,18,6,f2shade(col,-0.35)); });
    c.fillStyle='#2f4d5c'; c.fillRect(0,1300,W,H-1300); return; }
  if(name==='park'||name==='plaza'){ const eve=name==='plaza'||p.time==='evening';
    const g=c.createLinearGradient(0,0,0,950); if(eve){ g.addColorStop(0,'#ff8f6b'); g.addColorStop(1,'#ffd59a'); } else { g.addColorStop(0,'#7cc8f0'); g.addColorStop(1,'#cdeefd'); } c.fillStyle=g; c.fillRect(0,0,W,950);
    if(eve){ f2ell(c,780,700,110,110,'rgba(255,240,200,0.9)'); } else f2ell(c,860,240,70,70,'#fff4c2');
    [[180,330,1],[700,250,0.8],[460,520,0.6]].forEach(([x,y,s],i)=>{ const dx=Math.sin(t*0.3+i)*20; c.fillStyle=eve?'rgba(255,240,225,0.85)':'#ffffff'; [[0,0,60],[55,-20,72],[115,0,56],[55,18,60]].forEach(([a,b,r])=>{ c.beginPath(); c.arc(x+dx+a*s,y+b*s,r*s,0,Math.PI*2); c.fill(); }); });
    if(name==='plaza'){ c.fillStyle='#5c4a72'; [[0,620,160],[150,700,120],[270,560,180],[460,680,140],[600,600,170],[780,660,130],[910,580,170]].forEach(([x,y,w])=>c.fillRect(x,y,w,950-y)); c.fillStyle='rgba(255,220,140,0.8)'; for(let i=0;i<26;i++){ const x=(i*137)%1040+20, y=640+((i*71)%260); c.fillRect(x,y,14,20); } }
    else { for(let i=0;i<9;i++){ const x=i*135+20, r=90+((i*37)%40); c.fillStyle='#4f8f3a'; c.beginPath(); c.arc(x,930-r*0.6,r,0,Math.PI*2); c.fill(); c.fillStyle='#5a3a22'; c.fillRect(x-8,900,16,60); } }
    for(let i=0;i<12;i++){ c.fillStyle=name==='plaza'?(i%2?'#c9a27a':'#bf9670'):(i%2?'#5fae3e':'#56a238'); c.fillRect(0,950+i*85,W,85); }
    if(name==='plaza'){ c.fillStyle='#3a2f45'; c.fillRect(920,560,14,500); f2ell(c,927,555,34,22,'#fff1b8'); } return; }
  if(name==='beach'){ const g=c.createLinearGradient(0,0,0,900); g.addColorStop(0,p.time==='evening'?'#ff9a76':'#6cc3ee'); g.addColorStop(1,p.time==='evening'?'#ffd8a0':'#d4f0fb'); c.fillStyle=g; c.fillRect(0,0,W,900);
    f2ell(c,760,p.time==='evening'?820:260,90,90,p.time==='evening'?'rgba(255,236,190,0.95)':'#fff4c2'); c.fillStyle='#2f86c6'; c.fillRect(0,880,W,240); c.strokeStyle='rgba(255,255,255,0.55)'; c.lineWidth=6; c.lineCap='round';
    for(let i=0;i<10;i++){ const x=((i*173+t*40)%(W+200))-100, y=920+(i%4)*48; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+30,y-14,x+60,y); c.stroke(); } c.fillStyle='#ffffff'; c.fillRect(0,1110,W,16); c.fillStyle='#f0d29a'; c.fillRect(0,1120,W,H-1120);
    c.fillStyle='rgba(180,140,80,0.25)'; for(let i=0;i<40;i++) c.fillRect((i*211)%W,1160+(i*97)%700,10,6); c.fillStyle='#e5483a'; c.beginPath(); c.moveTo(150,700); c.lineTo(330,760); c.lineTo(-30,760); c.fill(); c.fillStyle='#f4f1ea'; c.fillRect(145,700,10,440); return; }
  if(name==='patio'){ c.fillStyle='#f1e4cf'; c.fillRect(0,0,W,1100); c.strokeStyle='rgba(120,80,40,0.10)'; c.lineWidth=4; for(let y=0;y<1100;y+=90){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    rr(c,90,420,240,330,18,'#9fd3f2'); c.fillStyle='#f4f1ea'; c.fillRect(205,420,10,330); c.fillRect(90,580,240,10); rr(c,800,820,150,170,20,'#c96a4b'); c.fillStyle='#2f9e44'; [[875,780,70],[830,800,50],[925,800,55]].forEach(([x,y,r])=>{ c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill(); });
    c.fillStyle='#c96a4b'; c.fillRect(0,1100,W,H-1100); c.strokeStyle='rgba(0,0,0,0.12)'; for(let y=1100;y<H;y+=110){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } for(let x=0;x<W;x+=150){ c.beginPath(); c.moveTo(x,1100); c.lineTo(x,H); c.stroke(); } return; }
  // solid / navygrid: one color with a soft center glow (navygrid adds a faint grid + stars)
  c.fillStyle=bg; c.fillRect(0,0,W,H); const g=c.createRadialGradient(W/2,H*0.5,40,W/2,H*0.5,H*0.6); g.addColorStop(0,'rgba(255,255,255,0.16)'); g.addColorStop(1,'rgba(0,0,0,0.10)'); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(name==='navygrid'){ c.strokeStyle='rgba(255,255,255,0.05)'; c.lineWidth=2; for(let x=0;x<W;x+=72){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); } for(let y=0;y<H;y+=72){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    for(let i=0;i<40;i++){ const x=(i*263)%W, y=(i*419)%H; c.fillStyle=`rgba(255,255,255,${0.15+0.25*Math.abs(Math.sin(t*1.5+i))})`; c.fillRect(x,y,4,4); } }
  if(p.ring){ c.beginPath(); c.arc(W/2,H*0.52,420,0,Math.PI*2); c.fillStyle=p.ring; c.globalAlpha=0.9; c.fill(); c.globalAlpha=1; }
}
function f2kettle(c,x,y,s){ c.save(); c.translate(x,y); f2ell(c,0,-s*0.38,s*0.5,s*0.4,'#c9ced4'); c.fillStyle='#aab1b9'; c.fillRect(-s*0.5,-s*0.38,s,s*0.38); f2ell(c,0,0,s*0.5,s*0.08,'#9aa1a9'); c.strokeStyle='#2a2f36'; c.lineWidth=s*0.07; c.beginPath(); c.arc(0,-s*0.72,s*0.28,Math.PI,0); c.stroke();
  c.strokeStyle='#aab1b9'; c.lineWidth=s*0.12; c.beginPath(); c.moveTo(s*0.4,-s*0.3); c.lineTo(s*0.75,-s*0.62); c.stroke(); f2ell(c,0,-s*0.78,s*0.08,s*0.05,'#2a2f36'); c.restore(); }
function f2bench(c,x,y,w,col){ c.fillStyle=col||'#8a5a34'; rr(c,x-w/2,y-w*0.32,w,w*0.07,6,col||'#8a5a34'); rr(c,x-w/2,y-w*0.2,w,w*0.07,6,col||'#8a5a34'); c.fillStyle='#3a2f2a'; c.fillRect(x-w*0.42,y-w*0.14,w*0.05,w*0.14); c.fillRect(x+w*0.37,y-w*0.14,w*0.05,w*0.14); c.fillRect(x-w*0.45,y-w*0.36,w*0.04,w*0.22); c.fillRect(x+w*0.41,y-w*0.36,w*0.04,w*0.22); }
function f2lamp(c,x,y,h,on){ c.fillStyle='#2f2a36'; c.fillRect(x-6,y-h,12,h); rr(c,x-26,y-h-40,52,44,10,'#2f2a36'); f2ell(c,x,y-h-16,16,14,on?'#ffe7a8':'#d9d4c8'); if(on){ const g=c.createRadialGradient(x,y-h-16,4,x,y-h-16,120); g.addColorStop(0,'rgba(255,220,140,0.45)'); g.addColorStop(1,'rgba(255,220,140,0)'); c.fillStyle=g; c.fillRect(x-120,y-h-136,240,240); } }
function f2lights(c,x0,x1,y,sag,t,n){ c.strokeStyle='rgba(40,30,30,0.6)'; c.lineWidth=3; c.beginPath(); for(let i=0;i<=40;i++){ const u=i/40, x=x0+(x1-x0)*u, yy=y+Math.sin(u*Math.PI)*sag; i?c.lineTo(x,yy):c.moveTo(x,yy); } c.stroke();
  const cols=['#ffd36a','#ff8a5a','#9fe3ff','#ffffff','#ffb3d1']; for(let i=1;i<n;i++){ const u=i/n, x=x0+(x1-x0)*u, yy=y+Math.sin(u*Math.PI)*sag+10; const a=0.75+0.25*Math.sin(t*3+i); c.globalAlpha=a; f2ell(c,x,yy,9,12,cols[i%5]); c.globalAlpha=1; } }
function f2bird(c,x,y,s,t){ const w=Math.sin(t*9)*0.5; c.strokeStyle='#2a2f3a'; c.lineWidth=4; c.lineCap='round'; c.beginPath(); c.moveTo(x-s,y-s*w*0.6); c.quadraticCurveTo(x-s*0.4,y-s*0.5,x,y); c.quadraticCurveTo(x+s*0.4,y-s*0.5,x+s,y-s*w*0.6); c.stroke(); }
function f2detail(c,name,t,p){
  if(name==='kitchen'){ const ty=(p.tableY||0.66)*H;
    // backsplash tiles behind the counter
    c.fillStyle='#e9efe9'; c.fillRect(0,ty-230,W,230); c.strokeStyle='rgba(60,90,100,0.18)'; c.lineWidth=3; for(let x=0;x<W;x+=60){ c.beginPath(); c.moveTo(x,ty-230); c.lineTo(x,ty); c.stroke(); } for(let y=ty-230;y<ty;y+=60){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    // window with curtains
    const wx=330, wy=470, ww=300, wh=300; rr(c,wx-14,wy-14,ww+28,wh+28,14,'#f4f1ea'); const sk=c.createLinearGradient(0,wy,0,wy+wh); sk.addColorStop(0,'#9fd6f2'); sk.addColorStop(1,'#dff3fb'); c.fillStyle=sk; c.fillRect(wx,wy,ww,wh); f2ell(c,wx+210,wy+90,40,22,'#ffffff'); c.fillStyle='#f4f1ea'; c.fillRect(wx+ww/2-5,wy,10,wh); c.fillRect(wx,wy+wh/2-5,ww,10);
    c.fillStyle='#f2c94c'; c.beginPath(); c.moveTo(wx-30,wy-30); c.lineTo(wx+70,wy-30); c.quadraticCurveTo(wx+10,wy+150,wx+30,wy+wh+10); c.lineTo(wx-30,wy+wh+10); c.fill(); c.beginPath(); c.moveTo(wx+ww+30,wy-30); c.lineTo(wx+ww-70,wy-30); c.quadraticCurveTo(wx+ww-10,wy+150,wx+ww-30,wy+wh+10); c.lineTo(wx+ww+30,wy+wh+10); c.fill(); c.fillStyle='#8a5a34'; c.fillRect(wx-50,wy-40,ww+100,12);
    // clock
    f2ell(c,860,560,62,62,'#f4f1ea'); c.strokeStyle='#2a2f36'; c.lineWidth=7; c.beginPath(); c.arc(860,560,62,0,Math.PI*2); c.stroke(); c.lineWidth=6; c.beginPath(); c.moveTo(860,560); c.lineTo(860+Math.sin(t*0.6)*38,560-Math.cos(t*0.6)*38); c.moveTo(860,560); c.lineTo(860+22,560+8); c.stroke();
    // hanging plant
    c.strokeStyle='#5a3a22'; c.lineWidth=3; c.beginPath(); c.moveTo(130,366); c.lineTo(110,450); c.moveTo(130,366); c.lineTo(150,450); c.stroke(); rr(c,95,450,70,52,12,'#c96a4b'); c.fillStyle='#3f8f3a'; for(let i=0;i<7;i++){ c.beginPath(); c.ellipse(105+i*9,505+i*16,10,18,0.4,0,Math.PI*2); c.fill(); }
    return; }
  if(name==='patio'){ // parrilla, string lights, chair
    rr(c,600,690,340,410,10,'#b5532f'); c.strokeStyle='rgba(60,20,10,0.25)'; c.lineWidth=3; for(let y=710;y<1100;y+=34){ c.beginPath(); c.moveTo(600,y); c.lineTo(940,y); c.stroke(); for(let x=600+((y/34)%2)*30;x<940;x+=60){ c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+34); c.stroke(); } }
    rr(c,640,820,260,150,8,'#2a1a14'); const g=c.createLinearGradient(0,900,0,970); g.addColorStop(0,'rgba(255,120,40,0)'); g.addColorStop(1,'rgba(255,140,60,'+(0.55+0.15*Math.sin(t*5))+')'); c.fillStyle=g; c.fillRect(640,880,260,90); c.strokeStyle='#5a5a5a'; c.lineWidth=4; for(let x=650;x<900;x+=22){ c.beginPath(); c.moveTo(x,850); c.lineTo(x,870); c.stroke(); } c.fillRect(640,852,260,4);
    rr(c,720,560,100,140,6,'#a8472a'); f2lights(c,-20,W+20,170,90,t,14);
    c.fillStyle='#8a5a34'; rr(c,110,980,120,16,4,'#8a5a34'); c.fillRect(112,860,14,240); c.fillRect(214,996,14,104); c.fillRect(112,996,14,104); rr(c,108,860,24,140,6,'#8a5a34'); return; }
  if(name==='park'){ c.fillStyle='#d9c79a'; c.beginPath(); c.moveTo(380,955); c.lineTo(700,955); c.lineTo(1080,1920); c.lineTo(-200,1920); c.fill(); c.fillStyle='rgba(0,0,0,0.05)'; for(let y=980;y<1920;y+=70) c.fillRect(0,y,W,6);
    f2bench(c,860,1010,190); f2lamp(c,160,1000,330,false); const r=rng(9); for(let i=0;i<70;i++){ const x=r()*W, y=1000+r()*880; if(x>300&&x<800&&y<1300) continue; f2ell(c,x,y,7,7,['#ffffff','#ffd94a','#f28bb0','#b9a3ff'][i%4]); }
    for(let i=0;i<3;i++) f2bird(c,(200+i*90+t*40)%(W+200)-100,200+i*30,22,t+i); return; }
  if(name==='plaza'){ f2lights(c,-20,W+20,560,110,t,16); f2bench(c,180,1080,200,'#6b4a3a'); f2lamp(c,920,1060,0,false);
    for(let i=0;i<4;i++){ const x=380+i*95+Math.sin(t*2+i)*6, y=1330+(i%2)*26, k=0.8; f2ell(c,x,y+10,20*k,5*k,'rgba(0,0,0,0.15)'); f2ell(c,x,y,22*k,14*k,'#8a8f9a'); f2ell(c,x+16*k,y-12*k,9*k,9*k,'#6b707a'); f2ell(c,x+22*k,y-12*k,3*k,2*k,'#e0a040'); } return; }
  if(name==='beach'){ c.strokeStyle='#f4f1ea'; c.lineWidth=10; c.beginPath(); c.moveTo(860,1380); c.lineTo(840,1080); c.stroke(); c.fillStyle='#e5483a'; c.beginPath(); c.moveTo(640,1110); c.quadraticCurveTo(840,960,1040,1110); c.fill(); c.fillStyle='#ffffff'; c.beginPath(); c.moveTo(780,1060); c.lineTo(840,1010); c.lineTo(900,1060); c.fill();
    rr(c,620,1400,260,90,10,'#3b82f6'); c.fillStyle='#ffffff'; for(let x=640;x<870;x+=50) c.fillRect(x,1400,18,90); for(let i=0;i<3;i++) f2bird(c,(150+i*120+t*35)%(W+200)-100,240+i*40,26,t+i); return; }
}
function f2fore(c,name,t,p){ if(name!=='kitchen'||p.table===false) return; const ty=(p.tableY||0.66)*H;
  const g=c.createLinearGradient(0,ty,0,ty+340); g.addColorStop(0,'#9a6a40'); g.addColorStop(1,'#5e3a20'); c.fillStyle=g; c.fillRect(0,ty+18,W,330); c.fillStyle='#b98352'; c.fillRect(0,ty-12,W,34);
  c.fillStyle='rgba(0,0,0,0.12)'; for(let y=ty+70;y<ty+340;y+=46) c.fillRect(0,y,W,4); c.fillStyle='#2a1d16'; c.fillRect(0,ty+348,W,H-ty-348);
  (p.tableObjs||[]).forEach((o,i)=>f2obj(c,{...o,y:o.y??(ty/H+0.005)},1,t,3,i));
  if(p.counterProps!==false){ f2kettle(c,955,ty-10,92); f2yerba(c,90,ty-8,118,'#2f9e44'); rr(c,150,ty-52,44,46,9,'#f4f1ea'); rr(c,150,ty-62,44,14,5,'#c96a4b'); } }
function f2mate(c,x,y,s,type,t,o={}){ // bottom-center at (x,y), s = height
  c.save(); c.translate(x,y); if(o.rot) c.rotate(o.rot);
  const w=s*0.98, h=s*0.82, cy=-h/2; c.fillStyle='rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0,0,w*0.42,s*0.05,0,0,Math.PI*2); c.fill();
  // bombilla behind the rim
  const bx=s*0.06, by=-h*0.98; c.strokeStyle='#cfd6dd'; c.lineWidth=Math.max(3,s*0.06); c.lineCap='round'; c.beginPath(); c.moveTo(bx,by+s*0.1); c.lineTo(bx+s*0.18,by-s*0.55); c.stroke(); c.strokeStyle='#e9eef2'; c.lineWidth=Math.max(2,s*0.025); c.beginPath(); c.moveTo(bx+s*0.02,by+s*0.05); c.lineTo(bx+s*0.18,by-s*0.5); c.stroke();
  rr(c,bx+s*0.13,by-s*0.62,s*0.1,s*0.1,s*0.03,'#b98a2e');
  let base=o.color||(type==='madera'?'#a0673a':type==='acero'?'#9aa6b2':type==='imperial'?'#5a3622':'#c07438');
  const g=c.createRadialGradient(-w*0.18,cy-h*0.15,s*0.05,0,cy,w*0.6); g.addColorStop(0,f2shade(base,0.28)); g.addColorStop(1,f2shade(base,-0.32)); c.fillStyle=g; c.beginPath(); c.ellipse(0,cy,w/2,h/2,0,0,Math.PI*2); c.fill();
  c.save(); c.beginPath(); c.ellipse(0,cy,w/2,h/2,0,0,Math.PI*2); c.clip();
  if(type==='madera'){ c.strokeStyle='rgba(60,30,10,0.25)'; c.lineWidth=Math.max(1.5,s*0.012); for(let i=-2;i<=2;i++){ c.beginPath(); c.ellipse(i*w*0.1,cy,w*0.06+Math.abs(i)*w*0.06,h*0.42,0,0,Math.PI*2); c.stroke(); } }
  else { c.setLineDash([s*0.05,s*0.035]); c.strokeStyle='rgba(60,25,8,0.55)'; c.lineWidth=Math.max(1.5,s*0.016); [0.05,0.28].forEach(k=>{ c.beginPath(); c.ellipse(0,cy+h*k,w*0.47,h*0.1,0,0,Math.PI); c.stroke(); }); c.setLineDash([]); }
  c.restore();
  c.strokeStyle='rgba(255,255,255,0.35)'; c.lineWidth=Math.max(2,s*0.035); c.beginPath(); c.ellipse(0,cy,w*0.36,h*0.36,0,Math.PI*1.08,Math.PI*1.38); c.stroke();
  // rim + yerba
  if(type==='imperial'){ rr(c,-w*0.36,-h*1.02,w*0.72,h*0.16,s*0.04,'#d6dde3'); }
  f2ell(c,0,-h*0.93,w*0.33,h*0.09,type==='acero'?'#c4ccd4':'#dfe5ea'); f2ell(c,0,-h*0.93,w*0.28,h*0.065,'#6fae3a'); f2ell(c,-w*0.06,-h*0.945,w*0.12,h*0.025,'#8ccc52');
  // bombilla in front of yerba (top part)
  c.strokeStyle='#d7dde3'; c.lineWidth=Math.max(3,s*0.055); c.beginPath(); c.moveTo(bx+s*0.03,-h*0.95); c.lineTo(bx+s*0.18,by-s*0.55); c.stroke();
  if(o.steam){ c.strokeStyle='rgba(255,255,255,0.55)'; c.lineWidth=Math.max(3,s*0.03); for(let i=0;i<3;i++){ const ph=(t*0.8+i/3)%1; c.globalAlpha=Math.sin(ph*Math.PI)*0.8; c.beginPath(); const x0=(i-1)*w*0.15, y0=-h*1.05-ph*s*0.6; c.moveTo(x0,y0); c.bezierCurveTo(x0+s*0.08,y0-s*0.12,x0-s*0.08,y0-s*0.22,x0,y0-s*0.32); c.stroke(); } c.globalAlpha=1; }
  if(o.face){ const fy=cy+h*0.02; c.fillStyle='#1b120e'; const blink=(t%3.2)<0.12; if(blink){ c.fillRect(-w*0.17-s*0.035,fy,s*0.07,s*0.012); c.fillRect(w*0.17-s*0.035,fy,s*0.07,s*0.012); } else { f2ell(c,-w*0.17,fy,s*0.035,s*0.045,'#1b120e'); f2ell(c,w*0.17,fy,s*0.035,s*0.045,'#1b120e'); }
    c.strokeStyle='#1b120e'; c.lineWidth=s*0.025; c.beginPath(); if(o.face==='surprised') { f2ell(c,0,fy+h*0.18,s*0.045,s*0.06,'#5a1f14'); } else { c.arc(0,fy+h*0.08,s*0.09,0.15*Math.PI,0.85*Math.PI); c.stroke(); } f2ell(c,-w*0.3,fy+h*0.1,s*0.05,s*0.03,'rgba(255,120,120,0.45)'); f2ell(c,w*0.3,fy+h*0.1,s*0.05,s*0.03,'rgba(255,120,120,0.45)'); }
  c.restore();
}
function f2termo(c,x,y,s,col,o={}){ c.save(); c.translate(x,y); if(o.rot) c.rotate(o.rot); const w=s*0.3; col=col||'#2f6f9f';
  const g=c.createLinearGradient(-w/2,0,w/2,0); g.addColorStop(0,f2shade(col,0.18)); g.addColorStop(0.6,col); g.addColorStop(1,f2shade(col,-0.3)); rr(c,-w/2,-s*0.86,w,s*0.86,w*0.22,g);
  rr(c,-w*0.42,-s,w*0.84,s*0.17,w*0.15,'#2a2f36'); rr(c,w*0.25,-s*0.95,w*0.32,s*0.07,w*0.06,'#2a2f36'); c.fillStyle='rgba(255,255,255,0.28)'; c.fillRect(-w*0.32,-s*0.78,w*0.1,s*0.66); rr(c,-w/2,-s*0.5,w,s*0.08,4,'rgba(0,0,0,0.15)'); c.restore(); }
function f2yerba(c,x,y,s,col){ c.save(); c.translate(x,y); const w=s*0.62; rr(c,-w/2,-s,w,s,s*0.04,'#f2e6cf'); c.fillStyle=col||'#2f9e44'; c.fillRect(-w/2,-s*0.62,w,s*0.3); c.fillStyle='#fff'; c.font=`900 ${Math.round(s*0.11)}px Montserrat`; c.textAlign='center'; c.textBaseline='middle'; c.fillText('YERBA',0,-s*0.47); c.fillStyle='#c96a4b'; c.fillRect(-w/2,-s*0.98,w,s*0.06); f2ell(c,0,-s*0.18,s*0.12,s*0.09,'#6fae3a'); c.restore(); }
function f2heart(c,x,y,s,col){ c.save(); c.translate(x,y); c.scale(s/100,s/100); c.fillStyle=col||'#e5483a'; c.beginPath(); c.moveTo(0,30); c.bezierCurveTo(-60,-10,-40,-60,0,-30); c.bezierCurveTo(40,-60,60,-10,0,30); c.fill(); c.restore(); }
function f2face(c,face,k,t,hx,hy){ const ex=24*k, ey=hy-6*k, ink='#1b120e'; c.fillStyle=ink; c.strokeStyle=ink; c.lineCap='round'; c.lineWidth=6*k;
  const blink=(t+hx*0.01)%3.4<0.12&&(face==='neutral'||face==='smile'||face==='surprised');
  const dot=(x,r)=>{ if(blink){ c.fillRect(x-r,ey-2*k,2*r,4*k); } else f2ell(c,x,ey,r,r*1.2,ink); };
  const arcEye=(x)=>{ c.beginPath(); c.arc(x,ey+4*k,9*k,1.15*Math.PI,1.85*Math.PI); c.stroke(); };
  if(face==='happy'||face==='laugh'||face==='proud') { arcEye(hx-ex); arcEye(hx+ex); }
  else if(face==='love'){ f2heart(c,hx-ex,ey+4*k,26*k,'#e5483a'); f2heart(c,hx+ex,ey+4*k,26*k,'#e5483a'); }
  else { const r=face==='surprised'?10*k:7.5*k; dot(hx-ex,r); dot(hx+ex,r); }
  c.lineWidth=5*k; c.beginPath();
  if(face==='surprised'){ c.moveTo(hx-ex-10*k,ey-22*k); c.lineTo(hx-ex+10*k,ey-26*k); c.moveTo(hx+ex-10*k,ey-26*k); c.lineTo(hx+ex+10*k,ey-22*k); }
  if(face==='sad'){ c.moveTo(hx-ex-10*k,ey-16*k); c.lineTo(hx-ex+10*k,ey-22*k); c.moveTo(hx+ex-10*k,ey-22*k); c.lineTo(hx+ex+10*k,ey-16*k); }
  if(face==='angry'){ c.moveTo(hx-ex-12*k,ey-24*k); c.lineTo(hx-ex+10*k,ey-14*k); c.moveTo(hx+ex-10*k,ey-14*k); c.lineTo(hx+ex+12*k,ey-24*k); }
  c.stroke(); const my=hy+26*k; c.lineWidth=6*k; c.beginPath();
  if(face==='surprised'){ f2ell(c,hx,my+4*k,9*k,12*k,'#5a1f14'); }
  else if(face==='laugh'||face==='happy'){ c.moveTo(hx-20*k,my-4*k); c.quadraticCurveTo(hx,my+(face==='laugh'?34:26)*k,hx+20*k,my-4*k); c.closePath(); c.fillStyle='#5a1f14'; c.fill(); }
  else if(face==='sad'||face==='angry'){ c.arc(hx,my+16*k,13*k,1.2*Math.PI,1.8*Math.PI); c.stroke(); }
  else if(face==='sip'){ f2ell(c,hx,my+2*k,9*k,9*k,'#5a1f14'); }
  else if(face==='neutral'){ c.moveTo(hx-9*k,my+2*k); c.lineTo(hx+9*k,my+2*k); c.stroke(); }
  else { c.arc(hx,my-6*k,15*k,0.2*Math.PI,0.8*Math.PI); c.stroke(); }
  f2ell(c,hx-40*k,hy+14*k,11*k,7*k,'rgba(240,110,100,0.35)'); f2ell(c,hx+40*k,hy+14*k,11*k,7*k,'rgba(240,110,100,0.35)'); }
// 2-bone IK: shoulder S, hand target T -> elbow; the elbow bends outwards (side = -1 left, +1 right)
function f2ik(Sx,Sy,Tx,Ty,L1,L2,side){ const dx=Tx-Sx, dy=Ty-Sy; let d=Math.hypot(dx,dy)||1e-3; const maxD=(L1+L2)*0.995; const k=Math.min(1,maxD/d); d=Math.min(d,maxD); const tx=Sx+dx*k, ty=Sy+dy*k;
  const a=Math.atan2(dy,dx), cb=clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1), bb=Math.acos(cb); const e1=[Sx+Math.cos(a+bb)*L1,Sy+Math.sin(a+bb)*L1], e2=[Sx+Math.cos(a-bb)*L1,Sy+Math.sin(a-bb)*L1];
  const pick=(e1[0]*side+e1[1]*0.35)>(e2[0]*side+e2[1]*0.35)?e1:e2; return {e:pick,h:[tx,ty]}; }
// hand targets per act (local units of a 520 px figure; y up is negative). Returns {L:[x,y],R:[x,y], sipK}
function f2targets(o,act,t,u,HX,HY){ const sw=Math.sin(t*2.1+(o.i||0)), rest=side=>[side*74+side*3*sw,-150+2*Math.cos(t*2.1)];
  const T={L:rest(-1),R:rest(1)}; const hold=o.hold;
  const chest=[22,-212], hip=[-74,-178];
  if(hold==='mate'||hold==='both'||o.carry) T.R=chest; if(hold==='termo'||hold==='both') T.L=hip;
  let sipK=0;
  if(act==='drink'){ const cyc=(t*0.55+0.15)%1; sipK=cyc<0.15?easeInOut(cyc/0.15):cyc<0.6?1:cyc<0.75?1-easeInOut((cyc-0.6)/0.15):0; const ms=76, rr0=-0.25*sipK, tx=0.24*ms, ty=-1.37*ms, ox=-0.3*ms+tx*Math.cos(rr0)-ty*Math.sin(rr0), oy=0.36*ms+tx*Math.sin(rr0)+ty*Math.cos(rr0); const mouth=[HX-ox,HY+28-oy]; T.R=[chest[0]+(mouth[0]-chest[0])*sipK,chest[1]+(mouth[1]-chest[1])*sipK]; }
  if(act==='pass'||act==='offer'){ const r=easeOut(clamp(u/0.25)); T.R=[chest[0]+(168-chest[0])*r,chest[1]+(-300-chest[1])*r]; }
  if(act==='receive'){ const r=easeOut(clamp((u-0.3)/0.3)); T.R=[74+(168-74)*r,-150+(-300+150)*r]; }
  if(act==='point') T.R=[176,-338];
  if(act==='wave') T.R=[118+26*Math.sin(t*10),-540];
  if(act==='cheer'||act==='jump'){ T.L=[-96,-565+14*Math.sin(t*10)]; T.R=[96,-565-14*Math.sin(t*10)]; }
  if(act==='shock'){ T.L=[-92,-440]; T.R=[92,-440]; }
  if(act==='hug'){ const fl=6*Math.sin(t*6); T.L=[-158,-292+fl]; T.R=[158,-292-fl]; }
  if(act==='laugh'){ T.L=[-40,-215]; T.R=[40,-215]; }
  if(act==='sigh'){ T.L=[-70,-140]; T.R=[70,-140]; }
  // ease in from the rest pose at the start of the shot so arms never pop
  const bl=easeOut(clamp(t/0.35)); for(const nm of ['L','R']){ const r=rest(nm==='L'?-1:1); if(T[nm]!==r) T[nm]=[r[0]+(T[nm][0]-r[0])*bl,r[1]+(T[nm][1]-r[1])*bl]; }
  return {...T,sipK}; }
function f2palm(c,x,y,k,skin){ f2ell(c,x,y+2*k,15*k,16*k,f2shade(skin,-0.06)); }
// fingers wrapping the front of a held object (side +1 right hand: fingers point to the body centre)
function f2fingers(c,x,y,k,skin,side,band){ c.save(); const sh=f2shade(skin,-0.12);
  if(band){ rr(c,x-15*k,y-9*k,30*k,20*k,9*k,skin); c.fillStyle=sh; for(let i=-1;i<=1;i++) c.fillRect(x-1*k+i*9*k,y-7*k,1.6*k,16*k); f2ell(c,x+side*15*k,y-4*k,6*k,8*k,skin); c.restore(); return; }
  for(let i=0;i<3;i++){ const fy=y-7*k+i*8.5*k, fx=x-side*(9*k+i*1.5*k); f2ell(c,fx,fy,9*k,4.6*k,skin); c.strokeStyle=sh; c.lineWidth=1.3*k; c.beginPath(); c.ellipse(fx,fy,9*k,4.6*k,0,0,Math.PI*2); c.stroke(); }
  f2ell(c,x+side*3*k,y-12*k,6*k,8*k,skin); c.restore(); }
// whole hand in front, grasping the side of the gourd: back of the hand on the rim, fingers curl over the front, joined to the hand (no loose fingers)
function f2grip(c,x,y,k,skin,side){ const sh=f2shade(skin,-0.12); c.save(); f2ell(c,x+side*2*k,y+1*k,14*k,17*k,skin); for(let i=0;i<3;i++){ const fy=y-8*k+i*8*k, fx=x-side*(10*k+i*1.2*k); f2ell(c,fx,fy,10*k,4.4*k,skin); c.strokeStyle=sh; c.lineWidth=1.2*k; c.beginPath(); c.moveTo(fx-side*9*k,fy); c.quadraticCurveTo(fx,fy+4.4*k,fx+side*6*k,fy+3.6*k); c.stroke(); } c.restore(); }
function f2hand(c,x,y,k,skin,side){ f2ell(c,x,y,15*k,15*k,skin); f2ell(c,x-side*9*k,y-7*k,7*k,9*k,f2shade(skin,-0.08)); }
function f2person(c,o,t,u){ const S=o.s||520, k=S/520; const act=o.act||null, face=o.face||'smile';
  let by=Math.sin(t*2.6+o.x*0.01)*2*k, hx=0, hy=0;
  if(act==='jump') by=-Math.abs(Math.sin(t*6))*70*k; if(act==='laugh'||act==='cheer') by=-Math.abs(Math.sin(t*12))*12*k;
  if(act==='nod') hy=Math.max(0,Math.sin(t*9))*8*k; if(act==='no') hx=Math.sin(t*11)*10*k; if(act==='shock') hx=Math.sin(t*40)*2*k; if(act==='sigh') hy=6*k;
  const a0=clamp((u*(o.dur||3)-(o.delay||0))/0.3); if(a0<=0.001) return; const app=0.86+0.14*easeOutBack(a0);
  c.save(); c.globalAlpha=Math.min(1,a0*1.8); c.translate(o.x,o.y); const fx=o.flip?-1:1; c.scale(app*fx,app); c.translate(0,by);
  const skin=o.skin, shirt=o.shirt, pants=o.pants||'#2b3a55', hair=o.hair, sleeve=f2shade(shirt,-0.08);
  c.fillStyle='rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0,-by,70*k,12*k,0,0,Math.PI*2); c.fill();
  const legTop=-150*k; c.fillStyle=o.shorts?skin:pants; c.fillRect(-36*k,legTop,26*k,140*k); c.fillRect(10*k,legTop,26*k,140*k);
  if(o.shorts){ c.fillStyle=pants; c.fillRect(-40*k,legTop-6*k,80*k,60*k); if(o.socks){ c.fillStyle=o.socks; c.fillRect(-36*k,-62*k,26*k,52*k); c.fillRect(10*k,-62*k,26*k,52*k); } }
  f2ell(c,-26*k,-8*k,26*k,12*k,'#1d1d22'); f2ell(c,26*k,-8*k,26*k,12*k,'#1d1d22');
  const HY=-420*k+hy, HX=hx; if(o.hairStyle==='long'){ rr(c,HX-66*k,HY-30*k,132*k,150*k,50*k,hair); }
  c.fillStyle=pants; rr(c,-58*k,-185*k,116*k,50*k,14*k,pants);
  const g=c.createLinearGradient(-60*k,-330*k,60*k,-150*k); g.addColorStop(0,f2shade(shirt,0.12)); g.addColorStop(1,f2shade(shirt,-0.12)); rr(c,-62*k,-335*k,124*k,175*k,34*k,g);
  c.save(); c.beginPath(); c.roundRect(-62*k,-335*k,124*k,175*k,34*k); c.clip();
  if(o.stripes==='sash'&&o.stripe){ c.strokeStyle=o.stripe; c.lineWidth=30*k; c.beginPath(); c.moveTo(-70*k,-340*k); c.lineTo(70*k,-150*k); c.stroke(); }
  if(o.stripes==='v'&&o.stripe){ c.fillStyle=o.stripe; for(let x=-50;x<=50;x+=40) c.fillRect(x*k-8*k,-335*k,16*k,175*k); }
  if(o.stripes==='h'&&o.stripe){ c.fillStyle=o.stripe; for(let y=-320;y<-160;y+=40) c.fillRect(-62*k,y*k,124*k,16*k); }
  if(o.scarf){ c.fillStyle=o.scarf; c.fillRect(-62*k,-335*k,124*k,26*k); c.fillRect(18*k,-320*k,22*k,80*k); }
  c.restore();
  c.fillStyle=skin; c.fillRect(-14*k+HX*0.5,-352*k,28*k,24*k);
  c.fillStyle=f2shade(shirt,-0.22); c.beginPath(); c.moveTo(-26*k,-335*k); c.lineTo(0,-300*k); c.lineTo(26*k,-335*k); c.closePath(); c.fill(); c.fillStyle=skin; c.beginPath(); c.moveTo(-17*k,-335*k); c.lineTo(0,-310*k); c.lineTo(17*k,-335*k); c.closePath(); c.fill();
  rr(c,-46*k,-292*k,26*k,24*k,4*k,f2shade(shirt,-0.14)); c.fillStyle='rgba(0,0,0,0.12)'; c.fillRect(-46*k,-292*k,26*k,5*k);
  // arms via IK (sleeve = upper arm, skin = forearm); hands are drawn last, over the props
  const T=f2targets(o,act,t,u,HX/k,HY/k); const L1=95*k, L2=88*k; const hands={}, arms={};
  [['L',-1],['R',1]].forEach(([nm,side])=>{ const sx=side*56*k, sy=-318*k; const r=f2ik(sx,sy,T[nm][0]*k,T[nm][1]*k,L1,L2,side); arms[nm]={s:[sx,sy],e:r.e,h:r.h,side}; hands[nm]=r.h; });
  const drawArm=(A)=>{ c.lineCap='round'; c.lineJoin='round'; c.strokeStyle=skin; c.lineWidth=24*k; c.beginPath(); c.moveTo(A.e[0],A.e[1]); c.lineTo(A.h[0],A.h[1]); c.stroke(); c.strokeStyle=sleeve; c.lineWidth=31*k; c.beginPath(); c.moveTo(A.s[0],A.s[1]); c.lineTo(A.e[0],A.e[1]); c.stroke(); };
  const raised=nm=>T[nm][1]<-380;  // arms above the shoulders go in front of the head
  ['L','R'].forEach(nm=>{ if(!raised(nm)) drawArm(arms[nm]); });
  // head
  f2ell(c,HX-62*k,HY+6*k,12*k,16*k,f2shade(skin,-0.06)); f2ell(c,HX+62*k,HY+6*k,12*k,16*k,f2shade(skin,-0.06)); f2ell(c,HX,HY,64*k,72*k,skin);
  const hs=o.hairStyle||'short';
  if(hs!=='bald'){ c.save(); c.beginPath(); c.ellipse(HX,HY-4*k,68*k,78*k,0,0,Math.PI*2); c.clip(); c.fillStyle=hair; c.beginPath(); c.moveTo(HX-72*k,HY+2*k); c.quadraticCurveTo(HX-40*k,HY-52*k,HX+6*k,HY-46*k); c.quadraticCurveTo(HX+42*k,HY-40*k,HX+72*k,HY-2*k); c.lineTo(HX+72*k,HY-110*k); c.lineTo(HX-72*k,HY-110*k); c.closePath(); c.fill(); c.restore();
    if(hs==='curly'){ c.fillStyle=hair; for(let i=0;i<9;i++){ const a=Math.PI*(1.0+i/8); c.beginPath(); c.arc(HX+Math.cos(a)*62*k,HY-8*k+Math.sin(a)*68*k,24*k,0,Math.PI*2); c.fill(); } }
    if(hs==='bun') f2ell(c,HX,HY-86*k,30*k,26*k,hair);
    if(hs==='long'){ c.fillStyle=hair; c.fillRect(HX-68*k,HY-20*k,18*k,100*k); c.fillRect(HX+50*k,HY-20*k,18*k,100*k); }
    if(hs==='cap'){ rr(c,HX-66*k,HY-76*k,132*k,46*k,22*k,o.capColor||'#e5483a'); rr(c,HX-10*k,HY-44*k,94*k,16*k,8*k,f2shade(o.capColor||'#e5483a',-0.25)); } }
  if(o.beard){ c.fillStyle=hair; c.beginPath(); c.ellipse(HX,HY+38*k,48*k,32*k,0,0,Math.PI); c.fill(); }
  if(o.glasses){ c.strokeStyle='#1b120e'; c.lineWidth=4*k; c.beginPath(); c.arc(HX-24*k,HY-4*k,16*k,0,Math.PI*2); c.moveTo(HX+40*k,HY-4*k); c.arc(HX+24*k,HY-4*k,16*k,0,Math.PI*2); c.moveTo(HX-8*k,HY-4*k); c.lineTo(HX+8*k,HY-4*k); c.stroke(); }
  if(hs!=='bald'&&hs!=='cap'){ c.strokeStyle='rgba(255,255,255,0.18)'; c.lineWidth=7*k; c.lineCap='round'; c.beginPath(); c.arc(HX-12*k,HY-26*k,40*k,Math.PI*1.15,Math.PI*1.45); c.stroke(); }
  const fc2=act==='drink'&&T.sipK>0.6?'sip':face; if(['sip','neutral','smile','happy','laugh','proud','love'].includes(fc2)){ c.strokeStyle=f2shade(hair||'#2b1d16',0.05); c.lineWidth=5*k; c.lineCap='round'; c.beginPath(); c.moveTo(HX-34*k,HY-30*k); c.quadraticCurveTo(HX-24*k,HY-36*k,HX-12*k,HY-31*k); c.moveTo(HX+12*k,HY-31*k); c.quadraticCurveTo(HX+24*k,HY-36*k,HX+34*k,HY-30*k); c.stroke(); }
  f2ell(c,HX+2*k,HY+10*k,7*k,5*k,f2shade(skin,-0.12));
  f2face(c,fc2,k,t,HX,HY);
  ['L','R'].forEach(nm=>{ if(raised(nm)) drawArm(arms[nm]); });
  // props sit in the hand: drawn after the arm, before the hand, so the fingers wrap around them
  const holdsMate=o.carry!==false&&(o.carry||o.hold==='mate'||o.hold==='both'||act==='drink'||((act==='pass'||act==='offer')&&!o.passing));
  const holdsTermo=o.hold==='termo'||o.hold==='both';
  // palms first (behind the props)
  if(!holdsMate) f2hand(c,hands.R[0],hands.R[1],k,skin,1);
  if(holdsTermo) f2palm(c,hands.L[0],hands.L[1],k,skin); else f2hand(c,hands.L[0],hands.L[1],k,skin,-1);
  // the prop sits in the hand: the gourd's outer lower side rests on the palm
  if(holdsMate){ const [x,y]=hands.R; const ms=76*k; f2mate(c,x-ms*0.3,y+ms*0.36,ms,o.mate||'calabaza',t,{steam:o.steam,rot:act==='drink'?-0.25*T.sipK:0}); f2grip(c,x,y,k,skin,1); }
  if(holdsTermo){ const [x,y]=hands.L; const ts=128*k; f2termo(c,x+2*k,y+ts*0.55,ts,o.termo); f2fingers(c,x+2*k,y,k,skin,-1,true); }
  if(act==='hug'){ const b=1+0.12*Math.sin(t*8); f2heart(c,0,-470*k-90*k*b,70*k*b,'#e5483a'); }
  c.restore();
  const W2=(p)=>[o.x+fx*app*p[0],o.y+app*(by+p[1])]; return {L:W2(hands.L),R:W2(hands.R),k:k*app}; }
function f2label(c,l,u,i,acc){ const a=easeOutBack(clamp((u-(l.u??(0.15+i*0.12)))/0.12)); if(a<=0.001) return; const x=l.x*W, y=l.y*H, tx=(l.tx??l.x)*W, ty=(l.ty??(l.y-0.08))*H;
  c.save(); c.strokeStyle='rgba(255,255,255,0.85)'; c.lineWidth=4; c.setLineDash([10,8]); c.beginPath(); c.moveTo(x,y); c.lineTo(x+(tx-x)*a,y+(ty-y)*a); c.stroke(); c.setLineDash([]); f2ell(c,x,y,9,9,'#fff');
  c.translate(tx,ty); c.scale(a,a); c.font='900 40px Montserrat'; const w=c.measureText(l.text).width+56; c.fillStyle='rgba(16,24,36,0.88)'; c.beginPath(); c.roundRect(-w/2,-34,w,68,34); c.fill(); c.lineWidth=4; c.strokeStyle=l.color||acc; c.stroke(); c.fillStyle=l.color||acc; c.textAlign='center'; c.textBaseline='middle'; c.fillText(l.text,0,2); c.restore(); }
function drawFlat(c,p,u,t,sh){ c.save(); const z=(sh?.zoom||1)*(1+0.05*u)*(1+0.08*Math.pow(1-clamp(t/0.3),3)); const fc=sh?.c||[0.5,0.55];
  const drift=p.drift??E.tl?.style?.drift??0; const zz=z*(drift?1.05:1); c.translate(fc[0]*W,fc[1]*H); c.scale(zz,zz); c.translate(-fc[0]*W,-fc[1]*H);
  const dir=(Math.round((sh?.start||0)*3)%2)?1:-1, dx=drift*dir*(ease(u)-0.5)*56;
  c.save(); c.translate(dx*0.35,0); f2scene(c,p.scene||'solid',t,p); if(p.details!==false) f2detail(c,p.scene,t,p); c.restore(); c.translate(dx,0); const dur=sh?.dur||3;
  const defFace=SEGFACE[sh?.segEmo]||'smile'; const emo=sh?.emo||{};
  const ppl=(p.people||[]).map((q,i)=>{ const hit=emo.who==null||emo.who==='all'||emo.who===i||(Array.isArray(emo.who)&&emo.who.includes(i));
    return { skin:F2.skins[(q.who??i)%6], hair:F2.hairs[(q.who??i)%6], hairStyle:F2.styles[(q.who??i)%6], shirt:F2.shirts[(q.who??i)%8], ...q, x:(q.x??0.5)*W, y:(q.y??0.8)*H, face:q.face||(hit&&emo.face)||defFace, carry:p.pass?(p.pass.from===i?(passM(u)<=0.001?true:false):p.pass.to===i?(passM(u)>=0.999?true:false):undefined):undefined, act:p.pass&&p.pass.to===i&&!q.act?'receive':(q.act||(hit?emo.act:null)), dur, delay:q.delay??i*0.08, i }; });
  ppl.filter(q=>q.back).forEach(q=>f2person(c,q,t,u));
  (p.objs||[]).filter(o=>o.back).forEach((o,i)=>f2obj(c,o,u,t,dur,i));
  const hands=[]; ppl.filter(q=>!q.back).sort((a,b)=>a.y-b.y).forEach(q=>{ hands[q.i]=f2person(c,q,t,u); });
  f2fore(c,p.scene,t,p); (p.objs||[]).filter(o=>!o.back).forEach((o,i)=>f2obj(c,o,u,t,dur,i));
  if(p.pass&&hands[p.pass.from]&&hands[p.pass.to]){ const m=passM(u); if(m>0.001&&m<0.999){ const ha=hands[p.pass.from].R, hb=hands[p.pass.to].R, kk=hands[p.pass.from].k;
    const fa=ppl[p.pass.from].flip?-1:1, fb=ppl[p.pass.to].flip?-1:1, ms=76*kk; // same spot in the hand as when held, short hand-to-hand move
    const ax=ha[0]-fa*0.3*ms, bx2=hb[0]-fb*0.3*ms, x=ax+(bx2-ax)*m, y=ha[1]+(hb[1]-ha[1])*m-Math.sin(m*Math.PI)*12*kk; f2mate(c,x,y+0.36*ms,ms,p.mate||'calabaza',t,{steam:true}); } }
  (p.labels||[]).forEach((l,i)=>f2label(c,l,u,i,E.accent)); c.restore(); }
function f2obj(c,o,u,t,dur,i){ const a=easeOutBack(clamp((u*dur-(o.delay??0.05+i*0.1))/0.3)); if(a<=0.001) return; const x=(o.x??0.5)*W, y=(o.y??0.7)*H, s=o.s||500, bob=o.bob?Math.sin(t*2.2)*12:0;
  c.save(); c.translate(x,y+bob); c.scale(a,a); if(o.spin) c.rotate(Math.sin(t*1.6)*0.06);
  if(o.type==='termo') f2termo(c,0,0,s,o.color); else if(o.type==='yerba') f2yerba(c,0,0,s,o.color); else if(o.type==='heart') f2heart(c,0,-s/2,s*(1+0.08*Math.sin(t*7)),o.color);
  else if(o.type==='bombilla'){ c.strokeStyle='#c9d1d9'; c.lineCap='round'; c.lineWidth=s*0.05; c.beginPath(); c.moveTo(0,-s*0.15); c.lineTo(0,-s); c.stroke(); c.strokeStyle='#eef2f5'; c.lineWidth=s*0.015; c.beginPath(); c.moveTo(-s*0.01,-s*0.2); c.lineTo(-s*0.01,-s*0.95); c.stroke(); const g=c.createLinearGradient(-s*0.1,0,s*0.1,0); g.addColorStop(0,'#eef2f5'); g.addColorStop(1,'#8f99a3'); c.fillStyle=g; c.beginPath(); c.ellipse(0,-s*0.1,s*0.09,s*0.14,0,0,Math.PI*2); c.fill(); c.fillStyle='#2a2f36'; for(let k=-2;k<=2;k++) c.fillRect(-s*0.07,-s*0.1+k*s*0.04,s*0.14,s*0.012); rr(c,-s*0.04,-s*1.03,s*0.08,s*0.06,s*0.02,'#b98a2e'); }
  else f2mate(c,0,0,s,o.type||'calabaza',t,{steam:o.steam,face:o.face,color:o.color});
  c.restore(); }
const easeInOut=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2; const passM=u=>easeInOut(clamp((u-0.5)/0.3));
T.flat=(p={})=>{ const s=new THREE.Scene(); s.background=new THREE.Color('#000'); const cam=newCam(40); const cues=[];
  (p.people||[]).forEach((q,i)=>{ cues.push({u:0.04+i*0.03,type:'pop'}); if(q.act==='jump'||q.act==='cheer') cues.push({u:0.2,type:'popBig'}); });
  if(p.pass) cues.push({u:0.3,type:'swish'}); if(p.objs?.length) cues.push({u:0.06,type:'pop'}); (p.labels||[]).forEach((l,i)=>cues.push({u:l.u??(0.15+i*0.12),type:'blip'}));
  return { scene:s, camera:cam, aperture:0, maxblur:0, no3d:true, cues, update(){ return 5; }, overlay:(c,u,t,sh)=>drawFlat(c,p,u,t,sh) }; };

// ---------------- low-poly kit (reference styles "24h", "diorama", "POV") ----------------
const fm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??0.85,metalness:o.m??0,flatShading:o.flat??true,emissive:o.e||'#000000',emissiveIntensity:o.ei??1,transparent:o.op!=null,opacity:o.op??1});
function bx(w,h,d,m){ return mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?fm(m):m); }
function lpMate(s=1,o={}){ const g=new THREE.Group(); const b=put(g,mesh(new THREE.IcosahedronGeometry(0.5,1),fm(o.color||'#9a5a2c',{flat:!o.smooth})),0,0.45,0); b.scale.set(1,0.92,1);
  put(g,mesh(new THREE.CylinderGeometry(0.3,0.33,0.09,o.smooth?24:8),fm('#c9ced4',{m:0.4,r:0.4,flat:!o.smooth})),0,0.88,0); put(g,mesh(new THREE.CylinderGeometry(0.27,0.27,0.02,o.smooth?24:8),fm('#5f9a2e',{flat:!o.smooth})),0,0.925,0);
  const bb=put(g,mesh(new THREE.CylinderGeometry(0.03,0.03,0.85,6),fm('#d6dbe0',{m:0.5,r:0.35})),0.12,1.2,0); bb.rotation.z=-0.28; g.scale.setScalar(s); return g; }
function lpTermo(s=1,c='#2c6e9e',smooth=false){ const g=new THREE.Group(); const sg=smooth?24:8; put(g,mesh(new THREE.CylinderGeometry(0.22,0.22,1.1,sg),fm(c,{r:0.5,flat:!smooth})),0,0.55,0); put(g,mesh(new THREE.CylinderGeometry(0.17,0.2,0.22,sg),fm('#23272e',{flat:!smooth})),0,1.21,0); const sp=put(g,bx(0.08,0.06,0.2,'#23272e'),0,1.22,0.2); g.scale.setScalar(s); return g; }
function lpPava(s=1){ const g=new THREE.Group(); put(g,mesh(new THREE.CylinderGeometry(0.3,0.38,0.45,8),fm('#b8bec6',{m:0.5,r:0.35})),0,0.23,0); put(g,mesh(new THREE.CylinderGeometry(0.05,0.08,0.4,6),fm('#b8bec6',{m:0.5})),0.38,0.4,0).rotation.z=-0.9; const h=put(g,mesh(new THREE.TorusGeometry(0.2,0.03,4,8,Math.PI),fm('#2a2a2a')),0,0.5,0); g.scale.setScalar(s); return g; }
function lpTree(s=1,c='#3f8a3a'){ const g=new THREE.Group(); put(g,bx(0.16,0.5,0.16,'#6b4428'),0,0.25,0); put(g,mesh(new THREE.ConeGeometry(0.62,1.5,6),fm(c)),0,1.15,0); g.scale.setScalar(s); return g; }
function lpHouse(w,h,d,wall,roof){ const g=new THREE.Group(); put(g,bx(w,h,d,wall),0,h/2,0); const r=put(g,mesh(new THREE.ConeGeometry(Math.max(w,d)*0.74,h*0.55,4),fm(roof)),0,h+h*0.27,0); r.rotation.y=Math.PI/4; r.scale.z=d/w;
  for(const x of [-w*0.25,w*0.25]) put(g,bx(w*0.18,h*0.22,0.02,fm('#ffe2a8',{e:'#ffcf7a',ei:0.35})),x,h*0.6,d/2+0.01); put(g,bx(w*0.2,h*0.4,0.02,'#5a3a22'),0,h*0.2,d/2+0.01); return g; }
// blocky character (box head, mustache) like the "24h" and POV references
function makeBlocky(o={}){ const g=new THREE.Group(); const skin=fm(o.skin||'#c98a5e'), shirt=fm(o.shirt||'#2a5bd7'), pants=fm(o.pants||'#1d2433'), hair=fm(o.hair||'#2b1d16'), dark=fm('#141414');
  const legs=[]; for(const sx of [-1,1]){ const lp=put(g,new THREE.Group(),sx*0.11,0.86,0); put(lp,bx(0.17,0.8,0.2,o.dress?skin:pants),0,-0.4,0); put(lp,bx(0.19,0.1,0.3,dark),0,-0.83,0.04); legs.push(lp); }
  const torso=put(g,new THREE.Group(),0,0.86,0); put(torso,bx(0.5,0.64,0.28,shirt),0,0.32,0);
  if(o.dress) put(torso,mesh(new THREE.CylinderGeometry(0.26,0.42,0.6,6),shirt),0,-0.18,0);
  if(o.vest){ put(torso,bx(0.52,0.52,0.3,'#ff7a1a'),0,0.3,0); for(const y of [0.18,0.36]) put(torso,bx(0.53,0.05,0.31,fm('#e8f0f0')),0,y,0); }
  const head=put(torso,new THREE.Group(),0,0.66,0); put(head,bx(0.12,0.08,0.12,skin),0,0.02,0); put(head,bx(0.38,0.42,0.36,skin),0,0.27,0);
  if(!o.bald){ put(head,bx(0.4,0.13,0.38,hair),0,0.49,-0.01); put(head,bx(0.4,0.32,0.08,hair),0,0.34,-0.16); if(o.longHair){ put(head,bx(0.42,0.6,0.1,hair),0,0.16,-0.17); for(const sx of [-1,1]) put(head,bx(0.06,0.42,0.3,hair),sx*0.21,0.24,-0.02); } }
  for(const sx of [-1,1]){ put(head,bx(0.06,0.07,0.02,dark),sx*0.09,0.32,0.185); if(o.brows!==false) put(head,bx(0.09,0.025,0.02,hair),sx*0.09,0.385,0.185); }
  put(head,bx(0.07,0.1,0.08,fm(f2shade(o.skin||'#c98a5e',-0.08))),0,0.25,0.2); if(o.mustache!==false&&!o.longHair) put(head,bx(0.2,0.05,0.04,hair),0,0.18,0.19);
  if(o.hat==='hardhat'){ put(head,mesh(new THREE.SphereGeometry(0.25,8,4,0,Math.PI*2,0,Math.PI/2),fm('#ffc21a',{r:0.4})),0,0.48,0); put(head,mesh(new THREE.CylinderGeometry(0.3,0.3,0.03,10),fm('#ffc21a',{r:0.4})),0,0.48,0.03); }
  if(o.hat==='fedora'){ put(head,mesh(new THREE.CylinderGeometry(0.33,0.33,0.03,10),dark),0,0.53,0); put(head,mesh(new THREE.CylinderGeometry(0.19,0.22,0.24,10),dark),0,0.66,0); }
  const arms=[]; for(const sx of [-1,1]){ const piv=put(torso,new THREE.Group(),sx*0.32,0.6,0); put(piv,bx(0.13,0.56,0.15,shirt),0,-0.27,0); const hand=put(piv,new THREE.Group(),0,-0.6,0); put(hand,bx(0.12,0.12,0.12,skin),0,0,0); piv.rotation.z=sx*0.06; arms.push({piv,hand}); }
  if(o.scale) g.scale.setScalar(o.scale);
  return {g,torso,head,legs,armL:arms[0].piv,armR:arms[1].piv,handL:arms[0].hand,handR:arms[1].hand}; }
function blockyAct(b,act,t,u,o={}){ const s=Math.sin(t*7);
  b.legs.forEach((l,i)=>l.rotation.x=0); b.armL.rotation.set(0,0,-0.06); b.armR.rotation.set(0,0,0.06); b.torso.rotation.set(0,0,0); b.head.rotation.set(0,0,0); b.torso.position.y=0.86;
  if(act==='walk'){ b.legs[0].rotation.x=s*0.55; b.legs[1].rotation.x=-s*0.55; b.armL.rotation.x=-s*0.45; if(!o.holdR) b.armR.rotation.x=s*0.45; b.torso.position.y=0.86+Math.abs(s)*0.03; }
  if(act==='sip'){ const k=0.5+0.5*Math.sin(t*1.6); b.armR.rotation.x=-1.3-0.9*k; b.armR.rotation.z=-0.35; b.head.rotation.x=-0.1*k; }
  if(act==='hold') { b.armR.rotation.x=-1.2; b.armR.rotation.z=-0.2; }
  if(act==='offer'){ b.armR.rotation.x=-1.45; b.armR.rotation.z=-0.05; }
  if(act==='laugh'){ b.torso.rotation.x=0.35+0.08*Math.sin(t*14); b.head.rotation.x=-0.3; }
  if(act==='wave'){ b.armR.rotation.z=2.6+0.3*Math.sin(t*9); }
  if(act==='stare'){ b.head.rotation.y=Math.sin(t*0.6)*0.06; }
  if(act==='sit'||o.sit){ b.legs.forEach(l=>l.rotation.x=-Math.PI/2); }
  if(act==='type'){ b.armL.rotation.x=-1.2+0.08*Math.sin(t*18); b.armR.rotation.x=-1.2+0.08*Math.cos(t*18); }
  b.head.rotation.y+=o.look||0; }
function lpLights(s,o){ s.add(new THREE.HemisphereLight(o.sky||'#ffffff',o.gnd||'#444444',o.hemi??0.7)); const d=sun(s,o.sun||'#ffffff',o.si??2.2,o.dir||V(-3,6,4),o.half||7); return d; }
// ---- 24h template: low-poly scene in the top half, info panel drawn by the composer ----
// p.set: kitchen|street|office|park|night|sleep ; p.act ; p.hud {value, where, desc}
T.lp24=(p={})=>{ const set=p.set||'kitchen'; const sky={kitchen:'#f2d3a0',street:'#87c8ee',office:'#cfd8e3',park:'#ee8a5c',night:'#0e1630',sleep:'#0b1124',dinner:'#2a1a12'}[set]||'#888';
  const s=new THREE.Scene(); s.background=new THREE.Color(sky); const cam=newCam(44); const ppl=[]; let scroll=null, tv=null, fire=null;
  const P1=()=>makeBlocky({skin:'#c98a5e',shirt:'#2a5bd7',pants:'#1d2433',hair:'#2b1d16'});
  if(set==='kitchen'||set==='dinner'){ const night=set==='dinner'; lpLights(s,{sky:night?'#ffcf9a':'#fff4e0',gnd:'#6a4a30',hemi:night?0.35:0.75,sun:night?'#ffb070':'#fff1d6',si:night?1.2:2.4,dir:V(-4,5,3)});
    put(s,bx(14,0.2,10,'#8a5a3a'),0,-0.1,0); put(s,bx(14,8,0.2,night?'#7a4f3a':'#e8c78f'),0,4,-3); const win=put(s,bx(2.2,1.6,0.05,fm(night?'#1b2a52':'#dff3ff',{e:night?'#22335f':'#cfeeff',ei:night?0.6:0.9})),-2.2,2.6,-2.88);
    put(s,bx(5,1.0,1.2,'#e9e4da'),1.4,0.5,-2.3); put(s,bx(5.1,0.08,1.3,'#9aa0a6'),1.4,1.04,-2.3); put(s,bx(1.1,2.4,1.1,'#f4f4f2'),-4,1.2,-2.3);
    put(s,lpPava(0.7),2.4,1.08,-2.3); put(s,lpTermo(0.55,'#c0392b'),0.6,1.08,-2.2);
    if(night){ put(s,bx(3,0.12,1.6,'#6b4428'),0,1.0,0.4); for(const x of [-1.1,1.1]) put(s,bx(0.12,1,0.12,'#5a3a22'),x,0.5,0.4); const lamp=new THREE.PointLight('#ffb36b',18,9); lamp.position.set(0,3,0.4); s.add(lamp); put(s,mesh(new THREE.ConeGeometry(0.45,0.4,8,1,true),fm('#ffcf8a',{e:'#ffb060',ei:1})),0,3.1,0.4);
      const a=P1(); a.g.position.set(-1.2,0,0.4); a.g.rotation.y=0.8; ppl.push({b:a,act:'sit',sit:true}); a.g.position.y=-0.35; const gm=makeBlocky({shirt:'#7a3b8f',dress:true,longHair:true,hair:'#d0ccc5',skin:'#e0a879',mustache:false}); gm.g.position.set(0.9,0,-0.3); gm.g.rotation.y=-0.4; gm.handR.add(lpMate(0.22)); ppl.push({b:gm,act:'offer'}); s.add(a.g,gm.g); }
    else { const a=P1(); a.g.position.set(0,0,-1.1); a.g.rotation.y=0.25; a.handR.add(lpMate(0.24)).position.set(0,-0.05,0.12); ppl.push({b:a,act:p.act||'sip'}); s.add(a.g); }
    cam.position.set(0.6,2.0,4.6); cam.lookAt(0,1.45,-1); }
  if(set==='street'){ lpLights(s,{sky:'#dff2ff',gnd:'#7a8a5a',hemi:0.8,sun:'#fff3dc',si:2.4,dir:V(5,7,3),half:12}); scroll=put(s,new THREE.Group(),0,0,0);
    put(s,bx(60,0.1,3,'#3b3f46'),0,-0.05,2.2); put(s,bx(60,0.16,1.6,'#9aa0a6'),0,0.02,0); put(s,bx(60,0.1,8,'#5f9a45'),0,-0.06,-4.6);
    for(let i=-6;i<8;i++){ put(scroll,bx(0.9,0.02,0.12,'#f2f2f2'),i*2.4,0.01,2.2); const cols=[['#e98a3a','#a0412b'],['#f2c94c','#7a4b2a'],['#d9534f','#5a2b20'],['#5bb5a2','#2f4f5a']][(i+12)%4]; put(scroll,lpHouse(2.2,2.0,1.8,cols[0],cols[1]),i*3.1,0,-3.4); put(scroll,lpTree(1.1+((i+12)%3)*0.15,'#3f9a46'),i*3.1+1.55,0,-1.6); }
    const a=P1(); a.g.position.set(0,0.1,0); a.g.rotation.y=Math.PI/2; const tm=lpTermo(0.42,'#2c6e9e'); a.torso.add(tm); tm.position.set(-0.36,0.05,0.05); tm.rotation.z=0.25; a.handR.add(lpMate(0.2)).position.set(0,-0.05,0.1); ppl.push({b:a,act:'walk',holdR:true}); s.add(a.g);
    cam.position.set(0,1.9,6.4); cam.lookAt(0,1.4,0); }
  if(set==='office'){ lpLights(s,{sky:'#ffffff',gnd:'#8a8f99',hemi:0.85,sun:'#f4f8ff',si:1.8,dir:V(-3,6,4)}); put(s,bx(14,0.2,10,'#9aa3ad'),0,-0.1,0); put(s,bx(14,8,0.2,'#cfd8e3'),0,4,-3);
    for(const x of [-1.5,1.5]){ put(s,bx(2.2,0.1,1.1,'#8a5a3a'),x,1.05,-1.2); for(const lx of [-0.95,0.95]) put(s,bx(0.08,1.05,1,'#3a3f46'),x+lx,0.52,-1.2); put(s,bx(0.9,0.6,0.06,'#22252b'),x,1.5,-1.55); put(s,bx(0.82,0.52,0.02,fm('#6fb1ff',{e:'#4a8fe8',ei:0.6})),x,1.5,-1.51); }
    const a=P1(); a.g.position.set(-1.5,-0.3,-0.4); a.g.rotation.y=Math.PI; ppl.push({b:a,act:'type',sit:true}); const b=makeBlocky({shirt:'#e5483a',hair:'#5a3a22',mustache:false,skin:'#e0b08a'}); b.g.position.set(0.4,0,0.1); b.g.rotation.y=-0.9; b.handR.add(lpMate(0.22)).position.set(0,-0.05,0.12); ppl.push({b,act:'offer'});
    put(s,lpTermo(0.5,'#2f9e44'),1.1,1.1,-1.2); s.add(a.g,b.g); cam.position.set(0.2,2.3,4.4); cam.lookAt(0,1.4,-0.8); }
  if(set==='park'){ lpLights(s,{sky:'#ffb58a',gnd:'#4a5a2a',hemi:0.6,sun:'#ffb070',si:2.6,dir:V(-2,2.2,-6),half:9}); put(s,bx(40,0.1,30,'#6f8f3a'),0,-0.05,0); put(s,bx(3,0.04,30,'#c9a27a'),0,0.0,0).rotation.y=0.25;
    put(s,mesh(new THREE.CircleGeometry(2.6,10),fm('#ffd27a',{e:'#ffcf6a',ei:1})),0,3.2,-16); for(const [x,z,sc,c] of [[-4,-6,1.6,'#2f6b3a'],[-2.6,-8,2.1,'#2a5f34'],[3.4,-7,1.9,'#2f6b3a'],[5,-5,1.4,'#356f3a'],[-6,-4,1.3,'#2a5f34'],[1.5,-10,2.4,'#24512d']]) put(s,lpTree(sc,c),x,0,z);
    put(s,mesh(new THREE.IcosahedronGeometry(6,1),fm('#5a6a2e')),-8,-3.6,-14).scale.y=0.6; put(s,mesh(new THREE.IcosahedronGeometry(7,1),fm('#4f5f2a')),9,-4,-16).scale.y=0.6;
    const n=p.people||3; const looks=[{shirt:'#2f9e44',dress:true,longHair:true,mustache:false,hair:'#2b1d16',skin:'#d9a273'},{shirt:'#2a5bd7'},{shirt:'#f2c94c',hair:'#8a5a2b',skin:'#e0b08a'},{shirt:'#7c3aed',hair:'#151515',skin:'#8a573a',mustache:false}];
    for(let i=0;i<n;i++){ const a=makeBlocky(looks[i%4]); const ang=(i/(n))*Math.PI*1.2-Math.PI*0.6; a.g.position.set(Math.sin(ang)*1.3,0,-Math.cos(ang)*0.9-0.6); a.g.rotation.y=Math.PI+ang*0.9; if(i===0){ a.handR.add(lpMate(0.22)).position.set(0,-0.05,0.12); } ppl.push({b:a,act:i===0?'offer':i===1?'laugh':null}); s.add(a.g); }
    put(s,lpTermo(0.5,'#c0392b'),0.2,0,0.2); cam.position.set(0.3,2.1,4.6); cam.lookAt(0,1.4,-0.8); }
  if(set==='night'||set==='sleep'){ lpLights(s,{sky:'#3a4f9a',gnd:'#10142a',hemi:0.45,sun:'#7f9cff',si:0.8,dir:V(3,5,4)}); put(s,bx(14,0.2,10,'#5a1f2a'),0,-0.1,0); put(s,bx(14,8,0.2,'#1d2b5a'),0,4,-3);
    put(s,bx(3.2,0.5,1.1,'#2a43a8'),0,0.35,-2.2); put(s,bx(3.2,1.0,0.3,'#2a43a8'),0,0.95,-2.65); for(const x of [-1.7,1.7]) put(s,bx(0.3,0.75,1.1,'#2a43a8'),x,0.5,-2.2); put(s,bx(1.2,0.08,0.7,'#7a5a3a'),1.2,0.5,-0.6);
    put(s,lpTermo(0.45,'#c0392b'),1.0,0.54,-0.6); put(s,lpMate(0.2),1.45,0.54,-0.5);
    const a=P1(); if(set==='sleep'){ a.g.rotation.z=Math.PI/2; a.g.position.set(0.9,0.62,-2.1); ppl.push({b:a,act:null}); } else { a.g.position.set(-0.4,0.22,-2.0); a.handR.add(lpMate(0.22)).position.set(0,-0.05,0.12); ppl.push({b:a,act:'sip',sit:true}); } s.add(a.g);
    tv=new THREE.PointLight('#8fb4ff',6,8); tv.position.set(0,1.6,1.5); s.add(tv); const lamp=new THREE.PointLight('#ffb36b',5,6); lamp.position.set(2.2,1.6,-1.5); s.add(lamp);
    cam.position.set(0.5,2.2,4.2); cam.lookAt(0,1.0,-1.6); }
  // frame the scene in the top half (the info panel covers the bottom)
  { const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion); cam.position.addScaledVector(fwd,-(p.back??1.6)); cam.position.y+=0.25; }
  cam.setViewOffset(W,H,0,H*0.16,W,H); const base=cam.position.clone(), q=cam.quaternion.clone();
  const cues=[{u:0.05,type:'pop'}];
  return { scene:s, camera:cam, aperture:0, maxblur:0, cues, update(u,t){ cam.position.copy(base).add(V(0.25*u,0,-0.5*u)); cam.quaternion.copy(q);
      if(scroll) scroll.position.x=-t*1.6; if(tv) tv.intensity=5+2*Math.sin(t*13)*Math.sin(t*3.1);
      ppl.forEach(pp=>blockyAct(pp.b,pp.act,t,u,pp)); return 5; } }; };
// ---- diorama template: fixed farm set in Misiones, a barbacua is built stage by stage ----
// p.stage 0..6, p.time day|night|sunset, p.act (worker), p.labels [[text,x,y,z]], p.family
T.dio=(p={})=>{ const st=p.stage||0, time=p.time||'day'; const bg=time==='night'?'#1b2440':time==='sunset'?'#f0a073':'#bfe0f0';
  const s=newScene(bg,22,60); const cam=newCam(30); const sm={flat:false};
  s.add(new THREE.HemisphereLight(time==='night'?'#55618f':'#fff2dc',time==='night'?'#1a1420':'#8a5a3a',time==='night'?0.35:0.75));
  const sn=sun(s,time==='night'?'#8fa2ff':time==='sunset'?'#ffb070':'#fff1d6',time==='night'?0.5:time==='sunset'?2.2:2.8,time==='sunset'?V(-6,4,2):V(-4,8,5),9);
  const M=(c)=>fm(c,{flat:false,r:0.75});
  put(s,mesh(new THREE.PlaneGeometry(80,80),M('#b5532f'),false,true),0,0,0).rotation.x=-Math.PI/2;
  for(const [x,z,r] of [[-5,3,2.2],[5,2,2.6],[-3,-2,1.6],[6,-3,2]]){ const g=put(s,mesh(new THREE.CircleGeometry(r,24),M('#8aa04a'),false,true),x,0.01,z); g.rotation.x=-Math.PI/2; }
  for(const [x,z,sx,sy,c] of [[-14,-22,14,5,'#b98a5a'],[6,-26,18,6,'#c49866'],[20,-20,12,4,'#a9925a'],[-26,-18,10,4,'#9aa05a']]){ const h=put(s,mesh(new THREE.SphereGeometry(1,24,16),M(c),false,true),x,0,z); h.scale.set(sx,sy,sx*0.5); }
  if(time!=='night') for(const [x,y,z] of [[-6,7.5,-14],[4,8.5,-18],[11,7,-12]]){ const c=put(s,new THREE.Group(),x,y,z); for(const [a,b,r] of [[0,0,1],[1.1,0.2,1.2],[2.2,0,0.9],[1.1,-0.3,0.9]]) put(c,mesh(new THREE.SphereGeometry(r,16,12),M('#fbf6ee'),false,false),a,b,0).scale.y=0.55; c.userData.cloud=1; }
  // house
  const hs=put(s,new THREE.Group(),-1.8,0,-4.2); put(hs,mesh(new THREE.BoxGeometry(6,2.4,3),M('#efe6d6')),0,1.2,0);
  for(let i=0;i<2;i++){ const r=put(hs,mesh(new THREE.BoxGeometry(6.6,0.16,2.1),M('#c4532e')),0,2.85,i?-0.78:0.78); r.rotation.x=i?-0.5:0.5; for(let k=0;k<11;k++) put(r,mesh(new THREE.CylinderGeometry(0.07,0.07,2.05,8),M('#b4482a')),-3.1+k*0.62,0.1,0).rotation.x=Math.PI/2; }
  put(hs,mesh(new THREE.BoxGeometry(0.9,1.7,0.08),M('#6b4428')),-0.6,0.85,1.52); for(const x of [-2.1,1.4]){ put(hs,mesh(new THREE.BoxGeometry(0.95,0.85,0.06),M('#24324f')),x,1.4,1.52); put(hs,mesh(new THREE.BoxGeometry(1.1,0.1,0.12),M('#f6f1e6')),x,0.92,1.55); }
  for(const [x,y] of [[2.4,0.5],[2.6,1.8],[-2.6,1.9]]) put(hs,mesh(new THREE.BoxGeometry(0.5,0.25,0.05),M('#b06a4a')),x,y,1.52);
  const wp=put(s,new THREE.Group(),-4.6,0,-2.4); for(let r=0;r<3;r++) for(let k=0;k<4-r;k++) put(wp,mesh(new THREE.CylinderGeometry(0.17,0.17,1.2,10),M('#8a5a34')),(k-(3-r)/2)*0.36,0.18+r*0.31,0).rotation.x=Math.PI/2;
  for(let i=0;i<7;i++) for(let j=0;j<2;j++) put(s,mesh(new THREE.SphereGeometry(0.42,14,10),M(i%2?'#2f6b2a':'#3a7a30')),3.4+i*0.95,0.35,-3.2+j*1.4).scale.y=0.85;
  // barbacua at the front
  const bb=put(s,new THREE.Group(),0.6,0,0.6); const wood=M('#7a4a26'), leaf=M(st>=5?'#7d8a3a':'#3f7d2a'); let flames=[], smoke=[], glow=null;
  if(st===0){ for(let k=0;k<6;k++) put(bb,mesh(new THREE.CylinderGeometry(0.07,0.07,2.2,8),wood),-0.5+k*0.12,0.08+(k%2)*0.1,0.8).rotation.z=Math.PI/2; }
  if(st>=1) for(const [x,z] of [[-1,-0.6],[1,-0.6],[-1,0.6],[1,0.6]]) put(bb,mesh(new THREE.CylinderGeometry(0.08,0.09,1.7,10),wood),x,0.85,z);
  if(st>=2){ for(const z of [-0.6,0.6]) put(bb,mesh(new THREE.BoxGeometry(2.3,0.12,0.12),wood),0,1.6,z); for(let k=0;k<9;k++) put(bb,mesh(new THREE.CylinderGeometry(0.035,0.035,1.4,6),M('#9a6a3a')),-1+k*0.25,1.68,0).rotation.x=Math.PI/2; }
  if(st>=3){ const r=rng(7); for(let k=0;k<26;k++){ const l=put(bb,mesh(new THREE.SphereGeometry(0.2+r()*0.1,10,8),leaf),-0.95+r()*1.9,1.8+r()*0.25,-0.5+r()*1.0); l.scale.set(1.3,0.55,1); } }
  if(st>=4&&st<5||p.fire){ put(bb,mesh(new THREE.BoxGeometry(0.7,0.3,1.6),M('#3a2a20')),0,0.15,0); for(let k=0;k<5;k++){ const f=put(bb,mesh(new THREE.ConeGeometry(0.12,0.45,8),new THREE.MeshStandardMaterial({color:'#ff8a2a',emissive:'#ff6a10',emissiveIntensity:2})),-0.2+k*0.1,0.45,-0.3+k*0.15); flames.push(f); }
    glow=new THREE.PointLight('#ff8a3a',time==='night'?14:6,5); glow.position.set(0.6,0.8,0.6); s.add(glow); for(let k=0;k<10;k++){ const sp=put(s,mesh(new THREE.SphereGeometry(0.25,10,8),new THREE.MeshStandardMaterial({color:'#d9d4cc',transparent:true,opacity:0.5,roughness:1})),0.6,2,0.6); smoke.push(sp); } }
  if(st>=5) for(const [x,z] of [[2.0,0.2],[2.5,0.6],[2.2,1.1]]) put(s,mesh(new THREE.CapsuleGeometry(0.3,0.4,6,12),M('#e8dcc0')),x,0.5,z);
  // worker + family
  const people=[]; const wk=makePerson({skin:P.skin2,shirt:'#2f6fd0',pants:'#3a3f55',hair:'short',hairColor:'#3a2a20'}); wk.g.position.set(p.wx??-1.4,0,p.wz??1.6); wk.g.rotation.y=p.wr??0.35;
  put(wk.head,mesh(new THREE.SphereGeometry(0.3,24,12,0,Math.PI*2,0,Math.PI/2),fm('#ffc21a',{flat:false,r:0.35})),0,0.08,0); put(wk.head,mesh(new THREE.CylinderGeometry(0.36,0.36,0.03,28),fm('#ffc21a',{flat:false,r:0.35})),0,0.08,0.03);
  const vest=put(wk.g,mesh(new THREE.CylinderGeometry(0.3,0.31,0.5,24,1,true),fm('#ff7a1a',{flat:false})),0,0.86,0); vest.material.side=THREE.DoubleSide; for(const y of [0.74,0.94]) put(wk.g,mesh(new THREE.CylinderGeometry(0.312,0.312,0.05,24,1,true),fm('#e8f0f0',{flat:false})),0,y,0);
  put(wk.head,mesh(new THREE.SphereGeometry(0.2,16,10,0,Math.PI*2,Math.PI*0.55,Math.PI*0.45),matte('#3a2a20')),0,-0.02,0.08);
  if(p.carry==='log') put(wk.armR,mesh(new THREE.CylinderGeometry(0.08,0.08,1.4,10),wood),0,-0.5,0.1).rotation.z=Math.PI/2; if(p.carry==='mate') wk.hold(lpMate(0.2,{smooth:true}));
  if(p.carry==='sack') put(wk.armR,mesh(new THREE.CapsuleGeometry(0.22,0.3,6,12),M('#e8dcc0')),0,-0.5,0.15);
  if(p.carry==='stick') put(wk.armR,mesh(new THREE.CylinderGeometry(0.04,0.04,1.3,8),wood),0,-0.55,0.3).rotation.x=1.2;
  s.add(wk.g); people.push(wk);
  if(p.family){ const F=[{skin:P.skin1,shirt:'#c0392b',hair:'bun',hairColor:'#6b4a32'},{skin:P.skin3,shirt:'#2f9e44',hair:'curly',hairColor:'#2b211c',scale:0.8},{skin:P.skin1,shirt:P.beige,hair:'bob',hairColor:'#c9c2b8'}];
    F.forEach((o,i)=>{ const a=makePerson(o); a.g.position.set(-0.2+i*1.1,0,2.2+(i%2)*0.3); a.g.rotation.y=-0.2-i*0.25; if(i===2) a.hold(lpTermo(0.35,'#2c6e9e',true)); s.add(a.g); people.push(a); }); }
  cam.fov=46; cam.updateProjectionMatrix(); cam.position.set(4.6,5.6,12.5); cam.lookAt(-0.3,1.6,-0.5); const base=cam.position.clone();
  const cues=[{u:0.08,type:st>=4?'crackle':'clank'}]; if(p.act==='hammer') cues.push({u:0.3,type:'clank'},{u:0.6,type:'clank'});
  const labels=(p.labels||[]).map(l=>({text:l[0],v:V(l[1],l[2],l[3])}));
  return { scene:s, camera:cam, aperture:0, maxblur:0, people, cues, labels:()=>labels, update(u,t){
      cam.position.copy(base).add(V(-0.3*u,0,-0.6*u)); cam.lookAt(-0.3,1.6,-0.5);
      s.children.forEach(c=>{ if(c.userData.cloud) c.position.x+=0.004; });
      flames.forEach((f,i)=>{ f.scale.y=0.8+0.4*Math.abs(Math.sin(t*9+i*1.7)); }); if(glow) glow.intensity=(time==='night'?13:6)+3*Math.sin(t*11);
      smoke.forEach((sp,i)=>{ const ph=(t*0.25+i/smoke.length)%1; sp.position.set(0.6+Math.sin(ph*6+i)*0.4,1.6+ph*3.2,0.6+Math.cos(ph*5+i)*0.3); sp.scale.setScalar(0.6+ph*1.6); sp.material.opacity=0.45*(1-ph); });
      if(p.act==='hammer'){ wk.armR.rotation.x=-1.6+Math.abs(Math.sin(t*6))*1.3; }
      return 5; } }; };
// ---- POV template: dark low-poly rooms, first person camera, warm lamps ----
// p.set: street|door|dining|suegra|mate ; p.phone {from,msg} ; p.note {title,sub,rows[[n,text]],hi} ; p.choice {q,options[{n,title,sub}],cta,foot}
T.pov=(p={})=>{ const set=p.set||'dining'; const s=new THREE.Scene(); s.background=new THREE.Color('#07070a'); s.fog=new THREE.Fog('#07070a',6,16); const cam=newCam(48);
  s.add(new THREE.HemisphereLight('#6a5a4a','#050505',0.25)); const warm=(x,y,z,i=14,d=7)=>{ const l=new THREE.PointLight('#ffb36b',i,d,1.6); l.position.set(x,y,z); s.add(l); return l; };
  let path=[V(0,1.6,4),V(0,1.6,2.6)], look=V(0,1.5,0); const ppl=[]; let mateG=null, flick=[];
  const room=(wall='#2b211b',floor='#1c1410')=>{ put(s,bx(12,0.2,14,floor),0,-0.1,0); put(s,bx(12,6,0.2,wall),0,3,-4); put(s,bx(0.2,6,14,wall),-4.5,3,0); put(s,bx(0.2,6,14,wall),4.5,3,0); };
  if(set==='street'){ put(s,bx(30,0.1,30,'#15120f'),0,-0.05,0); put(s,bx(30,0.2,3,'#2a2622'),0,0.05,-1); const f=put(s,bx(9,5,0.4,'#3a2d26'),0,2.5,-3); put(s,bx(1.1,2.1,0.1,'#4a2f1e'),0,1.05,-2.78);
    put(s,bx(0.06,2.1,0.11,fm('#ffb766',{e:'#ff9a3d',ei:1.4})),0.56,1.05,-2.76); for(const x of [-2.6,2.6]) put(s,bx(1.3,1.1,0.05,fm('#ffb766',{e:'#ff9a3d',ei:0.9})),x,2.2,-2.78);
    warm(0,2.6,-2,10,6); put(s,bx(0.12,4,0.12,'#222'),3.8,2,-0.5); warm(3.4,3.9,-0.5,8,6); path=[V(0.3,1.6,6.5),V(0,1.6,2.2)]; look=V(0,1.3,-3); }
  if(set==='door'||set==='suegra'){ room('#2e231c','#1a120d'); put(s,bx(1.4,2.4,0.1,'#120d0a'),0,1.2,-3.85); const sg=makeBlocky({shirt:'#3b2a4a',dress:true,longHair:true,hair:'#c9c2b8',skin:'#d9a273',mustache:false}); sg.g.position.set(0,0,set==='door'?-3.2:-1.4);
    const tm=lpTermo(0.5,'#5b2a2a'); sg.armL.add(tm); tm.position.set(0,-0.75,0.1); sg.handR.add(lpMate(0.22)).position.set(0,-0.05,0.1); s.add(sg.g); ppl.push({b:sg,act:'hold'}); warm(0,3.2,set==='door'?-2.2:-0.6,set==='door'?10:16,6);
    if(set==='door'){ path=[V(0,1.6,1.5),V(0,1.6,0.2)]; look=V(0,1.5,-3.2); } else { path=[V(0,1.62,1.8),V(0,1.65,0.2)]; look=V(0,2.0,-1.4); } }
  if(set==='dining'){ room(); put(s,bx(1.6,0.12,4.2,'#5a3a22'),0,1.0,-1.2); for(const [x,z] of [[-0.7,0.7],[0.7,0.7],[-0.7,-3],[0.7,-3]]) put(s,bx(0.1,1,0.1,'#3a2414'),x,0.5,z);
    const L=put(s,mesh(new THREE.ConeGeometry(0.5,0.45,8,1,true),fm('#ffcf8a',{e:'#ffb060',ei:1.2})),0,3.6,-1.2); L.material.side=THREE.DoubleSide; warm(0,2.6,-1.2,22,7);
    const seats=[[-0.95,-0.4,Math.PI/2,{shirt:'#4a5a3a',hair:'#2b1d16'}],[0.95,-0.7,-Math.PI/2,{shirt:'#7a2f2f',hair:'#151515',mustache:false,longHair:true,skin:'#e0b08a'}],[-0.95,-1.9,Math.PI/2,{shirt:'#2a3a5a',hair:'#5a3a22',mustache:false}],[0,-3.6,0,{shirt:'#3b2a4a',dress:true,longHair:true,hair:'#c9c2b8',skin:'#d9a273',mustache:false}]];
    seats.forEach(([x,z,ry,o],i)=>{ const b=makeBlocky(o); b.g.position.set(x,-0.33,z); b.g.rotation.y=ry; if(i===3){ b.g.position.y=0; b.handR.add(lpMate(0.22)).position.set(0,-0.05,0.1); ppl.push({b,act:p.sip?'sip':'hold'}); } else ppl.push({b,act:'stare',sit:true,look:(i%2?0.5:-0.5)}); s.add(b.g); });
    if(p.paper) put(s,bx(0.32,0.01,0.42,fm('#efe6cf',{e:'#3a3020',ei:0.3})),0.1,1.07,-0.5).rotation.y=0.15;
    path=p.down?[V(0,1.9,1.6),V(0,1.75,0.9)]:[V(0.15,1.6,2.6),V(-0.1,1.6,2.0)]; look=p.down?V(0,1.0,-0.4):V(0,1.35,-2.2); }
  if(set==='mate'){ room('#21180f','#1a120d'); put(s,bx(3,0.12,3,'#5a3a22'),0,1.0,-0.6); warm(0.2,2.3,-0.4,16,5);
    const arm=put(s,new THREE.Group(),0.35,1.15,0.6); put(arm,bx(0.18,0.18,1.2,'#2a3a5a'),0,0,0.3); put(arm,bx(0.2,0.16,0.22,'#d9a273'),0,0.02,-0.35); mateG=put(arm,lpMate(0.28),0,0.05,-0.42);
    for(let k=0;k<6;k++){ const sp=put(s,mesh(new THREE.SphereGeometry(0.022,8,6),new THREE.MeshBasicMaterial({color:'#f2efe8',transparent:true,opacity:0.4,depthWrite:false})),0.35,1.6,0.2); flick.push(sp); }
    path=[V(0,1.85,1.7),V(0.05,1.8,1.3)]; look=V(0.3,1.35,0.05); }
  const cues=[{u:0.05,type:set==='street'?'hum':'tick'}]; if(p.phone) cues.push({u:0.12,type:'buzz'},{u:0.3,type:'beep'}); if(p.choice) cues.push({u:0.1,type:'rise'});
  return { scene:s, camera:cam, aperture:0, maxblur:0, cues, update(u,t){ const k=ease(u); cam.position.lerpVectors(path[0],path[1],k); cam.position.y+=Math.sin(t*3.2)*0.015; cam.lookAt(look);
      ppl.forEach(pp=>blockyAct(pp.b,pp.act,t,u,pp)); flick.forEach((sp,i)=>{ const ph=(t*0.5+i/flick.length)%1; sp.position.set(0.35+Math.sin(ph*7+i)*0.06,1.62+ph*0.7,0.2); sp.scale.setScalar(0.8+ph*1.6); sp.material.opacity=0.28*(1-ph); }); return 5; },
    overlay:(c,u,t,sh)=>drawPovOverlay(c,p,u,t) }; };
function wrapText(c,txt,maxW){ const out=[]; let line=''; for(const w of txt.split(' ')){ const tst=line?line+' '+w:w; if(c.measureText(tst).width>maxW&&line){ out.push(line); line=w; } else line=tst; } if(line) out.push(line); return out; }
function drawPovOverlay(c,p,u,t){ const W2=W/2;
  if(p.note){ const a=easeOut(clamp(u*4)); c.save(); c.globalAlpha=a; c.translate(W2,H*0.55+(1-a)*80); c.rotate(-0.04); const w=820,h=760; c.shadowColor='rgba(0,0,0,0.6)'; c.shadowBlur=40; c.fillStyle='#efe6cf'; c.fillRect(-w/2,-h/2,w,h); c.shadowBlur=0;
    c.strokeStyle='rgba(60,80,140,0.25)'; c.lineWidth=2; for(let y=-h/2+170;y<h/2;y+=110){ c.beginPath(); c.moveTo(-w/2+30,y+40); c.lineTo(w/2-30,y+40); c.stroke(); }
    c.fillStyle='#1d1a16'; c.textAlign='left'; c.font='900 54px Montserrat'; c.fillText(p.note.title,-w/2+50,-h/2+90); c.font='600 30px Montserrat'; c.fillStyle='#5a5246'; c.fillText(p.note.sub||'',-w/2+50,-h/2+135);
    (p.note.rows||[]).forEach(([n,tx],i)=>{ const y=-h/2+250+i*110; const hi=p.note.hi===i&&u>0.35; if(hi){ c.fillStyle='rgba(255,138,61,0.35)'; c.fillRect(-w/2+36,y-50,w-72,80); } c.fillStyle='#1d1a16'; c.font='italic 600 58px "Cormorant Garamond", serif'; c.fillText(String(n),-w/2+50,y+10); c.font='500 36px "Courier New", monospace'; c.fillText(tx,-w/2+130,y+6); });
    c.restore(); }
  if(p.phone){ const a=easeOutBack(clamp(u*3.5)); c.save(); c.translate(W2,H*0.56); c.scale(a,a); const w=560,h=1000; c.fillStyle='#0b0b0d'; c.beginPath(); c.roundRect(-w/2,-h/2,w,h,70); c.fill(); c.strokeStyle='#2a2a2e'; c.lineWidth=10; c.stroke();
    c.fillStyle='#16161a'; c.beginPath(); c.roundRect(-w/2+22,-h/2+22,w-44,h-44,52); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.font='800 28px Montserrat'; c.fillText('22:47',0,-h/2+80); c.font='800 46px Montserrat'; c.fillText(p.phone.from,0,-h/2+190); c.font='600 26px Montserrat'; c.fillStyle='#8a8a92'; c.fillText('escribiendo...',0,-h/2+232);
    const b=easeOutBack(clamp((u-0.2)*4)); if(b>0.01){ c.save(); c.translate(0,0); c.scale(b,b); c.font='900 46px Montserrat'; const lines=wrapText(c,p.phone.msg,400); const bw=Math.max(...lines.map(l=>c.measureText(l).width))+70, bh=lines.length*58+44; c.fillStyle='#ff6a2b'; c.beginPath(); c.roundRect(-bw/2,-bh/2,bw,bh,30); c.fill(); c.fillStyle='#fff'; lines.forEach((l,i)=>c.fillText(l,0,-bh/2+56+i*58)); c.restore(); } c.restore(); }
  if(p.choice){ const a=easeOut(clamp(u*3)); c.save(); c.fillStyle=`rgba(0,0,0,${0.82*a})`; c.fillRect(0,0,W,H); c.globalAlpha=a; c.textAlign='center'; c.fillStyle='#fff'; c.font='900 92px Montserrat'; c.fillText(p.choice.q,W2,700);
    (p.choice.options||[]).forEach((o,i)=>{ const d=easeOutBack(clamp((u-0.12-i*0.1)*4)); if(d<=0.01) return; const y=860+i*230; c.save(); c.translate(W2,y); c.scale(d,d); c.fillStyle=i?'#ffb066':'#ff6a2b'; c.beginPath(); c.roundRect(-430,-90,860,180,34); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(-340,0,50,0,Math.PI*2); c.fill(); c.fillStyle=i?'#ffb066':'#ff6a2b'; c.font='900 60px Montserrat'; c.fillText(String(o.n),-340,22); c.fillStyle='#fff'; c.textAlign='left'; c.font='900 62px Montserrat'; c.fillText(o.title,-250,10); c.font='700 30px Montserrat'; c.fillText(o.sub||'',-250,56); c.textAlign='center'; c.restore(); });
    c.fillStyle='#fff'; c.font='800 54px Montserrat'; c.fillText(p.choice.cta||'',W2,1400); c.font='600 34px Montserrat'; c.fillStyle='rgba(255,255,255,0.85)'; c.fillText(p.choice.foot||'',W2,1470); c.restore(); } }
// ---- composer extras: 24h info panel, part badge, rewind / fade cuts ----
function drawPanel24(T_){ const st=E.tl.style.panel24, sh=E.curShot, hud=sh?.p?.hud||{}; const L=76, C2=470;
  const g=ctx.createLinearGradient(0,760,0,1060); g.addColorStop(0,'rgba(12,10,14,0)'); g.addColorStop(1,'rgba(12,10,14,0.96)'); ctx.fillStyle=g; ctx.fillRect(0,760,W,300); ctx.fillStyle='rgba(12,10,14,0.96)'; ctx.fillRect(0,1060,W,H-1060);
  const ga=ctx.createLinearGradient(0,1060,0,H); ga.addColorStop(0,'rgba(40,60,30,0)'); ga.addColorStop(1,'rgba(40,60,30,0.25)'); ctx.fillStyle=ga; ctx.fillRect(0,1060,W,H-1060);
  ctx.save(); ctx.textAlign='left'; ctx.textBaseline='alphabetic'; const lab=(tx,x,y)=>{ ctx.font='800 26px Montserrat'; ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.letterSpacing='4px'; ctx.fillText(tx,x,y); ctx.letterSpacing='0px'; };
  const showTitle=T_<(st.titleUntil||3.2)||T_>E.tl.total-(st.titleEnd||2.4);
  if(showTitle){ const k=easeOut(clamp(T_<5?T_/0.5:(T_-(E.tl.total-(st.titleEnd||2.4)))/0.5)); ctx.globalAlpha=k; ctx.textAlign='center'; ctx.font='600 84px "Cormorant Garamond", serif'; ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.7)'; ctx.shadowBlur=20; ctx.fillText(st.title[0],W/2,690);
    ctx.font='italic 600 84px "Cormorant Garamond", serif'; ctx.fillStyle='#f0a35e'; ctx.fillText(st.title[1],W/2,780); ctx.shadowBlur=0; ctx.globalAlpha=1; ctx.textAlign='left'; }
  lab(st.label1||'HORAS',L,1150); if(hud.where) lab(st.label2||'DÓNDE',C2,1150);
  const pop=easeOutBack(clamp((T_-(sh?.start||0))/0.25)); ctx.save(); ctx.translate(L,1250); ctx.scale(pop,pop); ctx.font='600 104px "Cormorant Garamond", serif'; ctx.fillStyle='#fff'; ctx.fillText(hud.value||'',0,0); ctx.restore();
  if(hud.where){ ctx.font='italic 500 64px "Cormorant Garamond", serif'; ctx.fillStyle='#f0a35e'; ctx.fillText(hud.where,C2,1240); }
  if(hud.desc){ ctx.font='italic 500 54px "Cormorant Garamond", serif'; ctx.fillStyle='#fff'; wrapText(ctx,hud.desc,900).forEach((l,i)=>ctx.fillText(l,L,1330+i*58)); }
  lab(st.funLabel||'DATO',L,1500); ctx.font='italic 500 44px "Cormorant Garamond", serif'; ctx.fillStyle='rgba(255,255,255,0.92)'; wrapText(ctx,st.fun||'',920).forEach((l,i)=>ctx.fillText(l,L,1560+i*50)); ctx.restore(); }
function drawBadge(T_){ const b=E.tl.style.partBadge; if(T_>(b.until||3.4)) return; const a=easeOutBack(clamp((T_-0.15)/0.3))*clamp(((b.until||3.4)-T_)/0.25); if(a<=0.01) return; ctx.save(); ctx.translate(W/2,b.y||480); ctx.scale(a,a); ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 50px Montserrat'; const w=ctx.measureText(b.text).width+70; ctx.fillStyle='#ff8a3d'; ctx.beginPath(); ctx.roundRect(-w/2,-38,w,76,38); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(b.text,0,3); if(b.sub){ ctx.font='800 26px Montserrat'; ctx.letterSpacing='4px'; ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillText(b.sub,0,72); ctx.letterSpacing='0px'; } ctx.restore(); }
function drawCutFx(T_){ const mode=E.tl.style.cut; for(const cut of E.tl.cuts){ const d=T_-cut;
    if(mode==='fade'&&Math.abs(d)<0.2){ ctx.fillStyle=`rgba(0,0,0,${1-Math.abs(d)/0.2})`; ctx.fillRect(0,0,W,H); }
    if(mode==='rewind'&&d>=0&&d<0.55){ const a=1-d/0.55; ctx.save(); ctx.globalAlpha=0.35*a; ctx.fillStyle='#fff'; for(let y=(d*900)%70;y<H;y+=70) ctx.fillRect(0,y,W,3); ctx.globalAlpha=0.9*a; ctx.translate(W/2,330);
      for(const x of [-70,10]){ ctx.beginPath(); ctx.moveTo(x+60,-50); ctx.lineTo(x,0); ctx.lineTo(x+60,50); ctx.closePath(); ctx.fill(); } ctx.restore(); } } }
function drawCaptionWord(T_,ch){ const w=ch.words.find((x,i)=>T_>=x.t-0.02&&(i===ch.words.length-1||T_<ch.words[i+1].t-0.02))||ch.words[0]; const txt=w.w.replace(/[.,!?:;«»]/g,''); const pop=easeOutBack(clamp((T_-w.t)/0.08));
  ctx.save(); ctx.translate(W/2,E.tl.style.captionY||800); ctx.scale(0.85+0.15*pop,0.85+0.15*pop); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font=`900 ${E.tl.style.captionSize||70}px Montserrat`; ctx.shadowColor='rgba(0,0,0,0.75)'; ctx.shadowBlur=16; ctx.shadowOffsetY=4; ctx.fillStyle='#fff'; ctx.fillText(txt.charAt(0).toUpperCase()+txt.slice(1),0,0); ctx.restore(); }

// ---- island template: premium low-poly floating island (key + fill + rim light, warm glow, fog, gradient sky) ----
// p.title [small, line1, line2], p.sub [line1, line2], p.sign, p.glow (0..1 or 'ramp'), p.sky ('twilight'|'day')
function skyTex(top,bot){ const c=document.createElement('canvas'); c.width=4; c.height=256; const g=c.getContext('2d'); const gr=g.createLinearGradient(0,0,0,256); gr.addColorStop(0,top); gr.addColorStop(1,bot); g.fillStyle=gr; g.fillRect(0,0,4,256); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function signTex(text){ const c=document.createElement('canvas'); c.width=512; c.height=128; const g=c.getContext('2d'); g.fillStyle='#2a1d1a'; g.fillRect(0,0,512,128); g.strokeStyle='#f3c35b'; g.lineWidth=8; g.strokeRect(10,10,492,108); g.fillStyle='#ffe2a0'; g.font='900 68px Montserrat'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,68); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
T.island=(p={})=>{ const tw=(p.sky||'twilight')==='twilight'; const s=new THREE.Scene(); s.background=skyTex(tw?'#3d3a86':'#cfd3da',tw?'#f0a77e':'#c9ccd2'); s.fog=new THREE.Fog(tw?'#c58f9e':'#c9ccd2',38,62);
  const cam=newCam(20); const F=(c,o={})=>fm(c,o);
  s.add(new THREE.HemisphereLight(tw?'#8fa0ff':'#ffffff',tw?'#5a3a3a':'#888888',tw?0.55:0.9));
  const key=sun(s,tw?'#ffcf9e':'#ffffff',tw?2.6:2.2,V(6,9,5),6); key.shadow.radius=4; key.shadow.mapSize.set(4096,4096);
  const rim=new THREE.DirectionalLight(tw?'#9fb6ff':'#ffffff',tw?1.6:0.3); rim.position.set(-6,4,-7); s.add(rim);
  const isl=put(s,new THREE.Group(),0,0,0);
  put(isl,bx(5,0.28,5,'#7cbf4a'),0,-0.14,0); put(isl,bx(5,0.7,5,'#9a5a32'),0,-0.63,0); put(isl,bx(5.02,0.06,5.02,'#6aa83e'),0,-0.29,0);
  const und=put(isl,mesh(new THREE.ConeGeometry(3.6,2.6,4,1),F('#6a5a86')),0,-2.28,0); und.rotation.y=Math.PI/4; und.rotation.x=Math.PI; und.scale.set(1,1,1);
  // building (almacen)
  const b=put(isl,new THREE.Group(),0.35,0,-0.6); put(b,bx(2.6,1.7,2.0,'#f1e4d0'),0,0.85,0); put(b,bx(2.7,0.12,2.1,'#d8c8b0'),0,0.06,0);
  for(const sgn of [-1,1]){ const r=put(b,bx(3.0,0.14,1.35,'#d63a32'),0,2.05,sgn*0.52); r.rotation.x=sgn*0.62; } put(b,bx(3.0,0.5,0.06,'#c4302a'),0,1.75,1.03).visible=false;
  const gable=put(b,mesh(new THREE.ConeGeometry(1.12,0.75,3),F('#f1e4d0')),0,2.04,0); gable.rotation.set(0,0,0); gable.scale.set(1,1,0.01); gable.rotation.y=Math.PI/2; gable.scale.set(1.0,1,1); gable.visible=false;
  for(const x of [-1.3,1.3]){ const tri=new THREE.Shape(); tri.moveTo(-1,0); tri.lineTo(1,0); tri.lineTo(0,0.62); tri.closePath(); const g=put(b,mesh(new THREE.ShapeGeometry(tri),F('#efe0c8',{})),x,1.7,0); g.rotation.y=Math.PI/2*Math.sign(x); g.material.side=THREE.DoubleSide; }
  const sign=put(b,mesh(new THREE.PlaneGeometry(1.3,0.32),new THREE.MeshStandardMaterial({map:signTex(p.sign||'ALMACÉN'),emissive:'#ffffff',emissiveMap:signTex(p.sign||'ALMACÉN'),emissiveIntensity:0.0,roughness:0.8})),0,1.78,1.02); sign.rotation.x=-0.25; sign.position.set(-0.2,1.95,0.86);
  // striped awning
  for(let i=0;i<8;i++){ const a=put(b,bx(0.3,0.06,0.62,i%2?'#ffffff':'#d63a32'),-1.05+i*0.3,1.32,1.27); a.rotation.x=0.42; }
  const winM=F('#ffcf7a',{e:'#ffb347',ei:0}); const winMeshes=[]; for(const x of [-0.75,0.75]){ winMeshes.push(put(b,bx(0.6,0.62,0.04,winM),x,0.85,1.01)); put(b,bx(0.7,0.08,0.08,'#5a3a22'),x,0.5,1.03); }
  put(b,bx(0.5,0.95,0.04,'#5a3a22'),0,0.48,1.01); for(const x of [-0.95,0.95]) put(b,bx(0.08,1.7,0.08,'#7a4a2a'),x,0.85,1.02);
  const lampIn=new THREE.PointLight('#ffb05a',0,4,1.6); lampIn.position.set(0.35,0.9,1.0); isl.add(lampIn);
  for(const x of [-0.9,0.9]){ const pl=put(b,mesh(new THREE.SphereGeometry(0.1,6,4),F('#ff6a3a',{e:'#ff5a2a',ei:0})),x,1.28,1.5); winMeshes.push(pl); }
  // trees
  const tree=(x,z,sc)=>{ const t=put(isl,new THREE.Group(),x,0,z); put(t,bx(0.16,0.7,0.16,'#6b4428'),0,0.35,0); for(const [a,y,c,r] of [[0,0.95,'#5aa83e',0.55],[0.25,1.25,'#6bbd4a',0.42],[-0.2,1.2,'#4f9a38',0.38]]) put(t,mesh(new THREE.IcosahedronGeometry(r,0),F(c)),a,y,0); t.scale.setScalar(sc); };
  tree(-1.9,-1.5,1.15); tree(-2.0,-0.2,0.85); tree(2.0,0.6,0.95);
  // stone path
  const rr2=rng(3); for(let i=0;i<7;i++){ const st=put(isl,bx(0.5,0.06,0.36,'#d7d2c8'),-0.4-i*0.22+rr2()*0.1,0.03,0.9+i*0.24); st.rotation.y=0.5+rr2()*0.3; }
  for(const [x,z] of [[-1.6,1.2],[1.7,1.8],[-0.9,2.0]]) put(isl,mesh(new THREE.IcosahedronGeometry(0.14,0),F('#8a8494')),x,0.08,z);
  // lamp post + bench + giant termo + mate barrel
  const post=put(isl,new THREE.Group(),0.6,0,1.7); put(post,bx(0.07,1.4,0.07,'#26222e'),0,0.7,0); const head=put(post,bx(0.2,0.2,0.2,F('#ffe0a0',{e:'#ffc560',ei:0})),0,1.48,0); put(post,bx(0.26,0.05,0.26,'#26222e'),0,1.6,0);
  const lampOut=new THREE.PointLight('#ffc070',0,3.5,1.8); lampOut.position.set(0.6,1.5,1.7); isl.add(lampOut);
  const bench=put(isl,new THREE.Group(),1.1,0,1.25); put(bench,bx(0.8,0.06,0.28,'#8a5a34'),0,0.32,0); for(const x of [-0.32,0.32]) put(bench,bx(0.06,0.32,0.26,'#5a3a22'),x,0.16,0);
  const termo=put(isl,lpTermo(1.25,'#2f6fd0'),1.75,0,-0.3); const mt=put(isl,lpMate(0.55),1.95,0,0.9);
  // floating rocks + clouds
  const rocks=[]; for(const [x,y,z,r] of [[-0.8,-1.7,2.2,0.46],[-0.2,-2.2,2.7,0.34],[-1.3,-2.3,2.6,0.28],[-0.6,-2.7,3.0,0.2]]) rocks.push(put(s,mesh(new THREE.IcosahedronGeometry(r,0),F(tw?'#ecc2cf':'#d9d4dc')),x,y,z));
  cam.position.set(18.5,15.8,22.5); const look=V(0,-0.7,0); cam.lookAt(look); cam.setViewOffset(W,H,0,-H*0.13,W,H); const base=cam.position.clone();
  const cues=[{u:0.05,type:'sparkle'}];
  return { scene:s, camera:cam, aperture:0, maxblur:0, cues, update(u,t){
      const ang=-0.12+0.18*u; const r=Math.hypot(base.x,base.z); cam.position.set(Math.sin(Math.atan2(base.x,base.z)+ang)*r,base.y,Math.cos(Math.atan2(base.x,base.z)+ang)*r); cam.lookAt(look);
      isl.position.y=Math.sin(t*1.1)*0.06; rocks.forEach((k,i)=>{ k.position.y+=Math.sin(t*1.3+i)*0.002; k.rotation.y=t*0.2+i; });
      const gl=p.glow==='ramp'?clamp((u-0.15)/0.35):(p.glow??1); s.userData.bloom=0.1+0.45*gl; winM.emissiveIntensity=2.0*gl; head.material.emissiveIntensity=3.2*gl; lampIn.intensity=6*gl; lampOut.intensity=5*gl; sign.material.emissiveIntensity=0.6*gl; winMeshes.slice(2).forEach(m=>m.material.emissiveIntensity=1.5*gl);
      return 12; }, overlay:(c,u,t,sh)=>{ const ti=p.title||[]; c.save(); c.textAlign='center'; c.textBaseline='middle';
      if(ti[0]){ c.font='800 30px Montserrat'; c.letterSpacing='8px'; c.fillStyle='#ff9a3d'; c.fillText(ti[0],W/2,230); c.letterSpacing='0px'; }
      c.font='900 100px Montserrat'; c.fillStyle=tw?'#ffffff':'#1f2440'; c.shadowColor='rgba(0,0,0,0.18)'; c.shadowBlur=10; if(ti[1]) c.fillText(ti[1],W/2,340); if(ti[2]) c.fillText(ti[2],W/2,455); c.shadowBlur=0;
      if(p.badge){ c.font='800 44px Montserrat'; const w=c.measureText(p.badge).width+130; c.fillStyle='rgba(255,255,255,0.22)'; c.beginPath(); c.roundRect(W/2-w/2,560,w,84,42); c.fill(); c.fillStyle='#ff9a3d'; c.beginPath(); c.arc(W/2-w/2+48,602,26,0,Math.PI*2); c.fill(); c.fillStyle='#1f2440'; c.font='900 34px Montserrat'; c.fillText(String(p.badgeN||4),W/2-w/2+48,604); c.fillStyle='#fff'; c.font='800 44px Montserrat'; c.fillText(p.badge,W/2+24,604); }
      if(p.sub){ c.font='800 50px Montserrat'; c.fillStyle='#fff'; c.shadowColor='rgba(0,0,0,0.35)'; c.shadowBlur=12; p.sub.forEach((l,i)=>c.fillText(l,W/2,1690+i*64)); }
      c.restore(); } }; };

function flowFade(u,a,b,dur){ const d1=(u-a)*dur, d2=(b-u)*dur; return clamp(Math.min(d1/0.35,d2/0.3)); }
function drawMeadowBox(c,box,a){ if(!box||a<=0.01) return; c.save(); c.globalAlpha=a; c.font='600 54px "Cormorant Garamond", serif'; c.letterSpacing='3px'; const lines=box.lines.map(l=>l.toUpperCase()); const w=Math.max(...lines.map(l=>c.measureText(l).width))+90, h=lines.length*64+50;
  const bot=box.pos==='bottom'; const x=bot?W/2-w/2:W-w-40, y=(bot?1560:280)+(1-a)*14; c.fillStyle='rgba(28,24,20,0.86)'; c.fillRect(x,y,w,h); c.strokeStyle='rgba(232,201,122,0.35)'; c.lineWidth=2; c.strokeRect(x+8,y+8,w-16,h-16); c.fillStyle='#f4efe4'; c.textAlign='center'; c.textBaseline='middle'; lines.forEach((l,i)=>c.fillText(l,x+w/2,y+57+i*64)); c.restore(); }
function drawMeadowTag(c,tag,lead,cam,a){ if(a<=0.01) return; const v=lead.g.position.clone().add(V(0,2.5,0)).project(cam); const x=(v.x*0.5+0.5)*W, y=(-v.y*0.5+0.5)*H; c.save(); c.translate(x,y-30); c.scale(a,a); c.textAlign='center'; c.textBaseline='middle';
  c.font='600 46px "Cormorant Garamond", serif'; c.letterSpacing='5px'; const t1=tag.title.toUpperCase(); const w1=c.measureText(t1).width; c.font='500 32px Montserrat'; c.letterSpacing='0px'; const w2=tag.sub?c.measureText(tag.sub).width:0; const w=Math.max(w1,w2)+64, h=tag.sub?120:76;
  c.fillStyle='rgba(28,24,20,0.86)'; c.beginPath(); c.roundRect(-w/2,-h/2,w,h,8); c.fill(); c.font='600 46px "Cormorant Garamond", serif'; c.letterSpacing='5px'; c.fillStyle='#e8c97a'; c.fillText(t1,0,tag.sub?-22:2); c.letterSpacing='0px'; if(tag.sub){ c.font='500 32px Montserrat'; c.fillStyle='#f2ede4'; c.fillText(tag.sub,0,26); } c.restore(); }
// ---- meadow template: cozy misty meadow, a line of toy villagers, name tag over the lead, serif caption boxes ----
// p.shot: 'line' (wide, sideways drift) | 'lead' (push in on the lead) ; p.tag {title, sub} ; p.box {lines[], pos:'top'|'bottom'}
function grassTex(){ const c=document.createElement('canvas'); c.width=c.height=1024; const g=c.getContext('2d'); g.fillStyle='#6fa04a'; g.fillRect(0,0,1024,1024); const r=rng(5);
  for(let i=0;i<260;i++){ const x=r()*1024,y=r()*1024,rad=30+r()*140; const gr=g.createRadialGradient(x,y,0,x,y,rad); const col=r()<0.5?'rgba(130,180,80,0.22)':'rgba(70,120,45,0.20)'; gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); }
  for(let i=0;i<9000;i++){ g.fillStyle=r()<0.5?'rgba(150,200,90,0.35)':'rgba(55,95,35,0.3)'; g.fillRect(r()*1024,r()*1024,2,5); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,10); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
T.meadow=(p={})=>{ const s=newScene('#dfe6e2',p.shot==='lead'?9:17,p.shot==='lead'?34:52); const cam=newCam(p.shot==='lead'?26:40);
  s.add(new THREE.HemisphereLight('#eef3ff','#6a7f3e',1.05)); const k=sun(s,'#fff1d8',2.1,V(-5,7,4),7); k.shadow.mapSize.set(4096,4096); k.shadow.bias=-0.0002; k.shadow.normalBias=0.03;
  const fill=new THREE.DirectionalLight('#cfe0ff',0.55); fill.position.set(6,3,6); s.add(fill); const rim=new THREE.DirectionalLight('#ffe6c4',0.7); rim.position.set(2,4,-8); s.add(rim);
  const g=put(s,mesh(new THREE.PlaneGeometry(120,120,1,1),new THREE.MeshStandardMaterial({map:grassTex(),roughness:0.95}),false,true),0,0,0); g.rotation.x=-Math.PI/2;
  const R2=rng(21); const flowerCols=['#ffffff','#ffd94a','#f28bb0','#b9a3ff','#ff8a5a'];
  const fl=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06,0),matte('#ffffff'),420); const stemG=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008,0.008,0.18,4),matte('#4f8a34'),420); const m4=new THREE.Matrix4(), col=new THREE.Color();
  for(let i=0;i<420;i++){ const x=-14+R2()*28, z=-9+R2()*16; if(Math.abs(z)<0.9&&Math.abs(x)<4.6) { i--; continue; } m4.makeTranslation(x,0.18,z); fl.setMatrixAt(i,m4); fl.setColorAt(i,col.set(flowerCols[(R2()*5)|0])); m4.makeTranslation(x,0.09,z); stemG.setMatrixAt(i,m4); }
  fl.castShadow=false; s.add(fl,stemG);
  const tuft=new THREE.InstancedMesh(new THREE.ConeGeometry(0.05,0.32,4),matte('#5d9440'),900); for(let i=0;i<900;i++){ const x=-14+R2()*28, z=-9+R2()*16; m4.makeRotationFromEuler(new THREE.Euler((R2()-0.5)*0.5,R2()*3,(R2()-0.5)*0.5)); m4.setPosition(x,0.14,z); tuft.setMatrixAt(i,m4); } s.add(tuft);
  for(let i=0;i<9;i++){ const x=-9+i*1.4; put(s,mesh(new THREE.BoxGeometry(0.1,0.7,0.1),matte('#8a6a48')),x,0.35,-4.5); if(i<8) for(const y of [0.25,0.55]) put(s,mesh(new THREE.BoxGeometry(1.42,0.06,0.04),matte('#a07a52')),x+0.7,y,-4.5); }
  const ran=put(s,new THREE.Group(),7.5,0,-8.5); put(ran,mesh(new THREE.BoxGeometry(3,1.6,2),matte('#efe3cc')),0,0.8,0); const rf=put(ran,mesh(new THREE.ConeGeometry(2.3,1.1,4),matte('#b85a3a')),0,2.15,0); rf.rotation.y=Math.PI/4; rf.scale.z=0.75;
  put(ran,mesh(new THREE.BoxGeometry(0.5,0.9,0.05),matte('#6b4428')),-0.6,0.45,1.01); put(ran,mesh(new THREE.BoxGeometry(0.5,0.4,0.05),new THREE.MeshStandardMaterial({color:'#ffd79a',emissive:'#ffb050',emissiveIntensity:0.5})),0.7,0.95,1.01); put(ran,mesh(new THREE.BoxGeometry(0.3,0.8,0.3),matte('#9a7a6a')),0.8,2.3,-0.3);
  const smoke=[]; for(let i=0;i<8;i++){ const sp=put(s,mesh(new THREE.SphereGeometry(0.25,12,10),new THREE.MeshStandardMaterial({color:'#f2f0ec',transparent:true,opacity:0.5,roughness:1,depthWrite:false})),8.3,2.9,-8.8); smoke.push(sp); }
  for(const [x,z,r] of [[-2.2,1.6,0.22],[3.4,1.2,0.18],[-5.5,-1.5,0.3],[5.8,-2.2,0.26]]) put(s,mesh(new THREE.IcosahedronGeometry(r,1),matte('#a8a49c')),x,r*0.5,z).scale.y=0.6;
  const flies=[]; for(let i=0;i<4;i++){ const b=put(s,new THREE.Group(),0,1,0); for(const sd of [-1,1]){ const w=put(b,mesh(new THREE.PlaneGeometry(0.12,0.09),new THREE.MeshStandardMaterial({color:['#ffd94a','#ffffff','#ff9a5a','#b9a3ff'][i],side:THREE.DoubleSide})),sd*0.06,0,0); w.userData.sd=sd; } flies.push(b); }
  const motes=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:600},()=>[(R2()-0.5)*16,R2()*4,(R2()-0.5)*10]).flat(),3)),new THREE.PointsMaterial({color:'#fff6dc',size:0.035,transparent:true,opacity:0.7,depthWrite:false})); s.add(motes);
  const R=rng(11); for(let i=0;i<26;i++){ const x=-16+i*1.3+R()*0.8, z=-10-R()*6; const tr=put(s,new THREE.Group(),x,0,z); put(tr,mesh(new THREE.CylinderGeometry(0.14,0.18,1.4,8),matte('#6b4a32')),0,0.7,0);
    const col=R()<0.25?['#e0894a','#d9733a']:['#7fae5a','#6a9a4a']; for(const [a,b,c,r] of [[0,1.9,0,0.95],[0.6,1.6,0.2,0.7],[-0.6,1.7,0.1,0.72],[0,2.5,0,0.6]]) put(tr,mesh(new THREE.SphereGeometry(r,18,14),matte(col[(a>0)|0])),a,b,c); tr.scale.setScalar(0.9+R()*0.5); }
  const looks=[{skin:P.skin1,shirt:'#8a4a8a',hair:'bob',hat:'band',hatColor:'#5a3a5a'},{skin:P.skin2,shirt:'#4a4a4a',hair:'short',hat:'hat',hatColor:'#3a3a3a'},{skin:P.skin3,shirt:'#6a5a3a',hair:'curly',hairColor:'#2b211c'},
    {skin:P.skin1,shirt:'#c98a3a',hair:'short',hat:'cap',hatColor:'#a86a2a',lead:true},{skin:P.skin2,shirt:'#5a8a4a',hair:'bun',hairColor:'#6b4a32'},{skin:P.skin3,shirt:'#b0663a',hair:'short',hat:'band',hatColor:'#7a3a2a'}];
  const scarfC=['#d9483a','#3a6ad9','#e8c34a','#c0392b','#2f9e44','#7c3aed']; const ppl=[]; let lead=null; looks.forEach((o,i)=>{ const a=makePerson({...o,scale:o.lead?1.08:0.95}); a.g.position.set(-3.75+i*1.5,0,0); a.g.rotation.y=0.35; s.add(a.g); ppl.push(a);
    const belt=put(a.g,mesh(new THREE.TorusGeometry(0.285,0.03,8,28),matte('#3a2a1e')),0,0.66,0); belt.rotation.x=Math.PI/2; put(a.g,mesh(new THREE.BoxGeometry(0.09,0.07,0.03),new THREE.MeshStandardMaterial({color:'#d8b45a',metalness:0.7,roughness:0.35})),0,0.66,0.29);
    for(const y of [0.84,0.98]) put(a.g,mesh(new THREE.SphereGeometry(0.022,8,6),matte('#f2ead8')),0,y,0.275);
    const sc=put(a.g,mesh(new THREE.TorusGeometry(0.17,0.045,8,20),matte(scarfC[i])),0,1.13,0.02); sc.rotation.x=Math.PI/2; const knot=put(a.g,mesh(new THREE.ConeGeometry(0.07,0.16,4),matte(scarfC[i])),0,1.03,0.17); knot.rotation.x=Math.PI;
    if(i%2===0) a.hold(lpMate(0.2,{smooth:true})); else { const tm=lpTermo(0.36,['#2c6e9e','#c0392b','#2f9e44'][i%3],true); put(a.armL,tm,0,-0.62,0.05); }
    if(o.lead){ lead=a; const pole=put(a.g,new THREE.Group(),0,0,0); put(pole,mesh(new THREE.CylinderGeometry(0.02,0.02,0.36,6),matte('#3a2a20')),0,1.93,-0.05); const fl=put(pole,mesh(new THREE.PlaneGeometry(0.26,0.16),matte('#f4efe4')),0.13,2.03,-0.05); fl.material.side=THREE.DoubleSide; pole.userData.flag=fl; a.flag=fl; } });
  const flow=p.shot==='flow'; let A,B,L; if(flow){ A=V(-5.5,3.6,17.5); B=V(0.6,1.8,6.4); L=V(0,0.6,0); } else if(p.shot==='lead'){ A=V(0.2,1.9,8.2); B=V(0.6,1.8,6.4); L=V(0.75,1.55,0); } else { A=V(-5.5,3.6,17.5); B=V(-2.5,3.4,17); L=V(0,0.6,0); }
  const cues=[{u:0.04,type:'birds'}];
  return { scene:s, camera:cam, aperture:p.shot==='lead'?0.0016:0.0012, maxblur:0.01, people:ppl, cues, update(u,t){ let l;
      if(flow){ const sw=p.switchU??0.45; const k1=clamp(u/sw), k2=ease(clamp((u-sw+0.08)/(1-sw+0.04)));
        const wide=V(-5.5+3*ease(k1),3.6-0.2*k1,17.5-0.5*k1), close=V(0.2+0.4*k2,1.9-0.1*k2,8.2-1.8*k2); cam.position.lerpVectors(wide,close,k2); l=V(0,0.6,0).lerp(V(0.75,1.55,0),k2); cam.fov=40-14*k2; cam.updateProjectionMatrix(); s.fog.near=17-8*k2; s.fog.far=52-18*k2; }
      else { const e=ease(u); cam.position.lerpVectors(A,B,e); l=L.clone(); } cam.lookAt(l);
      smoke.forEach((sp,i)=>{ const ph=(t*0.12+i/smoke.length)%1; sp.position.set(8.3+ph*0.8+Math.sin(ph*6+i)*0.2,2.9+ph*2.4,-8.8); sp.scale.setScalar(0.5+ph*1.6); sp.material.opacity=0.5*(1-ph); });
      flies.forEach((b,i)=>{ const a=t*0.5+i*1.7; b.position.set(Math.sin(a)*3+(i-1.5)*2,0.9+Math.sin(a*2.3)*0.3,1.2+Math.cos(a*0.8)*1.2); b.rotation.y=-a; b.children.forEach(w=>w.rotation.y=w.userData.sd*(0.3+0.9*Math.abs(Math.sin(t*18+i)))); });
      motes.rotation.y=t*0.02; motes.position.y=Math.sin(t*0.5)*0.05;
      ppl.forEach((a,i)=>{ a.g.position.y=Math.abs(Math.sin(t*2.2+i))*0.015; a.head.rotation.y=Math.sin(t*0.8+i*1.3)*0.15; }); if(lead) lead.flag.rotation.y=Math.sin(t*4)*0.25;
      return cam.position.distanceTo((p.shot==='lead'||flow)?lead.g.position.clone().add(V(0,1.3,0)):l); },
    overlay:(c,u,t,sh)=>{ c.save(); const dur=sh?.dur||3; let sw=p.switchU??0.45; if(p.switchWord&&E.tl){ const w=E.tl.words.find(w=>w.t>=sh.start&&new RegExp(p.switchWord,'i').test(w.w)); if(w) sw=(w.t-sh.start)/dur; }
      const boxA=p.box, boxB=p.box2; const fadeA=flowFade(u,0,sw,dur), fadeB=flowFade(u,sw,1.2,dur);
      if(p.shot==='flow'){ drawMeadowBox(c,boxA,fadeA); if(boxB) drawMeadowBox(c,boxB,fadeB); if(p.tag&&lead&&u>sw) drawMeadowTag(c,p.tag,lead,cam,easeOutBack(clamp((u-sw)*dur/0.3-0.4))); c.restore(); return; }
      if(p.tag&&lead){ const v=lead.g.position.clone().add(V(0,2.5,0)).project(cam); const x=(v.x*0.5+0.5)*W, y=(-v.y*0.5+0.5)*H; const a=easeOutBack(clamp((u*(sh?.dur||3)-0.3)/0.25)); if(a>0.01){ c.translate(x,y-30); c.scale(a,a); c.textAlign='center'; c.textBaseline='middle';
        c.font='600 46px "Cormorant Garamond", serif'; c.letterSpacing='5px'; const t1=p.tag.title.toUpperCase(); const w1=c.measureText(t1).width; c.font='500 32px Montserrat'; c.letterSpacing='0px'; const w2=p.tag.sub?c.measureText(p.tag.sub).width:0; const w=Math.max(w1,w2)+64, h=p.tag.sub?120:76;
        c.fillStyle='rgba(28,24,20,0.86)'; c.beginPath(); c.roundRect(-w/2,-h/2,w,h,8); c.fill(); c.font='600 46px "Cormorant Garamond", serif'; c.letterSpacing='5px'; c.fillStyle='#e8c97a'; c.fillText(t1,0,p.tag.sub?-22:2); c.letterSpacing='0px'; if(p.tag.sub){ c.font='500 32px Montserrat'; c.fillStyle='#f2ede4'; c.fillText(p.tag.sub,0,26); } c.setTransform(1,0,0,1,0,0); } }
      if(p.box){ const a=easeOut(clamp((u*(sh?.dur||3)-0.15)/0.3)); c.globalAlpha=a; c.font='600 54px "Cormorant Garamond", serif'; c.letterSpacing='3px'; const lines=p.box.lines.map(l=>l.toUpperCase()); const w=Math.max(...lines.map(l=>c.measureText(l).width))+90, h=lines.length*64+50;
        const top=p.box.pos==='bottom'; const x=top?W/2-w/2:W-w-40, y=top?1560:280; c.fillStyle='rgba(28,24,20,0.86)'; c.fillRect(x,y,w,h); c.strokeStyle='rgba(232,201,122,0.35)'; c.lineWidth=2; c.strokeRect(x+8,y+8,w-16,h-16); c.fillStyle='#f4efe4'; c.textAlign='center'; c.textBaseline='middle'; lines.forEach((l,i)=>c.fillText(l,x+w/2,y+25+32+i*64)); c.letterSpacing='0px'; c.globalAlpha=1; }
      c.restore(); } }; };

// ---- prado template: sunny meadow, toy figures with floating ball hands (no arms), props sit in the hand ----
// p.people:[{shirt,pants,hair:'short'|'side'|'bob'|'bun'|'bald',hairColor,glasses,scale,hold:'mate'|'termo'|'yerba'|'both',mate,face,turn}]
// p.shot:'wide'|'close'|'flow' (wide, then push in on p.focus), p.focus (index), p.switchU
const toyCache=new Map(); const toy=(c,r=0.6)=>{ const k=c+'|'+r; if(!toyCache.has(k)) toyCache.set(k,new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:0})); return toyCache.get(k); };
const BALL={skins:['#f6cfb4','#f8d9c4','#f4c9ac'],hair:'#3a2416',shirts:['#e5483a','#2f6fd0','#f2a922','#2f9e6e','#8a4fd0','#ef7a3a'],pants:['#34425a','#5a4636','#3f4a3a']};
function yerbaLabelTex(){ const c=document.createElement('canvas'); c.width=256; c.height=320; const g=c.getContext('2d'); g.fillStyle='#fbf3df'; g.fillRect(0,0,256,320); g.strokeStyle='#2f7d3a'; g.lineWidth=10; g.strokeRect(12,12,232,296);
  g.fillStyle='#2f7d3a'; g.textAlign='center'; g.textBaseline='middle'; g.font='900 62px Montserrat'; g.fillText('YERBA',128,92); g.font='800 44px Montserrat'; g.fillText('MATE',128,146);
  g.save(); g.translate(128,232); for(const a of [-0.6,0,0.6]){ g.save(); g.rotate(a); g.beginPath(); g.ellipse(0,-26,16,36,0,0,Math.PI*2); g.fill(); g.restore(); } g.restore(); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
function ballYerba(){ const g=new THREE.Group(); put(g,mesh(new THREE.BoxGeometry(0.5,0.7,0.3),toy('#35a04a',0.75)),0,0.35,0); put(g,mesh(new THREE.BoxGeometry(0.5,0.05,0.3),toy('#f2c230',0.75)),0,0.62,0);
  const top=put(g,mesh(new THREE.BoxGeometry(0.5,0.1,0.12),toy('#2b8a3e',0.75)),0,0.74,0); put(g,mesh(new THREE.BoxGeometry(0.2,0.04,0.14),toy('#f4efe4',0.7)),0,0.76,0);
  const lb=put(g,mesh(new THREE.PlaneGeometry(0.36,0.45),new THREE.MeshStandardMaterial({map:yerbaLabelTex(),roughness:0.8}),false,true),0,0.32,0.152); return g; }
function makeBall(o={}){ const g=new THREE.Group(); const i=o.i||0; const skinC=o.skin||BALL.skins[i%3], hairC=o.hairColor||BALL.hair;
  const skin=toy(skinC,0.7), shirt=toy(o.shirt||BALL.shirts[i%6]), pants=toy(o.pants||BALL.pants[i%3],0.8), hairM=toy(hairC,0.85);
  const dsM=m=>{ const c=m.clone(); c.side=THREE.DoubleSide; return c; };
  // one soft body standing on the ground (no legs, no neck); the head rests directly on the shoulders
  put(g,lathe([[0.001,0],[0.17,0],[0.25,0.035],[0.285,0.13],[0.29,0.26],[0.268,0.44],[0.215,0.6],[0.13,0.71],[0.001,0.74]],dsM(shirt)),0,0,0);
  put(g,lathe([[0.001,-0.001],[0.175,-0.001],[0.257,0.034],[0.292,0.13],[0.296,0.215]],dsM(pants)),0,0,0);
  const HY=0.94, SH=0.56; const head=put(g,new THREE.Group(),0,HY,0); head.scale.setScalar(1.1); head.add(mesh(new THREE.SphereGeometry(0.26,36,26),skin));
  const dark=new THREE.Color(skinC).offsetHSL(0,0.02,-0.07); const skinD=toy('#'+dark.getHexString(),0.7);
  for(const sx of [-1,1]) put(head,mesh(new THREE.SphereGeometry(0.05,12,10),skinD),sx*0.252,-0.01,0).scale.set(0.6,1,0.8);
  put(head,mesh(new THREE.SphereGeometry(0.03,12,10),skinD,false),0,-0.012,0.258);
  const eyeG=new THREE.SphereGeometry(0.036,14,10); eyeG.scale(1,1.3,0.5); const eyeM=toy('#1d1715',0.35);
  const eyes=[-1,1].map(sx=>{ const e=put(head,mesh(eyeG,eyeM,false),sx*0.095,0.035,0.236); put(e,mesh(new THREE.SphereGeometry(0.011,8,6),toy('#ffffff',0.3),false),0.012,0.02,0.016); return e; });
  const face=makeFace(head,eyes,skinC,{brow:hairC,oTilt:0.41,oScale:0.55}); const setFace=face.set; let baseFace=o.face||'smile', sipping=false; face.set=n=>{ baseFace=n; setFace(sipping?'sip':n); }; face.set(baseFace);
  const hs=o.hair||['short','side','bob','short','bun','side'][i%6];
  if(hs!=='bald'){ const cap=put(head,mesh(new THREE.SphereGeometry(0.273,36,18,0,Math.PI*2,0,1.22),hairM),0,0.012,-0.008); cap.rotation.x=-0.42;
    if(hs==='side'){ const f=put(head,mesh(new THREE.SphereGeometry(0.11,18,14),hairM),0.05,0.205,0.115); f.scale.set(1.55,0.42,1.0); f.rotation.set(0.6,0,-0.22); }
    if(hs==='bob'){ put(head,mesh(new THREE.SphereGeometry(0.283,32,18,Math.PI,Math.PI,0,2.2),hairM),0,0.005,-0.01); }
    if(hs==='bun'){ put(head,mesh(new THREE.SphereGeometry(0.11,16,12),hairM),0,0.21,-0.2); } }
  if(o.glasses){ for(const sx of [-1,1]) put(head,mesh(new THREE.TorusGeometry(0.062,0.011,8,24),toy('#2a2a2a',0.4),false),sx*0.095,0.035,0.25); put(head,mesh(new THREE.BoxGeometry(0.07,0.012,0.012),toy('#2a2a2a',0.4),false),0,0.04,0.262); }
  // ball hands float freely: each hand follows a target point in body space (an invisible shoulder pivot carries it, so arm actions still work)
  const arms=[]; for(const sx of [-1,1]){ const piv=put(g,new THREE.Group(),sx*0.36,SH,0); const hand=put(piv,mesh(new THREE.SphereGeometry(0.095,20,16),skin),0,-0.36,0); const holder=put(piv,new THREE.Group(),0,-0.36,0);
    arms.push({piv,hand,holder,sx,rest:V(sx*0.42,0.22,0.03),idle:true}); }
  const place=(A,P)=>{ const r=P.clone().sub(A.piv.position), len=Math.max(0.05,r.length()); A.hand.position.y=A.holder.position.y=-len; A.piv.rotation.set(Math.atan2(-r.z,-r.y),0,Math.asin(clamp(r.x/len,-1,1))); A.holder.quaternion.copy(A.piv.quaternion).invert(); };
  if(o.scale) g.scale.setScalar(o.scale);
  const steam=[]; const TL=1.35*0.4; const stream=put(g,mesh(new THREE.CylinderGeometry(0.011,0.008,1,10),new THREE.MeshStandardMaterial({color:'#cfeeff',transparent:true,opacity:0.85,roughness:0.2}),false,false),0,0,0); stream.visible=false;
  const api={g,head,face,eyes,arms,armL:arms[0].piv,armR:arms[1].piv,handL:arms[0].hand,handR:arms[1].hand,steam,act:o.act||null,
    // the prop is fixed to the hand: the ball grips the gourd / flask at its side, a pack is carried between both hands
    give(kind,side='R',type){ const A=arms[side==='R'?1:0], sx=A.sx; A.idle=false;
      if(kind==='mate'){ const pr=makeMate(type||'calabaza').g; pr.scale.setScalar(0.36); const tip=put(pr.userData.bombilla,new THREE.Object3D(),0,0.76*0.65+0.42+0.035,0); pr.updateMatrixWorld(true); const tipLocal=pr.worldToLocal(tip.getWorldPosition(V(0,0,0)));
        if(api.act==='drink'&&sx>0) pr.rotation.y=Math.PI; A.rest=V(sx*0.3,0.42,0.3); const off=V(-sx*0.12,-0.085,0.09); put(A.holder,pr,off.x,off.y,off.z); api.mate={arm:A,pr,off,tipLocal};
        for(let k=0;k<3;k++){ const sp=put(pr,mesh(new THREE.SphereGeometry(0.08,10,8),new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,opacity:0.5,roughness:1,depthWrite:false}),false,false),0,0.9,0); sp.userData={k}; steam.push(sp); } }
      if(kind==='termo'){ const pr=makeTermo(type||'#2c6e9e'); pr.scale.setScalar(0.4); A.rest=V(sx*0.33,0.36,0.27); const off=V(-sx*0.125,-0.25,0.09); put(A.holder,pr,off.x,off.y,off.z); api.termo={arm:A,pr,off}; }
      if(kind==='yerba'){ const pr=ballYerba(); pr.scale.setScalar(0.56); arms.forEach(a=>{ a.rest=V(a.sx*0.215,0.4,0.36); a.idle=false; }); api.pack=put(g,pr,0,0.2,0.44); }
      return api; },
    tick(t,ph=0,u=0){ const act=api.act, M=api.mate, Tm=api.termo; const w=(act==='drink'||act==='pour')?ease(clamp((u-0.08)/0.22)):0; const P=arms.map((a,k)=>a.rest.clone().add(V(0,Math.sin(t*1.6+ph+k)*(a.idle?0.02:0.008),a.idle?Math.sin(t*1.1+ph+k*2)*0.02:0)));
      stream.visible=false; let sip=false; if(M) M.pr.rotation.x=0;
      if(act==='drink'&&M){ // the hand goes where the bombilla tip meets the mouth; the gourd leans towards the face
        head.rotation.set(0.1*w,0,0); const mouth=V(0,-0.105*1.1,0.242*1.1+0.012).applyEuler(head.rotation).add(head.position); M.pr.rotation.x=-0.35*w+Math.sin(t*5)*0.012*w; M.pr.updateMatrix();
        const d=M.tipLocal.clone().applyMatrix4(M.pr.matrix); const k=arms.indexOf(M.arm); P[k].lerp(mouth.sub(d),w); sip=w>0.9; }
      if(act==='pour'&&M&&Tm){ // flask tilted, its spout right above the opening of the gourd, water falls into the yerba
        const km=arms.indexOf(M.arm), kt=arms.indexOf(Tm.arm), sx=Tm.arm.sx; P[km].lerp(V(M.arm.sx*0.36,0.2,0.34),w); const open=P[km].clone().add(M.off).add(V(0,0.76*0.36,0));
        const th=1.85*w+Math.sin(t*3)*0.02*w, dir=V(-sx*Math.sin(th),Math.cos(th),0); const tipT=open.clone().add(V(sx*0.035,0.1,0)); const B=Tm.arm.rest.clone().add(Tm.off).lerp(tipT.clone().sub(dir.clone().multiplyScalar(TL)),w);
        const hOff=Tm.off.clone().negate().lerp(dir.clone().multiplyScalar(TL*0.36).add(V(0,0.05,-0.11)),w); P[kt]=B.clone().add(hOff); Tm.pr.position.copy(hOff).negate(); Tm.pr.rotation.z=sx*th;
        if(w>0.98){ const tp=B.clone().add(dir.clone().multiplyScalar(TL)).add(V(-sx*0.012,-0.02,0)); const y1=open.y-0.012, len=Math.max(0.02,tp.y-y1); stream.visible=true; stream.position.set(tp.x,(tp.y+y1)/2,tp.z); stream.scale.set(1+Math.sin(t*23)*0.15,len,1+Math.cos(t*19)*0.15); } }
      arms.forEach((a,k)=>place(a,P[k])); if(api.pack) api.pack.position.y=0.2+Math.sin(t*1.6+ph)*0.006;
      if(sip!==sipping){ sipping=sip; setFace(sip?'sip':baseFace); }
      const bl=(t*0.31+ph*0.37)%1; const by=bl>0.965?0.15:1; eyes.forEach(e=>e.scale.y=by);
      steam.forEach(sp=>{ const q=(t*0.45+sp.userData.k/3)%1; sp.position.set(Math.sin(q*5+sp.userData.k)*0.07,0.86+q*0.7,0); sp.scale.setScalar(0.6+q*1.6); sp.material.opacity=0.5*Math.sin(q*Math.PI); }); } };
  return api; }
function pradoGrass(){ const c=document.createElement('canvas'); c.width=c.height=1024; const g=c.getContext('2d'); g.fillStyle='#7fbf4d'; g.fillRect(0,0,1024,1024); const r=rng(8);
  for(let i=0;i<240;i++){ const x=r()*1024,y=r()*1024,rad=40+r()*150; const cc=r()<0.5?'rgba(160,215,95,0.25)':'rgba(85,150,55,0.2)'; for(const ox of [-1024,0,1024]) for(const oy of [-1024,0,1024]){ const q=g.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,rad); q.addColorStop(0,cc); q.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=q; g.fillRect(x+ox-rad,y+oy-rad,rad*2,rad*2); } }
  for(let i=0;i<8000;i++){ g.fillStyle=r()<0.5?'rgba(175,225,105,0.35)':'rgba(70,125,45,0.28)'; g.fillRect(r()*1024,r()*1024,2,5); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,10); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
T.prado=(p={})=>{ const s=new THREE.Scene(); s.background=new THREE.Color('#cfe9fb'); s.fog=new THREE.Fog('#cfe9fb',24,78);
  { const c=document.createElement('canvas'); c.width=4; c.height=512; const g=c.getContext('2d'); const q=g.createLinearGradient(0,0,0,512); q.addColorStop(0,'#1672dc'); q.addColorStop(0.36,'#2f8fe8'); q.addColorStop(0.455,'#5fb0f2'); q.addColorStop(0.495,'#cfeaff'); q.addColorStop(1,'#cfeaff'); g.fillStyle=q; g.fillRect(0,0,4,512); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
    put(s,mesh(new THREE.SphereGeometry(150,32,24),new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,fog:false}),false,false),0,0,0); } s.userData.bloom=0.2; const cam=newCam(40);
  s.add(new THREE.HemisphereLight('#e6f3ff','#9ccf62',1.15)); const k=sun(s,'#fff1d2',3.5,V(-6,9.5,6.5),8); k.shadow.mapSize.set(4096,4096); k.shadow.bias=-0.0002; k.shadow.normalBias=0.03; k.shadow.radius=3;
  const fill=new THREE.DirectionalLight('#d6e8ff',0.4); fill.position.set(7,3,6); s.add(fill); const rim=new THREE.DirectionalLight('#fff0c8',0.9); rim.position.set(4,5,-8); s.add(rim);
  const gr=put(s,mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({map:pradoGrass(),roughness:0.95}),false,true),0,0,0); gr.rotation.x=-Math.PI/2;
  for(const [x,z,r,c] of [[-16,-40,17,'#86c25a'],[10,-46,22,'#79b852'],[30,-38,15,'#8cc860'],[-36,-34,14,'#7dbb55']]){ const h=put(s,mesh(new THREE.SphereGeometry(r,40,20),toy(c,0.95),false,true),x,-r*0.62,z); h.scale.y=0.75; }
  const R=rng(31), d=new THREE.Object3D(), col=new THREE.Color(); const free=(x,z)=>!(Math.abs(z)<0.75&&Math.abs(x)<3.4);
  // grass tufts in two greens
  const tuft=new THREE.InstancedMesh(new THREE.ConeGeometry(0.03,0.2,4),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.9}),2600); tuft.receiveShadow=true;
  for(let i=0;i<2600;i++){ const x=-13+R()*26, z=-10+R()*16.5; const sc=0.6+R()*0.8; d.position.set(x,0.09*sc,z); d.rotation.set((R()-0.5)*0.6,R()*3,(R()-0.5)*0.6); d.scale.setScalar(sc); d.updateMatrix(); tuft.setMatrixAt(i,d.matrix); tuft.setColorAt(i,col.set(['#5fa53c','#74bb46','#8ccc55','#4f9636'][(R()*4)|0])); } s.add(tuft);
  // flowers with five petals, a yellow heart and a stem
  const NF=430, petal=new THREE.InstancedMesh((()=>{ const g=new THREE.SphereGeometry(0.036,8,6); g.scale(1,0.38,0.62); return g; })(),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.7}),NF*5);
  const heart=new THREE.InstancedMesh(new THREE.SphereGeometry(0.022,8,6),toy('#ffd23a',0.6),NF), stem=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.007,0.009,1,5),toy('#4c9a36',0.9),NF);
  const fc=['#ffffff','#ffd94a','#ff8fb5','#b8a2ff','#ff7d52','#ffffff','#ff5d73'];
  for(let i=0;i<NF;i++){ let x,z; do{ x=-11+R()*22; z=-8.5+R()*17; }while(!free(x,z)); const h=0.14+R()*0.14, sc=0.85+R()*0.9, c=fc[(R()*fc.length)|0], a0=R()*6, tilt=(R()-0.5)*0.5;
    for(let q=0;q<5;q++){ const a=a0+q*Math.PI*2/5; d.position.set(x+Math.cos(a)*0.04*sc,h,z-Math.sin(a)*0.04*sc); d.rotation.set(tilt,a,0); d.scale.setScalar(sc); d.updateMatrix(); petal.setMatrixAt(i*5+q,d.matrix); petal.setColorAt(i*5+q,col.set(c)); }
    d.position.set(x,h+0.008,z); d.rotation.set(0,0,0); d.scale.setScalar(sc); d.updateMatrix(); heart.setMatrixAt(i,d.matrix); d.position.set(x,h/2,z); d.scale.set(1,h,1); d.updateMatrix(); stem.setMatrixAt(i,d.matrix); }
  petal.castShadow=heart.castShadow=stem.castShadow=false; s.add(petal,heart,stem);
  // trees with round crowns (some in blossom), bushes, fence, little house, rocks, clouds
  for(let i=0;i<22;i++){ const x=-17+i*1.6+R()*0.9, z=-10.5-R()*7; const tr=put(s,new THREE.Group(),x,0,z); put(tr,mesh(new THREE.CylinderGeometry(0.13,0.19,1.5,10),toy('#7a5334',0.9)),0,0.75,0);
    const cc=R()<0.22?['#ffb7cf','#ff9dbd']:R()<0.5?['#6fb648','#5fa53c']:['#84c755','#70b548']; for(const [a,b,c2,r] of [[0,2.0,0,1.0],[0.65,1.7,0.2,0.72],[-0.65,1.75,0.1,0.75],[0,2.65,0,0.62],[0.1,1.9,0.6,0.6]]) put(tr,mesh(new THREE.SphereGeometry(r,20,14),toy(cc[(a>0)|0],0.9)),a,b,c2); tr.scale.setScalar(0.9+R()*0.6); }
  for(const [x,z,r] of [[-4.6,-3.6,0.55],[-3.7,-3.9,0.4],[4.4,-3.2,0.5],[5.2,-3.6,0.36],[-6.5,1.5,0.45],[6.6,2.2,0.4]]){ const b=put(s,mesh(new THREE.SphereGeometry(r,18,14),toy('#5fa53c',0.9)),x,r*0.55,z); b.scale.y=0.8; put(s,mesh(new THREE.SphereGeometry(r*0.6,14,10),toy('#74bb46',0.9)),x+r*0.55,r*0.4,z+0.15); }
  for(let i=0;i<13;i++){ const x=-9+i*1.5; put(s,mesh(new THREE.BoxGeometry(0.11,0.75,0.11),toy('#f4efe6',0.8)),x,0.37,-5.2); if(i<12) for(const y of [0.27,0.58]) put(s,mesh(new THREE.BoxGeometry(1.5,0.07,0.05),toy('#f4efe6',0.8)),x+0.75,y,-5.2); }
  const ran=put(s,new THREE.Group(),6.2,0,-9.5); put(ran,mesh(new THREE.BoxGeometry(3,1.7,2.2),toy('#fbf4e4',0.85)),0,0.85,0); const rf=put(ran,mesh(new THREE.ConeGeometry(2.4,1.2,4),toy('#d2553a',0.8)),0,2.3,0); rf.rotation.y=Math.PI/4; rf.scale.z=0.8;
  put(ran,mesh(new THREE.BoxGeometry(0.55,0.95,0.05),toy('#7a4a2a',0.8)),-0.6,0.48,1.11); for(const x of [0.7]) put(ran,mesh(new THREE.BoxGeometry(0.55,0.45,0.05),toy('#9fd4f2',0.3)),x,1.0,1.11); put(ran,mesh(new THREE.BoxGeometry(0.32,0.8,0.32),toy('#c9b29a',0.9)),0.8,2.5,-0.3);
  for(const [x,z,r] of [[-2.6,1.9,0.22],[3.3,1.5,0.18],[-5.2,-1.7,0.3],[5.6,-2.2,0.26]]) put(s,mesh(new THREE.IcosahedronGeometry(r,2),toy('#b9b5ad',0.9)),x,r*0.45,z).scale.y=0.6;
  const cloudM=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:0.85,roughness:1,fog:false}); const clouds=[];
  for(const [x,y,z,sc] of [[-9,12.5,-42,1.5],[5,15,-48,1.9],[15,10.5,-40,1.2],[-20,9.5,-44,1.3],[-1,9.2,-46,1.0]]){ const c=put(s,new THREE.Group(),x,y,z); for(const [a,b,r] of [[0,0,1.6],[1.7,-0.2,1.2],[-1.7,-0.25,1.25],[0.8,0.6,1.1],[-0.8,0.5,1.0],[3,-0.45,0.8],[-3,-0.5,0.8]]) put(c,mesh(new THREE.SphereGeometry(r,18,12),cloudM,false,false),a,b,0).scale.y=0.7; c.scale.setScalar(sc); c.userData.x0=x; clouds.push(c); }
  const flies=[]; for(let i=0;i<4;i++){ const b=put(s,new THREE.Group(),0,1,0); for(const sd of [-1,1]){ const w=put(b,mesh(new THREE.CircleGeometry(0.04,10),new THREE.MeshStandardMaterial({color:['#ffd94a','#ffffff','#ff9a5a','#b9a3ff'][i],side:THREE.DoubleSide}),false,false),sd*0.032,0,0); w.userData.sd=sd; } flies.push(b); }
  const motes=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:400},()=>[(R()-0.5)*16,0.3+R()*3.5,(R()-0.5)*12]).flat(),3)),new THREE.PointsMaterial({color:'#fffbe6',size:0.03,transparent:true,opacity:0.6,depthWrite:false})); s.add(motes);
  // people in a gentle arc, turned a little towards the middle
  const defs=p.people&&p.people.length?p.people:[{hold:'mate'}]; const n=defs.length, sp=n>4?1.05:1.2; const ppl=defs.map((o,i)=>{ const a=makeBall({...o,i:o.who??i}); const off=i-(n-1)/2; a.g.position.set(off*sp,0,-Math.abs(off)*0.12); a.g.rotation.y=-off*0.13+(o.turn||0); a.g.userData.y0=0; s.add(a.g);
    if(o.hold==='mate'||o.hold==='both') a.give('mate','R',o.mate); if(o.hold==='termo') a.give('termo','R',o.color); if(o.hold==='both') a.give('termo','L',o.color); if(o.hold==='yerba') a.give('yerba'); return a; });
  const fi=clamp(p.focus??Math.floor((n-1)/2),0,n-1), fp=ppl[fi].g.position, fs=ppl[fi].g.scale.y; const dist=5.3+Math.max(0,n-2)*1.1;
  const wideA=V(-1.1,1.6,dist+0.55), wideB=V(-0.3,1.5,dist), wideL=V(0,0.82,0), closeA=V(fp.x+0.7,1.2*fs,fp.z+4.9), closeB=V(fp.x+0.32,1.12*fs,fp.z+4.2), closeL=V(fp.x,0.88*fs,fp.z);
  const shot=p.shot||'wide'; const cues=[{u:0.04,type:'birds'}];
  return { scene:s, camera:cam, aperture:0.0011, maxblur:0.008, exposure:1.12, keepFaces:true, people:ppl, cues, update(u,t){ let l, pos;
      if(shot==='flow'){ const sw=p.switchU??0.42; const k1=clamp(u/sw), k2=ease(clamp((u-sw+0.06)/0.34)); pos=wideA.clone().lerp(wideB,ease(k1)).lerp(closeA.clone().lerp(closeB,clamp((u-sw)/(1-sw))),k2); l=wideL.clone().lerp(closeL,k2); cam.fov=40-10*k2; }
      else if(shot==='close'){ pos=closeA.clone().lerp(closeB,ease(u)); l=closeL.clone(); cam.fov=30; } else { pos=wideA.clone().lerp(wideB,ease(u)); l=wideL.clone(); cam.fov=40; }
      cam.position.copy(pos); cam.updateProjectionMatrix(); cam.lookAt(l);
      ppl.forEach((a,i)=>{ a.g.position.y=Math.abs(Math.sin(t*2.1+i*1.4))*0.012; a.head.rotation.set(Math.sin(t*0.9+i)*0.03,Math.sin(t*0.7+i*1.3)*0.14,Math.sin(t*1.2+i*2)*0.03); a.tick(t,i*1.7,u); });
      flies.forEach((b,i)=>{ const a=t*0.5+i*1.7; b.position.set(Math.sin(a)*2.4+(i-1.5)*2.2,0.75+Math.sin(a*2.3)*0.3,-2.6+Math.cos(a*0.8)*0.9); b.rotation.y=-a; b.children.forEach(w=>w.rotation.y=w.userData.sd*(0.3+0.9*Math.abs(Math.sin(t*18+i)))); });
      clouds.forEach((c,i)=>c.position.x=c.userData.x0+t*0.12*(1+i*0.2)); motes.rotation.y=t*0.02;
      return cam.position.distanceTo(shot==='wide'?wideL:closeL.clone().lerp(wideL,shot==='flow'?1-ease(clamp((u-(p.switchU??0.42)+0.06)/0.34)):0)); } }; };

// ---------------- renderer ----------------
const canvas=document.getElementById('c'); canvas.width=W; canvas.height=H;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true}); renderer.setPixelRatio(1); renderer.setSize(W,H,false);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping;
const SOFT=(()=>{ try{ const gl=renderer.getContext(); const ext=gl.getExtension('WEBGL_debug_renderer_info'); return /SwiftShader|llvmpipe|Software/i.test(gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)); }catch(e){ return false; } })();
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,samples:SOFT?2:4}));
const dummyS=new THREE.Scene(), dummyC=newCam(40);
const renderPass=new RenderPass(dummyS,dummyC), bokeh=new BokehPass(dummyS,dummyC,{focus:3,aperture:0.002,maxblur:0.008});
const bloom=new UnrealBloomPass(new THREE.Vector2(W/2,H/2),0,0.45,0.97); bloom.enabled=false;
// high quality mode (style.hq): ambient occlusion, bloom, colour grade, vignette, film grain
const gtao=new GTAOPass(dummyS,dummyC,W,H); gtao.enabled=false; gtao.updateGtaoMaterial({radius:0.45,distanceExponent:1.4,thickness:1.2,scale:1.15,samples:16}); gtao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:16}); gtao.blendIntensity=0.85;
const GradeShader={uniforms:{tDiffuse:{value:null},time:{value:0},vig:{value:0.32},grain:{value:0.028},sat:{value:1.1},warm:{value:0.035},contrast:{value:1.07}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform sampler2D tDiffuse; uniform float time,vig,grain,sat,warm,contrast; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); } '+
  'void main(){ vec4 c=texture2D(tDiffuse,vUv); vec3 col=c.rgb; float l=dot(col,vec3(0.299,0.587,0.114)); col=mix(vec3(l),col,sat); col=(col-0.5)*contrast+0.5; col+=vec3(warm,warm*0.35,-warm*0.5)*(1.0-l)*0.8; col+=vec3(-warm*0.2,0.0,warm*0.3)*l*0.5; '+
  ' vec2 d=vUv-0.5; d.x*=0.5625; float v=smoothstep(0.75,0.18,length(d)); col*=mix(1.0-vig,1.0,v); col+=(h(vUv*vec2(1080.0,1920.0)+time)-0.5)*grain; gl_FragColor=vec4(clamp(col,0.0,1.0),c.a); }'};
const grade=new ShaderPass(GradeShader); grade.enabled=false;
composer.addPass(renderPass); composer.addPass(gtao); composer.addPass(bokeh); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(grade);
const SEGFACE={excited:'happy',surprised:'surprised',warm:'smile',nostalgic:'smile',proud:'proud',tense:'surprised',funny:'laugh',sad:'sad',angry:'angry',love:'love'};
function applyEmo(inst,sh,u,t){ if(!sh) return; const emo={...(inst.emo||{}),...(sh.emo||{})}; const face=emo.face||(inst.keepFaces?null:SEGFACE[sh.segEmo])||null;
  const who=emo.who; (inst.people||[]).forEach((pp,i)=>{ const hit=who==null||who==='all'||who===i||(Array.isArray(who)&&who.includes(i));
    if(face&&hit) pp.face.set(face); applyAct(pp,hit?emo.act:null,t,u); });
  (inst.mates||[]).forEach(M=>{ if(M.face&&(emo.mateFace||face)) M.face.set(emo.mateFace||face); }); }
function render3D(inst,u,t){ if(inst.no3d){ inst.update(u,t); return; } bokeh.enabled=inst.aperture>0&&inst.maxblur>0; renderPass.scene=bokeh.scene=inst.scene; renderPass.camera=bokeh.camera=inst.camera; bokeh.uniforms.aperture.value=inst.aperture; bokeh.uniforms.maxblur.value=inst.maxblur;
  const f=inst.update(u,t); applyEmo(inst,E.curShot,u,t); bokeh.uniforms.focus.value=f; const hq=!!E.tl?.style?.hq; let bs=inst.scene.userData.bloom||0; bloom.threshold=0.97; if(hq){ bs=Math.max(bs,0.32); bloom.threshold=Math.min(bloom.threshold,inst.scene.userData.bloom?0.97:0.8); } bloom.enabled=bs>0; bloom.strength=bs;
  gtao.enabled=hq&&inst.scene.userData.ao!==false; if(gtao.enabled){ gtao.scene=inst.scene; gtao.camera=inst.camera; } grade.enabled=hq; grade.uniforms.time.value=(t*37.13)%100; renderer.toneMappingExposure=inst.exposure||1; composer.render(); }

// ---------------- composer ----------------
const E={};
const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const ctx=cv.getContext('2d');
const easeOutBack=x=>{const c1=2.2,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
function strokeText(txt,x,y,fill,stroke,lw){ ctx.lineJoin='round'; ctx.miterLimit=2; ctx.strokeStyle=stroke; ctx.lineWidth=lw; ctx.strokeText(txt,x,y); ctx.fillStyle=fill; ctx.fillText(txt,x,y); }
const fmtNum=n=>Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
function fitFont(weight,size,txt,maxW){ ctx.font=`${weight} ${size}px Montserrat`; const w=ctx.measureText(txt).width; if(w>maxW){ size=Math.floor(size*maxW/w); ctx.font=`${weight} ${size}px Montserrat`; } return size; }

// flat vector look: every lit material becomes a 3-tone toon material, depth of field off, softer contrast
const toonGrad=(()=>{ const d=new Uint8Array([90,170,255]); const t=new THREE.DataTexture(d,3,1,THREE.RedFormat); t.minFilter=t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const toonCache=new Map();
function toToon(m){ if(!m||!m.isMeshStandardMaterial) return m; if(toonCache.has(m)) return toonCache.get(m);
  const t=new THREE.MeshToonMaterial({color:m.color.clone(),gradientMap:toonGrad,emissive:m.emissive.clone(),emissiveIntensity:m.emissiveIntensity,transparent:m.transparent,opacity:m.opacity,side:m.side,depthWrite:m.depthWrite});
  if(m.metalness>0.5) t.color.offsetHSL(0,0,0.08); toonCache.set(m,t); return t; }
function flatten(inst){ inst.aperture=0; inst.maxblur=0; inst.scene.traverse(o=>{ if(o.isMesh||o.isInstancedMesh){ o.material=Array.isArray(o.material)?o.material.map(toToon):toToon(o.material); } if(o.isLight&&o.shadow){ o.shadow.radius=1; } }); }

E.init=async(tl)=>{
  E.tl=tl; E.accent=tl.style?.accent||'#ffd84a'; E.capY=tl.style?.captionY||1190; E.capCase=tl.style?.captionCase||'upper';
  await document.fonts.load('900 90px Montserrat'); await document.fonts.load('800 50px Montserrat'); for(const q of ['600 80px "Cormorant Garamond"','italic 500 60px "Cormorant Garamond"','italic 600 80px "Cormorant Garamond"','500 60px "Cormorant Garamond"']) await document.fonts.load(q);
  E.inst=tl.shots.map(sh=>{ const f=T[sh.tpl]; if(!f) throw new Error('unknown template '+sh.tpl); return f(sh.p||{}); });
  if(tl.style?.render==='flat') E.inst.forEach(flatten);
  // caption chunks
  const ws=tl.words; const chunks=[]; let cur=[]; const maxW=tl.style?.wordsPerCaption||3;
  ws.forEach((w,i)=>{ cur.push(w); const nx=ws[i+1]; if(cur.length>=maxW||/[.,!?]$/.test(w.w)||!nx||nx.seg!==w.seg||w.w.length>12){ chunks.push(cur); cur=[]; } });
  E.chunks=chunks.map((c,i)=>{ const nx=chunks[i+1]; const l=c[c.length-1]; let t1=l.t+l.d+0.25; if(nx&&nx[0].seg===l.seg) t1=Math.min(t1,nx[0].t); return {words:c,t0:c[0].t,t1}; });
  // template cues -> global
  const cues=[]; tl.shots.forEach((sh,k)=>{ for(const c of E.inst[k].cues||[]){ cues.push({...c,t:sh.start+c.u*sh.dur,d:(c.d||0)*sh.dur}); }
    for(const a of E.inst[k].ambient||[]) cues.push({type:a,t:sh.start,d:sh.dur}); });
  E.events={flash:[...(tl.events?.flash||[])],shake:[...(tl.events?.shake||[])]}; cues.filter(c=>c.impact).forEach(c=>{ E.events.flash.push(c.t+0.05); E.events.shake.push(c.t+0.05); });
  return {total:tl.total,cues};
};
function shotIndex(T_){ const s=E.tl.shots; for(let i=0;i<s.length;i++) if(T_<s[i].start+s[i].dur) return i; return s.length-1; }
function drawCaptionExplainer(T_,ch){
  const pop=easeOutBack(clamp((T_-ch.t0)/0.1)); let size=E.tl.style?.captionSize||66; ctx.font=`800 ${size}px Montserrat`;
  const words=ch.words.map(w=>w.w.replace(/[.,!?:;]$/,'')); const sp=22; let widths=words.map(w=>ctx.measureText(w).width), tw=widths.reduce((a,b)=>a+b,0)+sp*(words.length-1);
  if(tw>900){ size=Math.floor(size*900/tw); ctx.font=`800 ${size}px Montserrat`; widths=words.map(w=>ctx.measureText(w).width); tw=widths.reduce((a,b)=>a+b,0)+sp*(words.length-1); }
  ctx.save(); ctx.translate(W/2,E.tl.style?.captionY||(E.tl.style?.viewfinder?420:300)); ctx.scale(0.9+0.1*pop,0.9+0.1*pop); ctx.textBaseline='middle'; ctx.textAlign='center'; let x=-tw/2;
  if(E.tl.style?.captionBox){ ctx.fillStyle=E.tl.style.captionBox===true?'rgba(14,20,30,0.62)':E.tl.style.captionBox; ctx.beginPath(); ctx.roundRect(-tw/2-34,-size*0.86,tw+68,size*1.72,size*0.5); ctx.fill(); }
  ch.words.forEach((w,i)=>{ const active=T_>=w.t-0.02&&(i===ch.words.length-1||T_<ch.words[i+1].t-0.02); const cx=x+widths[i]/2;
    if(active){ const st=E.tl.style||{}; ctx.fillStyle=st.hiBg||E.accent; ctx.beginPath(); ctx.roundRect(cx-widths[i]/2-14,-size*0.62,widths[i]+28,size*1.24,14); ctx.fill(); if(st.hiBorder){ ctx.lineWidth=4; ctx.strokeStyle=st.hiBorder; ctx.stroke(); } ctx.fillStyle=st.hiFg||'#10161f'; ctx.font=`900 ${size}px Montserrat`; }
    else { ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=12; ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.font=`800 ${size}px Montserrat`; }
    ctx.fillText(words[i],cx,3); ctx.shadowBlur=0; x+=widths[i]+sp; });
  ctx.restore();
}
function drawCaption(T_){
  if(E.tl.style?.noCaptions) return; const ch=E.chunks.find(c=>T_>=c.t0&&T_<c.t1); if(!ch) return; if(E.tl.style?.look==='word') return drawCaptionWord(T_,ch);
  if(E.tl.style?.look==='explainer') return drawCaptionExplainer(T_,ch);
  const pop=easeOutBack(clamp((T_-ch.t0)/0.12)); let size=E.tl.style?.captionSize||96; ctx.font=`900 ${size}px Montserrat`;
  const words=ch.words.map(w=>{ const x=w.w.replace(/[.,!?]$/,''); return E.capCase==='upper'?x.toUpperCase():x; }); const sp=46;
  let widths=words.map(w=>ctx.measureText(w).width), tw=widths.reduce((a,b)=>a+b,0)+sp*(words.length-1);
  if(tw>860){ size=Math.floor(size*860/tw); ctx.font=`900 ${size}px Montserrat`; widths=words.map(w=>ctx.measureText(w).width); tw=widths.reduce((a,b)=>a+b,0)+sp*(words.length-1); }
  const clean=(E.tl.style?.look||'clean')==='clean';
  ctx.save(); ctx.translate(W/2,E.capY); ctx.scale(0.75+0.25*pop,0.75+0.25*pop); ctx.textBaseline='middle'; ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=18; ctx.shadowOffsetY=6;
  let x=-tw/2; ch.words.forEach((w,i)=>{ const active=T_>=w.t-0.02&&(i===ch.words.length-1||T_<ch.words[i+1].t-0.02); const s=active?1.08:1;
    ctx.save(); ctx.translate(x+widths[i]/2,0); ctx.scale(s,s); ctx.textAlign='center';
    if(clean){ if(active){ ctx.save(); ctx.shadowBlur=14; ctx.fillStyle=E.accent; ctx.beginPath(); ctx.roundRect(-widths[i]/2-18,-size*0.62,widths[i]+36,size*1.22,size*0.3); ctx.fill(); ctx.restore(); ctx.shadowBlur=0; ctx.fillStyle='#1b120e'; ctx.fillText(words[i],0,4); }
      else { ctx.lineJoin='round'; ctx.lineWidth=9; ctx.strokeStyle='rgba(27,18,14,0.85)'; ctx.strokeText(words[i],0,0); ctx.shadowBlur=0; ctx.fillStyle='#ffffff'; ctx.fillText(words[i],0,0); } }
    else strokeText(words[i],0,0,active?E.accent:'#ffffff','#1b120e',16);
    ctx.restore(); x+=widths[i]+sp; });
  ctx.restore();
}
function drawCallouts(T_){
  for(const c of E.tl.callouts){ if(T_<c.t0||T_>=c.t1) continue;
    const a=clamp((T_-c.t0)/0.22), out=clamp((c.t1-T_)/0.1), sc=Math.max(0.01,easeOutBack(a))*out;
    ctx.save(); ctx.translate(W/2,c.y||(c.type!=='pill'&&E.tl.style?.calloutY)||(E.tl.style?.look==='explainer'?(c.type==='pill'?1320:1250):(c.type==='pill'?560:440))); ctx.rotate((c.rot||0)*Math.PI/180*(1-0.3*a)); ctx.scale(sc,sc);
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=24; ctx.shadowOffsetY=8;
    const col=c.color||E.accent;
    const cleanC=(E.tl.style?.look||'clean')==='clean';
    const card=(main,sub,mainCol)=>{ const ms=fitFont(900,150,main,820); const mw=ctx.measureText(main).width; let sw=0, ss=0; if(sub){ ss=fitFont(800,50,sub,820); sw=ctx.measureText(sub).width; }
      const w=Math.max(mw,sw)+110, h=ms*1.05+(sub?ss*1.5:0)+70; ctx.save(); ctx.shadowColor='rgba(40,20,10,0.35)'; ctx.shadowBlur=36; ctx.shadowOffsetY=14; ctx.fillStyle='#fffaf2'; ctx.beginPath(); ctx.roundRect(-w/2,-h/2,w,h,46); ctx.fill(); ctx.restore();
      ctx.fillStyle=col; ctx.beginPath(); ctx.roundRect(-w/2+40,h/2-16,w-80,8,4); ctx.fill();
      const y0=-h/2+35+ms*0.52; ctx.font=`900 ${ms}px Montserrat`; ctx.shadowBlur=0; ctx.fillStyle=mainCol||'#1b120e'; ctx.fillText(main,0,y0);
      if(sub){ ctx.font=`800 ${ss}px Montserrat`; ctx.fillStyle='#8a6a55'; ctx.fillText(sub,0,y0+ms*0.55+ss*0.75); } };
    if(c.type==='big'){ if(cleanC) card(c.text,c.sub,c.color&&c.color!==E.accent?c.color:'#1b120e'); else { const cs=E.tl.style?.calloutSize||170; fitFont(900,cs,c.text,940); strokeText(c.text,0,0,col,'#1b120e',Math.round(22*cs/170)); if(c.sub){ fitFont(800,54,c.sub,940); strokeText(c.sub,0,118,'#ffffff','#1b120e',12); } } }
    if(c.type==='counter'){ const k=clamp((T_-c.count[0])/Math.max(0.1,c.count[1]-c.count[0])); const v=c.from+(c.to-c.from)*(1-Math.pow(1-k,3)); const dec=c.decimals||0;
      const final=(c.prefix||'')+(dec?c.to.toFixed(dec):fmtNum(c.to))+(c.suffix||''); const s=fitFont(900,130,final,880); ctx.font=`900 ${s}px Montserrat`;
      if(cleanC){ card((c.prefix||'')+(dec?v.toFixed(dec):fmtNum(v))+(c.suffix||''),c.sub); } else { strokeText((c.prefix||'')+(dec?v.toFixed(dec):fmtNum(v))+(c.suffix||''),0,0,col,'#1b120e',20); if(c.sub){ fitFont(800,54,c.sub,940); strokeText(c.sub,0,110,'#ffffff','#1b120e',12); } } }
    if(c.type==='ratio'){ ctx.font='900 140px Montserrat'; const showB=T_>=c.tb; const bA=easeOutBack(clamp((T_-c.tb)/0.2));
      if(!showB) strokeText(c.a,0,0,c.colorA||'#9fe07a','#1b120e',20); else { strokeText(c.a,-260,0,c.colorA||'#9fe07a','#1b120e',20); ctx.save(); ctx.scale(bA,bA); strokeText('→',0,-6,'#ffffff','#1b120e',18); ctx.restore(); ctx.save(); ctx.translate(270,0); ctx.scale(bA,bA); strokeText(c.b,0,0,col,'#1b120e',20); ctx.restore(); }
      if(c.sub){ fitFont(800,54,c.sub,940); strokeText(c.sub,0,112,'#ffffff','#1b120e',12); } }
    if(c.type==='check'||c.type==='cross'){ const ok=c.type==='check'; const fs2=fitFont(900,120,(ok?'✓ ':'✗ ')+c.text,720); const w=Math.max(ctx.measureText((ok?'✓ ':'✗ ')+c.text).width+120,400);
      ctx.fillStyle=ok?'#2f9e44':'#d63c2f'; ctx.beginPath(); ctx.roundRect(-w/2,-95,w,190,40); ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.fillText((ok?'✓ ':'✗ ')+c.text,0,6); if(c.sub){ ctx.shadowBlur=18; fitFont(800,54,c.sub,940); strokeText(c.sub,0,150,'#ffffff','#1b120e',12); } }
    if(c.type==='xmark'){ ctx.restore(); ctx.save(); ctx.translate(W/2,c.y||900); const sz=c.size||380; const a=clamp((T_-c.t0)/0.25), b=clamp((T_-c.t0-0.15)/0.25)*out; ctx.lineCap='round'; ctx.lineWidth=46; ctx.strokeStyle=c.color||'#e5483a'; ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.moveTo(-sz/2,-sz/2); ctx.lineTo(-sz/2+sz*a*out,-sz/2+sz*a*out); ctx.stroke(); if(b>0){ ctx.beginPath(); ctx.moveTo(sz/2,-sz/2); ctx.lineTo(sz/2-sz*b,-sz/2+sz*b); ctx.stroke(); }
      if(c.text){ ctx.shadowBlur=0; ctx.font='900 '+(c.textSize||130)+'px Montserrat'; ctx.textAlign='center'; ctx.textBaseline='middle'; strokeText(c.text,0,-sz/2-110,c.textColor||'#e5483a','#10161f',10); } }
    if(c.type==='pill'){ const pulse=1+0.04*Math.sin((T_-c.t0)*10); ctx.scale(pulse,pulse); ctx.font='900 78px Montserrat'; const w=ctx.measureText(c.text).width+110, h=150;
      ctx.fillStyle=c.bg||'#c96a4b'; ctx.beginPath(); ctx.roundRect(-w/2,-h/2,w,h,h/2); ctx.fill(); ctx.shadowBlur=0; ctx.lineWidth=8; ctx.strokeStyle='#fff3e0'; ctx.stroke(); ctx.fillStyle='#fff'; ctx.fillText(c.text,0,4);
      if(c.sub){ ctx.font='800 50px Montserrat'; ctx.shadowBlur=18; strokeText(c.sub,0,140,E.accent,'#1b120e',12); } }
    ctx.restore(); }
}
const proj=new THREE.Vector3();
function drawLabels(inst,sh,zoomRect,T_){ if(!inst.labels) return; const L=inst.labels(); if(!L.length) return; const [x0,y0,sw,shh]=zoomRect;
  L.forEach((l,k)=>{ proj.copy(l.v).project(inst.camera); let x=(proj.x*0.5+0.5)*W, y=(-proj.y*0.5+0.5)*H; x=(x-x0)*W/sw; y=(y-y0)*H/shh; if(l.side) x+=l.side*260;
    const a=easeOutBack(clamp((T_-sh.start-0.25-k*0.12)/0.2)); if(a<=0) return; ctx.save(); ctx.translate(clamp(x,170,W-170),clamp(y,200,H-300)); ctx.scale(a,a); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='900 46px Montserrat'; const tw=ctx.measureText(l.text).width+50; ctx.fillStyle=E.tl.style?.labelBg||'rgba(27,18,14,0.82)'; ctx.beginPath(); ctx.roundRect(-tw/2,-38,tw,76,38); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(l.text,0,3);
    if(l.value){ ctx.font='900 64px Montserrat'; ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=14; strokeText(l.value,0,-90,E.accent,'#1b120e',14); } ctx.restore(); });
}
E.frame=(T_)=>{
  const tl=E.tl, k=shotIndex(T_), sh=tl.shots[k], inst=E.inst[k]; const L=T_-sh.start, u=clamp(L/sh.dur); E.curShot=sh;
  const dis=tl.style?.cut==='dissolve'&&k>0&&L<0.45; let prevImg=null;
  if(dis){ const ps=tl.shots[k-1], pi=E.inst[k-1]; E.curShot=ps; render3D(pi,1,ps.dur+L+(ps.tOffset||0)); if(!E._dc){ E._dc=document.createElement('canvas'); E._dc.width=W; E._dc.height=H; } const dc=E._dc.getContext('2d'); dc.drawImage(canvas,0,0,W,H); if(pi.overlay) pi.overlay(dc,1,ps.dur+L,ps); prevImg=E._dc; E.curShot=sh; }
  render3D(inst,u,L+(sh.tOffset||0));
  let z=(sh.zoom||1)*(1+0.05*u)*(1+0.1*Math.pow(1-clamp(L/0.28),3)); let sx=0,sy=0;
  for(const e of E.events.shake){ const d=T_-e; if(d>=0&&d<0.35){ const a=(1-d/0.35)*22; sx+=Math.sin(d*90)*a; sy+=Math.cos(d*77)*a; } }
  const sw=W/z, shh=H/z, c=sh.c||[0.5,0.5]; const x0=clamp(c[0]*W-sw/2,0,W-sw), y0=clamp(c[1]*H-shh/2,0,H-shh);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  let whip=0,dir=0; if(!tl.style?.cut) for(const cut of tl.cuts){ const d=T_-cut; if(Math.abs(d)<0.13){ whip=1-Math.abs(d)/0.13; dir=d<0?-1:1; } }
  if(whip>0){ const off=dir*whip*whip*420; for(let i=-4;i<=4;i++){ ctx.globalAlpha=i===0?1:0.22; ctx.drawImage(canvas,x0,y0,sw,shh,off+i*whip*40+sx,sy,W,H); } ctx.globalAlpha=1; }
  else { if(prevImg){ ctx.drawImage(prevImg,0,0); ctx.globalAlpha=ease(clamp(L/0.45)); } ctx.drawImage(canvas,x0,y0,sw,shh,sx,sy,W,H); }
  if(inst.overlay) inst.overlay(ctx,u,L,sh); ctx.globalAlpha=1;
  const g=ctx.createRadialGradient(W/2,H*0.48,H*0.3,W/2,H*0.5,H*0.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(20,10,5,${tl.style?.look==='explainer'?0.12:(tl.style?.look||'clean')==='clean'?0.28:0.45})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  for(const e of E.events.flash){ const d=T_-e; if(d>=0&&d<0.18){ ctx.fillStyle=`rgba(255,248,230,${0.55*(1-d/0.18)})`; ctx.fillRect(0,0,W,H); } }
  if(tl.style?.viewfinder){ const m=70, L=120, th=10; ctx.save(); ctx.strokeStyle='rgba(255,255,255,0.92)'; ctx.lineWidth=th; ctx.lineCap='round';
    for(const [cx,cy,dx,dy] of [[m,m+200,1,1],[W-m,m+200,-1,1],[m,H-m-260,1,-1],[W-m,H-m-260,-1,-1]]){ ctx.beginPath(); ctx.moveTo(cx,cy+dy*L); ctx.lineTo(cx,cy); ctx.lineTo(cx+dx*L,cy); ctx.stroke(); }
    if(Math.floor(T_*2)%2===0){ ctx.fillStyle='#ff3b30'; ctx.beginPath(); ctx.arc(m+50,m+260,16,0,Math.PI*2); ctx.fill(); } ctx.font='800 34px Montserrat'; ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText('REC',m+80,m+272);
    const sec=Math.floor(T_); ctx.textAlign='right'; ctx.fillText('00:'+String(sec).padStart(2,'0'),W-m-30,m+272); ctx.restore(); }
  if(tl.style?.panel24) drawPanel24(T_);
  drawLabels(inst,sh,[x0,y0,sw,shh],T_); drawCallouts(T_); drawCaption(T_); if(tl.style?.partBadge) drawBadge(T_); if(tl.style?.cut) drawCutFx(T_);
  ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(0,0,W,12); ctx.fillStyle=tl.style?.barColor||'#9fd3f2'; ctx.fillRect(0,0,W*clamp(T_/tl.total),12);
};
E.jpeg=(T_,q=0.92)=>{ E.frame(T_); return cv.toDataURL('image/jpeg',q); };
E.sheet=(times,cols=5)=>{ const cw=216,chh=384; const sc=document.createElement('canvas'); sc.width=cw*cols; sc.height=chh*Math.ceil(times.length/cols); const g2=sc.getContext('2d');
  times.forEach((t,k)=>{ E.frame(t); g2.drawImage(cv,(k%cols)*cw,Math.floor(k/cols)*chh,cw,chh); }); return sc.toDataURL('image/png'); };
E.templates=Object.keys(T);
window.__engine=E; window.__engineReady=true;
