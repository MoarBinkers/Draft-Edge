// v70 — self-contained inline chance-back estimates for the Live Draft list.
(()=>{
  const $=id=>document.getElementById(id);
  const INPUT_KEY='de34_draft_input';
  let sourceId='',draft=null,league=null,traded=[],picks=[],busy=false,timer=null,metaAt=0,decorateTimer=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function ps(){try{return Array.isArray(window.players)?window.players:[]}catch(_){return []}}
  function market(p){try{return typeof window.marketFor==='function'?window.marketFor(p):null}catch(_){return null}}
  function sleeperFetch(url){if(typeof window.sleeper==='function')return window.sleeper(url);return fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Sleeper HTTP '+r.status);return r.json()})}
  function savedSource(){try{return String(window.currentList?.()?.draftPrefs?.draftId||'')}catch(_){return ''}}
  function rawSource(){return savedSource()||$('draftId')?.value?.trim()||localStorage.getItem(INPUT_KEY)||''}
  function extractId(raw){const s=String(raw||'').trim();const m=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i)||s.match(/\b\d{8,}\b/);return m?.[1]||m?.[0]||''}

  async function resolve(force=false){
    const wanted=extractId(rawSource());
    if(!wanted){sourceId='';draft=null;league=null;traded=[];picks=[];return false}
    if(!force&&draft?.draft_id&&sourceId===wanted&&Date.now()-metaAt<60000)return true;
    let d=null,l=null;
    try{const x=await sleeperFetch('https://api.sleeper.app/v1/draft/'+wanted);if(x?.draft_id)d=x}catch(_){}
    if(!d){
      try{
        l=await sleeperFetch('https://api.sleeper.app/v1/league/'+wanted);
        if(l?.draft_id)d=await sleeperFetch('https://api.sleeper.app/v1/draft/'+l.draft_id);
        if(!d){const ds=await sleeperFetch('https://api.sleeper.app/v1/league/'+wanted+'/drafts');d=Array.isArray(ds)?(ds.find(x=>x.status==='drafting')||ds.find(x=>x.status==='pre_draft')||ds[0]):null}
      }catch(_){}
    }
    if(!d?.draft_id){draft=null;return false}
    sourceId=wanted;draft=d;
    if(!l&&d.league_id)try{l=await sleeperFetch('https://api.sleeper.app/v1/league/'+d.league_id)}catch(_){}
    league=l||null;traded=[];
    if(d.league_id)try{const t=await sleeperFetch('https://api.sleeper.app/v1/league/'+d.league_id+'/traded_picks');traded=Array.isArray(t)?t:[]}catch(_){}
    metaAt=Date.now();return true;
  }

  function teams(){return Math.max(1,Number(draft?.settings?.teams)||Number(league?.total_rosters)||12)}
  function rounds(){return Math.max(1,Number(draft?.settings?.rounds)||18)}
  function roundForPick(n){return Math.floor((Number(n)-1)/teams())+1}
  function slotForPick(n){const t=teams(),r=roundForPick(n),within=((Number(n)-1)%t)+1;return draft?.type==='snake'&&r%2===0?t-within+1:within}
  function rosterForSlot(slot){const map=draft?.slot_to_roster_id||{},v=map[String(slot)]??map[slot];return v==null?'':String(v)}
  function tradedOwner(round,original){let owner=String(original||'');for(const t of traded){const seasonOk=!t.season||!draft?.season||String(t.season)===String(draft.season);if(seasonOk&&Number(t.round)===Number(round)&&String(t.roster_id)===String(original))owner=String(t.owner_id)}return owner}
  function ownerForPick(n){const slot=slotForPick(n),original=rosterForSlot(slot);return original?tradedOwner(roundForPick(n),original):''}
  function selectedSlot(){
    try{const n=Number(window.DraftEdgeDraftOwnership?.selectedSlot?.());if(n>0)return n}catch(_){}
    const ui=Number($('deDraftSlot')?.value||0);if(ui>0)return ui;
    try{const n=Number(window.currentList?.()?.draftPrefs?.slot||0);if(n>0)return n}catch(_){}
    if(draft?.draft_id){const n=Number(localStorage.getItem('de41_draft_slot:'+draft.draft_id)||0);if(n>0)return n}
    return null;
  }
  function currentPick(){return draft?.draft_id?(picks||[]).reduce((m,p)=>Math.max(m,Number(p?.pick_no)||0),0)+1:null}
  function myPickNumbers(){
    const slot=selectedSlot(),total=teams()*rounds();if(!slot||!total)return [];
    const roster=rosterForSlot(slot),out=[];
    for(let n=1;n<=total;n++){
      if(roster){if(ownerForPick(n)===roster)out.push(n)}
      else if(slotForPick(n)===slot)out.push(n);
    }
    return out;
  }
  function targetPick(){
    const cur=currentPick();if(!cur)return null;
    const mine=myPickNumbers();if(!mine.length)return null;
    const onClock=mine.includes(cur);
    return mine.find(n=>onClock?n>cur:n>=cur)||null;
  }

  function chance(p){
    const cur=currentPick(),target=targetPick(),m=market(p),adp=Number(m?.adp)||Number(m?.rank)||0;
    if(!cur||!target||!adp)return null;
    if(adp<=cur-8)return 5;
    const spread=clamp(5+target*.055,5.5,13);
    const z=(adp-target)/spread;
    let pct=100/(1+Math.exp(-z));
    if(adp<=cur)pct=Math.min(pct,15);
    pct=clamp(pct,5,95);
    return Math.round(pct/5)*5;
  }

  function playerForRow(row){
    const idx=Number(row.dataset.index);if(Number.isInteger(idx)&&ps()[idx])return ps()[idx];
    const name=row.querySelector('.name')?.textContent?.trim().toLowerCase();if(!name)return null;
    return ps().find(p=>String(p?.name||'').trim().toLowerCase()===name)||null;
  }
  function css(){
    if($('deProb70Css'))return;
    const s=document.createElement('style');s.id='deProb70Css';s.textContent=`
      #page-draft #deDraftIntel48>.de48-panel:nth-child(2){display:none!important}
      #deProb70Status{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;padding:9px 11px;border:1px solid #2b3d4b;border-radius:11px;background:#0f1820;color:#8fa0ad;font-size:9px}
      #deProb70Status b{color:#c5d3dd;font-size:10px}.de70-state{color:#78bfe9;font-weight:900}
      .de70-chance{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:3px 6px;border-radius:6px;border:1px solid #3b4c58;background:#111a22;font-size:8px;font-weight:1000;vertical-align:middle;white-space:nowrap}
      .de70-chance.good{color:#7ce2a0;border-color:#346b4b;background:#102018}.de70-chance.mid{color:#f2c566;border-color:#7b5f31;background:#241d11}.de70-chance.bad{color:#ff9eaa;border-color:#74434a;background:#28171a}.de70-chance.unknown{color:#9ba8b2}
    `;document.head.appendChild(s)
  }
  function ensureStatus(){
    css();let el=$('deProb70Status');if(el)return el;
    const list=$('draftList');if(!list)return null;
    el=document.createElement('div');el.id='deProb70Status';list.parentNode.insertBefore(el,list);return el;
  }
  function tone(pct){return pct>=70?'good':pct>=45?'mid':'bad'}
  function decorate(){
    const list=$('draftList'),status=ensureStatus();if(!list||!status)return;
    const slot=selectedSlot(),cur=currentPick(),target=targetPick();
    if(!draft?.draft_id){status.innerHTML='<b>Chance to make it back</b><span>Connect a Sleeper draft to turn this on.</span>'}
    else if(!slot){status.innerHTML='<b>Chance to make it back</b><span>Select your draft slot to calculate your next pick.</span>'}
    else if(!target){status.innerHTML='<b>Chance to make it back</b><span>No future pick found for this slot.</span>'}
    else status.innerHTML='<b>Chance to make it back</b><span class="de70-state">Current #'+cur+' → your next pick #'+target+'</span>';

    list.querySelectorAll(':scope > .player').forEach(row=>{
      row.querySelectorAll('.de70-chance').forEach(x=>x.remove());
      const p=playerForRow(row);if(!p)return;
      const pct=chance(p),host=row.querySelector('.draft-insight-line')||row.querySelector('.meta')||row.querySelector('.person');if(!host)return;
      const badge=document.createElement('span');badge.className='de70-chance '+(pct==null?'unknown':tone(pct));
      badge.textContent=pct==null?'— chance back':pct+'% chance back';
      if(target)badge.title='Estimated chance '+p.name+' is still available at your next pick (#'+target+'). Based on Sleeper market rank and the connected draft position.';
      host.appendChild(badge);
    });
  }
  function scheduleDecorate(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,30)}

  async function tick(force=false){
    if(busy)return;busy=true;
    try{
      if(!(await resolve(force))){picks=[];decorate();return}
      const latest=await sleeperFetch('https://api.sleeper.app/v1/draft/'+draft.draft_id+'/picks');if(Array.isArray(latest))picks=latest;
      decorate();
      try{window.DraftEdgeRoundBands?.refresh?.()}catch(_){}
    }catch(e){console.warn('Draft probability v70 refresh failed',e);decorate()}
    finally{busy=false}
  }
  function start(){clearInterval(timer);tick(true);timer=setInterval(()=>tick(false),2500)}

  css();setTimeout(start,500);
  const page=$('page-draft')||document.body;const ob=new MutationObserver(()=>scheduleDecorate());ob.observe(page,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('#connectDraft'))setTimeout(()=>tick(true),350)});
  document.addEventListener('change',e=>{if(e.target?.id==='deDraftSlot')setTimeout(()=>{decorate();try{window.DraftEdgeRoundBands?.refresh?.()}catch(_){}},50)});
  window.DraftEdgeDraftProbability={refresh:()=>tick(true),chanceFor:chance,currentPick,targetPick};
})();