// v39 — tiers are visual only; ranking order is canonical and synced across ALL/position views.
(()=>{
  let dragSnap=null;
  let fixing=false;

  const pKey=p=>{
    if(!p)return '';
    if(p.sleeperId)return 'id:'+String(p.sleeperId);
    if(p.id)return 'id:'+String(p.id);
    const n=typeof norm==='function'?norm(p.name||''):String(p.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    return String(p.position||'')+':'+n;
  };
  const tierVal=v=>v==null||v===''||Number(v)===0?null:Number(v);
  const num=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;

  function overallOrder(){
    return players.slice().sort((a,b)=>num(a.overall,999999)-num(b.overall,999999));
  }

  function syncPosRanksFromOverall(){
    if(!Array.isArray(players))return false;
    const counts={};let changed=false;
    overallOrder().forEach(p=>{
      const pos=String(p.position||'');
      counts[pos]=(counts[pos]||0)+1;
      if(num(p.posRank,-1)!==counts[pos]){p.posRank=counts[pos];changed=true}
    });
    return changed;
  }

  // Critical rule: tier placement never participates in ranking math.
  orderedPos=function(pos){
    return overallOrder().filter(p=>String(p.position||'')===String(pos));
  };
  resequencePos=function(_pos){
    syncPosRanksFromOverall();
  };
  window.orderedPos=orderedPos;
  window.resequencePos=resequencePos;

  function captureDrag(row){
    if(fixing||!Array.isArray(players))return;
    const i=Number(row?.dataset?.index);
    if(!Number.isInteger(i)||!players[i])return;
    const dragged=players[i];
    const records=new Map();
    players.forEach(p=>records.set(pKey(p),{
      overall:num(p.overall,999999),
      posRank:num(p.posRank,999999),
      tier:tierVal(p.tier),
      position:String(p.position||'')
    }));
    const pos=String(dragged.position||'');
    dragSnap={
      key:pKey(dragged),
      position:pos,
      oldTier:tierVal(dragged.tier),
      records,
      posOrder:overallOrder().filter(p=>String(p.position||'')===pos).map(pKey),
      posSlots:overallOrder().filter(p=>String(p.position||'')===pos).map(p=>num(p.overall,999999)).sort((a,b)=>a-b)
    };
  }

  document.addEventListener('dragstart',e=>{
    const row=e.target.closest?.('#rankList .player[data-index]');
    if(row)captureDrag(row);
  },true);

  function tierFromDom(el){
    const section=el?.closest?.('.tier-drop[data-tier]');
    return section?tierVal(section.dataset.tier):null;
  }

  function restoreCanonicalRanks(s){
    let changed=false;
    players.forEach(p=>{
      const old=s.records.get(pKey(p));if(!old)return;
      if(num(p.overall,-1)!==old.overall){p.overall=old.overall;changed=true}
    });
    if(syncPosRanksFromOverall())changed=true;
    return changed;
  }

  function domKeysInTier(pos,tier){
    const list=document.getElementById('rankList');if(!list)return [];
    const section=[...list.querySelectorAll(':scope > .tier-drop[data-tier]')].find(el=>tierVal(el.dataset.tier)===tierVal(tier));
    if(!section)return [];
    return [...section.querySelectorAll(':scope > .player[data-index]')].map(row=>{
      const i=Number(row.dataset.index);return Number.isInteger(i)&&players[i]?players[i]:null;
    }).filter(p=>p&&String(p.position||'')===String(pos)).map(pKey);
  }

  function applySameTierPositionReorder(s,tier){
    // Only player order inside the SAME visual tier can change ranking order.
    // Moving to another tier is organization only and is handled separately.
    const members=s.posOrder.filter(k=>tierVal(s.records.get(k)?.tier)===tierVal(tier));
    if(members.length<2){restoreCanonicalRanks(s);return false}
    const memberSet=new Set(members);
    const dom=domKeysInTier(s.position,tier).filter(k=>memberSet.has(k));
    if(dom.length!==members.length){restoreCanonicalRanks(s);return false}

    const desired=s.posOrder.slice();
    let j=0;
    for(let i=0;i<desired.length;i++)if(memberSet.has(desired[i]))desired[i]=dom[j++];

    const byKey=new Map(players.map(p=>[pKey(p),p]));
    restoreCanonicalRanks(s);
    desired.forEach((k,i)=>{
      const p=byKey.get(k);if(p)p.overall=s.posSlots[i];
    });
    syncPosRanksFromOverall();
    return true;
  }

  const originalCommit=typeof commitVisualOrder==='function'?commitVisualOrder:null;
  commitVisualOrder=function(){
    if(fixing)return;
    if(!dragState?.el||dragState.index==null)return;

    if(rankPos==='ALL'){
      // ALL is the master ordering view. Let the native reorder happen, then derive position ranks from it.
      if(originalCommit)originalCommit();
      if(syncPosRanksFromOverall())try{save()}catch(_){}
      try{renderRankings()}catch(_){}
      dragSnap=null;
      return;
    }

    const s=dragSnap;
    const draggedEl=dragState.el;
    const dragged=players[dragState.index];
    if(!s||!dragged){
      // Fail safe: never let tier DOM order silently resequence ranks.
      const newTier=tierFromDom(draggedEl);
      if(dragged)dragged.tier=newTier;
      syncPosRanksFromOverall();
      try{save()}catch(_){}
      const el=dragState.el;dragState={el:null,index:null,startPos:null,startTier:null};
      if(el)el.classList.remove('dragging');
      try{renderRankings()}catch(_){}
      return;
    }

    fixing=true;
    try{
      const newTier=tierFromDom(draggedEl);
      const changedTier=tierVal(newTier)!==tierVal(s.oldTier);

      // First restore the ranking numbers that existed before this drag.
      restoreCanonicalRanks(s);
      dragged.tier=newTier;

      if(!changedTier){
        // Same tier: a deliberate up/down player drag changes actual rank and syncs back to ALL.
        applySameTierPositionReorder(s,newTier);
      }
      // Different tier: NO rank change. Tier is only visual organization.

      syncPosRanksFromOverall();
      try{save()}catch(_){}
      const el=dragState.el;
      dragState={el:null,index:null,startPos:null,startTier:null};
      if(el)el.classList.remove('dragging');
      dragSnap=null;
      try{renderRankings()}catch(_){}
    }finally{fixing=false}
  };
  window.commitVisualOrder=commitVisualOrder;

  // Repair any position ranks previously corrupted by tier-based resequencing.
  setTimeout(()=>{
    if(fixing||!Array.isArray(players))return;
    if(syncPosRanksFromOverall()){
      try{save()}catch(_){}
      try{renderRankings()}catch(_){}
    }
  },350);
})();
