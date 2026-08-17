// v38 — one ranking system: overall order is canonical; position tabs and tiers stay synced.
(()=>{
  let snap=null;
  let fixing=false;

  const playerKey=p=>{
    if(!p)return '';
    if(p.sleeperId)return 'id:'+String(p.sleeperId);
    if(p.id)return 'id:'+String(p.id);
    const n=typeof norm==='function'?norm(p.name||''):String(p.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    return String(p.position||'')+':'+n;
  };

  const tierKey=v=>v==null||v===''?'0':String(v);

  function recalcPositionRanks(){
    if(!Array.isArray(players))return false;
    const ordered=players.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999));
    const counts={};
    let changed=false;
    ordered.forEach(p=>{
      const pos=String(p.position||'');
      counts[pos]=(counts[pos]||0)+1;
      if(Number(p.posRank)!==counts[pos]){p.posRank=counts[pos];changed=true}
    });
    return changed;
  }

  function normalizeOverall(){
    if(!Array.isArray(players))return false;
    const ordered=players.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999));
    let changed=false;
    ordered.forEach((p,i)=>{if(Number(p.overall)!==i+1){p.overall=i+1;changed=true}});
    if(recalcPositionRanks())changed=true;
    return changed;
  }

  function snapshot(row){
    if(fixing||!Array.isArray(players))return;
    const i=Number(row?.dataset?.index);
    if(!Number.isInteger(i)||!players[i])return;
    const dragged=players[i];
    const records=new Map();
    players.forEach(p=>records.set(playerKey(p),{
      overall:Number(p.overall),
      posRank:Number(p.posRank),
      position:String(p.position||''),
      tier:tierKey(p.tier)
    }));
    const allOrder=players.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999)).map(playerKey);
    const pos=String(dragged.position||'');
    const posOrder=players.filter(p=>String(p.position||'')===pos).sort((a,b)=>(Number(a.posRank)||9999)-(Number(b.posRank)||9999)).map(playerKey);
    snap={dragKey:playerKey(dragged),oldTier:tierKey(dragged.tier),position:pos,records,allOrder,posOrder};
  }

  function restoreSnapshotOverall(s){
    let changed=false;
    for(const p of players){
      const old=s.records.get(playerKey(p));
      if(!old)continue;
      if(Number.isFinite(old.overall)&&Number(p.overall)!==old.overall){p.overall=old.overall;changed=true}
    }
    if(recalcPositionRanks())changed=true;
    return changed;
  }

  function keysInCurrentTierOrder(pos,tier){
    const list=document.getElementById('rankList');
    if(!list)return [];
    const section=[...list.querySelectorAll(':scope > .tier-drop')].find(el=>tierKey(el.dataset.tier)===tierKey(tier));
    if(!section)return [];
    const out=[];
    section.querySelectorAll('.player[data-index]').forEach(row=>{
      const i=Number(row.dataset.index);
      const p=Number.isInteger(i)?players?.[i]:null;
      if(p&&String(p.position||'')===pos)out.push(playerKey(p));
    });
    return out;
  }

  function applyPositionOrderToOverall(s,desiredPosOrder){
    const currentByKey=new Map(players.map(p=>[playerKey(p),p]));
    restoreSnapshotOverall(s);

    const slots=s.allOrder
      .map(k=>({k,rec:s.records.get(k)}))
      .filter(x=>x.rec&&x.rec.position===s.position)
      .map(x=>x.rec.overall)
      .sort((a,b)=>a-b);

    if(slots.length!==desiredPosOrder.length)return false;
    let changed=false;
    desiredPosOrder.forEach((k,i)=>{
      const p=currentByKey.get(k);
      if(!p)return;
      if(Number(p.overall)!==slots[i]){p.overall=slots[i];changed=true}
    });
    if(recalcPositionRanks())changed=true;
    return changed;
  }

  function desiredOrderForSameTier(s,newTier){
    const tierMembers=s.posOrder.filter(k=>tierKey(s.records.get(k)?.tier)===tierKey(newTier));
    if(tierMembers.length<2)return s.posOrder.slice();
    let domOrder=keysInCurrentTierOrder(s.position,newTier).filter(k=>tierMembers.includes(k));
    if(domOrder.length!==tierMembers.length){
      const nowByKey=new Map(players.map(p=>[playerKey(p),p]));
      domOrder=tierMembers.slice().sort((a,b)=>(Number(nowByKey.get(a)?.posRank)||9999)-(Number(nowByKey.get(b)?.posRank)||9999));
    }
    const wanted=new Set(tierMembers);
    let n=0;
    return s.posOrder.map(k=>wanted.has(k)?domOrder[n++]:k);
  }

  function finishDrag(){
    if(fixing||!snap||!Array.isArray(players))return;
    const s=snap;snap=null;
    const dragged=players.find(p=>playerKey(p)===s.dragKey);
    if(!dragged)return;
    fixing=true;
    try{
      const newTier=tierKey(dragged.tier);
      const view=typeof rankPos!=='undefined'?String(rankPos):'ALL';
      let changed=false;

      if(newTier!==s.oldTier){
        changed=restoreSnapshotOverall(s);
      }else if(view!=='ALL'&&view===s.position){
        const desired=desiredOrderForSameTier(s,newTier);
        changed=applyPositionOrderToOverall(s,desired)||changed;
      }else{
        changed=normalizeOverall();
      }

      if(changed){try{save()}catch(_){}}
      try{renderRankings()}catch(_){}
    }finally{fixing=false}
  }

  document.addEventListener('dragstart',e=>{
    const row=e.target.closest?.('.player[data-index]');
    if(row)snapshot(row);
  },true);
  document.addEventListener('dragend',()=>setTimeout(finishDrag,60),true);

  setTimeout(()=>{
    if(fixing||!Array.isArray(players))return;
    fixing=true;
    try{
      const changed=normalizeOverall();
      if(changed){try{save()}catch(_){};try{renderRankings()}catch(_){}}
    }finally{fixing=false}
  },500);
})();
