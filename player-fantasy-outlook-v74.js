// v74.2 — player drawer fantasy outlook driven by recent cached news.
(()=>{
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const keyFor=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();

  function installCss(){
    if($('de74Css'))return;
    const s=document.createElement('style');s.id='de74Css';s.textContent=`
      #drawerContent .de74-wrap{margin-top:15px}
      #drawerContent .de74-section{border:1px solid #293946;background:#0f171f;border-radius:13px;padding:13px;margin-top:10px}
      #drawerContent .de74-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
      #drawerContent .de74-head h3{margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#91a3b2}
      #drawerContent .de74-fresh{font-size:8px;color:#718391;white-space:nowrap}
      #drawerContent .de74-outlook{font-size:11px;line-height:1.58;color:#c4d0d9}
      #drawerContent .de74-news{padding:10px 0;border-top:1px solid #21303b}
      #drawerContent .de74-news:first-of-type{border-top:0;padding-top:2px}
      #drawerContent .de74-news-title{font-size:11px;font-weight:950;line-height:1.35;color:#edf3f7}
      #drawerContent .de74-news-meta{font-size:8px;color:#748795;margin-top:3px}
      #drawerContent .de74-news-summary{font-size:10px;line-height:1.45;color:#a9bac6;margin-top:6px}
      #drawerContent .de74-impact{font-size:10px;line-height:1.45;color:#c7d3dc;margin-top:6px;padding-left:8px;border-left:2px solid #435b6d}
      #drawerContent .de74-link{display:inline-block;margin-top:6px;font-size:9px;color:#81b9df;text-decoration:none;font-weight:900}
      #drawerContent .de74-empty{font-size:10px;color:#7f909e;line-height:1.45}
      #drawerContent .de74-loading{height:8px;width:74%;border-radius:999px;background:#1b2832;margin:7px 0}
    `;document.head.appendChild(s);
  }

  function apiConfig(){
    try{
      const url=typeof DRAFT_EDGE_SUPABASE_URL!=='undefined'?DRAFT_EDGE_SUPABASE_URL:'';
      const key=typeof DRAFT_EDGE_SUPABASE_KEY!=='undefined'?DRAFT_EDGE_SUPABASE_KEY:'';
      return {url:String(url||''),key:String(key||'')};
    }catch(_){return {url:'',key:''}}
  }

  async function rest(table,query){
    const cfg=apiConfig();if(!cfg.url||!cfg.key)return [];
    const r=await fetch(cfg.url+'/rest/v1/'+table+'?'+query,{headers:{apikey:cfg.key,Accept:'application/json'},cache:'no-store'});
    if(!r.ok)throw new Error('player news unavailable');
    const data=await r.json();return Array.isArray(data)?data:[];
  }

  function relativeTime(v){
    const t=new Date(v).getTime();if(!Number.isFinite(t))return '';
    const d=Date.now()-t,min=Math.max(0,Math.floor(d/60000));
    if(min<60)return min<=1?'just now':min+'m ago';
    const hr=Math.floor(min/60);if(hr<24)return hr+'h ago';
    const day=Math.floor(hr/24);if(day<7)return day+'d ago';
    return new Date(t).toLocaleDateString([],{month:'short',day:'numeric'});
  }

  function playerFromOpen(args){
    const i=Number(args?.[0]);
    try{return Number.isInteger(i)&&Array.isArray(players)?players[i]||null:null}catch(_){return null}
  }
  function playerFromMarket(args){
    const name=String(args?.[0]||'');if(!name)return null;
    try{
      const personal=typeof findPersonalByName==='function'?findPersonalByName(name):null;if(personal)return personal;
      const pool=Array.isArray(sleeperPool)?sleeperPool:[];
      return pool.find(x=>keyFor(x?.name)===keyFor(name))||{name};
    }catch(_){return {name}}
  }

  function sentence(v){
    const t=String(v||'').trim();if(!t)return '';
    return /[.!?]$/.test(t)?t:t+'.';
  }

  function isMaterial(n){
    const t=String(n?.fantasy_impact||'').toLowerCase();
    return !!t&&!/does not clearly change|relevant context to monitor/.test(t);
  }

  function outlookText(p,news){
    const name=String(p?.name||'This player');
    if(!news.length)return 'There is no recent player-specific news in the current feed, so there is no news-driven change to '+name+'\'s upcoming-season outlook right now.';

    const material=news.filter(isMaterial);
    const lead=material[0]||news[0];
    const second=news.find(n=>n!==lead&&String(n?.headline||'')!==String(lead?.headline||''));
    let out='Recent news is centered on '+sentence(lead?.headline);
    if(second)out+=' Another recent update is '+sentence(second.headline);
    if(lead?.fantasy_impact)out+=' '+String(lead.fantasy_impact).trim();
    return out.trim();
  }

  function mountShell(p){
    installCss();
    const drawer=$('drawerContent');if(!drawer||!p)return null;
    drawer.querySelector('#deFantasy74')?.remove();
    const wrap=document.createElement('div');wrap.id='deFantasy74';wrap.className='de74-wrap';wrap.dataset.playerKey=keyFor(p.name);
    wrap.innerHTML=`
      <div class="de74-section" id="de74Outlook">
        <div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">news-based</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:58%"></div>
      </div>
      <div class="de74-section" id="de74News">
        <div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">updated hourly</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:64%"></div>
      </div>`;
    const stats=drawer.querySelector('.stats');
    if(stats?.nextSibling)stats.parentNode.insertBefore(wrap,stats.nextSibling);else drawer.appendChild(wrap);
    return wrap;
  }

  async function hydrate(p){
    const wrap=mountShell(p);if(!wrap)return;
    const key=keyFor(p.name);if(!key)return;
    const newsQ='player_key=eq.'+encodeURIComponent(key)+'&select=provider,headline,summary,fantasy_impact,source_url,published_at&order=published_at.desc&limit=3';
    let news=[];
    try{news=await rest('player_news',newsQ)}catch(e){console.warn('Draft Edge player news unavailable',e)}
    const current=$('deFantasy74');if(!current||current.dataset.playerKey!==key)return;

    const out=$('de74Outlook');if(out){
      out.innerHTML='<div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">news-based</span></div><div class="de74-outlook">'+esc(outlookText(p,news))+'</div>';
    }

    const box=$('de74News');if(box){
      let body='';
      if(news.length){
        body=news.map(n=>'<div class="de74-news"><div class="de74-news-title">'+esc(n.headline)+'</div><div class="de74-news-meta">'+esc(n.provider||'Source')+(n.published_at?' · '+esc(relativeTime(n.published_at)):'')+'</div>'+(n.summary?'<div class="de74-news-summary">'+esc(n.summary)+'</div>':'')+(n.fantasy_impact?'<div class="de74-impact"><b>Fantasy impact:</b> '+esc(n.fantasy_impact)+'</div>':'')+(n.source_url?'<a class="de74-link" href="'+esc(n.source_url)+'" target="_blank" rel="noopener noreferrer">View source ↗</a>':'')+'</div>').join('');
      }else body='<div class="de74-empty">No recent player-specific news in the current feed.</div>';
      box.innerHTML='<div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">updated hourly</span></div>'+body;
    }
  }

  function wrap(name,resolver){
    const base=window[name];if(typeof base!=='function'||base.__de74Wrapped)return;
    const wrapped=async function(...args){
      const p=resolver(args),out=await base.apply(this,args);
      try{await hydrate(p)}catch(e){console.warn('Draft Edge player outlook unavailable',e)}
      return out;
    };
    wrapped.__de74Wrapped=true;wrapped.__de74Base=base;
    window[name]=wrapped;try{globalThis[name]=wrapped}catch(_){}
  }

  wrap('openDetail',playerFromOpen);
  wrap('openMarketDetail',playerFromMarket);
  window.DraftEdgeFantasyOutlook={refresh:p=>hydrate(p)};
})();
