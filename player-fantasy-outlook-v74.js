// v74.6 — player drawer separates real football news from market signals.
(()=>{
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
  const keyFor=v=>String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();
  const cats=n=>Array.isArray(n?.categories)?n.categories:[];
  const isTrending=n=>cats(n).includes('trending');
  const isIndirect=n=>cats(n).includes('indirect');
  const stamp=n=>{const t=new Date(n?.published_at||0).getTime();return Number.isFinite(t)?t:0};

  function installCss(){
    if($('de74Css'))return;
    const s=document.createElement('style');s.id='de74Css';s.textContent=`
      #drawerContent .de74-wrap{margin:12px 0 0}
      #drawerContent .de74-section{border:1px solid #293946;background:#0f171f;border-radius:13px;padding:13px;margin-top:10px}
      #drawerContent .de74-section:first-child{margin-top:0}
      #drawerContent .de74-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
      #drawerContent .de74-head h3{margin:0;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#91a3b2}
      #drawerContent .de74-fresh{font-size:8px;color:#718391;white-space:nowrap}
      #drawerContent .de74-outlook{font-size:11px;line-height:1.58;color:#c4d0d9}
      #drawerContent .de74-status{padding:9px 10px;margin:2px 0 9px;border:1px solid #263744;border-radius:10px;background:#0c141b;font-size:10px;line-height:1.45;color:#b8c6d0}
      #drawerContent .de74-status b{color:#eef4f7}
      #drawerContent .de74-news{padding:10px 0;border-top:1px solid #21303b}
      #drawerContent .de74-news:first-of-type{border-top:0;padding-top:2px}
      #drawerContent .de74-news-title{font-size:11px;font-weight:950;line-height:1.35;color:#edf3f7}
      #drawerContent .de74-news-meta{font-size:8px;color:#748795;margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
      #drawerContent .de74-badge{display:inline-block;border:1px solid #3e5566;border-radius:999px;padding:1px 5px;color:#a9c6da;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      #drawerContent .de74-news-summary{font-size:10px;line-height:1.45;color:#a9bac6;margin-top:6px}
      #drawerContent .de74-impact{font-size:10px;line-height:1.45;color:#c7d3dc;margin-top:6px;padding-left:8px;border-left:2px solid #435b6d}
      #drawerContent .de74-link{display:inline-block;margin-top:6px;font-size:9px;color:#81b9df;text-decoration:none;font-weight:900}
      #drawerContent .de74-empty{font-size:10px;color:#7f909e;line-height:1.45}
      #drawerContent .de74-market-note{font-size:9px;color:#8395a3;line-height:1.45;margin:-2px 0 5px}
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
    if(!r.ok)throw new Error('player data unavailable');
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
    if(isTrending(n))return false;
    const t=String(n?.fantasy_impact||'').toLowerCase();
    return !!t&&!/does not clearly change|relevant context to monitor|market signal, not proof/.test(t);
  }

  function orderedFootballNews(news){
    return news.filter(n=>!isTrending(n)).sort((a,b)=>{
      const pa=isIndirect(a)?1:0,pb=isIndirect(b)?1:0;
      if(pa!==pb)return pa-pb;
      return stamp(b)-stamp(a);
    });
  }

  function outlookText(p,news){
    const name=String(p?.name||'This player');
    const material=news.filter(isMaterial).sort((a,b)=>stamp(b)-stamp(a));
    if(!material.length)return 'There is no recent team, health, role or usage news that materially changes '+name+'\'s upcoming-season outlook right now.';
    const lead=material[0];
    const second=material.find(n=>n!==lead&&String(n?.headline||'')!==String(lead?.headline||''));
    let out='Recent relevant news is centered on '+sentence(lead?.headline);
    if(second)out+=' Another relevant update is '+sentence(second.headline);
    if(lead?.fantasy_impact)out+=' '+String(lead.fantasy_impact).trim();
    return out.trim();
  }

  function mountShell(p){
    installCss();
    const drawer=$('drawerContent');if(!drawer||!p)return null;
    drawer.querySelector('#deFantasy74')?.remove();
    const wrap=document.createElement('div');wrap.id='deFantasy74';wrap.className='de74-wrap';wrap.dataset.playerKey=keyFor(p.name);
    wrap.innerHTML=`
      <div class="de74-section" id="de74News">
        <div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">RotoWire · ESPN · CBS · Sleeper status</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:64%"></div>
      </div>
      <div class="de74-section" id="de74Market" hidden>
        <div class="de74-head"><h3>Market Signals</h3><span class="de74-fresh">Sleeper activity</span></div>
        <div class="de74-market-note">Adds and drops show fantasy-manager behavior, not a football role change.</div>
      </div>
      <div class="de74-section" id="de74Outlook">
        <div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">team & usage news only</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:58%"></div>
      </div>`;
    const head=drawer.querySelector('.detailhead');
    if(head?.nextSibling)head.parentNode.insertBefore(wrap,head.nextSibling);else if(head)head.parentNode.appendChild(wrap);else drawer.prepend(wrap);
    return wrap;
  }

  function playerId(p){
    const direct=p?.sleeperId||p?.id;if(direct)return String(direct);
    try{const m=typeof marketFor==='function'?marketFor(p):null;return m?.id?String(m.id):''}catch(_){return ''}
  }

  async function getSleeperStatus(p){
    const id=playerId(p);
    const q=id?'player_id=eq.'+encodeURIComponent(id):'full_name=eq.'+encodeURIComponent(String(p?.name||''));
    if(!q)return null;
    try{return (await rest('sleeper_player_status',q+'&select=player_id,full_name,team,status,injury_status,injury_body_part,news_updated,updated_at&limit=1'))[0]||null}catch(_){return null}
  }

  function sleeperStatusHtml(s){
    if(!s)return '';
    const parts=[];
    if(s.injury_status)parts.push(String(s.injury_status));
    else if(s.status)parts.push(String(s.status));
    if(s.injury_body_part)parts.push(String(s.injury_body_part));
    const newsAt=Number(s.news_updated)>0?new Date(Number(s.news_updated)):null;
    const when=newsAt&&Number.isFinite(newsAt.getTime())?relativeTime(newsAt.toISOString()):relativeTime(s.updated_at);
    return '<div class="de74-status"><b>Sleeper status:</b> '+esc(parts.join(' · ')||'No active designation')+(when?' <span style="color:#718391">· player data updated '+esc(when)+'</span>':'')+'</div>';
  }

  function newsCard(n,market=false){
    const indirect=isIndirect(n);
    const impact=n.fantasy_impact?'<div class="de74-impact"><b>'+(market?'Market read:':'Fantasy impact:')+'</b> '+esc(n.fantasy_impact)+'</div>':'';
    return '<div class="de74-news"><div class="de74-news-title">'+esc(n.headline)+'</div><div class="de74-news-meta"><span>'+esc(n.provider||'Source')+(n.published_at?' · '+esc(relativeTime(n.published_at)):'')+'</span>'+(indirect?'<span class="de74-badge">Indirect impact</span>':'')+(market?'<span class="de74-badge">Market signal</span>':'')+'</div>'+(n.summary?'<div class="de74-news-summary">'+esc(n.summary)+'</div>':'')+impact+(n.source_url?'<a class="de74-link" href="'+esc(n.source_url)+'" target="_blank" rel="noopener noreferrer">View source ↗</a>':'')+'</div>';
  }

  async function hydrate(p){
    const wrap=mountShell(p);if(!wrap)return;
    const key=keyFor(p.name);if(!key)return;
    const newsQ='player_key=eq.'+encodeURIComponent(key)+'&select=provider,headline,summary,fantasy_impact,categories,source_url,published_at&order=published_at.desc&limit=18';
    let allNews=[],status=null;
    try{[allNews,status]=await Promise.all([rest('player_news',newsQ),getSleeperStatus(p)])}catch(e){console.warn('Workhorse player news unavailable',e)}
    const current=$('deFantasy74');if(!current||current.dataset.playerKey!==key)return;

    const footballNews=orderedFootballNews(allNews);
    const visibleNews=footballNews.slice(0,6);
    const marketNews=allNews.filter(isTrending).sort((a,b)=>stamp(b)-stamp(a)).slice(0,4);

    const box=$('de74News');if(box){
      let body=sleeperStatusHtml(status);
      if(visibleNews.length)body+=visibleNews.map(n=>newsCard(n,false)).join('');
      else body+='<div class="de74-empty">No recent team, health, role or usage update is in the current feed.</div>';
      box.innerHTML='<div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">football updates first</span></div>'+body;
    }

    const market=$('de74Market');if(market){
      if(marketNews.length){
        market.hidden=false;
        market.innerHTML='<div class="de74-head"><h3>Market Signals</h3><span class="de74-fresh">Sleeper activity</span></div><div class="de74-market-note">Adds and drops show fantasy-manager behavior, not a football role change.</div>'+marketNews.map(n=>newsCard(n,true)).join('');
      }else market.hidden=true;
    }

    const out=$('de74Outlook');if(out){
      out.innerHTML='<div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">team & usage news only</span></div><div class="de74-outlook">'+esc(outlookText(p,footballNews))+'</div>';
    }
  }

  function wrap(name,resolver){
    const base=window[name];if(typeof base!=='function'||base.__de74Wrapped)return;
    const wrapped=async function(...args){
      const p=resolver(args),out=await base.apply(this,args);
      try{await hydrate(p)}catch(e){console.warn('Workhorse player outlook unavailable',e)}
      return out;
    };
    wrapped.__de74Wrapped=true;wrapped.__de74Base=base;
    window[name]=wrapped;try{globalThis[name]=wrapped}catch(_){}
  }

  wrap('openDetail',playerFromOpen);
  wrap('openMarketDetail',playerFromMarket);
  window.DraftEdgeFantasyOutlook={refresh:p=>hydrate(p)};
})();
