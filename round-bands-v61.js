// v61.4 — configurable 10/12/14-team round bands for Rankings + Sleeper ADP; live Draft follows connected draft.
(()=>{
  const $=id=>document.getElementById(id);
  const ps=()=>{try{return Array.isArray(players)?players:[]}catch(_){return []}};
  const LEAGUE_SIZE_KEY='workhorse_round_league_size';
  const VALID_SIZES=[10,12,14];
  let draftMeta=null,draftSource='',metaAt=0,metaBusy=false,decorateTimer=null,mutating=false;

  function savedLeagueSize(){
    const n=Number(localStorage.getItem(LEAGUE_SIZE_KEY));
    return VALID_SIZES.includes(n)?n:12;
  }
  function setLeagueSize(n){
    n=Number(n);if(!VALID_SIZES.includes(n))return;
    localStorage.setItem(LEAGUE_SIZE_KEY,String(n));
    syncControls();
    add('rankings');add('adp');
  }

  function css(){
    if($('deRound61Css'))return;
    const s=document.createElement('style');s.id='deRound61Css';s.textContent=`
      .de61-round-band{display:flex;align-items:center;gap:9px;margin:12px 0 7px;color:#7f93a3;font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}
      .de61-round-band::before,.de61-round-band::after{content:'';height:1px;background:linear-gradient(90deg,transparent,#304250);flex:1}.de61-round-band::after{background:linear-gradient(90deg,#304250,transparent)}
      .de61-round-band span{padding:4px 8px;border:1px solid #2a3b49;border-radius:999px;background:#0e171f;color:#93a8b8;white-space:nowrap}
      .de61-round-band.de61-live span{border-color:#38566b;background:#101d27;color:#b5cad9;box-shadow:0 0 0 1px #5ea9d310 inset}
      .de61-round-band .de61-now{color:#79c6f5;margin-left:5px}
      .de61-size-wrap{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:10px 0 12px;padding:9px 10px;border:1px solid #263744;border-radius:11px;background:#0d151c}
      .de61-size-label{font-size:9px;font-weight:950;letter-spacing:.07em;text-transform:uppercase;color:#879aa9}
      .de61-size-buttons{display:flex;gap:5px}
      .de61-size-btn{appearance:none;border:1px solid #344856;background:#101a22;color:#93a6b5;border-radius:8px;padding:6px 9px;font:900 10px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer}
      .de61-size-btn:hover{border-color:#4d687b;color:#c5d4df}
      .de61-size-btn.active{border-color:#5d91b1;background:#152632;color:#d6e8f3;box-shadow:0 0 0 1px rgba(93,145,177,.18) inset}
      @media(max-width:520px){.de61-size-wrap{align-items:flex-start}.de61-size-buttons{width:100%}.de61-size-btn{flex:1;padding:8px 6px}}
    `;document.head.appendChild(s);
  }
  function pos(kind){try{return kind==='adp'?adpPos:kind==='rankings'?rankPos:draftPos}catch(_){return 'ALL'}}
  function rankFor(row,kind){
    if(kind==='adp'){const n=Number((row.querySelector('.metric .num')?.textContent||'').replace(/[^0-9]/g,''));return Number.isFinite(n)&&n>0?n:null}
    const i=Number(row.dataset.index),p=Number.isInteger(i)?ps()[i]:null;return Number(p?.overall)||null;
  }
  function inputValue(){return $('draftId')?.value?.trim()||localStorage.getItem('de34_draft_input')||''}
  function savedDraft(){try{return String(currentList?.()?.draftPrefs?.draftId||'')}catch(_){return ''}}
  function extractId(raw){const s=String(raw||'').trim();const m=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i)||s.match(/\b\d{8,}\b/);return m?.[1]||m?.[0]||''}
  async function sl(url){if(typeof window.sleeper==='function')return window.sleeper(url);const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Sleeper HTTP '+r.status);return r.json()}
  async function refreshMeta(force=false){
    const source=savedDraft()||extractId(inputValue());
    if(!source){draftMeta=null;draftSource='';return null}
    if(metaBusy)return draftMeta;
    if(!force&&draftMeta&&draftSource===source&&Date.now()-metaAt<60000)return draftMeta;
    metaBusy=true;
    try{
      let d=null;
      try{const x=await sl('https://api.sleeper.app/v1/draft/'+source);if(x?.draft_id)d=x}catch(_){}
      if(!d){
        try{const l=await sl('https://api.sleeper.app/v1/league/'+source);if(l?.draft_id)d=await sl('https://api.sleeper.app/v1/draft/'+l.draft_id)}catch(_){}
      }
      if(d?.draft_id){draftMeta=d;draftSource=source;metaAt=Date.now()}
      return draftMeta;
    }finally{metaBusy=false}
  }
  function teamCount(){return Math.max(1,Number(draftMeta?.settings?.teams)||12)}
  function currentPick(){
    try{
      const intel=window.DraftEdgeDraftIntelligence;
      if(typeof intel?.currentPick==='function'){const n=Number(intel.currentPick());if(n>0)return n}
    }catch(_){}
    let max=0;for(const p of ps()){const n=Number(p?.draftedPickNo)||0;if(n>max)max=n}return max+1;
  }
  function roundForPick(n,t){return Math.floor((Math.max(1,Number(n))-1)/t)+1}
  function band(row,label,live=false){const b=document.createElement('div');b.className='de61-round-band'+(live?' de61-live':'');b.innerHTML='<span>'+label+'</span>';row.before(b)}
  function clear(list){list.querySelectorAll(':scope > .de61-round-band').forEach(x=>x.remove())}

  function ensureControl(kind,list){
    if(kind==='draft'||!list)return;
    const id='de61LeagueSize-'+kind;
    let box=$(id);
    if(!box){
      box=document.createElement('div');box.id=id;box.className='de61-size-wrap';box.dataset.kind=kind;
      box.innerHTML='<span class="de61-size-label">League Size</span><div class="de61-size-buttons" role="group" aria-label="League size"><button type="button" class="de61-size-btn" data-size="10">10 teams</button><button type="button" class="de61-size-btn" data-size="12">12 teams</button><button type="button" class="de61-size-btn" data-size="14">14 teams</button></div>';
      list.parentNode?.insertBefore(box,list);
    }
    const selected=savedLeagueSize();
    box.querySelectorAll('.de61-size-btn').forEach(btn=>{
      const active=Number(btn.dataset.size)===selected;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }
  function syncControls(){['rankings','adp'].forEach(kind=>{const list=$(kind==='adp'?'adpList':'rankList');if(list)ensureControl(kind,list)})}

  function addStatic(kind,list){
    const teams=savedLeagueSize();let last=0;
    for(const row of list.querySelectorAll(':scope > .player')){
      if(row.offsetParent===null)continue;const rank=rankFor(row,kind);if(!rank)continue;const rnd=roundForPick(rank,teams);if(rnd===last)continue;
      band(row,'Round '+rnd+' · picks '+(((rnd-1)*teams)+1)+'–'+(rnd*teams));last=rnd;
    }
  }
  function addDraftLive(list){
    const teams=teamCount(),cur=Math.max(1,currentPick());let visible=0,lastRound=0;
    for(const row of list.querySelectorAll(':scope > .player')){
      if(row.offsetParent===null)continue;
      const pickNo=cur+visible,rnd=roundForPick(pickNo,teams);visible++;
      if(rnd===lastRound)continue;
      const start=(rnd-1)*teams+1,end=rnd*teams;
      const now=pickNo===cur?' <span class="de61-now">• current pick #'+cur+'</span>':'';
      band(row,'Round '+rnd+' · picks '+start+'–'+end+now,true);lastRound=rnd;
    }
  }
  function add(kind){
    css();const list=$(kind==='adp'?'adpList':kind==='rankings'?'rankList':'draftList');if(!list)return;
    if(kind!=='draft')ensureControl(kind,list);
    mutating=true;try{clear(list);if(String(pos(kind)||'ALL').toUpperCase()!=='ALL')return;if(kind==='draft'&&draftMeta?.draft_id)addDraftLive(list);else addStatic(kind,list)}finally{mutating=false}
  }
  function schedule(){clearTimeout(decorateTimer);decorateTimer=setTimeout(()=>{['adp','rankings','draft'].forEach(add)},40)}
  function wrap(name,kind){try{const base=eval(name);if(typeof base!=='function'||base.__de61Round)return;const w=function(){const out=base.apply(this,arguments);queueMicrotask(()=>add(kind));return out};w.__de61Round=true;eval(name+'=w');try{window[name]=w}catch(_){}}catch(_){}}
  async function sync(force=false){await refreshMeta(force).catch(()=>null);add('draft')}

  css();wrap('renderAdp','adp');wrap('renderRankings','rankings');wrap('renderDraft','draft');
  setTimeout(()=>{['adp','rankings','draft'].forEach(add);sync(true)},120);
  setTimeout(()=>{['adp','rankings','draft'].forEach(add)},900);
  const draftList=$('draftList');if(draftList){const ob=new MutationObserver(()=>{if(!mutating)schedule()});ob.observe(draftList,{childList:true,subtree:false})}
  document.addEventListener('click',e=>{
    const sizeBtn=e.target.closest?.('.de61-size-btn[data-size]');
    if(sizeBtn){setLeagueSize(Number(sizeBtn.dataset.size));return}
    if(e.target.closest?.('#connectDraft'))setTimeout(()=>sync(true),350);
  });
  document.addEventListener('change',e=>{if(e.target?.id==='deDraftSlot')setTimeout(()=>add('draft'),0)});
  window.addEventListener('storage',e=>{if(e.key===LEAGUE_SIZE_KEY){syncControls();add('rankings');add('adp')}});
  setInterval(()=>{if($('page-draft')&&!$('page-draft').hidden)sync(false)},5000);
  window.DraftEdgeRoundBands={refresh:()=>sync(true),leagueSize:()=>savedLeagueSize(),setLeagueSize};
})();
