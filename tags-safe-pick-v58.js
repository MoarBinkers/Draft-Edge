// v58 — rename Green Light to Safe Pick without changing stored tag keys.
(()=>{
  function apply(){
    try{
      if(typeof TAGS!=='undefined' && TAGS?.green) TAGS.green.name='Safe Pick';
    }catch(_){}

    // Refresh tag-specific UI that may already have rendered before this patch loaded.
    try{ if(typeof renderTagDrawer==='function') renderTagDrawer(); }catch(_){}
    try{ if(typeof updateFilterIndicators==='function') updateFilterIndicators(); }catch(_){}

    document.querySelectorAll('[title="Green Light"]').forEach(el=>el.setAttribute('title','Safe Pick'));
    document.querySelectorAll('#tagPicker span,#tagFilterList span').forEach(el=>{
      if((el.textContent||'').trim()==='Green Light') el.textContent='Safe Pick';
    });
  }

  apply();
  setTimeout(apply,100);
  setTimeout(apply,600);
})();
