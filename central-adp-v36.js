// v36.2 — live Sleeper ADP plus non-destructive ranking/team reconciliation.
(()=>{
  const HISTORY_KEY='de29_adp_history';
  const FORMAT_KEY='de36_adp_format';
  const HISTORY_TTL=5*60*1000;
  const AUTO_RANK_LIMIT=300;
  const FORMATS={
    ppr:{label:'Full PPR',short:'PPR'},
    half_ppr:{label:'Half PPR',short:'Half PPR'},
    superflex:{label:'Superflex / 2QB',short:'Superflex'}
  };
  let activeFormat=FORMATS[localStorage.getItem(FORMAT_KEY)]?localStorage.getItem(FORMAT_KEY):'ppr';
  let centralClient=null;
  let activeRows=[];
  let applying=false,reconciling=false;
  const historyCache=new Map();

  function getClient(){
    if(centralClient)return centralClient;
    try{if(typeof supabaseClient!=='undefined'&&supabaseClient){centralClient=supabaseClient;return centralClient}}catch(_){}
    if(window.supabase&&typeof window.supabase.createClient==='function'&&typeof DRAFT_EDGE_SUPABASE_URL!=='undefined'&&typeof DRAFT_EDGE_SUPABASE_KEY!=='undefined'){
      centralClient=window.supabase.createClient(DRAFT_EDGE_SUPABASE_URL,DRAFT_EDGE_SUPABASE_KEY);return centralClient;
    }
    throw new Error('Workhorse database is not ready yet.');
  }
  const clean=v=>typeof cleanPlayerName==='function'?cleanPlayerName(v):String(v||'').trim();
  const nrm=v=>typeof norm==='function'?norm(v):clean(v).toLowerCase().replace(/[^a-z0-9]/g,'');
  const teamText=v=>{const s=String(v||'').trim();return s&&s.toUpperCase()!=='FA'?s:'—'};
  const setText=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text};
  const fmtTime=v=>{const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):''};

  function activeList(){try{return typeof currentList==='function'?currentList():rankingLists?.[activeListId]||null}catch(_){return null}}
  function excludedIds(list){
    if(!list)return new Set();
    if(!Array.isArray(list.excludedSleeperIds))list.excludedSleeperIds=[];
    return new Set(list.excludedSleeperIds.map(String));
  }

  function reconcileCurrentRankings(rows){
    if(reconciling||!Array.isArray(rows)||!rows.length)return false;
    let list=activeList();
    try{if(!list||!Array.isArray(players)||players.length<100)return false}catch(_){return false}
    reconciling=true;
    try{
      const byId=new Map(),byName=new Map();
      for(const r of rows){
        const id=String(r.player_id||'');if(id)byId.set(id,r);
        const key=nrm(r.full_name);if(key&&!byName.has(key))byName.set(key,r);
      }
      let changed=false;
      const existingIds=new Set(),existingNames=new Set();
      for(const p of players){
        const id=String(p?.sleeperId||'');
        const row=(id&&byId.get(id))||byName.get(nrm(p?.name));
        if(row){
          const rowId=String(row.player_id||'');
          if(rowId&&!p.sleeperId){p.sleeperId=rowId;changed=true}
          const currentTeam=String(p.team||'').trim();
          const liveTeam=String(row.team||'').trim();
          if(liveTeam&&liveTeam.toUpperCase()!=='FA'&&currentTeam!==liveTeam){p.team=liveTeam;changed=true}
          else if((!currentTeam||currentTeam.toUpperCase()==='FA')&&!liveTeam){p.team='—';changed=true}
        }
        const finalId=String(p?.sleeperId||'');if(finalId)existingIds.add(finalId);
        existingNames.add(nrm(p?.name));
      }

      const excluded=excludedIds(list);
      let maxOverall=players.reduce((m,p)=>Math.max(m,Number(p?.overall)||0),0);
      const posCounts={};
      for(const p of players){const pos=String(p?.position||'');posCounts[pos]=(posCounts[pos]||0)+1}
      const incoming=rows.filter(r=>['QB','RB','WR','TE'].includes(String(r.position||'').toUpperCase())&&Number(r.sleeper_rank)>0&&Number(r.sleeper_rank)<=AUTO_RANK_LIMIT)
        .sort((a,b)=>Number(a.sleeper_rank)-Number(b.sleeper_rank));
      for(const r of incoming){
        const id=String(r.player_id||''),name=clean(r.full_name),key=nrm(name),pos=String(r.position||'').toUpperCase();
        if(!id||!name||existingIds.has(id)||existingNames.has(key)||excluded.has(id))continue;
        posCounts[pos]=(posCounts[pos]||0)+1;
        players.push({overall:++maxOverall,name,position:pos,team:teamText(r.team),bye:'—',posRank:posCounts[pos],tier:null,tags:[],note:'',drafted:false,draftedAt:null,draftedSource:null,draftedDraftId:null,draftedPickNo:null,sleeperId:id});
        existingIds.add(id);existingNames.add(key);changed=true;
      }
      if(changed){
        list.players=players;list.updatedAt=Date.now();
        try{if(activeListId&&rankingLists?.[activeListId])rankingLists[activeListId]=list}catch(_){}
        try{save()}catch(e){console.warn('Workhorse ranking reconciliation save failed',e)}
      }
      return changed;
    }finally{reconciling=false}
  }
  window.WorkhorseReconcileSleeperRankings=()=>reconcileCurrentRankings(activeRows);

  function applyRows(rows){
    if(applying||!Array.isArray(rows)||!rows.length)return;
    applying=true;
    try{
      const target=(typeof market!=='undefined'&&market&&typeof market==='object')?market:{};
      Object.keys(target).forEach(k=>delete target[k]);
      const pool=[];
      for(const r of rows){
        const name=clean(r.full_name);if(!name)continue;
        const pos=String(r.position||'').toUpperCase(),team=teamText(r.team);
        target[name]={id:String(r.player_id),rank:Number(r.sleeper_rank),posRank:Number(r.position_rank),team,pos,adp:Number(r.sleeper_adp),searchRank:Number(r.sleeper_adp),move:Number(r.rank_change)||0,updatedAt:r.captured_at?new Date(r.captured_at).getTime():Date.now(),central:true,format:activeFormat};
        if(['QB','RB','WR','TE'].includes(pos))pool.push({id:String(r.player_id),name,position:pos,team,bye:'—',tier:null,tags:[],note:'',drafted:false});
      }
      try{sleeperPool=pool}catch(_){}
      try{localStorage.setItem('de_sleeper_pool',JSON.stringify(pool))}catch(_){}
    }finally{applying=false}
    reconcileCurrentRankings(rows);
  }

  function renderFormatTabs(){
    const adpList=document.getElementById('adpList');if(!adpList)return;
    let root=document.getElementById('adpFormatTabs');
    if(!root){
      root=document.createElement('div');root.id='adpFormatTabs';root.className='pills';root.style.cssText='margin:-12px 0 18px;gap:8px;flex-wrap:wrap';
      adpList.parentNode.insertBefore(root,adpList);
    }
    root.innerHTML=Object.entries(FORMATS).map(([key,cfg])=>'<button class="pill '+(key===activeFormat?'active':'')+'" data-adp-format="'+key+'" style="padding:9px 14px">'+cfg.label+'</button>').join('');
    root.querySelectorAll('[data-adp-format]').forEach(btn=>btn.onclick=()=>setFormat(btn.dataset.adpFormat));
    const p=document.querySelector('#page-adp .pagehead p');
    if(p)p.textContent='Sleeper '+FORMATS[activeFormat].label+' redraft ADP.';
  }

  async function loadCentralRanks(){
    renderFormatTabs();
    setText('liveText','Loading shared Sleeper '+FORMATS[activeFormat].short+' ranks…');
    try{
      const client=getClient();
      const {data,error}=await client.from('sleeper_adp_current')
        .select('format,player_id,full_name,position,team,sleeper_rank,position_rank,sleeper_adp,captured_at,rank_change')
        .eq('format',activeFormat).order('sleeper_rank',{ascending:true});
      if(error)throw error;
      if(!Array.isArray(data)||data.length<100)throw new Error('Shared Sleeper '+FORMATS[activeFormat].short+' ranks are incomplete.');
      activeRows=data;applyRows(activeRows);
      const latest=data.reduce((m,r)=>Math.max(m,r.captured_at?new Date(r.captured_at).getTime():0),0);
      const moved=data.filter(r=>Number(r.rank_change)!==0).length;
      setText('liveText','Sleeper '+FORMATS[activeFormat].short+' updated'+(latest?' '+fmtTime(latest):''));
      setText('adpStatus',moved?moved+' player'+(moved===1?'':'s')+' moved in the latest '+FORMATS[activeFormat].short+' update':'No '+FORMATS[activeFormat].short+' rank changes in the latest central update');
      if(typeof renderEverything==='function')renderEverything();
      return data;
    }catch(e){console.error('Central Sleeper ADP failed',e);setText('liveText','Couldn’t load shared Sleeper ranks');setText('adpStatus',e?.message||String(e));throw e}
  }

  async function setFormat(format){
    if(!FORMATS[format]||format===activeFormat)return;
    activeFormat=format;localStorage.setItem(FORMAT_KEY,format);activeRows=[];historyCache.clear();renderFormatTabs();
    await loadCentralRanks();
  }
  window.DraftEdgeAdpFormat=()=>activeFormat;
  window.setDraftEdgeAdpFormat=setFormat;

  refreshCurrentAdp=loadCentralRanks;window.refreshCurrentAdp=loadCentralRanks;
  const update=document.getElementById('topUpdate');if(update)update.onclick=loadCentralRanks;

  const originalRenderAdp=typeof renderAdp==='function'?renderAdp:null;
  if(originalRenderAdp){renderAdp=function(){if(activeRows.length)applyRows(activeRows);return originalRenderAdp()}}
  const originalRenderRankings=typeof renderRankings==='function'?renderRankings:null;
  if(originalRenderRankings){renderRankings=function(){if(activeRows.length)applyRows(activeRows);return originalRenderRankings()}}
  const originalRenderDraft=typeof renderDraft==='function'?renderDraft:null;
  if(originalRenderDraft){renderDraft=function(){if(activeRows.length)applyRows(activeRows);return originalRenderDraft()}}

  async function fetchHistory(playerId){
    const id=String(playerId||'');if(!id)return [];
    const cacheKey=activeFormat+':'+id,cached=historyCache.get(cacheKey);
    if(cached&&Date.now()-cached.at<HISTORY_TTL)return cached.rows;
    const client=getClient(),all=[];let from=0;
    while(true){
      const {data,error}=await client.from('sleeper_adp_history').select('sleeper_rank,captured_at,sleeper_adp').eq('format',activeFormat).eq('player_id',id).order('captured_at',{ascending:true}).range(from,from+999);
      if(error)throw error;const batch=Array.isArray(data)?data:[];all.push(...batch);if(batch.length<1000)break;from+=1000;
    }
    const rows=all.map(r=>({t:r.captured_at?new Date(r.captured_at).getTime():null,rank:Number(r.sleeper_rank),label:null})).filter(r=>Number.isFinite(r.rank));
    historyCache.set(cacheKey,{at:Date.now(),rows});return rows;
  }
  function playerIdFor(value){
    if(value&&typeof value==='object'){if(value.sleeperId)return String(value.sleeperId);if(value.id)return String(value.id);try{const m=marketFor(value);if(m?.id)return String(m.id)}catch(_){}}
    const name=typeof value==='string'?value:value?.name;if(!name)return '';
    try{if(market[name]?.id)return String(market[name].id);const n=nrm(name);for(const [key,m] of Object.entries(market||{}))if(m?.id&&nrm(key)===n)return String(m.id)}catch(_){}
    return '';
  }
  async function hydrateHistory(value){
    const id=playerIdFor(value);if(!id)return;
    const rows=await fetchHistory(id);let store={};try{store=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')||{}}catch(_){}
    store['id:'+id]=rows;try{localStorage.setItem(HISTORY_KEY,JSON.stringify(store))}catch(_){}
  }

  const detailBase=typeof openDetail==='function'?openDetail:null;
  if(detailBase){openDetail=async function(i){const p=players?.[i];if(!p)return detailBase(i);const drawer=document.getElementById('drawer'),content=document.getElementById('drawerContent');if(drawer&&content){content.innerHTML='<div class="small" style="padding:24px">Loading '+FORMATS[activeFormat].label+' Sleeper history…</div>';drawer.classList.add('open')}try{await hydrateHistory(p)}catch(e){console.warn(e)}return detailBase(i)};window.openDetail=openDetail}

  const marketDetailBase=typeof window.openMarketDetail==='function'?window.openMarketDetail:null;
  if(marketDetailBase){const wrapped=async function(name){const p=(typeof sleeperPool!=='undefined'?sleeperPool:[]).find(x=>nrm(x.name)===nrm(name))||{name};const drawer=document.getElementById('drawer'),content=document.getElementById('drawerContent');if(drawer&&content){content.innerHTML='<div class="small" style="padding:24px">Loading '+FORMATS[activeFormat].label+' Sleeper history…</div>';drawer.classList.add('open')}try{await hydrateHistory(p)}catch(e){console.warn(e)}return marketDetailBase(name)};window.openMarketDetail=wrapped;try{openMarketDetail=wrapped}catch(_){}}

  try{localStorage.removeItem(HISTORY_KEY);localStorage.removeItem('de5_history')}catch(_){}
  renderFormatTabs();
  loadCentralRanks().catch(()=>{});
  [1200,3000,6500].forEach(ms=>setTimeout(()=>{if(activeRows.length){applyRows(activeRows);if(typeof renderEverything==='function')renderEverything()}},ms));
})();
