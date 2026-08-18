// v61 feature loader — each decision-support feature is isolated so one failure cannot stop the others.
(()=>{
  const files=['./round-bands-v61.js?v=611','./smart-search-v62.js?v=621'];
  const loadOne=src=>new Promise(resolve=>{
    try{
      const s=document.createElement('script');
      s.src=src;s.async=false;
      s.onload=()=>resolve();
      s.onerror=()=>{console.warn('Draft Edge optional feature failed to load:',src);resolve()};
      document.body.appendChild(s);
    }catch(e){console.warn('Draft Edge optional feature loader error:',src,e);resolve()}
  });
  (async()=>{for(const src of files)await loadOne(src)})();
})();
