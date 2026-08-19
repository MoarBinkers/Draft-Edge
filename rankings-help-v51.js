// v75.3 — clearer rankings helper copy + bold player detail hints on My Rankings and Sleeper ADP + mobile touch-drag loader.
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

  function findSleeperAdpPage(){
    const pages=[...document.querySelectorAll('[id^="page-"]')];
    let page=pages.find(section=>{
      const head=section.querySelector('.pagehead');
      return /sleeper\s+(?:adp|rankings)/i.test((head?.textContent||'').trim());
    });
    if(page)return page;

    const tab=[...document.querySelectorAll('button,a,[role="tab"],[data-page]')].find(el=>/^sleeper\s+adp$/i.test((el.textContent||'').trim()));
    if(tab){
      const raw=tab.dataset.page||tab.getAttribute('aria-controls')||(tab.getAttribute('href')||'').replace(/^#/,'');
      if(raw){
        page=document.getElementById(raw)||document.getElementById('page-'+raw);
        if(page)return page;
      }
    }

    return pages.find(section=>/sleeper\s+adp/i.test((section.textContent||'').slice(0,700)))||null;
  }

  const apply=()=>{
    const myHead=document.querySelector('#page-rankings .pagehead');
    const p=myHead?.querySelector('p');
    if(p&&p.textContent!==copy)p.textContent=copy;
    addHint(myHead,'my-rankings');

    const sleeperPage=findSleeperAdpPage();
    if(sleeperPage)addHint(sleeperPage.querySelector('.pagehead')||sleeperPage,'sleeper-adp');
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
