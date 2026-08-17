// v37 — changing tier membership must not silently change personal rank numbers.
(()=>{
  let snap=null;
  const key=p=>p?.sleeperId?`id:${p.sleeperId}`:`${p?.position||''}:${typeof norm==='function'?norm(p?.name||''):String(p?.name||'').toLowerCase()}`;
  const takeSnapshot=(row)=>{
    const i=Number(row?.dataset?.index);
    if(!Number.isInteger(i)||!Array.isArray(players)||!players[i])return;
    const dragged=players[i];
    const ranks=new Map();
    players.forEach(p=>ranks.set(key(p),{overall:Number(p.overall),posRank:Number(p.posRank)}));
    snap={dragKey:key(dragged),oldTier:dragged.tier??null,ranks};
  };
  const restoreIfTierChanged=()=>{
    if(!snap||!Array.isArray(players))return;
    const s=snap;snap=null;
    const dragged=players.find(p=>key(p)===s.dragKey);
    if(!dragged)return;
    const newTier=dragged.tier??null;
    if(String(newTier)===String(s.oldTier))return;
    let changed=false;
    players.forEach(p=>{
      const old=s.ranks.get(key(p));if(!old)return;
      if(Number.isFinite(old.overall)&&Number(p.overall)!==old.overall){p.overall=old.overall;changed=true}
      if(Number.isFinite(old.posRank)&&Number(p.posRank)!==old.posRank){p.posRank=old.posRank;changed=true}
    });
    if(changed){
      try{save()}catch(_){}
      try{renderRankings()}catch(_){}
    }
  };
  document.addEventListener('dragstart',e=>{
    const row=e.target.closest?.('.player[data-index]');
    if(row)takeSnapshot(row);
  },true);
  document.addEventListener('dragend',()=>setTimeout(restoreIfTierChanged,25),true);
})();
