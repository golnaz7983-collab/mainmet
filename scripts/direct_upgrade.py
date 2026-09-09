from pathlib import Path

p = Path('play.html')
s = p.read_text()

# Labels
s = s.replace('<title>mainmet • Web Game 512</title>', '<title>mainmet • Web Game 2048</title>')
s = s.replace('mainmet • WEB GAME 512', 'mainmet • WEB GAME 2048')
s = s.replace('512×512 TEXTURES', '2048×2048 BLOCK TEXTURES • 1014×1014 MOB TEXTURES')
s = s.replace('Web Game 512×512', 'Web Game 2048×2048')

# Texture resolution: blocks use 2048, mobs use 1014.
s = s.replace('function tex(base,accent,seed=1){', 'function tex(base,accent,seed=1,size=2048){')
s = s.replace('c.width=c.height=512;', 'c.width=c.height=size;')
s = s.replace('x.fillRect(0,0,256,256);', 'x.fillRect(0,0,c.width,c.height);')
s = s.replace('for(let i=0;i<5200;i++){', 'for(let i=0;i<26000;i++){', 1)
s = s.replace('const px=s&255,py=(s>>>8)&255,sz=1+(s%4);', 'const px=s%c.width,py=(s>>>8)%c.height,sz=1+(s%8);', 1)
s = s.replace('for(let i=0;i<800;i++){', 'for(let i=0;i<4000;i++){', 1)
s = s.replace('const px=s&255,py=(s>>>8)&255;', 'const px=s%c.width,py=(s>>>8)%c.height;', 1)
s = s.replace('const MAX_INSTANCES=12000;', 'const MAX_INSTANCES=70000;')

# Infinite deterministic chunk streaming, with edits preserved while chunks unload/reload.
start = s.find('for(let x=-30;x<=30;x++)for(let z=-30;z<=30;z++){')
end = s.find('/* ---------- roaming mobs ---------- */')
if start != -1 and end != -1:
    world = '''const CHUNK_SIZE=16,STREAM_RADIUS=2;
const worldChunks=new Map();
const editedBlocks=new Map();
function chunkId(cx,cz){return `${cx},${cz}`}
function chunkFor(x,z){return [Math.floor(x/CHUNK_SIZE),Math.floor(z/CHUNK_SIZE)]}
function rememberEdit(x,y,z,type){editedBlocks.set(key(x,y,z),type===undefined?null:type)}
function generateChunk(cx,cz){
 const id=chunkId(cx,cz);if(worldChunks.has(id))return;
 const list=[];worldChunks.set(id,list);
 const put=(x,y,z,t)=>{addBlock(x,y,z,t);list.push(key(x,y,z));};
 for(let lx=0;lx<CHUNK_SIZE;lx++)for(let lz=0;lz<CHUNK_SIZE;lz++){
  const x=cx*CHUNK_SIZE+lx,z=cz*CHUNK_SIZE+lz,h=Math.max(2,heightAt(x,z));
  heights.set(key(x,0,z),h);
  for(let y=0;y<=h;y++){
   const ek=key(x,y,z),et=editedBlocks.get(ek);
   if(et===null)continue;
   put(x,y,z,et|| (y===h?'grass':y>=h-2?'dirt':'stone'));
  }
 }
 for(let lx=2;lx<CHUNK_SIZE-2;lx+=5)for(let lz=2;lz<CHUNK_SIZE-2;lz+=5){
  const x=cx*CHUNK_SIZE+lx,z=cz*CHUNK_SIZE+lz;
  if(Math.hypot(x,z-8)<11||rnd(x+4,z+8)>.72)continue;
  const h=heightAt(x,z)+1;
  for(let i=0;i<4;i++)put(x,h+i,z,'wood');
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=1;dy<=3;dy++)if(Math.abs(dx)+Math.abs(dz)<4)put(x+dx,h+dy,z+dz,'leaves');
 }
}
function unloadChunk(cx,cz){
 const id=chunkId(cx,cz),list=worldChunks.get(id);if(!list)return;
 for(const k of list){const b=blocks.get(k);if(b)removeBlock(b.x,b.y,b.z)}
 worldChunks.delete(id);
}
function updateWorldStreaming(){
 const [pcx,pcz]=chunkFor(player.feet.x,player.feet.z),wanted=new Set();
 for(let dx=-STREAM_RADIUS;dx<=STREAM_RADIUS;dx++)for(let dz=-STREAM_RADIUS;dz<=STREAM_RADIUS;dz++){
  const cx=pcx+dx,cz=pcz+dz;wanted.add(chunkId(cx,cz));generateChunk(cx,cz);
 }
 for(const id of [...worldChunks.keys()])if(!wanted.has(id)){
  const [cx,cz]=id.split(',').map(Number);unloadChunk(cx,cz);
 }
}
for(let cx=-2;cx<=2;cx++)for(let cz=-2;cz<=2;cz++)generateChunk(cx,cz);
'''
    s = s[:start] + world + s[end:]

# 1014x1014 animal textures and mapped materials.
s = s.replace('const sandTex=tex("#cfb66d","#bca15b",73);', 'const sandTex=tex("#cfb66d","#bca15b",73);\nconst cowTex=tex("#6b472c","#3e2818",91,1014);\nconst sheepTex=tex("#e8e7df","#b9b9b3",103,1014);')
s = s.replace("const bm=new THREE.MeshLambertMaterial({color:type==='sheep'?0xe8e7df:0x6b472c}),hm=new THREE.MeshLambertMaterial({color:type==='sheep'?0xd9d9d4:0x56371f});", "const animalTex=type==='sheep'?sheepTex:cowTex;const bm=new THREE.MeshLambertMaterial({map:animalTex});const hm=new THREE.MeshLambertMaterial({map:animalTex});")

# Survival / Creative selection.
marker = '<button class="mcbtn green" id="startBtn">🎮 شروع بازی</button>'
if 'id="survivalMode"' not in s:
    s = s.replace(marker, '<div class="modeSelect"><button class="modeBtn sel" id="survivalMode">🛡️ Survival</button><button class="modeBtn" id="creativeMode">🧱 Creative</button></div>\n '+marker)

css = '''
.modeSelect{display:flex;gap:8px;margin:10px 0}.modeBtn{flex:1;padding:12px;border:2px solid #555;background:#292929;color:#fff;font-weight:900;border-radius:4px;cursor:pointer}.modeBtn.sel{border-color:#7bc37e;background:#315c36}
#controlSettings{position:fixed;z-index:95;left:10px;top:90px;width:44px;height:38px;border:2px solid #555;border-radius:4px;background:#111c;color:#fff;font-weight:900}
#controlsModal{position:fixed;inset:0;z-index:125;background:#000c;display:none;align-items:center;justify-content:center;padding:18px}#controlsModal.show{display:flex}.controlsBox{width:min(560px,94vw);max-height:90vh;overflow:auto;background:#151815;border:3px solid #555;box-shadow:0 24px 90px #000;color:#fff;padding:18px}.controlGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.controlRow{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#0e110e;border:1px solid #454b45;padding:8px;border-radius:4px}.controlRow input{width:100px;background:#090b09;color:#fff;border:1px solid #666;padding:7px;direction:ltr}
@media(orientation:landscape) and (pointer:coarse){#joy{left:24px;bottom:26px}.break{right:98px;bottom:28px}.place{right:24px;bottom:28px}.look{right:24px;top:26px}.touchbtn{width:58px;height:58px}}
'''
if '.modeSelect{' not in s:
    s = s.replace('</style>', css + '</style>', 1)
if 'id="controlSettings"' not in s:
    s = s.replace('<button id="pauseBtn">Ⅱ</button>', '<button id="pauseBtn">Ⅱ</button><button id="controlSettings" title="تنظیم دکمه‌ها">⚙</button>')

controls = '''<div id="controlsModal"><div class="controlsBox"><h2>⚙ تنظیم دکمه‌ها</h2><p>کلیدهای کامپیوتر را تغییر بده؛ کنترل لمسی گوشی نیز از همین تنظیمات حرکت استفاده می‌کند.</p><div class="controlGrid"><label class="controlRow"><span>جلو</span><input id="bindForward" value="Z" maxlength="12"></label><label class="controlRow"><span>چپ</span><input id="bindLeft" value="Q" maxlength="12"></label><label class="controlRow"><span>عقب</span><input id="bindBack" value="S" maxlength="12"></label><label class="controlRow"><span>راست</span><input id="bindRight" value="D" maxlength="12"></label><label class="controlRow"><span>پرش</span><input id="bindJump" value="Space" maxlength="12"></label><label class="controlRow"><span>Inventory</span><input id="bindInv" value="E" maxlength="12"></label></div><button class="mcbtn green" id="saveControls">ذخیره</button><button class="mcbtn" id="resetControls">پیش‌فرض</button><button class="mcbtn" id="closeControls">بستن</button></div></div>
'''
if 'id="controlsModal"' not in s:
    s = s.replace('<div id="rotate">', controls + '<div id="rotate">', 1)

# Game mode and creative flight.
s = s.replace('let yaw=0,pitch=0,selected=0,started=false,paused=false;', 'let yaw=0,pitch=0,selected=0,started=false,paused=false,lastChunkX=999999,lastChunkZ=999999;let gameMode=localStorage.getItem("mainmet.gamemode")||"survival";')
s = s.replace('if((keys.Space||keys.KeyJ)&&player.onGround){player.vel.y=7;player.onGround=false}\n player.vel.y-=19*dt;player.onGround=false;', 'if(gameMode==="creative"){player.vel.y=0;if(keys.Space)player.feet.y+=8*dt;if(keys.ShiftLeft||keys.ShiftRight)player.feet.y-=8*dt;player.onGround=false}else{if((keys.Space||keys.KeyJ)&&player.onGround){player.vel.y=7;player.onGround=false}player.vel.y-=19*dt;player.onGround=false;}')

# Keep edits when chunks stream.
s = s.replace('function breakBlock(){const h=hit();if(!h)return;const p=h.object.userData;removeBlock(p.x,p.y,p.z);swing()}', 'function breakBlock(){const h=hit();if(!h)return;const p=h.object.userData;removeBlock(p.x,p.y,p.z);rememberEdit(p.x,p.y,p.z,null);swing()}')
s = s.replace('addBlock(x,y,z,["grass","dirt","stone","wood","leaves","sand"][selected]);swing();', 'const bt=["grass","dirt","stone","wood","leaves","sand"][selected];addBlock(x,y,z,bt);rememberEdit(x,y,z,bt);swing();')
s = s.replace('if(started&&!paused){physics(dt);updateMobs(dt);}', 'if(started&&!paused){physics(dt);updateMobs(dt);const cf=chunkFor(player.feet.x,player.feet.z);if(cf[0]!==lastChunkX||cf[1]!==lastChunkZ){lastChunkX=cf[0];lastChunkZ=cf[1];updateWorldStreaming();}}')

oldstart = 'document.getElementById("startBtn").onclick=()=>{'
if 'document.getElementById("survivalMode").onclick' not in s:
    modejs = '''document.getElementById("survivalMode").onclick=()=>{gameMode="survival";localStorage.setItem("mainmet.gamemode",gameMode);document.getElementById("survivalMode").classList.add("sel");document.getElementById("creativeMode").classList.remove("sel")};document.getElementById("creativeMode").onclick=()=>{gameMode="creative";localStorage.setItem("mainmet.gamemode",gameMode);document.getElementById("creativeMode").classList.add("sel");document.getElementById("survivalMode").classList.remove("sel")};if(gameMode==="creative"){document.getElementById("creativeMode").classList.add("sel");document.getElementById("survivalMode").classList.remove("sel")};
'''
    s = s.replace(oldstart, modejs + oldstart, 1)

# Functional key remapping for PC + touch movement.
if 'function keyFor(name)' not in s:
    keyscript = '''\n<script>\n(function(){\n const defaults={forward:'KeyZ',left:'KeyQ',back:'KeyS',right:'KeyD',jump:'Space',inv:'KeyE'};\n window.mainmetKeyFor=function(name){return localStorage.getItem('mainmet.key.'+name)||defaults[name]};\n window.mainmetKeyDown=function(name){return !!window.mainmetKeys?.[mainmetKeyFor(name)]};\n window.mainmetKeys={};\n addEventListener('keydown',e=>{window.mainmetKeys[e.code]=true});\n addEventListener('keyup',e=>{window.mainmetKeys[e.code]=false});\n const style=document.createElement('style');style.textContent='.bindHint{font-size:11px;color:#aaa}';document.head.appendChild(style);\n const m=document.getElementById('controlsModal');if(!m)return;\n const fields={forward:'bindForward',left:'bindLeft',back:'bindBack',right:'bindRight',jump:'bindJump',inv:'bindInv'};\n function load(){for(const [n,id] of Object.entries(fields)){const v=localStorage.getItem('mainmet.key.'+n);if(v)document.getElementById(id).value=v.replace(/^Key/,'');}}\n document.getElementById('controlSettings').onclick=()=>{load();m.classList.add('show')};\n document.getElementById('closeControls').onclick=()=>m.classList.remove('show');\n document.getElementById('resetControls').onclick=()=>{Object.keys(fields).forEach(n=>localStorage.removeItem('mainmet.key.'+n));load()};\n document.getElementById('saveControls').onclick=()=>{for(const [n,id] of Object.entries(fields)){let v=document.getElementById(id).value.trim();if(n==='jump')v=v.toLowerCase()==='space'?'Space':'Key'+v.toUpperCase();else v='Key'+v.toUpperCase();localStorage.setItem('mainmet.key.'+n,v)}m.classList.remove('show')};\n})();\n</script>\n'''
    s=s.replace('<script>\n/* ===== mainmet ArMaCraft account/skin helper ===== */',keyscript+'<script>\n/* ===== mainmet ArMaCraft account/skin helper ===== */',1)

# Make the game physics use the saved movement keys.
old='let f=(keys.KeyZ?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyQ?1:0);'
new='let f=(mainmetKeyDown("forward")?1:0)-(mainmetKeyDown("back")?1:0),s=(mainmetKeyDown("right")?1:0)-(mainmetKeyDown("left")?1:0);'
s=s.replace(old,new)
s=s.replace('if((keys.Space||keys.KeyJ)&&player.onGround)', 'if((mainmetKeyDown("jump")||keys.KeyJ)&&player.onGround)')
s=s.replace('if(keys.Space)player.feet.y+=8*dt;', 'if(mainmetKeyDown("jump"))player.feet.y+=8*dt;')
s=s.replace('if(keys.ShiftLeft||keys.ShiftRight)player.feet.y-=8*dt;', 'if(keys.ShiftLeft||keys.ShiftRight)player.feet.y-=8*dt;')

p.write_text(s)
