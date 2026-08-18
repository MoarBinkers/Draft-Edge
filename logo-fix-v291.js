// Workhorse brand patch — keeps branding isolated from the core fantasy app.
(()=>{
  const BRAND='Workhorse';
  const TITLE='Workhorse — Fantasy Analytics';
  const PARTS=Array.from({length:8},(_,i)=>'./assets/workhorse-icon-'+i+'.txt?v=1');
  let iconData='';
  let applying=false;

  const replaceText=v=>String(v||'').replace(/DRAFT EDGE/g,'WORKHORSE').replace(/Draft Edge/g,'Workhorse');

  function updateMeta(){
    document.title=TITLE;
    const set=(selector,attr,value)=>{const el=document.querySelector(selector);if(el)el.setAttribute(attr,value)};
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
        data.name='Workhorse Fantasy Analytics';
        data.description='Fantasy football analytics for rankings, player news, market movement, and live drafts.';
        ld.textContent=JSON.stringify(data);
      }catch(_){}
    }
  }

  function replaceVisibleBrand(){
    if(!document.body)return;
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p||/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;
      return /Draft Edge|DRAFT EDGE/.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{node.nodeValue=replaceText(node.nodeValue)});
    document.querySelectorAll('[title],[aria-label],[alt],[placeholder]').forEach(el=>{
      ['title','aria-label','alt','placeholder'].forEach(attr=>{
        if(el.hasAttribute(attr)&&/Draft Edge|DRAFT EDGE/.test(el.getAttribute(attr)||''))el.setAttribute(attr,replaceText(el.getAttribute(attr)));
      });
    });
  }

  function applyIcon(){
    if(!iconData)return false;
    const img=document.querySelector('.brand-mark img');
    if(img){
      img.src=iconData;
      img.alt='Workhorse';
      img.style.visibility='visible';
      img.style.objectFit='contain';
    }
    let favicon=document.querySelector('link[rel~="icon"]');
    if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}
    favicon.href=iconData;
    return !!img;
  }

  function apply(){
    if(applying)return;
    applying=true;
    try{updateMeta();replaceVisibleBrand();applyIcon()}finally{applying=false}
  }

  async function loadIcon(){
    try{
      const responses=await Promise.all(PARTS.map(p=>fetch(p,{cache:'no-store'})));
      if(responses.some(r=>!r.ok))throw new Error('Workhorse icon part unavailable');
      const chunks=await Promise.all(responses.map(r=>r.text()));
      iconData='data:image/webp;base64,'+chunks.join('').replace(/\s+/g,'');
      apply();
    }catch(e){console.warn('Workhorse brand icon unavailable',e)}
  }

  apply();
  loadIcon();
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
