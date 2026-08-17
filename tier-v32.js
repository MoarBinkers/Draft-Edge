// v32 — centered Add Tier + tiers above Untiered.
(function tierUiV32(){
  const install=()=>{
    const rankList=document.getElementById('rankList');
    const native=document.getElementById('addTier');
    if(!rankList||!native)return false;

    let bar=document.getElementById('centerAddTierBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='centerAddTierBar';
      bar.style.cssText='display:none;justify-content:center;align-items:center;margin:14px 0 10px';
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn primary';
      btn.id='centerAddTier';
      btn.textContent='＋ Add Tier';
      btn.style.cssText='min-width:150px;font-weight:900';
      btn.onclick=()=>native.click();
      bar.appendChild(btn);
      rankList.parentNode.insertBefore(bar,rankList);
    }

    const sync=()=>{bar.style.display=getComputedStyle(native).display==='none'?'none':'flex'};
    const putUntieredLast=()=>{
      const untiered=rankList.querySelector(':scope > .tier-drop[data-tier="0"]');
      const realTiers=rankList.querySelectorAll(':scope > .tier-drop:not([data-tier="0"])');
      if(untiered&&realTiers.length&&untiered!==rankList.lastElementChild)rankList.appendChild(untiered);
    };
    const refresh=()=>{sync();putUntieredLast()};

    refresh();
    const nativeObserver=new MutationObserver(refresh);
    nativeObserver.observe(native,{attributes:true,attributeFilter:['style','class']});
    const listObserver=new MutationObserver(()=>requestAnimationFrame(putUntieredLast));
    listObserver.observe(rankList,{childList:true});
    const pills=document.getElementById('rankPills');
    if(pills)pills.addEventListener('click',()=>setTimeout(refresh,0));
    return true;
  };

  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
