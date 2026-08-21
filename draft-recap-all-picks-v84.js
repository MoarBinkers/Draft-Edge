// v84 — Draft Recap shows every user pick in draft order, with value context for each pick.
(()=>{
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ps=()=>{try{return Array.isArray(players)?players:[]}catch(_){return []}};
  const signed=n=>Number(n)>0?'+'+Number(n):String(Number(n));

  function market(p){try{return typeof marketFor==='function'?marketFor(p):null}catch(_){return null}}
  function personal(name){
    try{if(typeof findPersonalByName==='function')return findPersonalByName(name)}catch(_){}
    return ps().find(p=>norm(p?.name)===norm(name))||null;
  }
  function draftId(){
    try{const x=currentList?.()?.draftPrefs?.draftId;if(x)return String(x)}catch(_){}
    const raw=$('draftId')?.value?.trim()||localStorage.getItem('de34_draft_input')||'';
    const m=String(raw).match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||String(raw).match(/\b\d{8,}\b/);
    return m?.[1]||'';
  }
  async function meta(){
    const id=draftId();if(!id)throw new Error('Connect a Sleeper draft first.');
    let d=null;try{d=await sleeper('https://api.sleeper.app/v1/draft/'+id)}catch(_){}
    if(d?.draft_id)return d;
    let l=null;try{l=await sleeper('https://api.sleeper.app/v1/league/'+id)}catch(_){}
    if(l?.draft_id){d=await sleeper('https://api.sleeper.app/v1/draft/'+l.draft_id);if(d?.draft_id)return d}
    throw new Error('Could not find that Sleeper draft.');
  }
  function pForPick(pk){
    const id=String(pk?.player_id||'');
    for(const p of ps()){
      const m=market(p);
      if(id&&String(m?.id||p?.sleeperId||p?.id||'')===id)return p;
    }
    const md=pk?.metadata||{};
    const name=[md.first_name,md.last_name].filter(Boolean).join(' ').trim();
    return personal(name);
  }
  function playerName(pk){
    return pForPick(pk)?.name||[pk?.metadata?.first_name,pk?.metadata?.last_name].filter(Boolean).join(' ').trim()||'Unknown player';
  }
  function valueLine(label,rank,value){
    if(!Number.isFinite(value)||!Number.isFinite(Number(rank)))return '<div class="small">'+label+' —</div>';
    const cls=value>0?'de65-good':value<0?'de65-bad':'';
    return '<div class="small">'+label+' #'+Number(rank)+' · <b class="'+cls+'">'+signed(value)+' picks</b></div>';
  }
  function allPickRow(x){
    const md=x.pk?.metadata||{};
    const pos=x.p?.position||md.position||'';
    const team=x.p?.team||md.team||'';
    const round=Number(x.pk?.round)||0;
    const detail=[round?'Round '+round:'','Pick #'+x.pick,pos,team].filter(Boolean).join(' · ');
    return '<span><b>'+esc(playerName(x.pk))+'</b><div class="small">'+esc(detail)+'</div></span>'+
      '<span style="text-align:right;white-space:nowrap">'+
        valueLine('Sleeper',x.m?.rank,x.market)+
        valueLine('Your rank',x.p?.overall,x.personal)+
      '</span>';
  }
  function section(title,rows,fn){
    return '<div class="de65-section"><h3>'+title+'</h3>'+(rows.length?rows.map(x=>'<div class="de65-row">'+fn(x)+'</div>').join(''):'<div class="small">Not enough data yet.</div>')+'</div>';
  }

  async function openAllPicks(){
    try{window.DraftEdgeRecap?.ensureButton?.()}catch(_){}
    const modal=$('deRecap65');
    const body=$('de65Body');
    if(!modal||!body)throw new Error('Draft Recap is not ready yet.');
    modal.classList.add('open');
    body.className='small';body.textContent='Building recap…';
    try{
      const d=await meta();
      const all=await sleeper('https://api.sleeper.app/v1/draft/'+d.draft_id+'/picks');
      const ownership=window.DraftEdgeDraftOwnership;
      if(!ownership?.ownPicks)throw new Error('Draft tracking is not ready yet. Reconnect the Sleeper draft and try again.');
      const slot=ownership.selectedSlot?.();
      if(!slot)throw new Error('Choose your draft slot first so Draft Edge knows which picks are yours.');
      const mine=ownership.ownPicks()||[];
      const own=Array.isArray(mine)?mine:[];
      const picks=Array.isArray(all)?all:[];
      if(!picks.length)throw new Error('No Sleeper draft picks are available yet.');

      const mineRows=own.map(pk=>{
        const p=pForPick(pk),m=p?market(p):null,pick=Number(pk.pick_no)||0;
        return {
          pk,p,m,pick,
          market:m?.rank!=null?pick-Number(m.rank):null,
          personal:p?.overall?pick-Number(p.overall):null
        };
      }).sort((a,b)=>(a.pick||999999)-(b.pick||999999));

      const tagged=k=>mineRows.filter(x=>(x.p?.tags||[]).includes(k)).length;
      body.className='';
      body.innerHTML=
        '<div class="de65-summary">'+
          '<div class="de65-box"><b>'+own.length+'</b><span>Your Picks</span></div>'+
          '<div class="de65-box"><b>'+tagged('blue')+'</b><span>Targets Landed</span></div>'+
          '<div class="de65-box"><b>'+tagged('green')+'</b><span>Safe Picks</span></div>'+
          '<div class="de65-box"><b>'+tagged('purple')+'</b><span>Sleepers Landed</span></div>'+
        '</div>'+
        (tagged('red')?'<div class="de65-section"><div class="de65-row"><span class="de65-bad"><b>⚠ '+tagged('red')+' Avoid-tagged pick'+(tagged('red')===1?'':'s')+'</b></span><span>Worth reviewing</span></div></div>':'')+
        section('Every Pick You Made',mineRows,allPickRow);
    }catch(e){
      body.className='small';body.textContent=e?.message||'Could not build the recap.';
    }
  }

  function install(){
    const api=window.DraftEdgeRecap;
    if(!api?.open)return false;
    if(api.open.__whAllPicks84)return true;
    const base=api.open;
    const wrapped=function(){return openAllPicks()};
    wrapped.__whAllPicks84=true;
    wrapped.__whBase=base;
    api.open=wrapped;
    return true;
  }

  if(!install()){
    let tries=0;
    const t=setInterval(()=>{tries++;if(install()||tries>50)clearInterval(t)},100);
  }
})();
