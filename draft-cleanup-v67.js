// v67 — cleaner Draft screen + estimated chance a player is still available at your next pick.
(()=>{
  const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let decorating=false,timer=null;
  function playersList(){try{return Array.isArray(players)?players:[]}catch(_){return []}}
  function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
  function byName(name){const key=norm(name);return playersList().find(p=>norm(p?.name)===key)||null}
  function chanceBack(p){
    try{
      const r=window.DraftEdgeDraftIntelligence?.riskFor?.(p);if(!r||!Number.isFinite(Number(r.score)))return null;
      const raw=clamp(100-Number(r.score),5,95);return Math.round(raw/5)*5;
    }catch(_){return null}
  }
  function tone(pct){return pct>=70?'good':pct>=45?'mid':'bad'}
  function css(){
    if($('deDraftClean67Css'))return;const s=document.createElement('style');s.id='deDraftClean67Css';s.textContent=`
      #page-draft #deDraftIntel48{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:10px!important}
      #page-draft #deDraftIntel48>.de48-panel{padding:11px 12px!important;border-radius:12px!important}
      #page-draft #deDraftIntel48>.de48-panel:first-child{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px 10px;align-items:start}
      #page-draft #deDraftIntel48>.de48-panel:first-child h3,#page-draft #deDraftIntel48>.de48-panel:first-child>.de48-sub{grid-column:1/-1}
      #page-draft #deDraftIntel48>.de48-panel:first-child .de48-pos{display:block;padding:7px 8px;border:1px solid #20313e;border-radius:9px;background:#101922;min-width:0}
      #page-draft #deDraftIntel48>.de48-panel:first-child .de48-pos b{display:block;margin-bottom:2px}
      #page-draft #deDraftIntel48>.de48-panel:first-child .de48-meta{font-size:9px;line-height:1.35}
      #page-draft #deDraftIntel48 .de48-upcoming{display:none!important}
      #page-draft #deDraftIntel48 .de48-player{grid-template-columns:minmax(0,1fr) auto;padding:8px 0;align-items:center}
      #page-draft #deDraftIntel48 .de48-why{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:720px}
      #page-draft #deDraftIntel48 .de48-risk{min-width:82px;text-align:center;border-radius:9px;padding:6px 8px}
      #page-draft #deDraftIntel48 .de67-chance{display:block;font-size:12px;font-weight:1000;line-height:1.05}
      #page-draft #deDraftIntel48 .de67-label{display:block;margin-top:3px;font-size:8px;font-weight:850;color:#8fa0ad;text-transform:uppercase;letter-spacing:.04em}
      #page-draft #deDraftIntel48 .de48-risk.de67-good{color:#7ce2a0;border-color:#346b4b;background:#102018}
      #page-draft #deDraftIntel48 .de48-risk.de67-mid{color:#f2c566;border-color:#7b5f31;background:#241d11}
      #page-draft #deDraftIntel48 .de48-risk.de67-bad{color:#ff9eaa;border-color:#74434a;background:#28171a}
      @media(max-width:760px){#page-draft #deDraftIntel48>.de48-panel:first-child{grid-template-columns:repeat(2,minmax(0,1fr))}#page-draft #deDraftIntel48 .de48-why{max-width:52vw}}
    `;document.head.appendChild(s)
  }
  function decorate(){
    if(decorating)return;decorating=true;
    try{
      css();const root=$('deDraftIntel48');if(!root)return;
      const panels=root.querySelectorAll(':scope > .de48-panel'),second=panels[1];
      if(second){
        const sub=second.querySelector(':scope > .de48-sub');
        if(sub)sub.textContent='Estimated chance each player is still available at your next pick. Based on Sleeper market timing, the teams picking before you, recent position runs and scarcity.';
      }
      root.querySelectorAll('.de48-player').forEach(row=>{
        const name=row.querySelector('.de48-pname')?.textContent?.trim(),p=byName(name),pill=row.querySelector('.de48-risk');if(!p||!pill)return;
        const pct=chanceBack(p);if(pct==null)return;
        pill.classList.remove('safe','lean','risky','high','unknown','de67-good','de67-mid','de67-bad');pill.classList.add('de67-'+tone(pct));
        pill.innerHTML='<span class="de67-chance">'+pct+'%</span><span class="de67-label">chance back</span>';
        pill.title='Estimated chance '+name+' is still available at your next pick. This is a Draft Edge estimate, not a guaranteed probability.';
      });
    }finally{decorating=false}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(decorate,20)}
  css();setTimeout(decorate,250);setTimeout(decorate,1200);
  const root=$('page-draft')||document.body;const ob=new MutationObserver(()=>schedule());ob.observe(root,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='deDraftSlot')setTimeout(decorate,80)});
  window.DraftEdgeDraftCleanup={refresh:decorate,chanceBack};
})();
