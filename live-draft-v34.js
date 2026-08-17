// v34 — easier Sleeper live-draft connection via full links, Draft IDs, or League IDs.
(()=>{
  const DRAFT_INPUT_KEY='de34_draft_input';
  let resolvedDraftId='';
  let resolvedDraftMeta=null;
  const htmlEsc=v=>typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function extractNumericId(raw){
    const s=String(raw||'').trim();
    const draftMatch=s.match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||s.match(/draft[^0-9]*(\d{8,})/i);
    return draftMatch?.[1]||(s.match(/\b\d{8,}\b/)||[])[0]||'';
  }
  async function resolveDraftInput(raw){
    const id=extractNumericId(raw);if(!id)throw new Error('Paste a Sleeper draft link, Draft ID, or League ID.');
    try{
      const draft=await sleeper('https://api.sleeper.app/v1/draft/'+id);
      if(draft&&draft.draft_id)return {id:String(draft.draft_id),draft,source:'draft'};
    }catch(_){}
    try{
      const league=await sleeper('https://api.sleeper.app/v1/league/'+id);
      if(league?.draft_id){
        const draft=await sleeper('https://api.sleeper.app/v1/draft/'+league.draft_id);
        return {id:String(league.draft_id),draft,source:'league'};
      }
    }catch(_){}
    try{
      const drafts=await sleeper('https://api.sleeper.app/v1/league/'+id+'/drafts');
      if(Array.isArray(drafts)&&drafts.length){
        const draft=drafts.find(x=>x.status==='drafting')||drafts.find(x=>x.status==='pre_draft')||drafts[0];
        return {id:String(draft.draft_id),draft,source:'league'};
      }
    }catch(_){}
    throw new Error('Could not find a Sleeper draft from that link or ID.');
  }
  function draftLabel(draft){
    const name=draft?.metadata?.name||draft?.metadata?.league_name||'Sleeper Draft';
    const status=String(draft?.status||'connected').replace('_',' ');
    return {name,status:status.charAt(0).toUpperCase()+status.slice(1)};
  }
  pollDraft=async function(){
    const input=document.getElementById('draftId');
    if(!resolvedDraftId){
      const raw=input?.value.trim();if(!raw)return;
      const resolved=await resolveDraftInput(raw);resolvedDraftId=resolved.id;resolvedDraftMeta=resolved.draft;
    }
    try{
      const picks=await sleeper('https://api.sleeper.app/v1/draft/'+resolvedDraftId+'/picks'),ids=new Set((Array.isArray(picks)?picks:[]).map(x=>String(x.player_id)));
      players.forEach(p=>{const mid=marketFor(p)?.id;if(mid&&ids.has(String(mid))){if(!p.drafted)p.draftedAt=Date.now();p.drafted=true}});
      save();renderTagDrawer();renderDraft();
      const label=draftLabel(resolvedDraftMeta),checked=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
      document.getElementById('draftState').innerHTML='<span style="color:#4ade80;font-weight:900">● LIVE</span> · '+htmlEsc(label.name)+' · '+htmlEsc(label.status)+' · '+ids.size+' picks · checked '+checked;
    }catch(e){document.getElementById('draftState').textContent='Connection error: '+e.message}
  };
  async function connectDraft34(){
    const input=document.getElementById('draftId'),state=document.getElementById('draftState'),btn=document.getElementById('connectDraft');
    const raw=input?.value.trim();if(!raw){state.textContent='Paste a Sleeper draft link, Draft ID, or League ID first.';return}
    clearInterval(draftTimer);resolvedDraftId='';resolvedDraftMeta=null;state.textContent='Connecting to Sleeper…';if(btn)btn.disabled=true;
    try{
      const resolved=await resolveDraftInput(raw);resolvedDraftId=resolved.id;resolvedDraftMeta=resolved.draft;localStorage.setItem(DRAFT_INPUT_KEY,raw);
      await pollDraft();draftTimer=setInterval(pollDraft,15000);
    }catch(e){state.textContent='Connection error: '+e.message}
    finally{if(btn)btn.disabled=false}
  }
  const draftInput=document.getElementById('draftId'),connectBtn=document.getElementById('connectDraft'),stopBtn=document.getElementById('stopDraft'),state=document.getElementById('draftState');
  if(draftInput){draftInput.placeholder='Paste Sleeper draft link, Draft ID, or League ID';draftInput.style.maxWidth='390px';const saved=localStorage.getItem(DRAFT_INPUT_KEY);if(saved&&!draftInput.value)draftInput.value=saved;draftInput.addEventListener('keydown',e=>{if(e.key==='Enter')connectDraft34()})}
  if(connectBtn)connectBtn.onclick=connectDraft34;
  if(stopBtn)stopBtn.onclick=()=>{clearInterval(draftTimer);resolvedDraftId='';resolvedDraftMeta=null;if(state)state.textContent='Stopped'};
  if(state&&!document.getElementById('draftHelp34')){
    const help=document.createElement('div');help.id='draftHelp34';help.className='small';help.style.cssText='margin:-18px 0 8px';help.innerHTML='<b>Easiest:</b> paste the full Sleeper draft link. Draft Edge also accepts a Draft ID or League ID, and works with real drafts or mock Draftboards.';state.parentNode.insertBefore(help,state);state.style.margin='0 0 20px';
  }
})();
