// v68 — expose the connected draft's current overall pick from Draft Intelligence's live state.
(()=>{
  function install(){
    const intel=window.DraftEdgeDraftIntelligence;if(!intel)return false;
    if(typeof intel.currentPick==='function')return true;
    intel.currentPick=()=>{
      try{
        const target=Number(intel.nextUserPick?.())||0;
        if(intel.isOnClock?.())return target>1?target-1:1;
        const between=intel.picksBeforeUser?.()||[];
        const first=Number(between?.[0]?.pickNo)||0;if(first>0)return first;
        if(target>0)return target;
      }catch(_){}
      return null;
    };
    return true;
  }
  if(!install()){let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>20)clearInterval(t)},100)}
})();
