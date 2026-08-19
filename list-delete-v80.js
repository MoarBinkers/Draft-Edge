// v80.0 — safe current-ranking-list deletion with a dedicated, non-squeezing action row.
(()=>{
  let deleting=false;

  function currentListSafe(){
    try{return typeof currentList==='function'?currentList():(rankingLists?.[activeListId]||null)}catch(_){return null}
  }

  function activeId(){try{return activeListId?String(activeListId):''}catch(_){return ''}}

  function listControlAnchor(){
    const id=activeId();
    const name=String(currentListSafe()?.name||'').trim();

    const preferred=[
      document.getElementById('rankingListSelect'),
      document.getElementById('rankListSelect'),
      document.getElementById('listSelect'),
      document.querySelector('[data-ranking-list-select]')
    ].filter(Boolean);
    if(preferred.length)return preferred[0];

    for(const select of document.querySelectorAll('select')){
      const options=[...select.options];
      if(id&&options.some(o=>String(o.value)===id))return select;
      if(name&&options.some(o=>String(o.textContent||'').trim()===name))return select;
    }

    const newListButton=[...document.querySelectorAll('button')].find(btn=>{
      const text=String(btn.textContent||'').trim().toLowerCase();
      const onclick=String(btn.getAttribute('onclick')||'');
      return onclick.includes('openNewList')||text==='new list'||text.includes('new list');
    });
    return newListButton||null;
  }

  function ensureStyles(){
    if(document.getElementById('workhorse-delete-list-style'))return;
    const style=document.createElement('style');
    style.id='workhorse-delete-list-style';
    style.textContent=`
      #workhorseDeleteListRow{
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        display:flex!important;
        justify-content:flex-end!important;
        align-items:center!important;
        clear:both!important;
        flex:1 0 100%!important;
        grid-column:1 / -1!important;
        margin:8px 0 0!important;
        padding:0!important;
      }
      #workhorseDeleteListBtn{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        float:none!important;
        flex:0 0 auto!important;
        width:auto!important;
        min-width:96px!important;
        max-width:100%!important;
        min-height:36px!important;
        margin:0!important;
        padding:8px 12px!important;
        border:1px solid #8f4652!important;
        border-radius:9px!important;
        background:rgba(143,70,82,.08)!important;
        color:#efb3bd!important;
        font-weight:750!important;
        cursor:pointer!important;
        box-sizing:border-box!important;
      }
      #workhorseDeleteListBtn:hover{background:rgba(143,70,82,.17)!important;border-color:#b65a69!important;}
      #workhorseDeleteListBtn:disabled{opacity:.55!important;cursor:default!important;}
      @media(max-width:620px){
        #workhorseDeleteListRow{margin-top:10px!important;}
        #workhorseDeleteListBtn{width:100%!important;min-height:42px!important;}
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
      if(live){live.disabled=false;live.textContent='Delete List'}
    }
  }

  function ensureDeleteButton(){
    try{
      ensureStyles();
      const list=currentListSafe(),anchor=listControlAnchor();
      if(!list||!anchor)return false;

      let host=anchor.parentElement;
      if(!host)return false;
      if(host.parentElement&&host.children.length===1&&host.parentElement.children.length<=8)host=host.parentElement;

      let row=document.getElementById('workhorseDeleteListRow');
      if(!row){row=document.createElement('div');row.id='workhorseDeleteListRow'}
      if(row.parentElement!==host)host.appendChild(row);

      let btn=document.getElementById('workhorseDeleteListBtn');
      if(!btn){
        btn=document.createElement('button');btn.type='button';btn.id='workhorseDeleteListBtn';btn.textContent='Delete List';
        btn.addEventListener('click',deleteCurrentList);
      }
      if(btn.parentElement!==row)row.appendChild(btn);
      btn.title='Delete '+String(list.name||'this ranking list');
      return true;
    }catch(e){console.warn('Workhorse Delete List control skipped',e);return false}
  }

  ensureDeleteButton();
  [150,450,900,1800,3500].forEach(ms=>setTimeout(ensureDeleteButton,ms));
  document.addEventListener('click',()=>setTimeout(ensureDeleteButton,0));
  window.WorkhorseDeleteList={refresh:ensureDeleteButton,deleteCurrent:deleteCurrentList};
})();
