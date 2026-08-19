// v77.0 — safely upgrade identity-only player matches to live Sleeper ADP by player ID.
(()=>{
  let patched=false;
  function install(){
    try{
      if(patched)return true;
      if(typeof marketFor!=='function')return false;
      const base=marketFor;
      const wrapped=function(player){
        let current=null;
        try{current=base(player)}catch(_){}
        if(current?.rank!=null)return current;
        const id=String(player?.sleeperId||player?.id||current?.id||'');
        if(!id)return current;
        try{
          const source=(typeof market!=='undefined'&&market&&typeof market==='object')?market:{};
          for(const entry of Object.values(source)){
            if(!entry||typeof entry!=='object'||entry.rank==null||!entry.id)continue;
            if(String(entry.id)===id)return entry;
          }
        }catch(_){}
        return current;
      };
      wrapped.__workhorseAdpIdLink=true;
      marketFor=wrapped;
      try{window.marketFor=wrapped}catch(_){}
      patched=true;
      return true;
    }catch(e){
      console.warn('Workhorse ADP ID linker could not install',e);
      return false;
    }
  }
  function refresh(){
    if(install()){
      try{if(typeof renderEverything==='function')renderEverything()}catch(e){console.warn('Workhorse ADP ID linker render skipped',e)}
    }
  }
  refresh();
  [300,900,1800,3500,6500].forEach(ms=>setTimeout(refresh,ms));
  window.WorkhorseAdpIdLink={refresh};
})();
