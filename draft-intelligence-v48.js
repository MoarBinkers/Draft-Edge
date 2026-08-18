// v48 — persistent Draft Intelligence with on-the-clock next-turn predictions.
// One owner for this panel. Uses directional labels instead of fake probability precision.
(()=>{
  const POLL_MS=2000;
  const INPUT_KEY='de34_draft_input';
  const POSITIONS=['QB','RB','WR','TE'];
  let timer=null,busy=false,resolving=false;
  let draftId='',sourceId='',draft=null,league=null,traded=[],picks=[];
  let lastMetaRefresh=0;

  const esc=v=>typeof window.esc==='function'?window.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function savedDraftId(){try{return String(window.currentList?.()?.draftPrefs?.draftId||'')}catch(_){return ''}}
  function inputValue(){return document.getElementById('draftId')?.value?.trim()||localStorage.getItem(INPUT_KEY)||''}
  function extractId(raw){
    const s=String(raw||'').trim();
    const m=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i);
    return m?.[1]||(s.match(/\b\d{8,}\b/)||[])[0]||'';
  }
  function selectedSlot(){
    const ui=Number(document.getElementById('deDraftSlot')?.value||0);if(ui>0)return ui;
    if(draftId){
      let listSlot=0;try{listSlot=Number(window.currentList?.()?.draftPrefs?.slot||0)}catch(_){}
      const saved=Number(localStorage.getItem('de41_draft_slot:'+draftId)||listSlot||0);if(saved>0)return saved;
    }
    return null;
  }
  async function sl(url){
    if(typeof window.sleeper==='function')return window.sleeper(url);
    const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('Sleeper HTTP '+r.status);return r.json();
  }
  async function resolve(force=false){
    if(resolving)return !!draftId;
    const wanted=savedDraftId()||extractId(inputValue());if(!wanted)return false;
    if(draftId&&!force&&String(sourceId)===String(wanted))return true;
    resolving=true;
    try{
      let d=null,l=null;
      try{const direct=await sl('https://api.sleeper.app/v1/draft/'+wanted);if(direct?.draft_id)d=direct}catch(_){}
      if(!d){
        try{
          l=await sl('https://api.sleeper.app/v1/league/'+wanted);
          if(l?.draft_id)d=await sl('https://api.sleeper.app/v1/draft/'+l.draft_id);
          if(!d){const ds=await sl('https://api.sleeper.app/v1/league/'+wanted+'/drafts');d=Array.isArray(ds)?(ds.find(x=>x.status==='drafting')||ds.find(x=>x.status==='pre_draft')||ds[0]):null}
        }catch(_){}
      }
      if(!d?.draft_id)return false;
      draftId=String(d.draft_id);sourceId=String(wanted);draft=d;
      if(!l&&d.league_id)try{l=await sl('https://api.sleeper.app/v1/league/'+d.league_id)}catch(_){}
      league=l||null;traded=[];
      if(d.league_id)try{const tp=await sl('https://api.sleeper.app/v1/league/'+d.league_id+'/traded_picks');traded=Array.isArray(tp)?tp:[]}catch(_){}
      lastMetaRefresh=Date.now();return true;
    }finally{resolving=false}
  }
  async function refreshMeta(){
    if(!draftId||Date.now()-lastMetaRefresh<60000)return;
    try{
      const d=await sl('https://api.sleeper.app/v1/draft/'+draftId);if(d?.draft_id)draft=d;
      if(draft?.league_id){
        const [l,tp]=await Promise.all([sl('https://api.sleeper.app/v1/league/'+draft.league_id).catch(()=>league),sl('https://api.sleeper.app/v1/league/'+draft.league_id+'/traded_picks').catch(()=>traded)]);
        if(l)league=l;if(Array.isArray(tp))traded=tp;
      }
      lastMetaRefresh=Date.now();
    }catch(_){}
  }

  function teams(){return Math.max(1,Number(draft?.settings?.teams)||Number(league?.total_rosters)||0)}
  function rounds(){return Math.max(1,Number(draft?.settings?.rounds)||0)}
  function roundForPick(n){return Math.floor((Number(n)-1)/teams())+1}
  function slotForPick(n){const t=teams(),r=roundForPick(n),within=((Number(n)-1)%t)+1;return draft?.type==='snake'&&r%2===0?t-within+1:within}
  function rosterForSlot(slot){const map=draft?.slot_to_roster_id||{},v=map[String(slot)]??map[slot];return v==null?'':String(v)}
  function tradedOwner(round,original){
    let owner=String(original||'');
    for(const t of traded){const seasonOk=!t.season||!draft?.season||String(t.season)===String(draft.season);if(seasonOk&&Number(t.round)===Number(round)&&String(t.roster_id)===String(original))owner=String(t.owner_id)}
    return owner;
  }
  function ownerForFuturePick(n){const slot=slotForPick(n),original=rosterForSlot(slot);return original?'r:'+tradedOwner(roundForPick(n),original):'s:'+slot}
  function ownerForPastPick(p){const roster=String(p?.roster_id||'').trim();if(roster)return 'r:'+roster;const slot=Number(p?.draft_slot)||slotForPick(Number(p?.pick_no)||1),mapped=rosterForSlot(slot);return mapped?'r:'+mapped:'s:'+slot}
  function myOwner(){const slot=selectedSlot();if(!slot)return '';const r=rosterForSlot(slot);return r?'r:'+r:'s:'+slot}
  function currentPick(){return draftId?(picks||[]).reduce((m,p)=>Math.max(m,Number(p.pick_no)||0),0)+1:null}
  function totalPicks(){return teams()*rounds()}
  function myPickNumbers(){
    const slot=selectedSlot(),owner=myOwner(),total=totalPicks();if(!slot||!total)return [];
    const out=[];for(let n=1;n<=total;n++){if(owner.startsWith('r:')){if(ownerForFuturePick(n)===owner)out.push(n)}else if(slotForPick(n)===slot)out.push(n)}return out;
  }
  function isMyCurrentPick(){const cur=currentPick(),owner=myOwner();return !!(cur&&owner&&ownerForFuturePick(cur)===owner)}
  function targetUserPick(){
    const cur=currentPick();if(!cur)return null;
    return myPickNumbers().find(n=>isMyCurrentPick()?n>cur:n>=cur)||null;
  }
  function picksBeforeTarget(){
    const cur=currentPick(),target=targetUserPick();if(!cur||!target||target<=cur)return [];
    const start=isMyCurrentPick()?cur+1:cur,out=[];
    for(let n=start;n<target;n++)out.push({pickNo:n,owner:ownerForFuturePick(n),slot:slotForPick(n)});
    return out;
  }

  function starterConfig(){
    const cfg={QB:0,RB:0,WR:0,TE:0,flex:0,superflex:0};
    const rp=Array.isArray(league?.roster_positions)?league.roster_positions.map(x=>String(x).toUpperCase()):[];
    if(rp.length){for(const x of rp){if(POSITIONS.includes(x))cfg[x]++;else if(x==='SUPER_FLEX')cfg.superflex++;else if(x.includes('FLEX'))cfg.flex++}}
    else{const s=draft?.settings||{};cfg.QB=Number(s.slots_qb)||0;cfg.RB=Number(s.slots_rb)||0;cfg.WR=Number(s.slots_wr)||0;cfg.TE=Number(s.slots_te)||0;cfg.flex=Number(s.slots_flex)||0;cfg.superflex=Number(s.slots_super_flex)||0}
    if(!cfg.QB)cfg.QB=1;if(!cfg.RB)cfg.RB=2;if(!cfg.WR)cfg.WR=2;if(!cfg.TE)cfg.TE=1;return cfg;
  }
  function teamCounts(){
    const map=new Map();for(const p of picks){const pos=String(p?.metadata?.position||'').toUpperCase();if(!POSITIONS.includes(pos))continue;const key=ownerForPastPick(p);if(!map.has(key))map.set(key,{QB:0,RB:0,WR:0,TE:0,total:0});const c=map.get(key);c[pos]++;c.total++}return map;
  }
  function demandFor(pos,owner,pickNo,cm=teamCounts()){
    const c=cm.get(owner)||{QB:0,RB:0,WR:0,TE:0,total:0},cfg=starterConfig(),round=roundForPick(pickNo),sf=cfg.superflex>0||cfg.QB>=2;
    if(pos==='QB'){
      if(sf){const target=Math.max(2,cfg.QB+cfg.superflex);if(c.QB===0)return .99;if(c.QB<target)return .88;if(c.QB===target)return round>=7?.34:.22;return .06}
      if(c.QB===0){if(round<=3)return .30;if(round<=5)return .52;if(round<=8)return .76;return .90}if(c.QB===1)return round>=10?.15:.05;return .02;
    }
    if(pos==='TE'){if(c.TE<cfg.TE){if(round<=4)return .28;if(round<=7)return .55;return .78}if(c.TE===cfg.TE)return round>=9?.20:.09;return .03}
    const base=cfg[pos]||2,flexShare=(cfg.flex||0)*(pos==='WR'?.60:.40),depth=base+flexShare+(round>=9?.8:round>=6?.35:0),have=c[pos]||0;
    if(have<base)return .92;if(have<depth)return .70;if(have<Math.ceil(depth)+1)return round<=5?.40:.52;if(have<Math.ceil(depth)+2)return .27;return .12;
  }
  function threatPicks(pos){const cm=teamCounts();return picksBeforeTarget().map(x=>({...x,demand:demandFor(pos,x.owner,x.pickNo,cm)}))}

  function playerId(p){try{return String(window.marketFor?.(p)?.id||p?.sleeperId||p?.id||'')}catch(_){return String(p?.sleeperId||p?.id||'')}}
  function marketInfo(p){try{return window.marketFor?.(p)||null}catch(_){return null}}
  function availablePlayers(){
    const gone=new Set(picks.map(p=>String(p.player_id||'')).filter(Boolean));
    return (Array.isArray(window.players)?window.players:[]).filter(p=>{const id=playerId(p);return id?!gone.has(id):!p.drafted}).sort((a,b)=>(Number(a.overall)||9999)-(Number(b.overall)||9999));
  }
  function recentCount(pos,n){return picks.slice().sort((a,b)=>(Number(b.pick_no)||0)-(Number(a.pick_no)||0)).slice(0,n).filter(p=>String(p?.metadata?.position||'').toUpperCase()===pos).length}
  function positionRun(pos){const l6=recentCount(pos,6),l10=recentCount(pos,10);if(l6>=4)return {level:'hot',label:'🔥 '+l6+' of last 6'};if(l6>=3)return {level:'active',label:l6+' of last 6'};if(l10>=4)return {level:'active',label:l10+' of last 10'};if(l6===0)return {level:'quiet',label:'0 of last 6'};return {level:'normal',label:l6+' of last 6'}}
  function samePosAhead(p,avail){const m=marketInfo(p),r=Number(m?.rank)||Number(m?.adp);if(!r)return 0;return avail.filter(x=>x!==p&&String(x.position)===String(p.position)).filter(x=>{const xm=marketInfo(x),xr=Number(xm?.rank)||Number(xm?.adp);return xr&&xr<r}).length}
  function nextSamePosGap(p,avail){const m=marketInfo(p),r=Number(m?.rank)||Number(m?.adp);if(!r)return 0;const later=avail.filter(x=>x!==p&&String(x.position)===String(p.position)).map(x=>{const xm=marketInfo(x);return Number(xm?.rank)||Number(xm?.adp)||0}).filter(x=>x>r).sort((a,b)=>a-b);return later.length?later[0]-r:0}

  function riskFor(p){
    const cur=currentPick(),target=targetUserPick(),between=picksBeforeTarget(),pos=String(p.position||'').toUpperCase(),avail=availablePlayers();
    if(!cur||!target||!selectedSlot())return {label:'Need draft slot',cls:'unknown',reasons:['Choose your draft slot']};
    const mi=marketInfo(p),mr=Number(mi?.rank)||Number(mi?.adp)||0,span=Math.max(1,target-cur);
    let marketScore=18;
    if(mr){if(mr<=cur)marketScore=clamp(60+(cur-mr)*1.2,60,72);else if(mr<target)marketScore=clamp(28+((target-mr)/span)*32,28,60);else if(mr<=target+8)marketScore=20;else if(mr<=target+18)marketScore=12;else marketScore=6}
    const threats=threatPicks(pos),strong=threats.filter(x=>x.demand>=.60),veryStrong=threats.filter(x=>x.demand>=.82),demandSum=threats.reduce((s,x)=>s+x.demand,0),ahead=samePosAhead(p,avail);
    const demandScore=Math.min(30,demandSum*8)/(1+ahead*.30),run=positionRun(pos),runScore=run.level==='hot'?11:run.level==='active'?7:run.level==='normal'?2:0,gap=nextSamePosGap(p,avail),scarcity=gap>=18?8:gap>=10?5:0;
    let score=clamp(marketScore+demandScore+runScore+scarcity,0,100);if(between.length<=2&&mr>target+8&&!veryStrong.length)score=Math.min(score,34);
    let label='Safe to wait',cls='safe';if(score>=72){label='High risk';cls='high'}else if(score>=54){label='Getting risky';cls='risky'}else if(score>=34){label='Lean wait';cls='lean'}
    const reasons=[];
    if(mr){if(mr<=cur)reasons.push('Sleeper #'+Math.round(Number(mi?.rank)||mr)+' is already at/past this pick');else if(mr<target)reasons.push('Sleeper market is before your #'+target+' pick');else if(mr>target+10)reasons.push('Sleeper market is later than your next turn')}
    if(strong.length)reasons.push(strong.length+' of '+between.length+' upcoming pick'+(between.length===1?'':'s')+' show '+pos+' need');
    if(run.level==='hot'||run.level==='active')reasons.push(run.label+' '+pos+' run');if(ahead>0)reasons.push(ahead+' '+pos+(ahead===1?' is':'s are')+' ahead by Sleeper');if(gap>=10)reasons.push('noticeable '+pos+' drop-off after him');if(!reasons.length)reasons.push('No strong short-term pressure signal');
    return {label,cls,reasons:reasons.slice(0,2),score};
  }
  function bestAt(pos){return availablePlayers().find(p=>String(p.position||'').toUpperCase()===pos)||null}
  function predictedFocus(x){
    const cm=teamCounts(),vals=POSITIONS.map(pos=>({pos,d:demandFor(pos,x.owner,x.pickNo,cm)})).sort((a,b)=>b.d-a.d);
    const top=vals[0],second=vals[1];
    if(!top||top.d<.50)return 'Open';
    if(second&&top.d-second.d<.12)return top.pos+' / '+second.pos;
    return top.pos+' lean';
  }

  function installCss(){
    if(document.getElementById('deDraftIntel48Css'))return;
    const s=document.createElement('style');s.id='deDraftIntel48Css';s.textContent=`
      #deDraftIntel48{margin:0 0 14px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.6fr);gap:10px}
      .de48-panel{border:1px solid #293a49;background:#0e161e;border-radius:14px;padding:13px;min-width:0}.de48-panel h3{margin:0 0 4px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8fa0af}.de48-sub{font-size:10px;color:#718391;margin-bottom:10px;line-height:1.4}
      .de48-pos{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;padding:8px 0;border-bottom:1px solid #1e2b36}.de48-pos:last-child{border-bottom:0}.de48-pos b,.de48-pname{font-size:11px}.de48-meta{font-size:10px;color:#98a7b3;line-height:1.45}
      .de48-player{display:grid;grid-template-columns:minmax(130px,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-bottom:1px solid #1e2b36}.de48-player:last-child{border-bottom:0}.de48-pname{font-weight:900}.de48-ranks{font-size:9px;color:#8495a3;margin-top:3px}.de48-why{font-size:9px;color:#8fa0ad;line-height:1.35;margin-top:4px}.de48-risk{white-space:nowrap;border:1px solid #3a4b58;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:1000}.de48-risk.safe{color:#70d9a0;border-color:#346b4b;background:#102018}.de48-risk.lean{color:#86bce5;border-color:#355b7a;background:#101c27}.de48-risk.risky{color:#f2c566;border-color:#7b5f31;background:#241d11}.de48-risk.high{color:#ff9eaa;border-color:#74434a;background:#28171a}.de48-risk.unknown{color:#9ba8b2}
      .de48-upcoming{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.de48-pickchip{font-size:9px;border:1px solid #2d404f;background:#111b24;color:#9fb0bd;border-radius:7px;padding:5px 7px}
      @media(max-width:900px){#deDraftIntel48{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }
  function ensureUi(){
    installCss();document.getElementById('deDraftIntel47')?.remove();
    let root=document.getElementById('deDraftIntel48');if(root)return root;
    const list=document.getElementById('draftList');if(!list)return null;
    root=document.createElement('div');root.id='deDraftIntel48';
    const mine=document.getElementById('deMyPicks43');if(mine)mine.insertAdjacentElement('afterend',root);else list.parentNode.insertBefore(root,list);return root;
  }
  function render(){
    const root=ensureUi();if(!root)return;
    if(!draftId){root.innerHTML='<div class="de48-panel" style="grid-column:1/-1"><h3>Draft Intelligence</h3><div class="de48-sub" style="margin:6px 0 0">Connect Sleeper and choose your draft slot to see positional runs and next-turn predictions.</div></div>';return}
    const slot=selectedSlot(),cur=currentPick(),target=targetUserPick(),between=picksBeforeTarget(),onClock=isMyCurrentPick();
    const posHtml=POSITIONS.map(pos=>{const run=positionRun(pos),strong=threatPicks(pos).filter(x=>x.demand>=.60).length,best=bestAt(pos);return '<div class="de48-pos"><b>'+pos+'</b><div class="de48-meta">'+esc(run.label)+' · '+strong+' threat pick'+(strong===1?'':'s')+' before you'+(best?'<br>Best left: <b>'+esc(best.name)+'</b> · Your #'+Number(best.overall):'')+'</div></div>'}).join('');
    const chips=between.slice(0,10).map(x=>'<span class="de48-pickchip">#'+x.pickNo+' · '+esc(predictedFocus(x))+'</span>').join('');
    const candidates=availablePlayers().slice(0,6);
    const avail=!slot?'<div class="de48-sub">Choose your draft slot so Draft Edge can analyze the exact rosters picking before you.</div>':!target?'<div class="de48-sub">No future pick found for your selected slot.</div>':candidates.map(p=>{const r=riskFor(p),m=marketInfo(p),sr=Number(m?.rank)||null;return '<div class="de48-player"><div><div class="de48-pname">'+esc(p.name)+'</div><div class="de48-ranks">Your #'+Number(p.overall)+(sr?' · Sleeper #'+sr:'')+' · '+esc(String(p.position||''))+'</div><div class="de48-why">'+r.reasons.map(esc).join(' · ')+'</div></div><div class="de48-risk '+r.cls+'">'+esc(r.label)+'</div></div>'}).join('');
    root.innerHTML='<div class="de48-panel"><h3>Position Runs & Availability</h3><div class="de48-sub">'+(slot&&target?(onClock?'On the clock · analyzing your following pick #'+target:between.length+' pick'+(between.length===1?'':'s')+' before your next pick #'+target):'Select your slot for exact upcoming-roster pressure')+'</div>'+posHtml+'</div><div class="de48-panel"><h3>Will They Make It Back?</h3><div class="de48-sub">'+(onClock&&target?'You are on the clock, so these predictions are for your following turn at #'+target+'.':'Uses Sleeper market timing, upcoming roster needs, recent runs and scarcity.')+'</div>'+(chips?'<div class="de48-upcoming">'+chips+'</div>':'')+avail+'</div>';
  }

  async function tick(){
    if(busy)return;busy=true;
    try{
      const wanted=savedDraftId()||extractId(inputValue());
      if(!wanted){draftId='';sourceId='';draft=null;league=null;traded=[];picks=[];render();return}
      if(!draftId||String(wanted)!==String(sourceId))await resolve(true);
      if(!draftId){render();return}
      await refreshMeta();const latest=await sl('https://api.sleeper.app/v1/draft/'+draftId+'/picks');if(Array.isArray(latest))picks=latest;render();
    }catch(e){console.warn('Draft intelligence v48 refresh failed',e);render()}finally{busy=false}
  }
  function start(){clearInterval(timer);timer=setInterval(tick,POLL_MS);tick()}
  function clear(restart=true){clearInterval(timer);timer=null;draftId='';sourceId='';draft=null;league=null;traded=[];picks=[];render();if(restart)setTimeout(start,800)}
  function wire(){
    const slot=document.getElementById('deDraftSlot');if(slot&&!slot.dataset.de48){slot.addEventListener('change',render);slot.dataset.de48='1'}
    const connect=document.getElementById('connectDraft');if(connect&&!connect.dataset.de48){connect.addEventListener('click',()=>setTimeout(()=>{draftId='';tick()},250));connect.dataset.de48='1'}
    const reset=document.getElementById('resetDraft');if(reset&&!reset.dataset.de48){reset.addEventListener('click',()=>setTimeout(()=>clear(true),0));reset.dataset.de48='1'}
    const stop=document.getElementById('stopDraft');if(stop&&!stop.dataset.de48){stop.addEventListener('click',()=>clear(false));stop.dataset.de48='1'}
  }
  ensureUi();wire();const ob=new MutationObserver(()=>{ensureUi();wire()});ob.observe(document.documentElement,{childList:true,subtree:true});setTimeout(start,1300);
  window.DraftEdgeDraftIntelligence={refresh:tick,positionRun,riskFor,nextUserPick:targetUserPick,picksBeforeUser:picksBeforeTarget,isOnClock:isMyCurrentPick};
})();
