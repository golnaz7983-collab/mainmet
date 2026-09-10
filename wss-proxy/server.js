const express = require('express');
const netApi = require('net-browserify');
const compression = require('compression');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const port = Number(process.env.PORT || 10000);
const timeout = Number(process.env.TIMEOUT || 10000);
app.use(compression());
app.use(cors());
app.use(express.json({limit:'64kb'}));
app.use(netApi({ allowOrigin: '*', log: process.env.LOG === 'true', timeout }));

app.get('/', (_req,res)=>res.json({ok:true,service:'mainmet Minecraft proxy + Diccorf realtime chat',target:`${process.env.MC_HOST||'ArMaCraftnet.aternos.me'}:${process.env.MC_PORT||'60107'}`}));
app.get('/health', (_req,res)=>res.status(200).send('ok'));

const server=http.createServer(app);
const diccorfWss=new WebSocketServer({noServer:true});
const diccorfClients=new Set();
const users=new Map();
const messages=new Map();
const cleanUser=v=>String(v||'').replace(/[\s()\-]/g,'').trim().slice(0,40);
const cleanText=v=>String(v||'').trim().slice(0,4000);
const roomKey=(a,b)=>[a,b].sort().join('::');
const send=(ws,obj)=>{if(ws&&ws.readyState===1)ws.send(JSON.stringify(obj))};
const broadcast=(obj,except=null)=>{for(const ws of diccorfClients)if(ws!==except)send(ws,obj)};
const userList=()=>[...users.values()].map(u=>({phone:u.phone,name:u.name,online:!!(u.ws&&u.ws.readyState===1)}));

function register(phone,name,ws=null){
  phone=cleanUser(phone);name=cleanText(name)||'کاربر Diccorf';if(!phone)return null;
  let u=users.get(phone);if(!u)u={phone,name};else u.name=name||u.name;if(ws)u.ws=ws;users.set(phone,u);return u;
}
function pendingFor(phone){
  const out=[];for(const arr of messages.values())for(const m of arr)if(m.to===phone)out.push(m);return out.sort((a,b)=>new Date(a.time)-new Date(b.time));
}

// HTTP fallback: works even when a browser WebSocket is blocked or disconnected.
app.get('/diccorf-health',(req,res)=>res.json({ok:true,service:'Diccorf chat',online:diccorfClients.size,users:users.size}));
app.post('/diccorf-register',(req,res)=>{const u=register(req.body?.phone,req.body?.name);if(!u)return res.status(400).json({ok:false});res.json({ok:true,user:{phone:u.phone,name:u.name},pending:pendingFor(u.phone)});});
app.get('/diccorf-poll',(req,res)=>{const phone=cleanUser(req.query.phone);if(!phone)return res.status(400).json({ok:false});const since=Number(req.query.since||0);register(phone,req.query.name||'کاربر Diccorf');const out=pendingFor(phone).filter(m=>new Date(m.time).getTime()>since);res.json({ok:true,now:Date.now(),messages:out});});
app.post('/diccorf-send',(req,res)=>{const from=cleanUser(req.body?.from),to=cleanUser(req.body?.to),text=cleanText(req.body?.text);if(!from||!to||!text||from===to)return res.status(400).json({ok:false,message:'invalid'});register(from,req.body?.name||'کاربر Diccorf');const msg={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),from,to,text,time:new Date().toISOString()};const key=roomKey(from,to);const arr=messages.get(key)||[];arr.push(msg);if(arr.length>500)arr.splice(0,arr.length-500);messages.set(key,arr);const target=users.get(to);if(target?.ws?.readyState===1)send(target.ws,{type:'message',message:msg});res.json({ok:true,message:msg});});

function handleChat(ws,data){
 if(!data||typeof data!=='object')return;
 if(data.type==='hello'){const u=register(data.phone,data.name,ws);if(!u)return send(ws,{type:'error',message:'شماره موبایل لازم است.'});ws.user=u;send(ws,{type:'welcome',user:{phone:u.phone,name:u.name},online:userList()});for(const m of pendingFor(u.phone))send(ws,{type:'message',message:m,pending:true});broadcast({type:'presence',phone:u.phone,name:u.name,online:true},ws);return;}
 if(!ws.user)return send(ws,{type:'error',message:'ابتدا وارد حساب شو.'});
 const from=ws.user.phone;
 if(data.type==='list-users')return send(ws,{type:'users',users:userList()});
 if(data.type==='history'){const to=cleanUser(data.to);if(!to)return;send(ws,{type:'history',to,messages:messages.get(roomKey(from,to))||[]});return;}
 if(data.type==='message'){const to=cleanUser(data.to),text=cleanText(data.text);if(!to||!text||to===from)return;const msg={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),from,to,text,time:new Date().toISOString()};const arr=messages.get(roomKey(from,to))||[];arr.push(msg);if(arr.length>500)arr.splice(0,arr.length-500);messages.set(roomKey(from,to),arr);send(ws,{type:'sent',message:msg});const target=users.get(to);if(target?.ws?.readyState===1)send(target.ws,{type:'message',message:msg});return;}
 if(data.type==='typing'){const to=cleanUser(data.to),target=users.get(to);if(target?.ws?.readyState===1)send(target.ws,{type:'typing',from,typing:!!data.typing});}
}
server.on('upgrade',(request,socket,head)=>{const pathname=new URL(request.url,`http://${request.headers.host}`).pathname;if(pathname==='/diccorf')diccorfWss.handleUpgrade(request,socket,head,ws=>diccorfWss.emit('connection',ws,request));else socket.destroy()});
diccorfWss.on('connection',ws=>{diccorfClients.add(ws);send(ws,{type:'status',online:true,clients:diccorfClients.size});ws.on('message',raw=>{try{handleChat(ws,JSON.parse(raw.toString()))}catch{send(ws,{type:'error',message:'پیام نامعتبر بود.'})}});ws.on('close',()=>{diccorfClients.delete(ws);if(ws.user){const u=users.get(ws.user.phone);if(u?.ws===ws){u.ws=null;users.set(u.phone,u);broadcast({type:'presence',phone:u.phone,name:u.name,online:false})}}});ws.on('error',()=>{})});
server.listen(port,()=>console.log(`mainmet proxy listening on ${port}`));
