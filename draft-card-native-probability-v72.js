// v72 — probability is injected during the Draft player-card HTML build via notePreview().
// The live model already factors Sleeper market timing, rosters/needs before the user's next pick,
// league starter requirements, position runs, same-position competition, and positional drop-off/scarcity.
(()=>{
  const $=id=>document.getElementById(id);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let lastSig='';

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

  function installCss(){
    if($('de72Css'))return;
    const s=document.createElement('style');s.id='de72Css';s.textContent=`
      .de72-prob{display:none}
      #page-draft .de72-prob{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:7px}
      #page-draft .de72-pill{display:inline-flex;align-items:baseline;gap:4px;padding:5px 8px;border:1px solid #3b4c58;border-radius:8px;background:#111a22;font-size:9px;font-weight:900;line-height:1}
      #page-draft .de72-pill strong{font-size:13px;letter-spacing:-.02em}
      #page-draft .de72-pill.good{color:#7ce2a0;border-color:#346b4b;background:#102018}
      #page-draft .de72-pill.mid{color:#f2c566;border-color:#7b5f31;background:#241d11}
      #page-draft .de72-pill.bad{color:#ff9eaa;border-color:#74434a;background:#28171a}
      #page-draft .de72-pill.wait{color:#9ba8b2}
      #page-draft .de72-why{color:#8293a2;font-size:9px;line-height:1.35;min-width:0}
      #page-draft #deDraftIntel48>.de48-panel:nth-child(2),
      #page-draft #deProb70Status,
      #page-draft .de70-chance,
      #page-draft .de71-prob{display:none!important}
      @media(max-width:720px){#page-draft .de72-prob{align-items:flex-start;flex-direction:column;gap:4px}}
    `;document.head.appendChild(s);
  }

  function tone(pct){return pct>=70?'good':pct>=45?'mid':'bad'}

  function probabilityHtml(p){
    const intel=window.DraftEdgeDraftIntelligence;
    if(!intel||typeof intel.riskFor!=='function'){
      return '<div class="de72-prob"><span class="de72-pill wait"><strong>—</strong> chance next pick</span><span class="de72-why">Loading live draft model…</span></div>';
    }
    let target=0,r=null,run=null;
    try{target=Number(intel.nextUserPick?.()||0);r=intel.riskFor(p);run=intel.positionRun?.(String(p?.position||'').toUpperCase())||null}catch(_){}
    if(!target||!Number.isFinite(Number(r?.score))){
      const reason=(r?.reasons||[])[0]||'Connect Sleeper and select your draft slot';
      return '<div class="de72-prob"><span class="de72-pill wait"><strong>—</strong> chance next pick</span><span class="de72-why">'+esc(reason)+'</span></div>';
    }

    const pct=Math.round(clamp(100-Number(r.score),5,95)/5)*5;
    const reasons=Array.isArray(r.reasons)?r.reasons.filter(Boolean).map(String):[];
    if(run&&(run.level==='hot'||run.level==='active')){
      const txt=String(run.label||'')+' '+String(p?.position||'')+' run';
      if(!reasons.some(x=>x.toLowerCase().includes('run')))reasons.push(txt);
    }
    const why=reasons.slice(0,3).join(' · ')||'ADP + upcoming roster needs + position scarcity';
    const title='Estimated chance this player is still available at your next pick. Factors include Sleeper market rank, every roster picking before you and its positional needs, league starter requirements, current position runs, same-position competition, and drop-off/scarcity at the position.';
    return '<div class="de72-prob"><span class="de72-pill '+tone(pct)+'" title="'+esc(title)+'"><strong>'+pct+'%</strong> at pick #'+target+'</span><span class="de72-why">'+esc(why)+'</span></div>';
  }

  function installIntoCardBuilder(){
    let current=null;
    try{current=window.notePreview}catch(_){}
    if(typeof current!=='function')return false;
    if(current.__de72)return true;

    const base=current.__de72Base||current;
    const wrapped=function(p,...args){
      let original='';
      try{original=base.call(this,p,...args)||''}catch(_){original=''}
      return original+probabilityHtml(p);
    };
    wrapped.__de72=true;wrapped.__de72Base=base;
    try{window.notePreview=wrapped}catch(_){}
    try{notePreview=wrapped}catch(_){}
    return true;
  }

  function renderNow(){
    installCss();
    if(!installIntoCardBuilder())return;
    try{if(typeof window.renderDraft==='function')window.renderDraft()}catch(e){console.warn('Draft probability v72 render failed',e)}
  }

  function signature(){
    const intel=window.DraftEdgeDraftIntelligence;
    if(!intel)return 'no-intel';
    let target=0,onClock=false;
    try{target=Number(intel.nextUserPick?.()||0);onClock=!!intel.isOnClock?.()}catch(_){}
    const slot=$('deDraftSlot')?.value||'';
    const state=$('draftState')?.textContent||'';
    return [target,onClock,slot,state].join('|');
  }

  function sync(force=false){
    installIntoCardBuilder();
    const sig=signature();
    if(force||sig!==lastSig){lastSig=sig;renderNow()}
  }

  installCss();
  setTimeout(()=>sync(true),250);
  setTimeout(()=>sync(true),1000);
  setInterval(()=>sync(false),1000);
  setInterval(()=>{if($('page-draft')?.classList.contains('active'))renderNow()},2000);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('#connectDraft,[data-page="draft"]'))setTimeout(()=>{try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}sync(true)},450);
  });
  document.addEventListener('change',e=>{
    if(e.target?.id==='deDraftSlot')setTimeout(()=>{try{window.DraftEdgeDraftIntelligence?.refresh?.()}catch(_){}sync(true)},100);
  });
  window.DraftEdgeNativeCardProbability={refresh:()=>sync(true),htmlFor:probabilityHtml};
})();
