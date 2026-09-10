(() => {
  const state = { level: localStorage.getItem('armaai.level') || '1' };
  let kb = null;
  const $ = id => document.getElementById(id);
  const add = (text, cls='ai') => { const el=document.createElement('div'); el.className='msg '+cls; el.textContent=text; $('msgs').appendChild(el); $('msgs').scrollTop=$('msgs').scrollHeight; };
  async function loadKB(){ try { kb=await fetch('knowledge.json',{cache:'no-store'}).then(r=>r.json()); } catch(e){} }
  function levelText(){ return kb?.levels?.[state.level]?.topics?.join('، ') || ''; }
  async function webSearch(q){
    const url='https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&origin=*';
    const r=await fetch(url); if(!r.ok) throw new Error('web'); const d=await r.json();
    return (d.query?.search||[]).slice(0,4).map(x=>({title:x.title,snippet:x.snippet.replace(/<[^>]+>/g,'')}));
  }
  function localAnswer(q){
    const ql=q.toLowerCase();
    const map=[
      ['javascript',['JavaScript یک زبان برنامه‌نویسی پویاست که برای وب و محیط‌هایی مثل Node.js استفاده می‌شود. در Level '+state.level+' موضوعات این سطح شامل '+levelText()+' است. منبع آموزشی پیشنهادی: MDN JavaScript Guide.']],
      ['html',['HTML ساختار و معنای محتوای صفحه وب را مشخص می‌کند. برای یادگیری عمیق‌تر، مسیر MDN Web Development مناسب است.']],
      ['css',['CSS برای ظاهر، چیدمان، رنگ، فاصله، انیمیشن و واکنش‌گرایی صفحات وب استفاده می‌شود.']],
      ['الگوریتم',['در سطح‌های بالاتر، الگوریتم یعنی طراحی گام‌های دقیق برای حل مسئله؛ از مباحث مهم این Level: تحلیل پیچیدگی، جستجو، مرتب‌سازی و ساختمان داده است.']],
      ['فرهنگ',['ArMa AI می‌تواند درباره فرهنگ، تاریخ، ادبیات، هنر و دانش عمومی پاسخ آموزشی بدهد؛ برای اطلاعات متغیر، جستجوی وب را فعال نگه می‌داریم.']],
      ['apk',['برای ساخت APK اندروید می‌توان از Kotlin و Android Studio استفاده کرد؛ در Level 4 مسیر شامل معماری برنامه، رابط کاربری، داده، امنیت، تست و انتشار است.']],
      ['سایت',['برای ساخت سایت حرفه‌ای باید HTML/CSS/JavaScript، Backend، API، Database، امنیت، تست و استقرار را کنار هم یاد گرفت.']]
    ];
    for(const [k,v] of map) if(ql.includes(k)) return v[0];
    return null;
  }
  async function answer(q){
    const local=localAnswer(q); if(local){add(local); return;}
    add('🔎 دارم در منابع وب جستجو می‌کنم...');
    try {
      const results=await webSearch(q);
      const last=$('msgs').lastElementChild; if(last) last.remove();
      if(!results.length){ add('در منابع وب نتیجه مناسبی پیدا نشد. سؤال را دقیق‌تر بنویس.'); return; }
      add('نتیجه‌های مرتبط برای Level '+state.level+':\n'+results.map((x,i)=>(i+1)+'. '+x.title+' — '+x.snippet).join('\n\n'));
    } catch(e){
      const last=$('msgs').lastElementChild; if(last) last.remove();
      add('اتصال جستجوی وب در این لحظه در دسترس نیست. می‌توانی سؤال را دوباره امتحان کنی.');
    }
  }
  window.addEventListener('DOMContentLoaded', async()=>{
    await loadKB();
    document.querySelectorAll('.level').forEach((b,i)=>b.addEventListener('click',()=>{state.level=String(i+1);localStorage.setItem('armaai.level',state.level);}));
    const send=$('send'), q=$('q'); if(send&&q){ send.addEventListener('click',()=>{const t=q.value.trim();if(!t)return;add(t,'me');q.value='';answer(t)}); q.addEventListener('keydown',e=>{if(e.key==='Enter')send.click()}); }
  });
})();