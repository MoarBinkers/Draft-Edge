// v75.4 — clearer rankings helper copy + bold player detail hints on My Rankings and Current ADP + mobile touch-drag loader.
(()=>{
  const mobileTouch=()=>window.matchMedia?.('(max-width: 820px)').matches&&(navigator.maxTouchPoints||0)>0;
  const copy=mobileTouch()
    ? 'ALL is your overall ranking list. On mobile, press and hold a player card for a moment, then drag it up or down to reorder. A normal swipe still scrolls. Moving a player between tiers only changes the visual tier, not their rank.'
    : 'ALL is your overall ranking list. Position tabs show My Pos Rank. Drag a player card up or down to reorder them; moving a player between tiers only changes the visual tier, not their rank. Tiers are completely optional and only appear when you create them.';
  const hint=mobileTouch()?'Tap any player card to see more details.':'Click any player card to see more details.';

  function addHint(target,key){
    if(!target)return;
    let el=target.querySelector('[data-player-detail-hint="'+key+'"]');
    if(!el){
      el=document.createElement('div');
      el.dataset.playerDetailHint=key;
      el.style.cssText='margin-top:9px;font-size:14px;font-weight:850;color:#f4f7fa;letter-spacing:.01em;line-height:1.35;';
      const p=target.querySelector(':scope > p')||target.querySelector('p');
      if(p)p.insertAdjacentElement('afterend',el);else target.prepend(el);
    }
    if(el.textContent!==hint)el.textContent=hint;
  }

  const apply=()=>{
    const myHead=document.querySelector('#page-rankings .pagehead');
    const p=myHead?.querySelector('p');
    if(p&&p.textContent!==copy)p.textContent=copy;
    addHint(myHead,'my-rankings');

    // Current ADP is the real Sleeper ADP screen in the app.
    const currentAdpHead=document.querySelector('#page-adp .pagehead');
    addHint(currentAdpHead,'current-adp');
  };

  apply();
  [250,900,2200,5000].forEach(ms=>setTimeout(apply,ms));

  if(mobileTouch()&&!document.querySelector('script[data-mobile-touch-v75]')){
    const s=document.createElement('script');
    s.src='./mobile-touch-v75.js?v=75';
    s.async=false;
    s.dataset.mobileTouchV75='1';
    document.head.appendChild(s);
  }
})();
