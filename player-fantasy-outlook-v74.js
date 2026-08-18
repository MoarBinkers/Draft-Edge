// v74 — lightweight player drawer fantasy outlook + cached recent news.
// Reads only cached Supabase rows on player click; never live-polls a news provider from the Draft page.
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
      #drawerContent .de74-outlook{font-size:11px;line-height:1.55;color:#c4d0d9}
      #drawerContent .de74-projection{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
      #drawerContent .de74-chip{border:1px solid #344755;background:#111d26;border-radius:7px;padding:5px 7px;font-size:9px;font-weight:900;color:#9fb2bf}
      #drawerContent .de74-chip strong{color:#edf3f7}
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
    if(!r.ok)throw new Error('cached fantasy data unavailable');
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

  function marketInfo(p){try{return typeof marketFor==='function'?marketFor(p):null}catch(_){return null}}

  function projectionLabel(pos,pts){
    const p=Number(pts);if(!Number.isFinite(p))return '';
    pos=String(pos||'').toUpperCase();
    if(pos==='QB')return p>=350?'Elite projected QB production':p>=300?'Strong starting-QB projection':p>=250?'QB2-range projection':'Depth/upside projection';
    if(pos==='RB')return p>=250?'High-end RB projection':p>=190?'Weekly RB2-level projection':p>=140?'Flex-range projection':'Depth/upside projection';
    if(pos==='WR')return p>=260?'High-end WR projection':p>=200?'Weekly WR2-level projection':p>=150?'WR3/flex-range projection':'Depth/upside projection';
    if(pos==='TE')return p>=220?'Elite TE projection':p>=150?'Starting-TE projection':p>=100?'Streaming/depth projection':'Depth/upside projection';
    return 'Season projection';
  }

  function outlookText(p,projection){
    const m=marketInfo(p),mine=Number(p?.overall),mr=Number(m?.rank),name=String(p?.name||'This player');
    const parts=[];
    if(Number.isFinite(mine)&&mine>0&&Number.isFinite(mr)&&mr>0){
      const gap=mr-mine;
      if(gap>=8)parts.push('Draft Edge values '+name+' well ahead of the Sleeper market ('+'#'+mine+' vs #'+mr+'), so he profiles as a player to target at normal market cost.');
      else if(gap<=-8)parts.push('The Sleeper market is more aggressive on '+name+' than your board ('+'#'+mr+' market vs #'+mine+' for you), so Draft Edge sees less reason to chase him above your price.');
      else parts.push('Your ranking and the Sleeper market are closely aligned on '+name+' ('+'#'+mine+' for you, #'+mr+' market), which makes draft position and roster build more important than pure value.');
    }else if(Number.isFinite(mr)&&mr>0)parts.push(name+' is currently going around #'+mr+' in the Sleeper market.');
    else parts.push(name+' is on your board, and Draft Edge will layer season projection context here as cached data becomes available.');

    const pts=Number(projection?.ppr_points),label=projectionLabel(projection?.position||p?.position,pts);
    if(Number.isFinite(pts))parts.push('The cached '+projection.season+' preseason projection has him at '+pts.toFixed(1)+' PPR points, which Draft Edge classifies as '+label.toLowerCase()+'.');

    try{
      const intel=window.DraftEdgeDraftIntelligence;
      const r=intel?.riskFor?.(p),target=Number(intel?.nextUserPick?.()||0);
      if(target&&r?.label&&!/need draft slot/i.test(String(r.label)))parts.push('Live draft context: '+String(r.label).toLowerCase()+' to survive until pick #'+target+'.');
    }catch(_){}
    return parts.join(' ');
  }

  function mountShell(p){
    installCss();
    const drawer=$('drawerContent');if(!drawer||!p)return null;
    drawer.querySelector('#deFantasy74')?.remove();
    const wrap=document.createElement('div');wrap.id='deFantasy74';wrap.className='de74-wrap';wrap.dataset.playerKey=keyFor(p.name);
    wrap.innerHTML=`
      <div class="de74-section" id="de74Outlook">
        <div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">Draft Edge</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:58%"></div>
      </div>
      <div class="de74-section" id="de74News">
        <div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">cached · hourly refresh</span></div>
        <div class="de74-loading"></div><div class="de74-loading" style="width:64%"></div>
      </div>`;
    const stats=drawer.querySelector('.stats');
    if(stats?.nextSibling)stats.parentNode.insertBefore(wrap,stats.nextSibling);else drawer.appendChild(wrap);
    return wrap;
  }

  async function hydrate(p){
    const wrap=mountShell(p);if(!wrap)return;
    const key=keyFor(p.name);if(!key)return;
    const qKey=encodeURIComponent(key);
    const newsQ='player_key=eq.'+qKey+'&select=provider,headline,summary,fantasy_impact,source_url,published_at&order=published_at.desc&limit=3';
    const projQ='player_key=eq.'+qKey+'&select=season,ppr_points,position,team,fetched_at&order=fetched_at.desc&limit=1';
    const [newsRes,projRes]=await Promise.allSettled([rest('player_news',newsQ),rest('player_projection_cache',projQ)]);
    const current=$('deFantasy74');if(!current||current.dataset.playerKey!==key)return;
    const news=newsRes.status==='fulfilled'?newsRes.value:[];
    const projection=projRes.status==='fulfilled'?(projRes.value[0]||null):null;

    const out=$('de74Outlook');if(out){
      const chips=[];
      if(Number.isFinite(Number(projection?.ppr_points)))chips.push('<span class="de74-chip"><strong>'+Number(projection.ppr_points).toFixed(1)+'</strong> projected PPR pts</span>');
      if(projection?.season)chips.push('<span class="de74-chip"><strong>'+esc(projection.season)+'</strong> season</span>');
      out.innerHTML='<div class="de74-head"><h3>Upcoming Season Fantasy Outlook</h3><span class="de74-fresh">Draft Edge</span></div><div class="de74-outlook">'+esc(outlookText(p,projection))+'</div>'+(chips.length?'<div class="de74-projection">'+chips.join('')+'</div>':'');
    }

    const box=$('de74News');if(box){
      let body='';
      if(news.length){
        body=news.map(n=>'<div class="de74-news"><div class="de74-news-title">'+esc(n.headline)+'</div><div class="de74-news-meta">'+esc(n.provider||'Source')+(n.published_at?' · '+esc(relativeTime(n.published_at)):'')+'</div>'+(n.summary?'<div class="de74-news-summary">'+esc(n.summary)+'</div>':'')+(n.fantasy_impact?'<div class="de74-impact"><b>Fantasy impact:</b> '+esc(n.fantasy_impact)+'</div>':'')+(n.source_url?'<a class="de74-link" href="'+esc(n.source_url)+'" target="_blank" rel="noopener noreferrer">View source ↗</a>':'')+'</div>').join('');
      }else body='<div class="de74-empty">No recent news is cached for this player yet. Draft Edge keeps this separate from the live draft board, so a news-feed problem cannot slow down or break your draft.</div>';
      box.innerHTML='<div class="de74-head"><h3>Recent News</h3><span class="de74-fresh">cached · hourly refresh</span></div>'+body;
    }
  }

  function wrap(name,resolver){
    const base=window[name];if(typeof base!=='function'||base.__de74Wrapped)return;
    const wrapped=async function(...args){
      const p=resolver(args),out=await base.apply(this,args);
      try{await hydrate(p)}catch(e){console.warn('Draft Edge cached player news unavailable',e)}
      return out;
    };
    wrapped.__de74Wrapped=true;wrapped.__de74Base=base;
    window[name]=wrapped;try{globalThis[name]=wrapped}catch(_){}
  }

  wrap('openDetail',playerFromOpen);
  wrap('openMarketDetail',playerFromMarket);
  window.DraftEdgeFantasyOutlook={refresh:p=>hydrate(p)};
})();
