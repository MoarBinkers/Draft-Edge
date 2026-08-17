// v46 — compatibility UI only. v45 is the single owner of Sleeper 1-second pick sync and "Your Picks" rendering.
(()=>{
  function ensureUi(){
    const state=document.getElementById('draftState');
    if(state&&!document.getElementById('deFastSync43')){
      const s=document.createElement('div');
      s.id='deFastSync43';
      s.className='small';
      s.style.cssText='margin:-14px 0 14px;color:#91a0ad';
      s.textContent='Live sync ready';
      state.insertAdjacentElement('afterend',s);
    }

    if(!document.getElementById('deMyPicks43')){
      const ctx=document.getElementById('deDraftContext');
      const list=document.getElementById('draftList');
      if(ctx||list){
        const root=document.createElement('div');
        root.id='deMyPicks43';
        root.className='de-draft-panel';
        root.style.margin='0 0 14px';
        root.innerHTML='<h3>Your Picks</h3><div class="small">Connect a Sleeper draft and choose your draft slot to track your picks.</div>';
        if(ctx)ctx.insertAdjacentElement('afterend',root);
        else list.parentNode.insertBefore(root,list);
      }
    }
  }

  function install(){
    ensureUi();
    return !!document.getElementById('draftList');
  }

  if(!install()){
    const ob=new MutationObserver(()=>{if(install())ob.disconnect()});
    ob.observe(document.documentElement,{childList:true,subtree:true});
  }

  // Kept only so v45 can safely call the legacy stop hook. No polling or rendering occurs here.
  window.DraftEdgeFastDraftSync={
    start(){},
    stop(){},
    tick(){}
  };
})();
