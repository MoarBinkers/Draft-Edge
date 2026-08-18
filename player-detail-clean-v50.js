// v50 — simplify player ADP history: keep the graph, remove the long snapshot list, show only the latest Sleeper update time.
(()=>{
  function currentFormat(){
    try{return typeof window.DraftEdgeAdpFormat==='function'?window.DraftEdgeAdpFormat():'ppr'}catch(_){return 'ppr'}
  }

  function activeMarketEntry(p){
    try{return typeof marketFor==='function'?marketFor(p):null}catch(_){return null}
  }

  function formatUpdatedAt(ms){
    const n=Number(ms);if(!Number.isFinite(n)||n<=0)return '—';
    const d=new Date(n);if(Number.isNaN(d.getTime()))return '—';
    const now=new Date();
    const sameDay=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
    return sameDay
      ? d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})
      : d.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }

  function playerForOpenDetail(args){
    const i=Number(args?.[0]);
    try{return Number.isInteger(i)&&Array.isArray(players)?players[i]||null:null}catch(_){return null}
  }

  function playerForMarketDetail(args){
    const name=String(args?.[0]||'');if(!name)return null;
    try{
      const owned=typeof findPersonalByName==='function'?findPersonalByName(name):null;
      if(owned)return owned;
      return (Array.isArray(sleeperPool)?sleeperPool:[]).find(p=>{
        const a=typeof norm==='function'?norm(p.name):String(p.name||'').toLowerCase();
        const b=typeof norm==='function'?norm(name):name.toLowerCase();
        return a===b;
      })||{name};
    }catch(_){return {name}}
  }

  function simplifyDrawer(p){
    const drawer=document.getElementById('drawerContent');if(!drawer)return;
    const sections=[...drawer.querySelectorAll('.section')];
    const historySection=sections.find(sec=>/ADP History/i.test(sec.querySelector('h3')?.textContent||''));
    if(!historySection)return;

    historySection.querySelectorAll('.historyrow').forEach(el=>el.remove());
    [...historySection.querySelectorAll('.small')].forEach(el=>{
      const t=(el.textContent||'').trim();
      if(/^All\s+\d+\s+saved Sleeper rank change/i.test(t))el.remove();
    });

    let stamp=historySection.querySelector('#deLastAdpUpdate50');
    if(!stamp){
      stamp=document.createElement('div');
      stamp.id='deLastAdpUpdate50';
      stamp.className='small';
      stamp.style.cssText='margin-top:10px;color:#8fa0af';
      historySection.appendChild(stamp);
    }
    const m=activeMarketEntry(p);
    stamp.textContent='Last updated: '+formatUpdatedAt(m?.updatedAt);

    const h=historySection.querySelector('h3');
    if(h&&/Full Sleeper ADP History/i.test(h.textContent||''))h.textContent='Sleeper ADP History';
  }

  function wrap(name,resolver){
    const base=window[name];if(typeof base!=='function'||base.__de50Wrapped)return;
    const wrapped=async function(...args){
      const p=resolver(args);
      const out=await base.apply(this,args);
      simplifyDrawer(p);
      queueMicrotask(()=>simplifyDrawer(p));
      requestAnimationFrame(()=>simplifyDrawer(p));
      return out;
    };
    wrapped.__de50Wrapped=true;
    window[name]=wrapped;
    try{globalThis[name]=wrapped}catch(_){}
  }

  wrap('openDetail',playerForOpenDetail);
  wrap('openMarketDetail',playerForMarketDetail);

  window.DraftEdgePlayerDetailClean={simplify:simplifyDrawer,format:currentFormat};
})();
