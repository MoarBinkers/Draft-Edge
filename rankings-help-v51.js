// v51 — clearer My Rankings drag-and-drop helper copy.
(()=>{
  const copy='ALL is your overall ranking list. Position tabs show My Pos Rank. Drag a player card up or down to reorder them; moving a player between tiers only changes the visual tier, not their rank. Tiers are completely optional and only appear when you create them.';
  const apply=()=>{
    const p=document.querySelector('#page-rankings .pagehead p');
    if(p&&p.textContent!==copy)p.textContent=copy;
  };
  apply();
  [250,900,2200].forEach(ms=>setTimeout(apply,ms));
})();
