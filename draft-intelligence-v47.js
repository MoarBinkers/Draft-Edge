// v47 — Draft Intelligence: positional runs + roster-aware next-pick availability.
// Uses Sleeper's exact upcoming draft owners when possible, but intentionally avoids fake probability precision.
(()=>{
  const POLL_MS=2000;
  const INPUT_KEY='de34_draft_input';
  const POSITIONS=['QB','RB','WR','TE'];
  let timer=null,busy=false,resolving=false;
  let draftId='',sourceId='',draft=null,league=null,traded=[],picks=[];
  let lastMetaRefresh=0,lastSig='';

  const esc47=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function savedDraftId(){
    try{return String(currentList?.()?.draftPrefs?.draftId||'')}catch(_){return ''}
  }
  function inputValue(){
    return document.getElementById('draftId')?.value?.trim()||localStorage.getItem(INPUT_KEY)||'';
  }
  function extractId(raw){
    const s=String(raw||'').trim();
    const m=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i);
    return m?.[1]||(s.match(/\b\d{8,}\b/)||[])[0]||'';
  }
  function selectedSlot(){
    const ui=Number(document.getElementById('deDraftSlot')?.value||0);
    if(ui>0)return ui;
    if(draftId){
      let listSlot=0;try{listSlot=Number(currentList?.()?.draftPrefs?.slot||0)}catch(_){}
      const saved=Number(localStorage.getItem('de41_draft_slot:'+draftId)||listSlot||0);
      if(saved>0)return saved;
    }
    return null;
  }

  async function resolve(force=false){
    if(resolving)return !!draftId;
    const wanted=savedDraftId()||extractId(inputValue());
    if(!wanted)return false;
    if(draftId&&!force&&String(sourceId)===String(wanted))return true;
    resolving=true;
    try{
      let d=null,l=null;
      try{
        const direct=await sleeper('https://api.sleeper.app/v1/draft/'+wanted);
        if(direct?.draft_id)d=direct;
      }catch(_){}
      if(!d){
        try{
          l=await sleeper('https://api.sleeper.app/v1/league/'+wanted);
          if(l?.draft_id)d=await sleeper('https://api.sleeper.app/v1/draft/'+l.draft_id);
          if(!d){
            const ds=await sleeper('https://api.sleeper.app/v1/league/'+wanted+'/drafts');
            d=Array.isArray(ds)?(ds.find(x=>x.status==='drafting')||ds.find(x=>x.status==='pre_draft')||ds[0]):null;
          }
        }catch(_){}
      }
      if(!d?.draft_id)return false;
      draftId=String(d.draft_id);sourceId=String(wanted);draft=d;
      if(!l&&d.league_id){
        try{l=await sleeper('https://api.sleeper.app/v1/league/'+d.league_id)}catch(_){}
      }
      league=l||null;
      traded=[];
      if(d.league_id){
        try{
          const tp=await sleeper('https://api.sleeper.app/v1/league/'+d.league_id+'/traded_picks');
          traded=Array.isArray(tp)?tp:[];
        }catch(_){}
      }
      lastMetaRefresh=Date.now();
      return true;
    }finally{resolving=false}
  }

  async function refreshMetaIfNeeded(){
    if(!draftId||Date.now()-lastMetaRefresh<60000)return;
    try{
      const d=await sleeper('https://api.sleeper.app/v1/draft/'+draftId);
      if(d?.draft_id)draft=d;
      if(draft?.league_id){
        const [l,tp]=await Promise.all([
          sleeper('https://api.sleeper.app/v1/league/'+draft.league_id).catch(()=>league),
          sleeper('https://api.sleeper.app/v1/league/'+draft.league_id+'/traded_picks').catch(()=>traded)
        ]);
        if(l)league=l;if(Array.isArray(tp))traded=tp;
      }
      lastMetaRefresh=Date.now();
    }catch(_){}
  }

  function teams(){return Math.max(1,Number(draft?.settings?.teams)||Number(league?.total_rosters)||0)}
  function rounds(){return Math.max(1,Number(draft?.settings?.rounds)||0)}
  function roundForPick(n){return Math.floor((Number(n)-1)/teams())+1}
  function slotForPick(n){
    const t=teams(),round=roundForPick(n),within=((Number(n)-1)%t)+1;
    return draft?.type==='snake'&&round%2===0?t-within+1:within;
  }
  function rosterForSlot(slot){
    const map=draft?.slot_to_roster_id||{},v=map[String(slot)]??map[slot];
    return v==null?'':String(v);
  }
  function tradedOwner(round,original){
    let owner=String(original||'');
    for(const t of traded){
      const seasonOk=!t.season||!draft?.season||String(t.season)===String(draft.season);
      if(seasonOk&&Number(t.round)===Number(round)&&String(t.roster_id)===String(original))owner=String(t.owner_id);
    }
    return owner;
  }
  function futureOwnerKey(pickNo){
    const slot=slotForPick(pickNo),original=rosterForSlot(slot);
    if(original)return 'r:'+tradedOwner(roundForPick(pickNo),original);
    return 's:'+slot;
  }
  function pastOwnerKey(p){
    const roster=String(p?.roster_id||'').trim();
    if(roster)return 'r:'+roster;
    const slot=Number(p?.draft_slot)||slotForPick(Number(p?.pick_no)||1);
    const mapped=rosterForSlot(slot);
    return mapped?'r:'+mapped:'s:'+slot;
  }
  function selectedOwnerKey(){
    const slot=selectedSlot();if(!slot)return '';
    const roster=rosterForSlot(slot);return roster?'r:'+roster:'s:'+slot;
  }
  function currentPickNo(){
    if(!draftId)return null;
    return (picks||[]).reduce((m,p)=>Math.max(m,Number(p.pick_no)||0),0)+1;
  }
  function totalPicks(){return teams()*rounds()}
  function userFuturePickNumbers(){
    const slot=selectedSlot(),owner=selectedOwnerKey(),total=totalPicks();if(!slot||!total)return [];
    const out=[];
    for(let n=1;n<=total;n++){
      if(owner&&owner.startsWith('r:')){if(futureOwnerKey(n)===owner)out.push(n)}
      else if(slotForPick(n)===slot)out.push(n);
    }
    return out;
  }
  function nextUserPick(){
    const cur=currentPickNo();if(!cur)return null;
    return userFuturePickNumbers().find(n=>n>=cur)||null;
  }
  function picksBeforeUser(){
    const cur=currentPickNo(),next=nextUserPick();if(!cur||!next||next<=cur)return [];
    const out=[];for(let n=cur;n<next;n++)out.push({pickNo:n,owner:futureOwnerKey(n),slot:slotForPick(n)});
    return out;
  }

  function starterConfig(){
    const cfg={QB:0,RB:0,WR:0,TE:0,flex:0,superflex:0,bench:0};
    const rp=Array.isArray(league?.roster_positions)?league.roster_positions.map(x=>String(x).toUpperCase()):[];
    if(rp.length){
      for(const x of rp){
        if(POSITIONS.includes(x))cfg[x]++;
        else if(x==='SUPER_FLEX')cfg.superflex++;
        else if(x==='BN'||x==='BENCH')cfg.bench++;
        else if(x.includes('FLEX'))cfg.flex++;
      }
    }else{
      const s=draft?.settings||{};
      cfg.QB=Number(s.slots_qb)||0;cfg.RB=Number(s.slots_rb)||0;cfg.WR=Number(s.slots_wr)||0;cfg.TE=Number(s.slots_te)||0;
      cfg.flex=Number(s.slots_flex)||0;cfg.superflex=Number(s.slots_super_flex)||0;cfg.bench=Number(s.slots_bn)||0;
    }
    if(!cfg.QB)cfg.QB=1;if(!cfg.RB)cfg.RB=2;if(!cfg.WR)cfg.WR=2;if(!cfg.TE)cfg.TE=1;
    return cfg;
  }

  function teamCounts(){
    const map=new Map();
    for(const p of picks){
      const pos=String(p?.metadata?.position||'').toUpperCase();if(!POSITIONS.includes(pos))continue;
      const key=pastOwnerKey(p);if(!map.has(key))map.set(key,{QB:0,RB:0,WR:0,TE:0,total:0});
      const c=map.get(key);c[pos]++;c.total++;
    }
    return map;
  }
  function demandFor(pos,owner,pickNo,countsMap=teamCounts()){
    const c=countsMap.get(owner)||{QB:0,RB:0,WR:0,TE:0,total:0},cfg=starterConfig(),round=roundForPick(pickNo);
    const sf=cfg.superflex>0||cfg.QB>=2;
    if(pos==='QB'){
      if(sf){
        const target=Math.max(2,cfg.QB+cfg.superflex);
        if(c.QB===0)return .99;
        if(c.QB<target)return .88;
        if(c.QB===target)return round>=7?.34:.22;
        return .06;
      }
      if(c.QB===0){
        if(round<=3)return .30;
        if(round<=5)return .52;
        if(round<=8)return .76;
        return .90;
      }
      if(c.QB===1)return round>=10?.15:.05;
      return .02;
    }
    if(pos==='TE'){
      if(c.TE<cfg.TE){
        if(round<=4)return .28;
        if(round<=7)return .55;
        return .78;
      }
      if(c.TE===cfg.TE)return round>=9?.20:.09;
      return .03;
    }
    const base=cfg[pos]||2;
    const flexShare=(cfg.flex||0)*(pos==='WR'?.60:.40);
    const depthTarget=base+flexShare+(round>=9?.8:round>=6?.35:0);
    const have=c[pos]||0;
    if(have<base)return .92;
    if(have<depthTarget)return .70;
    if(have<Math.ceil(depthTarget)+1)return round<=5?.40:.52;
    if(have<Math.ceil(depthTarget)+2)return .27;
    return .12;
  }

  function playerId(p){
    try{return String(marketFor(p)?.id||p?.sleeperId||p?.id||'')}catch(_){return String(p?.sleeperId||p?.id||'')}
  }
  function marketInfo(p){
    try{return marketFor(p)||null}catch(_){return null}
  }
  function pickedIds(){return new Set(picks.map(p=>String(p.player_id||'')).filter(Boolean))}
  function availablePlayers(){
    const gone=pickedIds();
    return (Array.isArray(players)?players:[]).filter(p=>{
      const id=playerId(p);return id?!gone.has(id):!p.drafted;
    }).sort((a,b)=>(Number(a.overall)||9999)-(Number(b.overall)||9999));
  }

  function recentPositionCount(pos,n=6){
    return picks.slice().sort((a,b)=>(Number(b.pick_no)||0)-(Number(a.pick_no)||0)).slice(0,n)
      .filter(p=>String(p?.metadata?.position||'').toUpperCase()===pos).length;
  }
  function positionRun(pos){
    const last6=recentPositionCount(pos,6),last10=recentPositionCount(pos,10);
    if(last6>=4)return {level:'hot',label:'🔥 '+last6+' of last 6'};
    if(last6>=3)return {level:'active',label:last6+' of last 6'};
    if(last10>=4)return {level:'active',label:last10+' of last 10'};
    if(last6===0)return {level:'quiet',label:'0 of last 6'};
    return {level:'normal',label:last6+' of last 6'};
  }
  function threatPicks(pos){
    const cm=teamCounts();
    return picksBeforeUser().map(x=>({...x,demand:demandFor(pos,x.owner,x.pickNo,cm)}));
  }

  function samePosMarketAhead(p,avail){
    const m=marketInfo(p),rank=Number(m?.rank)||Number(m?.adp);if(!rank)return 0;
    return avail.filter(x=>x!==p&&String(x.position)===String(p.position)).filter(x=>{
      const xm=marketInfo(x),xr=Number(xm?.rank)||Number(xm?.adp);return xr&&xr<rank;
    }).length;
  }
  function nextSamePosMarketGap(p,avail){
    const m=marketInfo(p),rank=Number(m?.rank)||Number(m?.adp);if(!rank)return 0;
    const later=avail.filter(x=>x!==p&&String(x.position)===String(p.position)).map(x=>{
      const xm=marketInfo(x);return Number(xm?.rank)||Number(xm?.adp)||0;
    }).filter(x=>x>rank).sort((a,b)=>a-b);
    return later.length?later[0]-rank:0;
  }

  function riskFor(p){
    const cur=currentPickNo(),next=nextUserPick(),between=picksBeforeUser(),pos=String(p.position||'').toUpperCase(),avail=availablePlayers();
    if(!cur||!next||!selectedSlot())return {score:null,label:'Need draft slot',className:'unknown',reasons:['Choose your draft slot']};
    if(next===cur)return {score:100,label:'On the clock',className:'clock',reasons:['This is your pick now']};

    const mi=marketInfo(p),mr=Number(mi?.rank)||Number(mi?.adp)||0,span=Math.max(1,next-cur);
    let marketScore=18;
    if(mr){
      if(mr<=cur)marketScore=clamp(60+(cur-mr)*1.2,60,72);
      else if(mr<next)marketScore=clamp(28+((next-mr)/span)*32,28,60);
      else if(mr<=next+8)marketScore=20;
      else if(mr<=next+18)marketScore=12;
      else marketScore=6;
    }

    const threats=threatPicks(pos),strong=threats.filter(x=>x.demand>=.60),veryStrong=threats.filter(x=>x.demand>=.82);
    const demandSum=threats.reduce((s,x)=>s+x.demand,0);
    const ahead=samePosMarketAhead(p,avail);
    const demandScore=Math.min(30,demandSum*8)/(1+ahead*.30);
    const run=positionRun(pos),runScore=run.level==='hot'?11:run.level==='active'?7:run.level==='normal'?2:0;
    const gap=nextSamePosMarketGap(p,avail),scarcityScore=gap>=18?8:gap>=10?5:0;
    let score=clamp(marketScore+demandScore+runScore+scarcityScore,0,100);

    if(between.length<=2&&mr>next+8&&!veryStrong.length)score=Math.min(score,34);

    let label='Safe to wait',className='safe';
    if(score>=72){label='High risk';className='high'}
    else if(score>=54){label='Getting risky';className='risky'}
    else if(score>=34){label='Lean wait';className='lean'}

    const reasons=[];
    if(mr){
      if(mr<=cur)reasons.push('Sleeper #'+Math.round(Number(mi?.rank)||mr)+' is already at/past this pick');
      else if(mr<next)reasons.push('Sleeper market is before your #'+next+' pick');
      else if(mr>next+10)reasons.push('Sleeper market is later than your next pick');
    }
    if(strong.length)reasons.push(strong.length+' of '+between.length+' upcoming pick'+(between.length===1?'':'s')+' show '+pos+' need');
    if(run.level==='hot'||run.level==='active')reasons.push(run.label+' '+pos+' run');
    if(ahead>0)reasons.push(ahead+' '+pos+(ahead===1?' is':'s are')+' ahead by Sleeper');
    if(gap>=10)reasons.push('noticeable '+pos+' drop-off after him');
    if(!reasons.length)reasons.push('No strong short-term pressure signal');
    return {score,label,className,reasons:reasons.slice(0,2),marketRank:mi?.rank||null,strong:strong.length,total:between.length};
  }

  function bestAt(pos){
    return availablePlayers().find(p=>String(p.position||'').toUpperCase()===pos)||null;
  }

  function ensureUi(){
    if(!document.getElementById('deDraftIntel47Css')){
      const s=document.createElement('style');s.id='deDraftIntel47Css';s.textContent=`
        #deDraftIntel47{margin:0 0 14px;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.6fr);gap:10px}
        .de47-panel{border:1px solid #293a49;background:#0e161e;border-radius:14px;padding:13px;min-width:0}
        .de47-panel h3{margin:0 0 4px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8fa0af}
        .de47-sub{font-size:10px;color:#718391;margin-bottom:10px;line-height:1.4}
        .de47-pos{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;padding:8px 0;border-bottom:1px solid #1e2b36}
        .de47-pos:last-child{border-bottom:0}.de47-pos b{font-size:11px}.de47-meta{font-size:10px;color:#98a7b3;line-height:1.45}
        .de47-player{display:grid;grid-template-columns:minmax(130px,1fr) auto;gap:10px;align-items:start;padding:9px 0;border-bottom:1px solid #1e2b36}
        .de47-player:last-child{border-bottom:0}.de47-name{font-size:11px;font-weight:900}.de47-ranks{font-size:9px;color:#8495a3;margin-top:3px}
        .de47-why{font-size:9px;color:#8fa0ad;line-height:1.35;margin-top:4px}
        .de47-risk{white-space:nowrap;border:1px solid #3a4b58;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:1000}
        .de47-risk.safe{color:#70d9a0;border-color:#346b4b;background:#102018}
        .de47-risk.lean{color:#86bce5;border-color:#355b7a;background:#101c27}
        .de47-risk.risky{color:#f2c566;border-color:#7b5f31;background:#241d11}
        .de47-risk.high,.de47-risk.clock{color:#ff9eaa;border-color:#74434a;background:#28171a}
        .de47-risk.unknown{color:#9ba8b2}
        @media(max-width:900px){#deDraftIntel47{grid-template-columns:1fr}}
      `;document.head.appendChild(s);
    }
    let root=document.getElementById('deDraftIntel47');if(root)return root;
    const list=document.getElementById('draftList');if(!list)return null;
    root=document.createElement('div');root.id='deDraftIntel47';
    const mine=document.getElementById('deMyPicks43');
    if(mine)mine.insertAdjacentElement('afterend',root);
    else list.parentNode.insertBefore(root,list);
    return root;
  }

  function render(){
    const root=ensureUi();if(!root)return;
    if(!draftId){
      root.innerHTML='<div class="de47-panel" style="grid-column:1/-1"><h3>Draft Intelligence</h3><div class="de47-sub" style="margin:6px 0 0">Connect Sleeper and choose your draft slot to see positional runs and roster-aware next-pick availability.</div></div>';
      return;
    }
    const slot=selectedSlot(),cur=currentPickNo(),next=nextUserPick(),between=picksBeforeUser();
    const posHtml=POSITIONS.map(pos=>{
      const run=positionRun(pos),threats=threatPicks(pos),strong=threats.filter(x=>x.demand>=.60).length,best=bestAt(pos);
      return '<div class="de47-pos"><b>'+pos+'</b><div class="de47-meta">'+
        '<span>'+esc47(run.label)+'</span> · <span>'+strong+' threat pick'+(strong===1?'':'s')+' before you</span>'+
        (best?'<br>Best left: <b>'+esc47(best.name)+'</b> · Your #'+Number(best.overall):'')+
      '</div></div>';
    }).join('');

    const candidates=availablePlayers().slice(0,6);
    const availHtml=!slot?'<div class="de47-sub">Choose your draft slot so Draft Edge can analyze the exact rosters picking before you.</div>':
      !next?'<div class="de47-sub">No future pick found for your selected slot.</div>':
      next===cur?'<div class="de47-sub">You are on the clock. Availability risk is not needed for this pick.</div>':
      candidates.map(p=>{
        const r=riskFor(p),m=marketInfo(p);
        const sleeperRank=Number(m?.rank)||null;
        return '<div class="de47-player"><div><div class="de47-name">'+esc47(p.name)+'</div>'+
          '<div class="de47-ranks">Your #'+Number(p.overall)+(sleeperRank?' · Sleeper #'+sleeperRank:'')+' · '+esc47(String(p.position||''))+'</div>'+
          '<div class="de47-why">'+r.reasons.map(esc47).join(' · ')+'</div></div>'+
          '<div class="de47-risk '+r.className+'">'+esc47(r.label)+'</div></div>';
      }).join('');

    root.innerHTML=
      '<div class="de47-panel"><h3>Position Runs & Availability</h3>'+
        '<div class="de47-sub">'+(slot&&next?between.length+' pick'+(between.length===1?'':'s')+' before your next pick #'+next:'Select your slot for exact upcoming-roster pressure')+'</div>'+
        posHtml+
      '</div>'+
      '<div class="de47-panel"><h3>Will They Make It Back?</h3>'+
        '<div class="de47-sub">Uses Sleeper market timing + the exact upcoming rosters + their drafted positions + recent position runs. Labels are directional, not fake probabilities.</div>'+
        availHtml+
      '</div>';
  }

  function signature(arr){return arr.map(p=>[p.pick_no,p.player_id,p.roster_id,p.draft_slot,p.picked_by].join(':')).join('|')}

  async function tick(){
    if(busy)return;busy=true;
    try{
      const wanted=savedDraftId()||extractId(inputValue());
      if(!wanted){
        if(draftId){draftId='';sourceId='';draft=null;league=null;traded=[];picks=[];lastSig=''}
        render();return;
      }
      if(!draftId||String(wanted)!==String(sourceId))await resolve(true);
      if(!draftId){render();return}
      await refreshMetaIfNeeded();
      const latest=await sleeper('https://api.sleeper.app/v1/draft/'+draftId+'/picks');
      if(Array.isArray(latest)){
        const sig=signature(latest);picks=latest;
        if(sig!==lastSig)lastSig=sig;
      }
      render();
    }catch(e){console.warn('Draft intelligence refresh failed',e);render()}
    finally{busy=false}
  }

  function start(){clearInterval(timer);timer=setInterval(tick,POLL_MS);tick()}
  function clear(restart=true){
    clearInterval(timer);timer=null;draftId='';sourceId='';draft=null;league=null;traded=[];picks=[];lastSig='';render();
    if(restart)setTimeout(start,800);
  }
  function wire(){
    const slot=document.getElementById('deDraftSlot');
    if(slot&&!slot.dataset.de47){slot.addEventListener('change',render);slot.dataset.de47='1'}
    const connect=document.getElementById('connectDraft');
    if(connect&&!connect.dataset.de47){connect.addEventListener('click',()=>setTimeout(()=>{draftId='';lastSig='';tick()},250));connect.dataset.de47='1'}
    const reset=document.getElementById('resetDraft');
    if(reset&&!reset.dataset.de47){reset.addEventListener('click',()=>setTimeout(()=>clear(true),0));reset.dataset.de47='1'}
    const stop=document.getElementById('stopDraft');
    if(stop&&!stop.dataset.de47){stop.addEventListener('click',()=>clear(false));stop.dataset.de47='1'}
  }

  ensureUi();wire();
  const ob=new MutationObserver(()=>{ensureUi();wire()});
  ob.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(start,1300);

  window.DraftEdgeDraftIntelligence={
    refresh:tick,
    positionRun,
    riskFor,
    nextUserPick,
    picksBeforeUser
  };
})();
