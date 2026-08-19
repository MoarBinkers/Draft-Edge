// v79.0 — keep New List actions clean and prevent the Create List button from squeezing existing controls.
(()=>{
  function ensureStyles(){
    if(document.getElementById('workhorse-list-modal-layout-style'))return;
    const style=document.createElement('style');
    style.id='workhorse-list-modal-layout-style';
    style.textContent=`
      #workhorseCreateListActionRow{
        display:flex!important;
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        margin:16px 0 0!important;
        padding:14px 0 0!important;
        border-top:1px solid rgba(255,255,255,.09)!important;
        clear:both!important;
        flex:1 0 100%!important;
        grid-column:1 / -1!important;
      }
      #workhorseCreateListActionRow #workhorseCreateListConfirm{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        float:none!important;
        display:block!important;
        flex:1 1 auto!important;
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        min-height:44px!important;
        margin:0!important;
        box-sizing:border-box!important;
      }
      #newListModal #newListName{min-width:0!important;box-sizing:border-box!important;}
      @media (max-width:620px){
        #workhorseCreateListActionRow{margin-top:14px!important;padding-top:12px!important;}
        #workhorseCreateListActionRow #workhorseCreateListConfirm{min-height:46px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function contentHost(modal,input){
    let node=input;
    while(node?.parentElement&&node.parentElement!==modal)node=node.parentElement;
    return node?.parentElement===modal?node:(input.parentElement||modal);
  }

  function tidyNewListModal(){
    try{
      ensureStyles();
      const modal=document.getElementById('newListModal');
      const input=document.getElementById('newListName');
      const btn=document.getElementById('workhorseCreateListConfirm');
      if(!modal||!input||!btn)return false;

      const host=contentHost(modal,input);
      if(!host)return false;

      let row=document.getElementById('workhorseCreateListActionRow');
      if(!row){
        row=document.createElement('div');
        row.id='workhorseCreateListActionRow';
      }
      if(row.parentElement!==host)host.appendChild(row);
      if(btn.parentElement!==row)row.appendChild(btn);

      // Undo the inline layout from the first confirmation-button version.
      btn.style.marginTop='0';
      btn.style.width='100%';

      return true;
    }catch(e){
      console.warn('Workhorse New List layout cleanup skipped',e);
      return false;
    }
  }

  tidyNewListModal();
  [120,350,800,1600,3200].forEach(ms=>setTimeout(tidyNewListModal,ms));
  document.addEventListener('click',()=>setTimeout(tidyNewListModal,0));
  window.WorkhorseListModalLayout={refresh:tidyNewListModal};
})();
