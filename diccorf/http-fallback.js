(()=>{
const BASE='https://mainmet.onrender.com',AUTH='diccorf.auth.v3',CHATS='diccorf.live.v1';
const $=id=>document.getElementById(id);const norm=v=>String(v||'').replace(/[\s()\-]/g,'').trim();const clock=()=>new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
let me=JSON.parse(localStorage.getItem(AUTH)||'null'),last=Number(localStorage.getItem('diccorf.poll.since')||0),busy=false;
function chats(){try{const x=JSON.parse(localStorage.getItem(CHATS)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function save(x){localStorage.setItem(CHATS,JSON.stringify(x))}
function activeChat(){const name=$('headName')?.textContent?.trim();if(!name)return null;return chats().find(c=>c.name===name)||null}
function redraw(){const c=activeChat();if(c&&window.openChat)window.openChat(c.id);else if(window.render)window.render()}
async function register(){if(!me?.phone)return;try{await fetch(BASE+'/diccorf-register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone:norm(me.phone),name:me.name})})}catch{}}
async function poll(){if(!me?.phone||busy)return;busy=true;try{const r=await fetch(BASE+'/diccorf-poll?phone='+encodeURIComponent(norm(me.phone))+'&name='+encodeURIComponent(me.name||'' )+'&since='+encodeURIComponent(last),{cache:'no-store'});if(r.ok){const d=await r.json();last=Number(d.now||Date.now());localStorage.setItem('diccorf.poll.since',String(last));const arr=chats();let changed=false;(d.messages||[]).forEach(m=>{let c=arr.find(x=>norm(x.phone)===norm(m.from));if(!c){c={id:'u_'+m.from,phone:m.from,name:m.from,online:true,avatar:m.from.slice(-1),messages:[]};arr.unshift(c)}if(!c.messages.some(x=>x.id===m.id)){c.messages.push({id:m.id,text:m.text,me:false,time:clock()});changed=true}c.online=true});if(changed){save(arr);redraw()}}}catch{}finally{busy=false}}
async function sendHttp(text,to){if(!me?.phone||!to)return false;try{const r=await fetch(BASE+'/diccorf-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:norm(me.phone),name:me.name,to:norm(to),text})});return r.ok}catch{return false}}
function install(){const btn=$('send');if(!btn||btn.dataset.httpFallback)return;btn.dataset.httpFallback='1';btn.addEventListener('click',async()=>{setTimeout(async()=>{const c=activeChat(),input=$('msg');if(!c||!input)return;const txt=input.value.trim();if(!txt||!c.phone||String(c.phone).startsWith('demo'))return;await sendHttp(txt,c.phone)},50) },true)}
async function boot(){me=JSON.parse(localStorage.getItem(AUTH)||'null');if(!me)return;await register();install();setInterval(poll,2000);poll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
