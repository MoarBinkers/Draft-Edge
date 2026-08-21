// v80.2 — safe current-ranking-list deletion without running Settings cleanup after unrelated clicks.
(()=>{
  let deleting=false;

  function currentListSafe(){
    try{return typeof currentList==='function'?currentList():(rankingLists?.[activeListId]||null)}catch(_){return null}
  }

  function activeId(){try{return activeListId?String(activeListId):''}catch(_){return ''}}

  function settingsHost(){
    const modal=document.getElementById('settingsModal');
    if(!modal)return null;
    return modal.querySelector('.modalbox')||modal;
  }

  function ensureStyles(){
    if(document.getElementById('workhorse-delete-list-style'))return;
    const style=document.createElement('style');
    style.id='workhorse-delete-list-style';
    style.textContent=`
      #workhorseDeleteListRow{
        width:100%!important;
        box-sizing:border-box!important;
        display:flex!important;
        justify-content:flex-end!important;
        align-items:center!important;
        margin:16px 0 0!important;
        padding:12px 0 0!important;
        border-top:1px solid rgba(255,255,255,.07)!important;
      }
      #workhorseDeleteListBtn{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        float:none!important;
        width:auto!important;
        min-width:0!important;
        min-height:30px!important;
        margin:0!important;
        padding:5px 9px!important;
        border:1px solid rgba(143,70,82,.72)!important;
        border-radius:7px!important;
        background:transparent!important;
        color:#d99aa5!important;
        font-size:11px!important;
        line-height:1.2!important;
        font-weight:700!important;
        cursor:pointer!important;
        box-sizing:border-box!important;
      }
      #workhorseDeleteListBtn:hover{background:rgba(143,70,82,.12)!important;border-color:#a95563!important;color:#efb3bd!important;}
      #workhorseDeleteListBtn:disabled{opacity:.55!important;cursor:default!important;}
      @media(max-width:620px){
        #workhorseDeleteListRow{margin-top:14px!important;padding-top:10px!important;}
        #workhorseDeleteListBtn{min-height:32px!important;padding:6px 10px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function refreshAfterDelete(){
    try{
      const ids=Object.keys(rankingLists||{});
      activeListId=ids[0]||null;
      if(activeListId){
        if(typeof loadActiveList==='function')loadActiveList();
        if(typeof renderEverything==='function')renderEverything();
      }else{
        try{players=[]}catch(_){}
        if(typeof renderEverything==='function')renderEverything();
        setTimeout(()=>{try{if(typeof openNewList==='function')openNewList()}catch(_){}},0);
      }
      try{if(!currentUser&&typeof saveLocalLists==='function')saveLocalLists()}catch(_){}
    }catch(e){console.warn('Workhorse list UI refresh after delete skipped',e)}
  }

  async function deleteCurrentList(){
    if(deleting)return;
    const list=currentListSafe(),id=activeId();
    if(!list||!id)return;
    const name=String(list.name||'Untitled List').trim()||'Untitled List';
    const message=`Delete “${name}”?\n\nThis removes the list from your rankings. This cannot be undone from this screen.`;
    if(!confirm(message))return;

    deleting=true;
    const btn=document.getElementById('workhorseDeleteListBtn');
    if(btn){btn.disabled=true;btn.textContent='Deleting…'}
    try{
      if(currentUser&&supabaseClient&&!id.startsWith('local_')){
        const {error}=await supabaseClient.from('ranking_lists').delete().eq('id',id).eq('user_id',currentUser.id);
        if(error)throw error;
      }
      delete rankingLists[id];
      refreshAfterDelete();
    }catch(e){
      console.error('Workhorse list delete failed',e);
      alert('Could not delete this list: '+(e?.message||e));
    }finally{
      deleting=false;
      const live=document.getElementById('workhorseDeleteListBtn');
      if(live){live.disabled=false;live.textContent='Delete current list'}
    }
  }

  function ensureDeleteButton(){
    try{
      ensureStyles();
      const list=currentListSafe(),host=settingsHost();
      if(!host){return false}

      let row=document.getElementById('workhorseDeleteListRow');
      if(!row){row=document.createElement('div');row.id='workhorseDeleteListRow'}
      if(row.parentElement!==host)host.appendChild(row);

      let btn=document.getElementById('workhorseDeleteListBtn');
      if(!btn){
        btn=document.createElement('button');
        btn.type='button';
        btn.id='workhorseDeleteListBtn';
        btn.addEventListener('click',deleteCurrentList);
      }
      if(btn.parentElement!==row)row.appendChild(btn);

      if(list){
        btn.style.display='';
        btn.textContent=deleting?'Deleting…':'Delete current list';
        btn.title='Delete '+String(list.name||'this ranking list');
      }else{
        btn.style.display='none';
      }
      return true;
    }catch(e){console.warn('Workhorse Delete List control skipped',e);return false}
  }

  function observeSettings(){
    const modal=document.getElementById('settingsModal');
    if(!modal||modal.__wh80Observed)return false;
    const ob=new MutationObserver(()=>{if(modal.classList.contains('open'))setTimeout(ensureDeleteButton,0)});
    ob.observe(modal,{attributes:true,attributeFilter:['class']});
    modal.__wh80Observed=true;return true;
  }

  ensureDeleteButton();observeSettings();
  [150,450,900,1800,3500].forEach(ms=>setTimeout(()=>{ensureDeleteButton();observeSettings()},ms));
  window.WorkhorseDeleteList={refresh:ensureDeleteButton,deleteCurrent:deleteCurrentList};
})();
