// v77 — optional, non-invasive tier context for Live Draft.
(()=>{
  const PREF_KEY='workhorse_live_draft_tier_context_v1';
  let enabled=localStorage.getItem(PREF_KEY)==='1';
  let expandedKey='';

  const esc=v=>typeof window.esc==='function'
    ? window.esc(String(v??''))
    : String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectCss(){
    if(document.getElementById('whTierContextCss'))return;
    const s=document.createElement('style');
    s.id='whTierContextCss';
    s.textContent=`
      #whTierContextBar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border:1px solid #2b3d4c;border-radius:12px;background:#0e171f}
      .wh-tier-context-copy{display:flex;align-items:center;gap:8px;min-width:0}
      .wh-tier-context-title{font-size:11px;font-weight:1000;letter-spacing:.06em;text-transform:uppercase;color:#e8f1f8}
      .wh-tier-context-help{font-size:10px;color:#8394a2;line-height:1.35}
      #whTierContextToggle{display:inline-flex;align-items:center;gap:8px;border:1px solid #3a4d5d;border-radius:999px;background:#111b24;color:#a9b7c2;padding:7px 10px;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}
      #whTierContextToggle .wh-tier-switch{width:27px;height:15px;border-radius:999px;background:#354654;position:relative;flex:0 0 auto;transition:.15s ease}
      #whTierContextToggle .wh-tier-switch:after{content:"";position:absolute;width:11px;height:11px;top:2px;left:2px;border-radius:50%;background:#c7d2db;transition:.15s ease}
      #whTierContextToggle.active{border-color:#4b7da2;color:#edf7ff;background:#122434}
      #whTierContextToggle.active .wh-tier-switch{background:#3978a7}
      #whTierContextToggle.active .wh-tier-switch:after{left:14px;background:#fff}
      #whTierContextNote{width:100%;font-size:10px;color:#91a1ae;line-height:1.4;display:none}
      .wh-tier-badge{display:inline-flex;align-items:center;gap:4px;margin-left:7px;padding:3px 7px;border:1px solid #405b70;border-radius:999px;background:#13212c;color:#b9d9ef;font-size:9px;font-weight:1000;letter-spacing:.02em;line-height:1.15;cursor:pointer;vertical-align:1px;white-space:nowrap}
      .wh-tier-badge:hover{border-color:#5f8fb1;color:#e7f5ff;background:#162b3b}
      .wh-tier-badge.last{border-color:#8b6a35;background:#271f12;color:#f5cd74}
      .wh-tier-detail{margin:3px 0 9px;padding:10px 12px;border:1px solid #304656;border-radius:11px;background:#0d161e}
      .wh-tier-detail-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}
      .wh-tier-detail-title{font-size:10px;font-weight:1000;letter-spacing:.06em;text-transform:uppercase;color:#d9e8f2}
      .wh-tier-detail-count{font-size:9px;font-weight:900;color:#8799a7}
      .wh-tier-members{display:flex;gap:6px;flex-wrap:wrap}
      .wh-tier-member{border:1px solid #2c4252;background:#111c25;color:#c7d3dc;border-radius:8px;padding:5px 7px;font-size:10px;line-height:1.2}
      button.wh-tier-member{cursor:pointer}
      button.wh-tier-member:hover{border-color:#4b7594;color:#eef7ff}
      @media(max-width:700px){
        #whTierContextBar{align-items:flex-start}
        .wh-tier-context-copy{display:block}
        .wh-tier-context-help{margin-top:3px}
        .wh-tier-badge{font-size:8px;padding:3px 6px;margin-left:5px}
      }
    `;
    document.head.appendChild(s);
  }

  function tierConfig(pos){
    try{return Array.isArray(tiers?.[pos])?tiers[pos]:[]}catch(_){return []}
  }

  function tierInfo(p){
    if(!p||!p.position||p.tier==null||String(p.tier)==='0'||String(p.tier)==='')return null;
    const cfg=tierConfig(String(p.position));
    const idx=cfg.findIndex(t=>String(t?.id)===String(p.tier));
    if(idx<0)return null;
    const item=cfg[idx]||{};
    const name=String(item.name||('Tier '+(idx+1))).trim()||('Tier '+(idx+1));
    return {pos:String(p.position),id:String(item.id),name,index:idx};
  }

  function availableMembers(info){
    if(!info)return [];
    let list=[];
    try{
      list=(Array.isArray(players)?players:[]).filter(p=>{
        const ti=tierInfo(p);
        return !p.drafted&&ti&&ti.pos===info.pos&&ti.id===info.id;
      });
    }catch(_){return []}
    return list.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999));
  }

  function meaningfulTierCount(){
    try{return (Array.isArray(players)?players:[]).filter(p=>!p.drafted&&tierInfo(p)).length}catch(_){return 0}
  }

  function ensureUi(){
    injectCss();
    const filters=document.getElementById('deDraftSmartFilters');
    const list=document.getElementById('draftList');
    const anchor=filters||list;
    if(!anchor||!anchor.parentNode)return null;

    let bar=document.getElementById('whTierContextBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='whTierContextBar';
      bar.innerHTML=
        '<div class="wh-tier-context-copy"><div class="wh-tier-context-title">Tier Context</div><div class="wh-tier-context-help">See how many players remain in your saved position tiers without changing draft order.</div></div>'+ 
        '<button type="button" id="whTierContextToggle" aria-pressed="false"><span class="wh-tier-switch" aria-hidden="true"></span><span class="wh-tier-toggle-label">Off</span></button>'+ 
        '<div id="whTierContextNote"></div>';
      anchor.parentNode.insertBefore(bar,anchor);
      bar.querySelector('#whTierContextToggle').onclick=()=>{
        enabled=!enabled;
        localStorage.setItem(PREF_KEY,enabled?'1':'0');
        if(!enabled)expandedKey='';
        applyTierContext();
      };
    }else if(bar.nextElementSibling!==anchor){
      anchor.parentNode.insertBefore(bar,anchor);
    }
    return bar;
  }

  function updateUi(){
    const bar=ensureUi();if(!bar)return;
    const btn=bar.querySelector('#whTierContextToggle');
    const label=bar.querySelector('.wh-tier-toggle-label');
    const note=bar.querySelector('#whTierContextNote');
    if(btn){
      btn.classList.toggle('active',enabled);
      btn.setAttribute('aria-pressed',enabled?'true':'false');
    }
    if(label)label.textContent=enabled?'On':'Off';
    const count=meaningfulTierCount();
    if(note){
      if(enabled&&!count){
        note.style.display='block';
        note.textContent='No usable tiers are set up yet. Create position tiers in My Rankings and they will appear here automatically.';
      }else{
        note.style.display='none';
        note.textContent='';
      }
    }
  }

  function directChild(root,node){
    let el=node?.nodeType===1?node:node?.parentElement;
    while(el&&el.parentElement!==root)el=el.parentElement;
    return el&&el.parentElement===root?el:null;
  }

  function findNameNode(root,name){
    if(!root||!name)return null;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(n.parentElement?.closest('.wh-tier-detail'))continue;
      if(String(n.nodeValue||'').trim()===String(name).trim())return n;
    }
    return null;
  }

  function clearDecorations(){
    document.querySelectorAll('#draftList .wh-tier-badge').forEach(el=>el.remove());
    document.querySelectorAll('#draftList > .wh-tier-detail').forEach(el=>el.remove());
  }

  function openPlayer(p){
    try{
      const i=(Array.isArray(players)?players:[]).indexOf(p);
      if(i>=0&&typeof openDetail==='function')openDetail(i);
    }catch(_){}
  }

  function renderDetail(root,row,info,members,key){
    root.querySelectorAll(':scope > .wh-tier-detail').forEach(el=>el.remove());
    if(expandedKey!==key)return;
    const detail=document.createElement('div');
    detail.className='wh-tier-detail';
    detail.dataset.tierContextDetail=key;
    detail.innerHTML=
      '<div class="wh-tier-detail-head"><div class="wh-tier-detail-title">'+esc(info.pos)+' · '+esc(info.name)+'</div><div class="wh-tier-detail-count">'+members.length+' available</div></div>'+ 
      '<div class="wh-tier-members"></div>';
    const memberRoot=detail.querySelector('.wh-tier-members');
    members.forEach(p=>{
      const canOpen=typeof openDetail==='function';
      const el=document.createElement(canOpen?'button':'span');
      if(canOpen)el.type='button';
      el.className='wh-tier-member';
      el.textContent=p.name+'  #'+(p.overall||'—');
      if(canOpen)el.onclick=e=>{e.preventDefault();e.stopPropagation();openPlayer(p)};
      memberRoot.appendChild(el);
    });
    row.insertAdjacentElement('afterend',detail);
  }

  function decorate(){
    const root=document.getElementById('draftList');
    if(!root)return;
    clearDecorations();
    if(!enabled)return;

    let pool=[];
    try{pool=(Array.isArray(players)?players:[]).filter(p=>!p.drafted&&tierInfo(p))}catch(_){return}
    const seenRows=new Set();

    for(const p of pool){
      const nameNode=findNameNode(root,p.name);
      if(!nameNode)continue;
      const row=directChild(root,nameNode);
      if(!row||seenRows.has(row)||row.classList.contains('wh-tier-detail'))continue;
      const info=tierInfo(p);if(!info)continue;
      const members=availableMembers(info);if(!members.length)continue;
      const key=info.pos+':'+info.id;
      seenRows.add(row);

      const badge=document.createElement('button');
      badge.type='button';
      badge.className='wh-tier-badge'+(members.length===1?' last':'');
      badge.dataset.tierContextKey=key;
      badge.textContent=members.length===1
        ? info.name.toUpperCase()+' · LAST IN TIER'
        : info.name.toUpperCase()+' · '+members.length+' LEFT';
      badge.title='Show available players in '+info.pos+' '+info.name;
      badge.onclick=e=>{
        e.preventDefault();e.stopPropagation();
        expandedKey=expandedKey===key?'':key;
        decorate();
      };

      const host=nameNode.parentElement||row;
      host.appendChild(badge);
      if(expandedKey===key)renderDetail(root,row,info,members,key);
    }
  }

  function applyTierContext(){
    updateUi();
    decorate();
  }

  function installRenderHook(){
    const base=window.renderDraft;
    if(typeof base!=='function'||base.__workhorseTierContext)return false;
    const wrapped=function(...args){
      const out=base.apply(this,args);
      queueMicrotask(applyTierContext);
      return out;
    };
    wrapped.__workhorseTierContext=true;
    wrapped.__workhorseTierContextBase=base;
    window.renderDraft=wrapped;
    try{renderDraft=wrapped}catch(_){}
    return true;
  }

  function install(){
    ensureUi();
    installRenderHook();
    applyTierContext();
    return !!document.getElementById('draftList');
  }

  if(!install()){
    const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  [250,900,1800,3500].forEach(ms=>setTimeout(()=>{installRenderHook();applyTierContext()},ms));
})();
