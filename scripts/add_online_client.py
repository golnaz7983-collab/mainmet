from pathlib import Path

p = Path('play.html')
s = p.read_text(encoding='utf-8')

css = '''\n/* ===== Real Java online client launcher ===== */\n#onlineBtn{position:absolute;z-index:26;left:10px;top:90px;width:190px;height:38px;border:2px solid #555;border-radius:4px;background:linear-gradient(#5d8f45,#365d2b);color:#fff;font-weight:900;cursor:pointer;text-shadow:2px 2px #222}\n#onlineBtn:hover{filter:brightness(1.15)}\n'''
if '#onlineBtn{' not in s:
    s = s.replace('</style>', css + '</style>', 1)

html = '<button id="onlineBtn" title="اتصال واقعی به سرور Java">🎮 ورود آنلاین ArMaCraft</button>'
if 'id="onlineBtn"' not in s:
    marker = '<button id="pauseBtn">Ⅱ</button>'
    s = s.replace(marker, marker + html, 1)

js = '''\n<script id="mainmet-online-launcher">\n(function(){\n  const btn=document.getElementById('onlineBtn');\n  if(!btn)return;\n  btn.addEventListener('click',function(){\n    const saved=localStorage.getItem('mainmet.arma.user')||localStorage.getItem('mainmet.lastOnlineUser')||'';\n    const username=(prompt('نام بازیکن ArMaCraft را وارد کن:',saved)||saved||'ArMaPlayer').trim().replace(/[^A-Za-z0-9_]/g,'').slice(0,16)||'ArMaPlayer';\n    localStorage.setItem('mainmet.arma.user',username);\n    const q=new URLSearchParams({\n      ip:'ArMaCraftnet.aternos.me:60107',\n      name:'ArMaCraft',\n      version:'1.21.11',\n      proxy:'https://mainmet.onrender.com',\n      username,\n      lockConnect:'true'\n    });\n    window.open('https://mcraft.fun/?'+q.toString(),'_blank','noopener');\n  });\n})();\n</script>\n'''
if 'id="mainmet-online-launcher"' not in s:
    s = s.replace('</body>', js + '</body>', 1)

p.write_text(s, encoding='utf-8')
print('online launcher added')
'''}