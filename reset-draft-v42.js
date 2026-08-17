// v42 — reset live draft state without touching rankings, tiers, tags, notes, or ADP history.
(()=>{
  function clearDraftedState(){
    if(!Array.isArray(players))return 0;
    let cleared=0;
    players.forEach(p=>{
      if(p.drafted||p.draftedAt||p.draftedSource||p.draftedDraftId||p.draftedPickNo){cleared++}
      p.drafted=false;
      p.draftedAt=null;
      p.draftedSource=null;
      p.draftedDraftId=null;
      p.draftedPickNo=null;
    });
    return cleared;
  }

  function resetDraft(){
    if(!confirm('Reset this draft? This clears drafted-player status and disconnects Sleeper. Your rankings, tiers, tags, and notes will stay the same.'))return;

    // Disconnect first so the next Sleeper poll cannot immediately re-mark players as drafted.
    try{document.getElementById('stopDraft')?.click()}catch(_){}

    const cleared=clearDraftedState();
    try{localStorage.removeItem('de34_draft_input')}catch(_){}
    const input=document.getElementById('draftId');if(input)input.value='';
    const slot=document.getElementById('deDraftSlot');if(slot)slot.value='';

    try{
      const list=typeof currentList==='function'?currentList():null;
      if(list&&Object.prototype.hasOwnProperty.call(list,'draftPrefs'))list.draftPrefs=null;
    }catch(_){}

    try{save()}catch(e){console.warn('Could not save reset draft state',e)}
    try{renderTagDrawer()}catch(_){}
    try{renderDraft()}catch(_){}
    try{if(document.getElementById('draftedModal')?.classList.contains('open'))renderDraftedModal()}catch(_){}

    const state=document.getElementById('draftState');
    if(state)state.textContent='Draft reset · '+cleared+' drafted player'+(cleared===1?'':'s')+' cleared';
  }
  window.resetDraftEdgeDraft=resetDraft;

  function install(){
    const stop=document.getElementById('stopDraft');
    const controls=document.querySelector('#page-draft .controls');
    if(!controls)return false;
    if(document.getElementById('resetDraft'))return true;
    const btn=document.createElement('button');
    btn.type='button';btn.id='resetDraft';btn.className='btn';btn.textContent='Reset Draft';
    btn.style.cssText='border-color:#6b3440;color:#fb9aaa;background:#25161b';
    btn.onclick=resetDraft;
    if(stop)stop.insertAdjacentElement('afterend',btn);else controls.appendChild(btn);
    return true;
  }

  if(!install()){
    const ob=new MutationObserver(()=>{if(install())ob.disconnect()});
    ob.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
