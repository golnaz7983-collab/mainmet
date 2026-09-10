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
app.use(netApi({ allowOrigin: '*', log: process.env.LOG === 'true', timeout }));

app.get('/', (_req, res) => res.json({
  ok: true,
  service: 'mainmet Minecraft proxy + Diccorf realtime chat',
  target: `${process.env.MC_HOST || 'ArMaCraftnet.aternos.me'}:${process.env.MC_PORT || '60107'}`
}));
app.get('/health', (_req, res) => res.status(200).send('ok'));
app.get('/diccorf-health', (_req, res) => res.json({ok:true,service:'Diccorf chat',online:diccorfClients.size}));

const server = http.createServer(app);
const diccorfWss = new WebSocketServer({ noServer: true });
const diccorfClients = new Set();
const users = new Map();
const messages = new Map();

function cleanUser(v){return String(v || '').replace(/[\s()\-]/g,'').trim().slice(0,40)}
function cleanText(v){return String(v || '').trim().slice(0,4000)}
function roomKey(a,b){return [a,b].sort().join('::')}
function send(ws,obj){if(ws && ws.readyState===1) ws.send(JSON.stringify(obj))}
function broadcast(obj, except=null){for(const ws of diccorfClients) if(ws!==except) send(ws,obj)}
function userList(){return [...users.values()].map(u=>({phone:u.phone,name:u.name,online:!!(u.ws&&u.ws.readyState===1)}))}
function sendPending(ws){
  const phone=ws.user?.phone; if(!phone)return;
  for(const arr of messages.values()){
    for(const m of arr){
      if(m.to===phone && m.from!==phone) send(ws,{type:'message',message:m,pending:true});
    }
  }
}

function handleChat(ws, data){
  if(!data || typeof data!=='object') return;
  if(data.type==='hello'){
    const phone=cleanUser(data.phone), name=cleanText(data.name) || 'کاربر Diccorf';
    if(!phone) return send(ws,{type:'error',message:'شماره موبایل لازم است.'});
    let u=users.get(phone);
    if(!u) u={phone,name}; else {u.name=name||u.name; if(u.ws&&u.ws!==ws) try{u.ws.close(4001,'new connection')}catch{} }
    u.ws=ws; users.set(phone,u); ws.user=u;
    send(ws,{type:'welcome',user:{phone:u.phone,name:u.name},online:userList()});
    sendPending(ws);
    broadcast({type:'presence',phone:u.phone,name:u.name,online:true},ws);
    return;
  }
  if(!ws.user) return send(ws,{type:'error',message:'ابتدا وارد حساب شو.'});
  const from=ws.user.phone;
  if(data.type==='list-users') return send(ws,{type:'users',users:userList()});
  if(data.type==='history'){
    const to=cleanUser(data.to); if(!to) return;
    const key=roomKey(from,to); send(ws,{type:'history',to,messages:messages.get(key)||[]}); return;
  }
  if(data.type==='message'){
    const to=cleanUser(data.to), text=cleanText(data.text); if(!to||!text||to===from) return;
    const msg={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),from,to,text,time:new Date().toISOString()};
    const key=roomKey(from,to); const arr=messages.get(key)||[]; arr.push(msg); if(arr.length>200) arr.splice(0,arr.length-200); messages.set(key,arr);
    const target=users.get(to);
    if(target&&target.ws&&target.ws.readyState===1) send(target.ws,{type:'message',message:msg});
    send(ws,{type:'sent',message:msg});
    return;
  }
  if(data.type==='typing'){
    const to=cleanUser(data.to), target=users.get(to); if(target&&target.ws&&target.ws.readyState===1) send(target.ws,{type:'typing',from,typing:!!data.typing});
    return;
  }
}

server.on('upgrade',(request,socket,head)=>{
  const pathname=new URL(request.url,`http://${request.headers.host}`).pathname;
  if(pathname==='/diccorf'){
    diccorfWss.handleUpgrade(request,socket,head,ws=>diccorfWss.emit('connection',ws,request));
  } else if(pathname==='/arma') {
    socket.destroy();
  } else {
    socket.destroy();
  }
});

diccorfWss.on('connection',ws=>{
  diccorfClients.add(ws);
  send(ws,{type:'status',online:true,clients:diccorfClients.size});
  ws.on('message',raw=>{try{handleChat(ws,JSON.parse(raw.toString()))}catch(e){send(ws,{type:'error',message:'پیام نامعتبر بود.'})}});
  ws.on('close',()=>{
    diccorfClients.delete(ws);
    if(ws.user){
      const u=users.get(ws.user.phone); if(u&&u.ws===ws){u.ws=null;users.set(u.phone,u);broadcast({type:'presence',phone:u.phone,name:u.name,online:false});}
    }
  });
  ws.on('error',()=>{});
});

server.listen(port,()=>{
  console.log(`mainmet proxy listening on ${port}`);
  console.log(`Minecraft target: ${process.env.MC_HOST || 'ArMaCraftnet.aternos.me'}:${process.env.MC_PORT || '60107'}`);
  console.log('Diccorf realtime chat: /diccorf');
});
