// v71 — next-pick availability probability lives directly on every Live Draft player card.
// Uses Draft Intelligence's live model: Sleeper market timing, upcoming roster needs,
// position runs, same-position competition/drop-off, league format, and distance to user's next pick.
(()=>{
  const $=id=>document.getElementById(id);
  let decorateTimer=null;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function playerForRow(row){
    const list=Array.isArray(window.players)?window.players:[];
    const idx=Number(row?.dataset?.index);
    if(Number.isInteger(idx)&&list[idx])return list[idx];
    const name=row?.querySelector('.name')?.textContent?.trim().toLowerCase();
    return name?list.find(p=>String(p?.name||'').trim().toLowerCase()===name)||null:null;
  }

  function installCss(){
    if($('de71Css'))return;
    const s=document.createElement('style');s.id='de71Css';s.textContent=`
      #page-draft #deDraftIntel48>.de48-panel:nth-child(2){display:none!important}
      #page-draft #deProb70Status,.de70-chance{display:none!important}
      #page-draft .de71-prob{display:flex;align-items:center;gap:9px;margin-top:7px;min-width:0}
      #page-draft .de71-prob-main{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border:1px solid #3b4c58;border-radius:8px;background:#111a22;white-space:nowrap;font-size:9px;font-weight:1000;line-height:1}
      #page-draft .de71-prob-main strong{font-size:12px;letter-spacing:-.02em}
      #page-draft .de71-prob-main.good{color:#7ce2a0;border-color:#346b4b;background:#102018}
      #page-draft .de71-prob-main.mid{color:#f2c566;border-color:#7b5f31;background:#241d11}
      #page-draft .de71-prob-main.bad{color:#ff9eaa;border-color:#74434a;background:#28171a}
      #page-draft .de71-prob-main.wait{color:#9ba8b2}
      #page-draft .de71-prob-why{min-width:0;color:#8293a2;font-size:9px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      @media(max-width:720px){#page-draft .de71-prob{align-items:flex-start;flex-direction:column;gap:4px}#page-draft .de71-prob-why{white-space:normal}}
    `;document.head.appendChild(s);
  }

  function tone(pct){return pct>=70?'good':pct>=45?'mid':'bad'}
  function roundedChance(score){
    if(!Number.isFinite(Number(score)))return null;
    const pct=clamp(100-Number(score),5,95);
    return Math.round(pct/5)*5;
  }

  function ensureCardBlock(row){
    let root=row.querySelector('.de71-prob');
    if(root)return root;
    const host=row.querySelector('.playertext')||row.querySelector('.person')||row;
    root=document.createElement('div');root.className='de71-prob';
    host.appendChild(root);return root;
  }

  function decorate(){
    installCss();
    $('deProb70Status')?.remove();
    document.querySelectorAll('#page-draft .de70-chance').forEach(x=>x.remove());
    const list=$('draftList');if(!list)return;
    const intel=window.DraftEdgeDraftIntelligence;
    const target=typeof intel?.nextUserPick==='function'?Number(intel.nextUserPick()||0):0;

    list.querySelectorAll(':scope > .player').forEach(row=>{
      const p=playerForRow(row),root=ensureCardBlock(row);if(!p||!root)return;
      if(!intel||typeof intel.riskFor!=='function'){
        root.innerHTML='<span class="de71-prob-main wait"><strong>—</strong> chance at next pick</span><span class="de71-prob-why">Connecting draft intelligence…</span>';
        return;
      }
      let r=null;
      try{r=intel.riskFor(p)}catch(_){}
      const pct=roundedChance(r?.score);
      if(!target||pct==null){
        const reason=(r?.reasons||[])[0]||'Connect Sleeper and select your draft slot';
        root.innerHTML='<span class="de71-prob-main wait"><strong>—</strong> chance at next pick</span><span class="de71-prob-why">'+String(reason).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</span>';
        return;
      }
      const reasons=Array.isArray(r?.reasons)?r.reasons.filter(Boolean):[];
      let run='';
      try{const pr=intel.positionRun?.(String(p.position||'').toUpperCase());if(pr&&(pr.level==='hot'||pr.level==='active'))run=String(pr.label||'')+' '+String(p.position||'')+' run'}catch(_){}
      const details=[...reasons];if(run&&!details.some(x=>String(x).toLowerCase().includes('run')))details.push(run);
      const why=details.slice(0,2).join(' · ')||'Sleeper ADP + upcoming roster needs + position scarcity';
      const safeWhy=String(why).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      root.innerHTML='<span class="de71-prob-main '+tone(pct)+'" title="Estimated chance this player is still available at your next pick. Model factors: Sleeper market rank, rosters picking before you, team positional needs, league format, position runs, same-position players ahead, and positional drop-off/scarcity."><strong>'+pct+'%</strong> at pick #'+target+'</span><span class="de71-prob-why">'+safeWhy+'</span>';
    });
  }

  function schedule(){clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,20)}
  function wireList(){
    const list=$('draftList');if(!list||list.dataset.de71Observed)return;
    new MutationObserver(schedule).observe(list,{childList:true,subtree:false});
    list.dataset.de71Observed='1';
  }

  function wrapRender(){
    const base=window.renderDraft;if(typeof base!=='function'||base.__de71)return;
    const wrapped=function(...args){const out=base.apply(this,args);setTimeout(()=>{wireList();decorate()},0);return out};
    wrapped.__de71=true;window.renderDraft=wrapped;
  }

  function boot(){installCss();wrapRender();wireList();decorate()}
  setTimeout(boot,250);setTimeout(boot,900);
  setInterval(()=>{wrapRender();wireList();decorate()},1000);
  document.addEventListener('click',e=>{if(e.target.closest?.('#connectDraft'))setTimeout(()=>{try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}decorate()},400)});
  document.addEventListener('change',e=>{if(e.target?.id==='deDraftSlot')setTimeout(()=>{try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}decorate()},80)});
  window.DraftEdgeCardProbability={refresh:decorate};
})();
