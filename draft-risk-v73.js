// v73.3 — Draft risk labels, clean Draft columns, position tabs above players, no duplicate Target/Avoid filters.
(()=>{
  const $=id=>document.getElementById(id);
  let lastSig='';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

  function installCss(){
    if($('de73Css'))return;
    const s=document.createElement('style');s.id='de73Css';s.textContent=`
      #page-draft .de72-prob,
      #page-draft .de71-prob,
      #page-draft #deProb70Status,
      #page-draft .de70-chance,
      #page-draft #deDraftIntel48>.de48-panel:nth-child(2){display:none!important}

      /* Target/Avoid already exist as tag controls; hide the duplicate smart-filter pair. */
      #page-draft #deDraftSmartFilters [data-smart="target"],
      #page-draft #deDraftSmartFilters [data-smart="avoid"]{display:none!important}

      .de73-risk{display:none}
      #page-draft .de73-risk{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:7px}
      #page-draft .de73-pill{display:inline-flex;align-items:center;padding:5px 8px;border-radius:8px;border:1px solid #3b4c58;background:#111a22;font-size:9px;font-weight:1000;line-height:1;white-space:nowrap}
      #page-draft .de73-pill.very-low{color:#7ce2a0;border-color:#346b4b;background:#102018}
      #page-draft .de73-pill.low{color:#9bddb0;border-color:#3f6950;background:#122019}
      #page-draft .de73-pill.medium{color:#f2c566;border-color:#7b5f31;background:#241d11}
      #page-draft .de73-pill.high{color:#ffb07a;border-color:#805131;background:#271a11}
      #page-draft .de73-pill.very-high{color:#ff9eaa;border-color:#74434a;background:#28171a}
      #page-draft .de73-pill.wait{color:#9ba8b2}
      #page-draft .de73-why{color:#8293a2;font-size:9px;line-height:1.35;min-width:0}

      #page-draft .colheads.rankings>div:last-child,
      #page-draft .player.rankings>.metric:last-child{display:none!important}
      #page-draft .colheads.rankings,
      #page-draft .player.rankings{grid-template-columns:minmax(340px,1fr) 92px 96px 96px 88px!important}

      #page-draft #draftPills{display:flex!important;align-items:center;gap:4px!important;flex-wrap:nowrap;width:max-content;max-width:100%;margin:2px 0 8px;padding:4px;border:1px solid #2b3d4b;border-radius:11px;background:#0e161e}
      #page-draft #draftPills .pill{min-width:48px;padding:7px 11px!important;border:0!important;border-radius:8px!important;background:transparent!important;color:#8999a7!important;font-size:10px!important;font-weight:950!important;cursor:pointer}
      #page-draft #draftPills .pill:hover{color:#dce7ef!important;background:#17232d!important}
      #page-draft #draftPills .pill.active{color:#eef6fb!important;background:#243645!important;box-shadow:inset 0 0 0 1px #45647b}

      @media(max-width:1280px){
        #page-draft .colheads.rankings,
        #page-draft .player.rankings{grid-template-columns:minmax(305px,1fr) 84px 88px 88px 78px!important}
      }
      @media(max-width:760px){
        #page-draft #draftPills{width:100%;overflow-x:auto}
        #page-draft .de73-risk{align-items:flex-start;flex-direction:column;gap:4px}
      }
    `;document.head.appendChild(s);
  }

  function riskBand(score){
    const n=Number(score);
    if(!Number.isFinite(n))return {cls:'wait',label:'Waiting for draft'};
    if(n<35)return {cls:'very-low',label:'Very Low Risk'};
    if(n<54)return {cls:'low',label:'Low Risk'};
    if(n<72)return {cls:'medium',label:'Medium Risk'};
    if(n<85)return {cls:'high',label:'High Risk'};
    return {cls:'very-high',label:'Very High Risk'};
  }

  function riskHtml(p){
    const intel=window.DraftEdgeDraftIntelligence;
    if(!intel||typeof intel.riskFor!=='function'){
      return '<div class="de73-risk"><span class="de73-pill wait">Waiting for draft</span><span class="de73-why">Connect Sleeper and choose your draft slot.</span></div>';
    }
    let target=0,r=null,run=null;
    try{
      target=Number(intel.nextUserPick?.()||0);
      r=intel.riskFor(p);
      run=intel.positionRun?.(String(p?.position||'').toUpperCase())||null;
    }catch(_){}
    if(!target||!Number.isFinite(Number(r?.score))){
      const why=(r?.reasons||[])[0]||'Connect Sleeper and choose your draft slot';
      return '<div class="de73-risk"><span class="de73-pill wait">Waiting for draft</span><span class="de73-why">'+esc(why)+'</span></div>';
    }
    const band=riskBand(r.score);
    const reasons=Array.isArray(r.reasons)?r.reasons.filter(Boolean).map(String):[];
    if(run&&(run.level==='hot'||run.level==='active')){
      const txt=String(run.label||'')+' '+String(p?.position||'')+' run';
      if(!reasons.some(x=>x.toLowerCase().includes('run')))reasons.push(txt);
    }
    const why=reasons.slice(0,3).join(' · ')||'Sleeper market + upcoming roster needs + positional scarcity';
    const title='Risk this player is taken before your next pick. Factors: Sleeper market timing, every roster picking before you and its positional needs, league starter requirements, current position runs, same-position competition, and positional drop-off/scarcity.';
    return '<div class="de73-risk"><span class="de73-pill '+band.cls+'" title="'+esc(title)+'">'+band.label+' · next pick #'+target+'</span><span class="de73-why">'+esc(why)+'</span></div>';
  }

  function installIntoCardBuilder(){
    let current=null;
    try{current=window.notePreview}catch(_){}
    if(typeof current!=='function')return false;
    if(current.__de73)return true;

    let base=current;
    if(current.__de72Base)base=current.__de72Base;
    else if(current.__de73Base)base=current.__de73Base;

    const wrapped=function(p,...args){
      let original='';
      try{original=base.call(this,p,...args)||''}catch(_){original=''}
      return original+riskHtml(p);
    };
    wrapped.__de73=true;wrapped.__de73Base=base;
    try{window.notePreview=wrapped}catch(_){}
    try{notePreview=wrapped}catch(_){}
    return true;
  }

  function ensurePositionTabs(){
    const root=$('draftPills'),list=$('draftList');if(!root)return false;
    const positions=['ALL','QB','RB','WR','TE'];
    if(root.querySelectorAll('.pill').length!==positions.length){
      root.innerHTML=positions.map(pos=>'<button class="pill" type="button" data-pos="'+pos+'">'+pos+'</button>').join('');
    }
    if(list?.parentNode&&root.nextElementSibling!==list)list.parentNode.insertBefore(root,list);

    let active='ALL';
    try{active=String(localStorage.getItem('de_draft_pos')||draftPos||'ALL')}catch(_){active=String(localStorage.getItem('de_draft_pos')||'ALL')}
    if(!positions.includes(active))active='ALL';
    root.querySelectorAll('.pill').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.pos===active);
      if(btn.dataset.de73)return;
      btn.addEventListener('click',()=>{
        const pos=btn.dataset.pos||'ALL';
        root.querySelectorAll('.pill').forEach(x=>x.classList.toggle('active',x===btn));
        localStorage.setItem('de_draft_pos',pos);
        try{draftPos=pos}catch(_){}
        try{window.renderDraft?.()}catch(_){}
      });
      btn.dataset.de73='1';
    });
    return true;
  }

  function removeDuplicateTagSmartFilters(){
    const root=$('deDraftSmartFilters');if(!root)return;
    const dup=[...root.querySelectorAll('[data-smart="target"],[data-smart="avoid"]')];
    const activeDup=dup.find(x=>x.classList.contains('active'));
    if(activeDup){
      const all=root.querySelector('[data-smart="all"]');
      if(all)all.click();
    }
    dup.forEach(x=>x.style.display='none');
  }

  function cleanDraftHeaders(){
    const head=$('draftList')?.querySelector(':scope > .colheads.rankings');
    if(!head)return;
    const kids=[...head.children];
    const last=kids[kids.length-1];
    if(last&&/adp\s*(move|change)/i.test(last.textContent||''))last.style.display='none';
  }

  function renderNow(){
    installCss();ensurePositionTabs();removeDuplicateTagSmartFilters();
    if(!installIntoCardBuilder())return;
    try{if(typeof window.renderDraft==='function')window.renderDraft()}catch(e){console.warn('Draft risk v73 render failed',e)}
    ensurePositionTabs();removeDuplicateTagSmartFilters();cleanDraftHeaders();
  }

  function signature(){
    const intel=window.DraftEdgeDraftIntelligence;
    let target=0,onClock=false;
    try{target=Number(intel?.nextUserPick?.()||0);onClock=!!intel?.isOnClock?.()}catch(_){}
    const slot=$('deDraftSlot')?.value||'';
    const state=$('draftState')?.textContent||'';
    let pos='ALL';try{pos=String(draftPos||'ALL')}catch(_){pos=String(localStorage.getItem('de_draft_pos')||'ALL')}
    return [target,onClock,slot,state,pos].join('|');
  }

  function sync(force=false){
    installCss();installIntoCardBuilder();ensurePositionTabs();removeDuplicateTagSmartFilters();
    const sig=signature();
    if(force||sig!==lastSig){lastSig=sig;renderNow()}
  }

  installCss();
  setTimeout(()=>sync(true),250);
  setTimeout(()=>sync(true),1000);
  setInterval(()=>sync(false),1000);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#connectDraft,[data-page="draft"]'))setTimeout(()=>{
      try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}
      sync(true);
    },450);
  });
  document.addEventListener('change',e=>{
    if(e.target?.id==='deDraftSlot')setTimeout(()=>{
      try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}
      sync(true);
    },100);
  });
  window.DraftEdgeDraftRisk={refresh:()=>sync(true),htmlFor:riskHtml,bandFor:riskBand};
})();
