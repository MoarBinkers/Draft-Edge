// v44 — once Sleeper is connected, Sleeper is the only source of truth for drafted players.
(()=>{
  const MODE_KEY='de44_sleeper_auto_draft';
  let cleaning=false;

  function listHasDraft(){
    try{
      const list=typeof currentList==='function'?currentList():null;
      return !!list?.draftPrefs?.draftId;
    }catch(_){return false}
  }

  function liveSeen(){
    const state=document.getElementById('draftState')?.textContent||'';
    const fast=document.getElementById('deFastSync43')?.textContent||'';
    return /●\s*LIVE/i.test(state)||/●\s*Live sync/i.test(fast);
  }

  function autoMode(){
    return localStorage.getItem(MODE_KEY)==='1'||listHasDraft();
  }

  function installCss(){
    if(document.getElementById('de44AutoDraftCss'))return;
    const s=document.createElement('style');
    s.id='de44AutoDraftCss';
    s.textContent=`
      body.de-sleeper-auto-draft #page-draft .draft-btn{display:none!important}
      #deAutoDraftNote44{margin:-8px 0 12px;color:#91a0ad}
    `;
    document.head.appendChild(s);
  }

  function clearManualDrafts(){
    if(cleaning||!Array.isArray(players))return;
    cleaning=true;
    try{
      let changed=false;
      players.forEach(p=>{
        if(p?.draftedSource==='manual'){
          p.drafted=false;
          p.draftedAt=null;
          p.draftedSource=null;
          p.draftedDraftId=null;
          p.draftedPickNo=null;
          changed=true;
        }
      });
      if(changed){
        try{save()}catch(e){console.warn('Could not clear old manual draft flags',e)}
        try{renderTagDrawer()}catch(_){}
        try{renderDraft()}catch(_){}
        try{if(document.getElementById('draftedModal')?.classList.contains('open'))renderDraftedModal()}catch(_){}
      }
    }finally{cleaning=false}
  }

  function paintMode(){
    installCss();
    const on=autoMode();
    document.body.classList.toggle('de-sleeper-auto-draft',on);
    const fast=document.getElementById('deFastSync43');
    if(fast){
      let note=document.getElementById('deAutoDraftNote44');
      if(on&&!note){
        note=document.createElement('div');
        note.id='deAutoDraftNote44';
        note.className='small';
        note.textContent='Sleeper controls drafted players automatically while this draft is connected.';
        fast.insertAdjacentElement('afterend',note);
      }else if(!on&&note){
        note.remove();
      }
    }
  }

  function activate(){
    if(localStorage.getItem(MODE_KEY)!=='1')localStorage.setItem(MODE_KEY,'1');
    clearManualDrafts();
    paintMode();
  }

  function deactivate(){
    localStorage.removeItem(MODE_KEY);
    paintMode();
    try{renderDraft()}catch(_){}
  }

  const baseToggle=window.toggleDraft;
  if(typeof baseToggle==='function'){
    const wrapped=function(i){
      if(autoMode())return;
      return baseToggle(i);
    };
    window.toggleDraft=wrapped;
    try{toggleDraft=wrapped}catch(_){}
  }

  function wireButtons(){
    const reset=document.getElementById('resetDraft');
    if(reset&&!reset.dataset.de44Wrapped){
      reset.addEventListener('click',()=>setTimeout(deactivate,0));
      reset.dataset.de44Wrapped='1';
    }
  }

  function check(){
    if(liveSeen())activate();
    else paintMode();
    wireButtons();
  }

  installCss();
  if(autoMode())clearManualDrafts();
  paintMode();
  wireButtons();

  const ob=new MutationObserver(check);
  ob.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  setInterval(check,1000);

  window.DraftEdgeSleeperAutoDraft={
    isActive:autoMode,
    activate,
    deactivate
  };
})();
