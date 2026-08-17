// v36.1 — simplify Current ADP helper copy.
(()=>{
  const apply=()=>{
    const p=document.querySelector('#page-adp .pagehead p');
    if(!p)return;
    const format=typeof window.DraftEdgeAdpFormat==='function'?window.DraftEdgeAdpFormat():'ppr';
    const labels={ppr:'Full PPR',half_ppr:'Half PPR',superflex:'Superflex / 2QB'};
    p.textContent='Sleeper '+(labels[format]||'PPR')+' redraft ADP.';
  };
  apply();
  document.addEventListener('click',e=>{if(e.target.closest('[data-adp-format]'))setTimeout(apply,0)});
  const target=document.getElementById('adpFormatTabs');
  if(target)new MutationObserver(apply).observe(target,{childList:true,subtree:true,attributes:true});
  [250,800,1800,4000].forEach(ms=>setTimeout(apply,ms));
})();
