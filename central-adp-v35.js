// v35 — shared Sleeper-only PPR ranks + central ADP history.
(()=>{
  const HISTORY_KEY='de29_adp_history';
  const LEGACY_CLEAR_KEY='de35_cleared_legacy_adp_history';
  const HISTORY_TTL=5*60*1000;
  const historyCache=new Map();
  let centralClient=null;
  let centralReady=false;

  function getClient(){
    if(centralClient)return centralClient;
    try{
      if(typeof supabaseClient!=='undefined'&&supabaseClient){centralClient=supabaseClient;return centralClient}
    }catch(_){}
    if(window.supabase&&typeof window.supabase.createClient==='function'&&typeof DRAFT_EDGE_SUPABASE_URL!=='undefined'&&typeof DRAFT_EDGE_SUPABASE_KEY!=='undefined'){
      centralClient=window.supabase.createClient(DRAFT_EDGE_SUPABASE_URL,DRAFT_EDGE_SUPABASE_KEY);
      return centralClient;
    }
    throw new Error('Draft Edge database is not ready yet.');
  }

  function clean(v){return typeof cleanPlayerName==='function'?cleanPlayerName(v):String(v||'').trim()}
  function norm35(v){return typeof norm==='function'?norm(v):clean(v).toLowerCase().replace(/[^a-z0-9]/g,'')}
  function setStatus(id,text){const el=document.getElementById(id);if(el)el.textContent=text}
  function formatTime(value){
    const d=value?new Date(value):null;
    return d&&!Number.isNaN(d.getTime())?d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}):'';
  }

  function clearLegacyHistoryOnce(){
    if(localStorage.getItem(LEGACY_CLEAR_KEY)==='1')return;
    try{localStorage.removeItem(HISTORY_KEY);localStorage.removeItem('de5_history')}catch(_){}
    try{if(typeof history!=='undefined'&&history&&typeof history==='object')Object.keys(history).forEach(k=>delete history[k])}catch(_){}
    localStorage.setItem(LEGACY_CLEAR_KEY,'1');
  }

  function applyCentralRows(rows){
    const oldMarket=(typeof market!=='undefined'&&market&&typeof market==='object')?market:{};
    Object.keys(oldMarket).forEach(k=>delete oldMarket[k]);
    const pool=[];
    for(const r of rows){
      const name=clean(r.full_name);if(!name)continue;
      const pos=String(r.position||'').toUpperCase();
      oldMarket[name]={
        id:String(r.player_id),
        rank:Number(r.sleeper_rank),
        posRank:Number(r.position_rank),
        team:r.team||'FA',
        pos,
        adp:Number(r.sleeper_adp),
        searchRank:Number(r.sleeper_adp),
        move:Number(r.rank_change)||0,
        updatedAt:r.captured_at?new Date(r.captured_at).getTime():Date.now(),
        central:true
      };
      if(['QB','RB','WR','TE'].includes(pos))pool.push({id:String(r.player_id),name,position:pos,team:r.team||'FA',bye:'—',tier:null,tags:[],note:'',drafted:false});
    }
    try{sleeperPool=pool}catch(_){}
    try{localStorage.setItem('de_sleeper_pool',JSON.stringify(pool));localStorage.setItem('de5_market',JSON.stringify(oldMarket))}catch(_){}
    centralReady=true;
  }

  async function loadCentralRanks(){
    setStatus('liveText','Loading shared Sleeper ranks…');
    try{
      const client=getClient();
      const {data,error}=await client.from('sleeper_rank_current')
        .select('player_id,full_name,position,team,sleeper_rank,position_rank,sleeper_adp,captured_at,rank_change')
        .order('sleeper_rank',{ascending:true});
      if(error)throw error;
      if(!Array.isArray(data)||data.length<100)throw new Error('Shared Sleeper ranks are incomplete.');
      applyCentralRows(data);
      const latest=data.reduce((m,r)=>Math.max(m,r.captured_at?new Date(r.captured_at).getTime():0),0);
      const moved=data.filter(r=>Number(r.rank_change)!==0).length;
      setStatus('liveText','Shared Sleeper ranks updated'+(latest?' '+formatTime(latest):''));
      setStatus('adpStatus',moved?moved+' player'+(moved===1?'':'s')+' moved in the latest central update':'No rank changes in the latest central update');
      if(typeof renderEverything==='function')renderEverything();
      return data;
    }catch(e){
      console.error('Central Sleeper ranks failed',e);
      setStatus('liveText','Couldn’t load shared Sleeper ranks');
      setStatus('adpStatus',e?.message||String(e));
      throw e;
    }
  }

  refreshCurrentAdp=loadCentralRanks;
  window.refreshCurrentAdp=loadCentralRanks;
  const update=document.getElementById('topUpdate');if(update)update.onclick=loadCentralRanks;

  async function fetchAllHistory(playerId){
    const id=String(playerId||'');if(!id)return [];
    const cached=historyCache.get(id);
    if(cached&&Date.now()-cached.at<HISTORY_TTL)return cached.rows;
    const client=getClient();
    const all=[];let from=0;
    while(true){
      const {data,error}=await client.from('sleeper_rank_history')
        .select('sleeper_rank,captured_at,sleeper_adp')
        .eq('player_id',id)
        .order('captured_at',{ascending:true})
        .range(from,from+999);
      if(error)throw error;
      const batch=Array.isArray(data)?data:[];all.push(...batch);
      if(batch.length<1000)break;
      from+=1000;
    }
    const rows=all.map(r=>({t:r.captured_at?new Date(r.captured_at).getTime():null,rank:Number(r.sleeper_rank),label:null}))
      .filter(r=>Number.isFinite(r.rank));
    historyCache.set(id,{at:Date.now(),rows});
    return rows;
  }

  function playerIdFor(value){
    if(value&&typeof value==='object'){
      if(value.sleeperId)return String(value.sleeperId);
      if(value.id)return String(value.id);
      try{const m=marketFor(value);if(m?.id)return String(m.id)}catch(_){}
    }
    const name=typeof value==='string'?value:value?.name;
    if(!name)return '';
    try{
      if(market[name]?.id)return String(market[name].id);
      const n=norm35(name);
      for(const [key,m] of Object.entries(market||{}))if(m?.id&&norm35(key)===n)return String(m.id);
    }catch(_){}
    return '';
  }

  async function hydrateHistory(value){
    const id=playerIdFor(value);if(!id)return;
    const rows=await fetchAllHistory(id);
    let store={};try{store=JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')||{}}catch(_){}
    store['id:'+id]=rows;
    try{localStorage.setItem(HISTORY_KEY,JSON.stringify(store))}catch(e){console.warn('Could not cache central history locally',e)}
  }

  const oldOpenDetail=typeof openDetail==='function'?openDetail:null;
  if(oldOpenDetail){
    openDetail=async function(i){
      const p=players?.[i];if(!p)return oldOpenDetail(i);
      const drawer=document.getElementById('drawer'),content=document.getElementById('drawerContent');
      if(drawer&&content){content.innerHTML='<div class="small" style="padding:24px">Loading full shared Sleeper history…</div>';drawer.classList.add('open')}
      try{await hydrateHistory(p)}catch(e){console.warn('Central history unavailable',e)}
      return oldOpenDetail(i);
    };
    window.openDetail=openDetail;
  }

  const oldMarketDetail=typeof window.openMarketDetail==='function'?window.openMarketDetail:null;
  if(oldMarketDetail){
    const wrappedMarketDetail=async function(name){
      const p=(typeof sleeperPool!=='undefined'?sleeperPool:[]).find(x=>norm35(x.name)===norm35(name))||{name};
      const drawer=document.getElementById('drawer'),content=document.getElementById('drawerContent');
      if(drawer&&content){content.innerHTML='<div class="small" style="padding:24px">Loading full shared Sleeper history…</div>';drawer.classList.add('open')}
      try{await hydrateHistory(p)}catch(e){console.warn('Central history unavailable',e)}
      return oldMarketDetail(name);
    };
    window.openMarketDetail=wrappedMarketDetail;
    try{openMarketDetail=wrappedMarketDetail}catch(_){}
  }

  clearLegacyHistoryOnce();
  loadCentralRanks().catch(()=>{});
  setTimeout(()=>{if(!centralReady)loadCentralRanks().catch(()=>{})},900);
})();
