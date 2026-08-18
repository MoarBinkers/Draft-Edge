// Workhorse brand patch — keeps branding isolated from the core fantasy app.
(()=>{
  const TITLE='Workhorse — Fantasy Analytics';
  const ICON_PARTS=Array.from({length:8},(_,i)=>'./assets/workhorse-icon-'+i+'.txt?v=1');
  const MAIN_PARTS=Array.from({length:7},(_,i)=>'./assets/workhorse-main-'+i+'.txt?v=1');
  let iconData='';
  let mainLogoData='';
  let applying=false;

  const replaceText=v=>String(v||'')
    .replace(/DRAFT EDGE/g,'WORKHORSE')
    .replace(/Draft Edge/g,'Workhorse')
    .replace(/Rank\.\s*Draft\.\s*Dominate\.?/gi,'');

  function ensureStyle(){
    if(document.getElementById('workhorse-brand-style'))return;
    const style=document.createElement('style');
    style.id='workhorse-brand-style';
    style.textContent=`
      .brand-lockup{display:flex!important;justify-content:center!important;align-items:center!important;margin:0 0 22px!important;padding:0!important;min-height:0!important}
      .brand-lockup-inner{width:100%!important;display:flex!important;justify-content:center!important;align-items:center!important;gap:0!important}
      .workhorse-main-lockup{width:min(560px,50vw);max-width:560px;display:flex;justify-content:center;align-items:center;margin:0 auto;filter:drop-shadow(0 16px 28px #00000042)}
      .workhorse-main-lockup img{display:block;width:100%;height:auto;object-fit:contain;border:0;border-radius:0;background:transparent}
      @media(max-width:1360px){.workhorse-main-lockup{width:min(500px,48vw)}}
    `;
    document.head.appendChild(style);
  }

  function updateMeta(){
    if(document.title!==TITLE)document.title=TITLE;
    const set=(selector,attr,value)=>{const el=document.querySelector(selector);if(el&&el.getAttribute(attr)!==value)el.setAttribute(attr,value)};
    set('meta[name="description"]','content','Workhorse is a fantasy football analytics tool for custom rankings, player news, Sleeper market comparison, ADP movement, and live drafts.');
    set('meta[property="og:site_name"]','content','Workhorse Fantasy Analytics');
    set('meta[property="og:title"]','content',TITLE);
    set('meta[property="og:description"]','content','Fantasy football analytics, rankings, player news, market movement, and live draft tools.');
    set('meta[name="twitter:title"]','content',TITLE);
    set('meta[name="twitter:description"]','content','Fantasy football analytics, rankings, player news, market movement, and live draft tools.');
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(x=>x.remove());
    const ld=document.querySelector('script[type="application/ld+json"]');
    if(ld){
      try{
        const data=JSON.parse(ld.textContent||'{}');
        let changed=false;
        if(data.name!=='Workhorse Fantasy Analytics'){data.name='Workhorse Fantasy Analytics';changed=true}
        const desc='Fantasy football analytics for rankings, player news, market movement, and live drafts.';
        if(data.description!==desc){data.description=desc;changed=true}
        if(changed)ld.textContent=JSON.stringify(data);
      }catch(_){}
    }
  }

  function replaceVisibleBrand(){
    if(!document.body)return;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;
      return /Draft Edge|DRAFT EDGE|Rank\.\s*Draft\.\s*Dominate/i.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.nodeValue=replaceText(node.nodeValue)});
    document.querySelectorAll('[title],[aria-label],[alt],[placeholder]').forEach(el=>{
      ['title','aria-label','alt','placeholder'].forEach(attr=>{
        const value=el.getAttribute(attr)||'';
        if(el.hasAttribute(attr)&&/Draft Edge|DRAFT EDGE|Rank\.\s*Draft\.\s*Dominate/i.test(value))el.setAttribute(attr,replaceText(value));
      });
    });
  }

  function applyHeader(){
    if(!mainLogoData)return false;
    const inner=document.querySelector('.brand-lockup-inner');
    if(!inner)return false;
    const existing=inner.querySelector('.workhorse-main-lockup img');
    if(existing){
      if(existing.src!==mainLogoData)existing.src=mainLogoData;
      return true;
    }
    inner.innerHTML='';
    const wrap=document.createElement('div');
    wrap.className='workhorse-main-lockup';
    const img=document.createElement('img');
    img.src=mainLogoData;
    img.alt='Workhorse Fantasy Analytics';
    img.decoding='async';
    wrap.appendChild(img);
    inner.appendChild(wrap);
    return true;
  }

  function applyFavicon(){
    if(!iconData)return false;
    let favicon=document.querySelector('link[rel~="icon"]');
    if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}
    if(favicon.href!==iconData)favicon.href=iconData;
    return true;
  }

  function apply(){
    if(applying)return;
    applying=true;
    try{ensureStyle();updateMeta();replaceVisibleBrand();applyHeader();applyFavicon()}finally{applying=false}
  }

  async function loadData(parts){
    const responses=await Promise.all(parts.map(p=>fetch(p,{cache:'no-store'})));
    if(responses.some(r=>!r.ok))throw new Error('Workhorse brand asset unavailable');
    const chunks=await Promise.all(responses.map(r=>r.text()));
    return 'data:image/webp;base64,'+chunks.join('').replace(/\s+/g,'');
  }

  apply();
  Promise.all([loadData(ICON_PARTS),loadData(MAIN_PARTS)]).then(([icon,main])=>{
    iconData=icon;
    mainLogoData=main;
    apply();
  }).catch(e=>console.warn('Workhorse brand assets unavailable',e));

  const observer=new MutationObserver(()=>apply());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();