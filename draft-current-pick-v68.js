// v68.2 — expose the exact connected draft current pick for round-band alignment.
(()=>{
  function exactCurrentPickFromDraftRoom(){
    try{
      const value=document.querySelector('#deDraftRoomSummary .de-draft-card:first-child .v')?.textContent||'';
      const n=Number(String(value).replace(/[^0-9]/g,''));
      return Number.isFinite(n)&&n>0?n:null;
    }catch(_){return null}
  }

  function install(){
    const intel=window.DraftEdgeDraftIntelligence;if(!intel)return false;
    intel.currentPick=()=>{
      const exact=exactCurrentPickFromDraftRoom();
      if(exact)return exact;
      try{
        // Away from the user's turn, the first pick before their next turn is the live current pick.
        const between=intel.picksBeforeUser?.()||[];
        const first=Number(between?.[0]?.pickNo)||0;
        if(first>0)return first;
        // If the user is on the clock, do not estimate from their following turn; that can cross rounds.
        if(!intel.isOnClock?.()){
          const target=Number(intel.nextUserPick?.())||0;
          if(target>0)return target;
        }
      }catch(_){}
      return null;
    };
    return true;
  }
  if(!install()){let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>30)clearInterval(t)},100)}
})();
