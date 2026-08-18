// v75 — clearer My Rankings helper copy + mobile touch-drag loader.
(()=>{
  const mobileTouch=()=>window.matchMedia?.('(max-width: 820px)').matches&&(navigator.maxTouchPoints||0)>0;
  const copy=mobileTouch()
    ? 'ALL is your overall ranking list. On mobile, press and hold a player card for a moment, then drag it up or down to reorder. A normal swipe still scrolls. Moving a player between tiers only changes the visual tier, not their rank.'
    : 'ALL is your overall ranking list. Position tabs show My Pos Rank. Drag a player card up or down to reorder them; moving a player between tiers only changes the visual tier, not their rank. Tiers are completely optional and only appear when you create them.';
  const apply=()=>{
    const p=document.querySelector('#page-rankings .pagehead p');
    if(p&&p.textContent!==copy)p.textContent=copy;
  };
  apply();
  [250,900,2200].forEach(ms=>setTimeout(apply,ms));

  if(mobileTouch()&&!document.querySelector('script[data-mobile-touch-v75]')){
    const s=document.createElement('script');
    s.src='./mobile-touch-v75.js?v=75';
    s.async=false;
    s.dataset.mobileTouchV75='1';
    document.head.appendChild(s);
  }
})();
