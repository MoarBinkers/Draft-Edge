// v66 — durable Draft Recap trigger. Shows a floating button whenever the Draft UI is visible.
(()=>{
  const ID='deRecapFloat66';
  function visible(el){
    if(!el)return false;
    const cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden')return false;
    return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length);
  }
  function draftVisible(){
    return ['draftList','deDraftContext','deMyPicks43','draftId','connectDraft'].some(id=>visible(document.getElementById(id)));
  }
  function ensureCss(){
    if(document.getElementById('deRecapFloat66Css'))return;
    const s=document.createElement('style');
    s.id='deRecapFloat66Css';
    s.textContent=`#${ID}{position:fixed;right:22px;bottom:22px;z-index:2147481200;display:none;align-items:center;gap:7px;padding:11px 15px;border:1px solid #466477;border-radius:12px;background:#14232e;color:#eef6fb;font:800 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 14px 35px #0008;cursor:pointer}#${ID}:hover{filter:brightness(1.1)}#${ID}:active{transform:translateY(1px)}@media(max-width:700px){#${ID}{right:12px;bottom:12px;padding:10px 13px}}`;
    document.head.appendChild(s);
  }
  function ensure(){
    ensureCss();
    let b=document.getElementById(ID);
    if(!b){
      b=document.createElement('button');
      b.id=ID;b.type='button';b.innerHTML='<span aria-hidden="true">📋</span><span>Draft Recap</span>';
      b.setAttribute('aria-label','Open Draft Recap');
      b.addEventListener('click',()=>{
        const api=window.DraftEdgeRecap;
        if(api?.open){api.open();return}
        const old=document.getElementById('deRecapBtn65');
        if(old){old.click();return}
        console.warn('Draft Recap feature is not ready yet.');
      });
      document.body.appendChild(b);
    }
    b.style.display=draftVisible()?'inline-flex':'none';
    const old=document.getElementById('deRecapBtn65');
    if(old)old.style.display='none';
  }
  function install(){
    ensure();
    const ob=new MutationObserver(()=>ensure());
    ob.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',()=>setTimeout(ensure,0),true);
    setInterval(ensure,1000);
    window.DraftEdgeRecapTrigger={ensure};
  }
  if(document.body)install();else document.addEventListener('DOMContentLoaded',install,{once:true});
})();
