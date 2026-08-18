// v52 — make Add Tags & Note the primary action when an owned player is opened.
(()=>{
  function injectCss(){
    if(document.getElementById('dePlayerTags52Css'))return;
    const s=document.createElement('style');
    s.id='dePlayerTags52Css';
    s.textContent=`
      #drawerContent .de52-tag-cta{margin:14px 0 16px}
      #drawerContent .de52-tag-btn{
        width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
        padding:13px 16px;border-radius:12px;border:1px solid #4d97d0;
        background:#17689f;color:#f5fbff;font-size:12px;font-weight:1000;
        letter-spacing:.02em;box-shadow:0 8px 22px rgba(0,0,0,.22);cursor:pointer
      }
      #drawerContent .de52-tag-btn:hover{filter:brightness(1.12)}
      #drawerContent .de52-tag-btn:focus-visible{outline:2px solid #8fd2ff;outline-offset:2px}
    `;
    document.head.appendChild(s);
  }

  function promote(){
    injectCss();
    const root=document.getElementById('drawerContent');if(!root)return;
    const btn=[...root.querySelectorAll('button')].find(b=>/add\s+tags?\s*&?\s*note/i.test((b.textContent||'').trim())||/openEdit\(/.test(b.getAttribute('onclick')||''));
    if(!btn)return;

    let box=root.querySelector('.de52-tag-cta');
    if(!box){
      box=document.createElement('div');box.className='de52-tag-cta';
      const head=root.querySelector('.detailhead');
      if(head)head.insertAdjacentElement('afterend',box);else root.prepend(box);
    }
    btn.classList.remove('btn','primary');
    btn.classList.add('de52-tag-btn');
    btn.textContent='＋ Add Tags & Note';
    box.appendChild(btn);
  }

  function wrap(name){
    const base=window[name];if(typeof base!=='function'||base.__de52Wrapped)return;
    const wrapped=async function(...args){
      const out=await base.apply(this,args);
      promote();
      queueMicrotask(promote);
      requestAnimationFrame(promote);
      return out;
    };
    wrapped.__de52Wrapped=true;
    window[name]=wrapped;
    try{globalThis[name]=wrapped}catch(_){}
  }

  injectCss();
  wrap('openDetail');
  wrap('openMarketDetail');
  const ob=new MutationObserver(()=>{
    if(document.getElementById('drawer')?.classList.contains('open'))requestAnimationFrame(promote);
  });
  ob.observe(document.documentElement,{childList:true,subtree:true});
})();
