// v43 — persistent 1-second Sleeper pick sync + clearly show the user's drafted players.
(()=>{
  const FAST_MS=1000;
  const INPUT_KEY='de34_draft_input';
  let fastTimer=null;
  let fastDraftId='';
  let fastDraftMeta=null;
  let fastPicks=[];
  let pickSignature='';
  let inFlight=false;
  let resolving=false;
  let lastResolveAttempt=0;
  let failCount=0;

  const esc43=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function extractId(raw){
    const s=String(raw||'').trim();
    const m=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i);
    return m?.[1]||(s.match(/\b\d{8,}\b/)||[])[0]||'';
  }

  function draftInput(){
    return document.getElementById('draftId')?.value?.trim()||localStorage.getItem(INPUT_KEY)||'';
  }

  function currentSavedDraftId(){
    try{
      const list=typeof currentList==='function'?currentList():null;
      return String(list?.draftPrefs?.draftId||'');
    }catch(_){return ''}
  }

  async function resolveFastDraft(force=false){
    if(resolving)return !!fastDraftId;
    if(fastDraftId&&!force)return true;
    if(!force&&Date.now()-lastResolveAttempt<2500)return false;
    lastResolveAttempt=Date.now();
    resolving=true;
    try{
      const saved=currentSavedDraftId();
      const raw=draftInput();
      const id=saved||extractId(raw);
      if(!id)return false;

      try{
        const d=await sleeper('https://api.sleeper.app/v1/draft/'+id);
        if(d?.draft_id){fastDraftId=String(d.draft_id);fastDraftMeta=d;return true}
      }catch(_){}

      try{
        const league=await sleeper('https://api.sleeper.app/v1/league/'+id);
        if(league?.draft_id){
          const d=await sleeper('https://api.sleeper.app/v1/draft/'+league.draft_id);
          if(d?.draft_id){fastDraftId=String(d.draft_id);fastDraftMeta=d;return true}
        }
      }catch(_){}

      try{
        const drafts=await sleeper('https://api.sleeper.app/v1/league/'+id+'/drafts');
        const d=Array.isArray(drafts)?(drafts.find(x=>x.status==='drafting')||drafts.find(x=>x.status==='pre_draft')||drafts[0]):null;
        if(d?.draft_id){fastDraftId=String(d.draft_id);fastDraftMeta=d;return true}
      }catch(_){}
      return false;
    }finally{resolving=false}
  }

  function ensureUi(){
    const state=document.getElementById('draftState');
    if(state&&!document.getElementById('deFastSync43')){
      const s=document.createElement('div');
      s.id='deFastSync43';s.className='small';s.style.cssText='margin:-14px 0 14px;color:#91a0ad';
      s.textContent='Live sync ready · checks Sleeper picks about every 1 second';
      state.insertAdjacentElement('afterend',s);
    }
    const ctx=document.getElementById('deDraftContext');
    if(ctx&&!document.getElementById('deMyPicks43')){
      const root=document.createElement('div');root.id='deMyPicks43';root.className='de-draft-panel';root.style.margin='0 0 14px';
      root.innerHTML='<h3>Your Picks</h3><div class="small">Choose your draft slot to track who you drafted.</div>';
      ctx.insertAdjacentElement('afterend',root);
    }
  }

  function setFastStatus(text,bad=false){
    ensureUi();const el=document.getElementById('deFastSync43');if(!el)return;
    el.textContent=text;el.style.color=bad?'#f0a2ad':'#91a0ad';
  }

  function selectedSlot(){
    const val=Number(document.getElementById('deDraftSlot')?.value||0);
    if(val>0)return val;
    if(fastDraftId){const saved=Number(localStorage.getItem('de41_draft_slot:'+fastDraftId)||0);if(saved>0)return saved}
    return null;
  }

  function rosterIdForSlot(slot){
    if(!slot)return null;
    const map=fastDraftMeta?.slot_to_roster_id||{};
    const v=map[String(slot)]??map[slot];
    return v==null?null:String(v);
  }

  function ownPicks(){
    const slot=selectedSlot();if(!slot)return [];
    const roster=rosterIdForSlot(slot);
    return fastPicks.filter(p=>roster?String(p.roster_id||'')===roster:Number(p.draft_slot)===slot)
      .sort((a,b)=>(Number(a.pick_no)||0)-(Number(b.pick_no)||0));
  }

  function pickName(p){
    const m=p?.metadata||{};
    const name=[m.first_name,m.last_name].filter(Boolean).join(' ').trim();
    if(name)return name;
    const id=String(p?.player_id||'');
    try{
      const mine=players.find(x=>String(marketFor(x)?.id||x.sleeperId||x.id||'')===id);
      if(mine?.name)return mine.name;
    }catch(_){}
    return 'Player '+id;
  }

  function renderMyPicks(){
    ensureUi();const root=document.getElementById('deMyPicks43');if(!root)return;
    const slot=selectedSlot();
    if(!fastDraftId){root.innerHTML='<h3>Your Picks</h3><div class="small">Connect a Sleeper draft to track your picks.</div>';return}
    if(!slot){root.innerHTML='<h3>Your Picks</h3><div class="small">Choose your draft slot above so Draft Edge knows which picks are yours.</div>';return}
    const picks=ownPicks();
    root.innerHTML='<h3>Your Picks · Slot '+slot+'</h3>'+(picks.length?picks.map(p=>{
      const meta=p.metadata||{};
      return '<div class="de-pick-row"><span><b>#'+(Number(p.pick_no)||'—')+' · '+esc43(pickName(p))+'</b></span><span>'+esc43(String(meta.position||''))+(meta.team?' · '+esc43(meta.team):'')+'</span></div>';
    }).join(''):'<div class="small">You have not drafted anyone yet.</div>');
  }

  function reconcileFast(picks){
    if(!Array.isArray(players)||!fastDraftId)return false;
    const byId=new Map(picks.map(p=>[String(p.player_id),p]));
    let changed=false;
    players.forEach(p=>{
      let id='';try{id=String(marketFor(p)?.id||p.sleeperId||p.id||'')}catch(_){}
      if(!id)return;
      const pick=byId.get(id);
      if(pick){
        if(!p.drafted||p.draftedSource!=='sleeper'||p.draftedDraftId!==fastDraftId||Number(p.draftedPickNo)!==Number(pick.pick_no))changed=true;
        p.drafted=true;p.draftedSource='sleeper';p.draftedDraftId=fastDraftId;p.draftedPickNo=Number(pick.pick_no)||null;p.draftedAt=p.draftedAt||Date.now();
      }else if(p.draftedSource==='sleeper'&&p.draftedDraftId===fastDraftId){
        p.drafted=false;p.draftedSource=null;p.draftedDraftId=null;p.draftedPickNo=null;p.draftedAt=null;changed=true;
      }
    });
    if(changed){try{save()}catch(_){};try{renderTagDrawer()}catch(_){};try{if(document.getElementById('draftedModal')?.classList.contains('open'))renderDraftedModal()}catch(_){}}
    return changed;
  }

  function sig(picks){return picks.map(p=>[p.pick_no,p.player_id,p.roster_id,p.draft_slot].join(':')).join('|')}

  async function fastTick(){
    ensureUi();
    if(inFlight)return;
    if(!fastDraftId){
      const ok=await resolveFastDraft(false);if(!ok){setFastStatus('Live sync waiting for a connected Sleeper draft');return}
    }
    inFlight=true;
    try{
      const picks=await sleeper('https://api.sleeper.app/v1/draft/'+fastDraftId+'/picks');
      if(!Array.isArray(picks))throw new Error('Sleeper returned invalid draft picks.');
      failCount=0;
      const nextSig=sig(picks),changed=nextSig!==pickSignature;
      fastPicks=picks;pickSignature=nextSig;
      const playerChanged=reconcileFast(picks);
      renderMyPicks();
      setFastStatus('● Live sync · checking Sleeper picks about every 1 second');
      if(changed){
        try{if(typeof window.pollDraft==='function')await window.pollDraft()}catch(e){console.warn('Full draft refresh after pick change failed',e)}
        try{renderDraft()}catch(_){}
      }else if(playerChanged){try{renderDraft()}catch(_){}}
    }catch(e){
      failCount++;
      setFastStatus('Live sync reconnecting automatically…',true);
      if(failCount>=4){fastDraftId='';fastDraftMeta=null;pickSignature='';}
    }finally{inFlight=false}
  }

  function startFast(){
    clearInterval(fastTimer);
    fastTimer=setInterval(fastTick,FAST_MS);
    fastTick();
  }
  function stopFast(){clearInterval(fastTimer);fastTimer=null;inFlight=false;setFastStatus('Live sync stopped');}

  function install(){
    ensureUi();
    const connect=document.getElementById('connectDraft');
    const stop=document.getElementById('stopDraft');
    if(!connect)return false;
    if(!connect.dataset.de43Wrapped){
      const base=connect.onclick;
      connect.onclick=async function(e){
        fastDraftId='';fastDraftMeta=null;fastPicks=[];pickSignature='';failCount=0;
        try{if(base)await base.call(this,e)}finally{
          await resolveFastDraft(true).catch(()=>false);
          startFast();
        }
      };
      connect.dataset.de43Wrapped='1';
    }
    if(stop&&!stop.dataset.de43Wrapped){const base=stop.onclick;stop.onclick=function(e){stopFast();fastDraftId='';fastDraftMeta=null;fastPicks=[];pickSignature='';renderMyPicks();if(base)return base.call(this,e)};stop.dataset.de43Wrapped='1'}
    document.getElementById('deDraftSlot')?.addEventListener('change',()=>renderMyPicks());
    return true;
  }

  if(!install()){
    const ob=new MutationObserver(()=>{if(install())ob.disconnect()});
    ob.observe(document.documentElement,{childList:true,subtree:true});
  }

  // Resume a previously connected draft automatically; no repeated Connect presses needed.
  setTimeout(async()=>{
    ensureUi();
    const saved=currentSavedDraftId(),raw=draftInput(),connect=document.getElementById('connectDraft');
    if(saved&&raw&&connect){connect.click();return}
    if(saved){fastDraftId=saved;await resolveFastDraft(true).catch(()=>false);startFast();}
  },900);

  window.DraftEdgeFastDraftSync={start:startFast,stop:stopFast,tick:fastTick};
})();
