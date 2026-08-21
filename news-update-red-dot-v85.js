// v85 — make ranking News Update badges easier to notice with a small red notification dot.
(()=>{
  if(document.getElementById('whNewsRedDot85Css'))return;
  const s=document.createElement('style');
  s.id='whNewsRedDot85Css';
  s.textContent=`
    #page-rankings .wh83-news-update::before,
    #page-adp .wh83-news-update::before{
      width:6px!important;
      height:6px!important;
      background:#ef4444!important;
      box-shadow:0 0 0 2px rgba(239,68,68,.16),0 0 7px rgba(239,68,68,.42)!important;
    }
  `;
  document.head.appendChild(s);
})();
