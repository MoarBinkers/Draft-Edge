// v69 — native Draft probability panel. Replaces the old label-only intelligence block with clear estimated chance-back percentages.
(()=>{
  const $=id=>document.getElementById(id);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  let timer=null;

  function ps(){try{return Array.isArray(window.players)?window.players:[]}catch(_){return []}}
  function market(p){try{return typeof window.marketFor==='function'?window.marketFor(p):null}catch(_){return null}}
  function intel(){return window.DraftEdgeDraftIntelligence||null}
  function currentPick(){try{return Number(intel()?.currentPick?.())||null}catch(_){return null}}
  function nextPick(){try{return Number(intel()?.nextUserPick?.())||null}catch(_){return null}}
  function slot(){try{return Number(window.DraftEdgeDraftOwnership?.selectedSlot?.())||Number(document.getElementById('deDraftSlot')?.value)||null}catch(_){return null}}

  function chanceFor(p){
    const i=intel(),target=nextPick(),cur=currentPick();
    try{
      const r=i?.riskFor?.(p);
      if(Number.isFinite(Number(r?.score))){
        const pct=clamp(100-Number(r.score),5,95);
        return {pct:Math.round(pct/5)*5,reason:(r.reasons||[])[0]||''};
      }
    }catch(_){}
    if(!target||!cur)return {pct:null,reason:''};
    const m=market(p),mr=Number(m?.rank)||Number(m?.adp)||0;
    if(!mr)return {pct:null,reason:'No Sleeper market rank available'};
    const span=Math.max(1,target-cur);
    let pct;
    if(mr<=cur)pct=12;
    else if(mr<target)pct=18+((mr-cur)/span)*58;
    else pct=78+Math.min(17,(mr-target)*1.4);
    pct=Math.round(clamp(pct,5,95)/5)*5;
    return {pct,reason:'Sleeper market timing vs your next pick'};
  }

  function visiblePlayers(){
    const list=$('draftList');
    if(list){
      const out=[];
      for(const row of list.querySelectorAll(':scope > .player')){
        if(row.offsetParent===null)continue;
        const idx=Number(row.dataset.index);
        if(Number.isInteger(idx)&&ps()[idx])out.push(ps()[idx]);
        else{
          const name=row.querySelector('.name')?.textContent?.trim()||'';
          const p=ps().find(x=>norm(x?.name)===norm(name));if(p)out.push(p);
        }
        if(out.length>=10)break;
      }
      if(out.length)return out;
    }
    return ps().filter(p=>!p?.drafted).sort((a,b)=>(Number(a?.overall)||9999)-(Number(b?.overall)||9999)).slice(0,10);
  }

  function css(){
    if($('deProb69Css'))return;
    const s=document.createElement('style');s.id='deProb69Css';s.textContent=`
      #page-draft #deDraftIntel48{display:none!important}
      #deDraftProbability69{margin:0 0 12px;border:1px solid #2b3d4b;border-radius:14px;background:#0e161e;overflow:hidden}
      .de69-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:12px 13px;border-bottom:1px solid #20303c}
      .de69-head h3{margin:0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#b7c5cf}.de69-sub{margin-top:4px;color:#7f91a0;font-size:9px;line-height:1.4}.de69-next{flex:0 0 auto;border:1px solid #345166;border-radius:9px;background:#10202c;color:#9fd2f1;padding:6px 8px;font-size:9px;font-weight:950}
      .de69-list{padding:0 13px}.de69-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #1f2c36}.de69-row:last-child{border-bottom:0}.de69-name{font-size:11px;font-weight:950;color:#e6edf2}.de69-meta{margin-top:3px;color:#8495a3;font-size:9px}.de69-why{margin-top:3px;color:#788a98;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:680px}
      .de69-pct{min-width:82px;text-align:center;border:1px solid #3b4c58;border-radius:10px;padding:7px 8px;font-weight:1000}.de69-pct b{display:block;font-size:15px;line-height:1}.de69-pct span{display:block;margin-top:3px;font-size:7px;letter-spacing:.06em;text-transform:uppercase}.de69-good{color:#7ce2a0;border-color:#346b4b;background:#102018}.de69-mid{color:#f2c566;border-color:#7b5f31;background:#241d11}.de69-bad{color:#ff9eaa;border-color:#74434a;background:#28171a}.de69-unknown{color:#9ba8b2}
      .de69-empty{padding:13px;color:#8fa0ad;font-size:10px}
      @media(max-width:700px){.de69-head{align-items:center}.de69-why{max-width:55vw}.de69-pct{min-width:70px}}
    `;document.head.appendChild(s);
  }

  function ensure(){
    css();let root=$('deDraftProbability69');if(root)return root;
    const list=$('draftList');if(!list)return null;
    root=document.createElement('section');root.id='deDraftProbability69';
    const mine=$('deMyPicks43');
    if(mine)mine.insertAdjacentElement('afterend',root);else list.parentNode.insertBefore(root,list);
    return root;
  }

  function tone(p){return p>=70?'de69-good':p>=45?'de69-mid':'de69-bad'}
  function render(){
    const root=ensure();if(!root)return;
    const target=nextPick(),cur=currentPick(),s=slot();
    if(!intel()){
      root.innerHTML='<div class="de69-head"><div><h3>Will They Make It Back?</h3><div class="de69-sub">Live probability panel is loading.</div></div></div>';return;
    }
    if(!s){
      root.innerHTML='<div class="de69-head"><div><h3>Will They Make It Back?</h3><div class="de69-sub">Connect your Sleeper draft and choose your draft slot to calculate your exact next turn.</div></div></div>';return;
    }
    if(!target){
      root.innerHTML='<div class="de69-head"><div><h3>Will They Make It Back?</h3><div class="de69-sub">No future pick found for your selected slot.</div></div></div>';return;
    }
    const rows=visiblePlayers();
    const body=rows.map(p=>{
      const c=chanceFor(p),m=market(p),sr=Number(m?.rank)||Number(m?.adp)||null,pct=c.pct;
      const pill=pct==null?'<div class="de69-pct de69-unknown"><b>—</b><span>chance back</span></div>':'<div class="de69-pct '+tone(pct)+'"><b>'+pct+'%</b><span>chance back</span></div>';
      return '<div class="de69-row"><div><div class="de69-name">'+String(p?.name||'Player').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))+'</div><div class="de69-meta">Your #'+(Number(p?.overall)||'—')+(sr?' · Sleeper #'+Math.round(sr):'')+' · '+String(p?.position||'')+'</div><div class="de69-why">'+(c.reason||'Estimated from Sleeper timing and the teams picking before you')+'</div></div>'+pill+'</div>';
    }).join('');
    root.innerHTML='<div class="de69-head"><div><h3>Will They Make It Back?</h3><div class="de69-sub">Estimated chance each available player is still there at your next pick. This is an estimate, not a guarantee.</div></div><div class="de69-next">'+(cur?'Now #'+cur+' · ':'')+'Next pick #'+target+'</div></div><div class="de69-list">'+(body||'<div class="de69-empty">No available players to show.</div>')+'</div>';
  }

  function start(){clearInterval(timer);render();timer=setInterval(render,1000)}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
  const ob=new MutationObserver(()=>{if(!$('deDraftProbability69'))render()});ob.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='deDraftSlot')setTimeout(render,60)});
  window.DraftEdgeDraftProbability={refresh:render,chanceFor};
})();
