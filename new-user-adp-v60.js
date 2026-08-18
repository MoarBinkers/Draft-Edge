// v60 — clean onboarding: new ranking lists start as a bare Sleeper ADP snapshot.
(()=>{
  const MIGRATION_KEY='de60_clean_adp_onboarding';
  let busy=false;

  const hasCentralAdp=()=>{
    try{
      if(!Array.isArray(sleeperPool)||sleeperPool.length<100)return false;
      let ranked=0;
      for(const p of sleeperPool){
        try{if(Number.isFinite(Number(marketFor(p)?.rank)))ranked++}catch(_){}
        if(ranked>=100)return true;
      }
    }catch(_){}
    return false;
  };

  function freshPlayers(){
    let pool=[];
    try{pool=(Array.isArray(sleeperPool)?sleeperPool:[]).filter(p=>POS.includes(p.position))}catch(_){return []}
    pool=pool.filter(p=>{try{return Number.isFinite(Number(marketFor(p)?.rank))}catch(_){return false}})
      .sort((a,b)=>Number(marketFor(a)?.rank||99999)-Number(marketFor(b)?.rank||99999))
      .slice(0,300);
    const pc={};
    return pool.map((p,i)=>{
      pc[p.position]=(pc[p.position]||0)+1;
      return {
        overall:i+1,
        name:p.name,
        position:p.position||p.pos||'NA',
        team:p.team||'FA',
        bye:p.bye??'—',
        posRank:pc[p.position],
        tier:null,
        tags:[],
        note:'',
        drafted:false,
        draftedAt:null,
        draftedSource:null,
        draftedDraftId:null,
        draftedPickNo:null
      };
    });
  }

  function untouchedBuiltInList(list){
    if(!list||list.name!=='My Rankings'||!Array.isArray(list.players)||!list.players.length)return false;
    let initial=null;
    try{initial=Array.isArray(INITIAL)?INITIAL:null}catch(_){}
    if(!initial||list.players.length!==initial.length)return false;
    for(let i=0;i<initial.length;i++){
      const p=list.players[i],src=initial[i];
      if(!p||!src)return false;
      let same=false;
      try{same=norm(p.name)===norm(src.name)}catch(_){same=String(p.name||'').toLowerCase()===String(src.name||'').toLowerCase()}
      if(!same)return false;
      if(Number(p.overall)!==i+1)return false;
      if((p.tags||[]).length||String(p.note||'').trim()||p.drafted)return false;
    }
    return true;
  }

  function cleanListData(name='My Rankings'){
    const ps=freshPlayers();
    if(ps.length<100)return null;
    return {id:localId(),name,players:ps,tiers:emptyTiers(),draftPrefs:null,createdAt:Date.now(),updatedAt:Date.now()};
  }

  async function createCloudStarter(){
    if(busy||!currentUser||activeListId||Object.keys(rankingLists||{}).length||!hasCentralAdp())return false;
    busy=true;
    try{
      const list=cleanListData();if(!list)return false;
      await persistNewList(list);
      activeTagFilter='ALL';
      document.getElementById('newListModal')?.classList.remove('open');
      try{renderEverything()}catch(_){}
      return true;
    }catch(e){
      console.warn('Draft Edge starter rankings could not be created',e);
      return false;
    }finally{busy=false}
  }

  function migrateUntouchedLocalStarter(){
    if(currentUser||!hasCentralAdp())return false;
    let ids=[];try{ids=Object.keys(rankingLists||{})}catch(_){return false}
    if(ids.length!==1)return false;
    const id=ids[0],list=rankingLists[id];
    if(!untouchedBuiltInList(list))return false;
    const ps=freshPlayers();if(ps.length<100)return false;
    list.players=ps;
    list.tiers=emptyTiers();
    list.draftPrefs=null;
    list.updatedAt=Date.now();
    rankingLists[id]=list;
    activeListId=id;
    loadActiveList();
    activeTagFilter='ALL';
    try{saveLocalLists()}catch(_){}
    try{localStorage.setItem(MIGRATION_KEY,'1')}catch(_){}
    try{renderEverything()}catch(_){}
    return true;
  }

  // Any explicitly-created "from ADP" list should also be guaranteed clean.
  const baseCreateNamedList=typeof createNamedList==='function'?createNamedList:null;
  if(baseCreateNamedList){
    createNamedList=async function(kind){
      if(kind!=='adp')return baseCreateNamedList.apply(this,arguments);
      const name=document.getElementById('newListName')?.value?.trim();
      if(!name){document.getElementById('newListName')?.focus();return}
      try{
        if(!hasCentralAdp()&&typeof refreshCurrentAdp==='function')await refreshCurrentAdp();
        const list=cleanListData(name);
        if(!list)throw new Error('Sleeper ADP is still loading.');
        await persistNewList(list);
        activeTagFilter='ALL';
        document.getElementById('newListModal')?.classList.remove('open');
      }catch(e){alert('Could not create list: '+(e?.message||e))}
    };
    try{window.createNamedList=createNamedList}catch(_){}
  }

  // Cloud reliability may have wrapped loadCloudLists before this patch. Extend its final behavior.
  const baseLoadCloudLists=typeof loadCloudLists==='function'?loadCloudLists:null;
  if(baseLoadCloudLists){
    loadCloudLists=async function(){
      const out=await baseLoadCloudLists.apply(this,arguments);
      if(currentUser&&!activeListId)await createCloudStarter();
      return out;
    };
    try{window.loadCloudLists=loadCloudLists}catch(_){}
  }

  async function reconcile(){
    if(!hasCentralAdp())return;
    if(currentUser){
      if(!activeListId)await createCloudStarter();
    }else{
      migrateUntouchedLocalStarter();
    }
  }

  [100,500,1200,2500,5000,8000].forEach(ms=>setTimeout(reconcile,ms));
})();
