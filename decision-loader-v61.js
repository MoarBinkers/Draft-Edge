// v61 feature loader — each decision-support feature is isolated so one failure cannot stop the others.
(()=>{
  const files=['./draft-current-pick-v68.js?v=681','./round-bands-v61.js?v=613','./smart-search-v62.js?v=621','./player-compare-v63.js?v=631','./edge-heat-v64.js?v=641','./draft-recap-v65.js?v=652','./draft-recap-trigger-v66.js?v=661','./draft-risk-v73.js?v=734','./player-fantasy-outlook-v74.js?v=743'];
  const loadOne=src=>new Promise(resolve=>{
    try{
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>resolve();
      s.onerror=()=>{console.warn('Workhorse optional feature failed to load:',src);resolve()};
      document.body.appendChild(s);
    }catch(e){console.warn('Workhorse optional feature loader error:',src,e);resolve()}
  });
  (async()=>{for(const src of files)await loadOne(src)})();
})();
