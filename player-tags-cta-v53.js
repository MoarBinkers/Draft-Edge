// v53 — reliable, polished primary Add Tags & Note CTA in owned-player detail.
(()=>{
  let activeIndex=null;

  function injectCss(){
    if(document.getElementById('dePlayerTags53Css'))return;
    const s=document.createElement('style');
    s.id='dePlayerTags53Css';
    s.textContent=`
      #drawerContent .de53-tag-cta{margin:14px 0 18px}
      #drawerContent .de53-tag-btn{
        position:relative;overflow:hidden;isolation:isolate;
        width:100%;display:flex;align-items:center;justify-content:center;gap:9px;
        min-height:48px;padding:13px 18px;border-radius:13px;
        border:1px solid rgba(125,200,255,.72);
        background:linear-gradient(135deg,#1679bd 0%,#215fd0 55%,#394fd0 100%);
        color:#fff;font-size:13px;font-weight:1000;letter-spacing:.015em;
        box-shadow:0 8px 24px rgba(18,92,172,.28),inset 0 1px 0 rgba(255,255,255,.16);
        cursor:pointer;transform:translateY(0) scale(1);
        transition:transform .18s ease,box-shadow .18s ease,filter .18s ease,border-color .18s ease;
      }
      #drawerContent .de53-tag-btn::before{
        content:'';position:absolute;z-index:-1;top:-70%;left:-45%;width:34%;height:240%;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
        transform:rotate(18deg) translateX(-240%);transition:transform .52s ease;
      }
      #drawerContent .de53-tag-btn:hover{
        transform:translateY(-2px) scale(1.008);filter:brightness(1.07);
        border-color:#a6dcff;
        box-shadow:0 13px 30px rgba(24,113,214,.38),0 0 0 1px rgba(111,195,255,.10),inset 0 1px 0 rgba(255,255,255,.20);
      }
      #drawerContent .de53-tag-btn:hover::before{transform:rotate(18deg) translateX(520%)}
      #drawerContent .de53-tag-btn:active{transform:translateY(0) scale(.985);transition-duration:.07s}
      #drawerContent .de53-tag-btn:focus-visible{outline:3px solid rgba(143,210,255,.65);outline-offset:3px}
      #drawerContent .de53-tag-icon{
        display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;
        background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.16);
        font-size:15px;line-height:1;
      }
      @media (prefers-reduced-motion:reduce){
        #drawerContent .de53-tag-btn,#drawerContent .de53-tag-btn::before{transition:none!important}
        #drawerContent .de53-tag-btn:hover{transform:none}
      }
    `;
    document.head.appendChild(s);
  }

  function findOwnedIndex(){
    if(Number.isInteger(activeIndex)&&Array.isArray(players)&&players[activeIndex])return activeIndex;
    const title=document.querySelector('#drawerContent .detailhead h2')?.textContent?.trim();
    if(!title||!Array.isArray(players))return null;
    const key=typeof norm==='function'?norm(title):title.toLowerCase().replace(/[^a-z0-9]/g,'');
    const i=players.findIndex(p=>{
      const pk=typeof norm==='function'?norm(p?.name||''):String(p?.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      return pk===key;
    });
    return i>=0?i:null;
  }

  function openEditor(i){
    if(!Number.isInteger(i)||!Array.isArray(players)||!players[i])return;
    const fn=typeof window.openEdit==='function'?window.openEdit:(typeof openEdit==='function'?openEdit:null);
    if(typeof fn!=='function'){
      console.warn('Draft Edge: tag editor is unavailable');
      return;
    }
    fn(i);
  }

  function decorate(){
    injectCss();
    const root=document.getElementById('drawerContent');
    if(!root||!document.getElementById('drawer')?.classList.contains('open'))return;
    const i=findOwnedIndex();
    if(!Number.isInteger(i))return;
    activeIndex=i;

    root.querySelectorAll('.de52-tag-cta').forEach(el=>el.remove());
    root.querySelectorAll('button').forEach(btn=>{
      const text=(btn.textContent||'').trim();
      const onclick=btn.getAttribute('onclick')||'';
      if(!btn.classList.contains('de53-tag-btn')&&(/add\s+tags?\s*&?\s*note/i.test(text)||/openEdit\(/.test(onclick)))btn.remove();
    });

    let box=root.querySelector('.de53-tag-cta');
    if(!box){
      box=document.createElement('div');box.className='de53-tag-cta';
      const head=root.querySelector('.detailhead');
      if(head)head.insertAdjacentElement('afterend',box);else root.prepend(box);
    }
    let btn=box.querySelector('.de53-tag-btn');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='de53-tag-btn';
      btn.innerHTML='<span class="de53-tag-icon" aria-hidden="true">＋</span><span>Add Tags &amp; Note</span>';
      btn.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        const index=findOwnedIndex();
        openEditor(index);
      });
      box.appendChild(btn);
    }
    btn.dataset.playerIndex=String(i);
  }

  function wrapOpenDetail(){
    const base=window.openDetail;
    if(typeof base!=='function'||base.__de53Wrapped)return;
    const wrapped=async function(...args){
      const i=Number(args[0]);
      activeIndex=Number.isInteger(i)?i:null;
      const out=await base.apply(this,args);
      decorate();queueMicrotask(decorate);requestAnimationFrame(decorate);
      return out;
    };
    wrapped.__de53Wrapped=true;
    window.openDetail=wrapped;
    try{globalThis.openDetail=wrapped}catch(_){}
  }

  injectCss();
  wrapOpenDetail();
  const ob=new MutationObserver(()=>{
    if(document.getElementById('drawer')?.classList.contains('open'))requestAnimationFrame(decorate);
  });
  ob.observe(document.documentElement,{childList:true,subtree:true});
})();
