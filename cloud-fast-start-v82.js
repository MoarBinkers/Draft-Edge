// v82.0 — restore the signed-in user's last synced rankings immediately, then refresh cloud state in the background.
(()=>{
  const PREFIX='de82_cloud_rankings_';
  const LEGACY_KEY='de41_cloud_cache';
  let installed=false,saveWrapped=false,persistWrapped=false,saveTimer=null;

  const userId=()=>{try{return currentUser?.id?String(currentUser.id):''}catch(_){return ''}};
  const scopedKey=()=>{const id=userId();return id?PREFIX+id:''};
  const listMap=()=>{try{return rankingLists&&typeof rankingLists==='object'?rankingLists:{}}catch(_){return {}}};

  function scheduleSave(delay=120){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveSnapshot,delay);
  }

  function saveSnapshot(){
    try{
      const id=userId(),key=scopedKey();
      if(!id||!key)return false;
      const lists=listMap();
      const ids=Object.keys(lists);
      if(!ids.length)return false;
      const active=(activeListId&&lists[activeListId])?String(activeListId):ids[0];
      localStorage.setItem(key,JSON.stringify({userId:id,activeListId:active,rankingLists:lists,savedAt:Date.now()}));
      return true;
    }catch(e){
      console.warn('Workhorse fast ranking cache save skipped',e);
      return false;
    }
  }

  function applySnapshot(cache){
    try{
      const id=userId();
      if(!id||!cache||cache.userId!==id||!cache.rankingLists||typeof cache.rankingLists!=='object')return false;
      const ids=Object.keys(cache.rankingLists);
      if(!ids.length)return false;
      rankingLists=cache.rankingLists;
      activeListId=(cache.activeListId&&rankingLists[cache.activeListId])?cache.activeListId:ids[0];
      if(typeof loadActiveList==='function')loadActiveList();
      if(typeof renderEverything==='function')renderEverything();
      return true;
    }catch(e){
      console.warn('Workhorse fast ranking cache restore skipped',e);
      return false;
    }
  }

  function restoreScoped(){
    try{
      const key=scopedKey();if(!key)return false;
      const raw=localStorage.getItem(key);if(!raw)return false;
      return applySnapshot(JSON.parse(raw));
    }catch(_){return false}
  }

  async function migrateLegacyIfOwned(){
    try{
      const id=userId();
      if(!id||!supabaseClient)return false;
      const raw=localStorage.getItem(LEGACY_KEY);if(!raw)return false;
      const legacy=JSON.parse(raw);
      const lists=legacy?.rankingLists;
      if(!lists||typeof lists!=='object')return false;
      const ids=Object.keys(lists).filter(x=>x&&!String(x).startsWith('local_'));
      const candidate=(legacy.activeListId&&lists[legacy.activeListId]&&!String(legacy.activeListId).startsWith('local_'))?String(legacy.activeListId):(ids[0]||'');
      if(!candidate)return false;
      const {data,error}=await supabaseClient.from('ranking_lists').select('id').eq('id',candidate).eq('user_id',id).maybeSingle();
      if(error||!data?.id)return false;
      const ok=applySnapshot({userId:id,activeListId:legacy.activeListId,rankingLists:lists,savedAt:legacy.savedAt||Date.now()});
      if(ok)saveSnapshot();
      return ok;
    }catch(e){
      console.warn('Workhorse legacy ranking cache check skipped',e);
      return false;
    }
  }

  function wrapSave(){
    try{
      if(saveWrapped||typeof save!=='function')return;
      const base=save;
      const wrapped=function(){
        const out=base.apply(this,arguments);
        scheduleSave();
        return out;
      };
      wrapped.__workhorseFastCache=true;
      save=wrapped;
      try{window.save=wrapped}catch(_){}
      saveWrapped=true;
    }catch(_){}
  }

  function wrapPersist(){
    try{
      if(persistWrapped||typeof persistNewList!=='function')return;
      const base=persistNewList;
      const wrapped=async function(){
        const out=await base.apply(this,arguments);
        saveSnapshot();
        return out;
      };
      persistNewList=wrapped;
      try{window.persistNewList=wrapped}catch(_){}
      persistWrapped=true;
    }catch(_){}
  }

  function install(){
    try{
      wrapSave();wrapPersist();
      if(installed||typeof loadCloudLists!=='function')return installed;
      const base=loadCloudLists;
      const wrapped=async function(){
        let restored=restoreScoped();
        if(!restored)restored=await migrateLegacyIfOwned();
        const out=await base.apply(this,arguments);
        saveSnapshot();
        return out;
      };
      wrapped.__workhorseFastStart=true;
      loadCloudLists=wrapped;
      try{window.loadCloudLists=wrapped}catch(_){}
      installed=true;
      restoreScoped();
      return true;
    }catch(e){
      console.warn('Workhorse fast cloud start could not install',e);
      return false;
    }
  }

  install();
  [80,250,700,1400].forEach(ms=>setTimeout(()=>{install();if(userId())restoreScoped()},ms));
  window.addEventListener('beforeunload',saveSnapshot);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveSnapshot()});
  document.addEventListener('change',()=>scheduleSave(250));
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#workhorseDeleteListBtn'))[900,2200,4500].forEach(ms=>setTimeout(saveSnapshot,ms));
  });
  window.WorkhorseCloudFastStart={restore:restoreScoped,save:saveSnapshot};
})();
