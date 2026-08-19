// v78.0 — make genuine Sleeper no-ADP rows explicit without inventing market values.
(()=>{
  let installed=false;

  function install(){
    try{
      if(installed)return true;
      if(typeof rankRow!=='function')return false;
      const base=rankRow;
      if(base.__workhorseUnrankedLabels){installed=true;return true}

      const wrapped=function(p,mode='rankings'){
        const html=base.apply(this,arguments);
        if(mode!=='rankings')return html;

        let info=null;
        try{info=typeof marketFor==='function'?marketFor(p):null}catch(_){}
        if(info?.rank!=null)return html;

        try{
          const box=document.createElement('div');
          box.innerHTML=html;
          const row=box.firstElementChild;
          if(!row)return html;
          const metrics=row.querySelectorAll(':scope > .metric');

          // My Rank is always owned by the user's list, never by Sleeper.
          if(metrics[0]){
            const value=metrics[0].querySelector('.num');
            if(value&&(!value.textContent.trim()||value.textContent.trim()==='—')){
              let rank=null;
              try{rank=String(rankPos||'ALL').toUpperCase()==='ALL'?Number(p?.overall):Number(p?.posRank)}catch(_){rank=Number(p?.overall)}
              if(Number.isFinite(rank)&&rank>0)value.textContent='#'+rank;
            }
          }

          const explanation='Sleeper currently has no usable ADP for this player in the selected format.';
          if(metrics[2]){
            const value=metrics[2].querySelector('.num');
            if(value){value.textContent='NR';value.title=explanation;value.setAttribute('aria-label',explanation)}
          }
          if(metrics[3]){
            const value=metrics[3].querySelector('.edge');
            if(value){value.textContent='NR';value.classList.remove('good','bad');value.title='My Edge needs a real Sleeper ADP, so it is unavailable for this player.'}
          }
          if(metrics[4]){
            const value=metrics[4].querySelector('.move');
            if(value){value.textContent='NR';value.classList.remove('up','down');value.classList.add('flat');value.title=explanation}
          }
          return row.outerHTML;
        }catch(_){return html}
      };

      wrapped.__workhorseUnrankedLabels=true;
      rankRow=wrapped;
      try{window.rankRow=wrapped}catch(_){}
      installed=true;
      return true;
    }catch(e){
      console.warn('Workhorse unranked-label helper could not install',e);
      return false;
    }
  }

  function refresh(){
    if(!install())return;
    try{if(typeof renderRankings==='function')renderRankings()}catch(e){console.warn('Workhorse unranked-label render skipped',e)}
  }

  refresh();
  [300,900,1800,3500].forEach(ms=>setTimeout(refresh,ms));
  window.WorkhorseUnrankedLabels={refresh};
})();
