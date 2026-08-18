// v59 — tag UX upgrade: hover motion, inline filters, priority edge rails, legend, and draft emphasis.
(()=>{
  const PRIORITY=['red','blue','green','orange','purple','teal','yellow'];
  const COPY={
    green:'Comfortable taking this player at or near their cost.',
    blue:'A player you actively want to leave the draft with.',
    purple:'A player you think the room or market is undervaluing.',
    teal:'A player with a strong chance to make a meaningful leap.',
    yellow:'You like parts of the profile, but something is holding you back.',
    orange:'Meaningful downside, uncertainty, or volatility comes with the pick.',
    red:'A player you would rather pass on at their current cost.'
  };
  const LABELS={green:'Safe Pick',yellow:'Hesitant',red:'Avoid',blue:'Target',purple:'Sleeper',orange:'Risk',teal:'Breakout'};
  const COLORS={green:'#4ade80',yellow:'#facc15',red:'#fb7185',blue:'#60a5fa',purple:'#c084fc',orange:'#fb923c',teal:'#2dd4bf'};
  const EMOJI={green:'✔',yellow:'🤔',red:'❌',blue:'🎯',purple:'💎',orange:'⚠️',teal:'🚀'};

  function getPlayers(){try{return Array.isArray(players)?players:[]}catch(_){return []}}
  function getTags(){try{return typeof TAGS!=='undefined'?TAGS:null}catch(_){return null}}
  function tagsFor(p){return (p?.tags||[]).filter(k=>PRIORITY.includes(k))}
  function priorityFor(p){const set=new Set(tagsFor(p));return PRIORITY.find(k=>set.has(k))||''}
  function count(k){const ps=getPlayers();return k==='ALL'?ps.length:ps.filter(p=>(p.tags||[]).includes(k)).length}
  function active(){try{return activeTagFilter||'ALL'}catch(_){return 'ALL'}}
  function tagInfo(k){const t=getTags()?.[k]||{};return {name:t.name||LABELS[k]||k,emoji:t.emoji||EMOJI[k]||'🏷️',color:t.color||COLORS[k]||'#dce5ec'}}

  function injectCss(){
    if(document.getElementById('deTags59Css'))return;
    const s=document.createElement('style');s.id='deTags59Css';s.textContent=`
      .tag{border-radius:7px;transition:transform .16s ease,filter .16s ease,text-shadow .16s ease,background .16s ease;transform-origin:center}
      .tag:hover{transform:translateY(-2px) scale(1.23);filter:brightness(1.16) saturate(1.12);text-shadow:0 0 12px currentColor;background:color-mix(in srgb,currentColor 11%,transparent)}
      .tag:active{transform:translateY(0) scale(.96)}
      .tag-choice{position:relative;overflow:hidden;transition:transform .16s ease,box-shadow .16s ease,filter .16s ease,border-color .16s ease!important}
      .tag-choice:hover{transform:translateY(-2px) scale(1.015);filter:brightness(1.07);box-shadow:0 8px 18px #0000002e,0 0 14px color-mix(in srgb,currentColor 18%,transparent)}
      .tag-choice:active{transform:translateY(0) scale(.985)}
      .tag-choice.selected{box-shadow:0 7px 16px #00000026,inset 0 0 0 1px #ffffff0b}

      .de59-tagbar{display:flex;align-items:center;gap:7px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;margin:0 0 12px;padding:2px 1px 5px;white-space:nowrap}
      .de59-tagbar::-webkit-scrollbar{display:none}
      .de59-filter{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border:1px solid #2c3d4c;background:#111a22;color:#aebbc6;border-radius:999px;padding:7px 10px;font-size:10px;font-weight:900;cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease,color .15s ease,box-shadow .15s ease}
      .de59-filter:hover{transform:translateY(-1px);border-color:#536b7e;background:#17232d;color:#e2eaf0}
      .de59-filter.active{color:#f4f8fb;border-color:color-mix(in srgb,var(--tag-color,#5da5d6) 65%,#44515d);background:color-mix(in srgb,var(--tag-color,#5da5d6) 13%,#14202a);box-shadow:0 0 0 1px color-mix(in srgb,var(--tag-color,#5da5d6) 12%,transparent) inset,0 5px 16px #00000020}
      .de59-filter .de59-count{color:#7f91a0;font-size:9px;font-weight:1000}
      .de59-filter.active .de59-count{color:#c4d1da}
      .de59-legend-btn{margin-left:auto;border-style:dashed;color:#92a5b5}

      .player.de59-tagged{position:relative;overflow:hidden;--de-tag-color:#607487}
      .player.de59-tagged::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:0 4px 4px 0;background:var(--de-tag-color);box-shadow:0 0 12px color-mix(in srgb,var(--de-tag-color) 58%,transparent);pointer-events:none;z-index:2;opacity:.92}
      .player.de59-priority-red{--de-tag-color:${COLORS.red}}
      .player.de59-priority-blue{--de-tag-color:${COLORS.blue}}
      .player.de59-priority-green{--de-tag-color:${COLORS.green}}
      .player.de59-priority-orange{--de-tag-color:${COLORS.orange}}
      .player.de59-priority-purple{--de-tag-color:${COLORS.purple}}
      .player.de59-priority-teal{--de-tag-color:${COLORS.teal}}
      .player.de59-priority-yellow{--de-tag-color:${COLORS.yellow}}

      #page-draft .player.de59-draft-blue,#page-draft .player.de59-draft-green,#page-draft .player.de59-draft-purple,#page-draft .player.de59-draft-teal{background-image:linear-gradient(90deg,color-mix(in srgb,var(--de-tag-color) 8%,transparent),transparent 34%)}
      #page-draft .player.de59-draft-red{background-image:linear-gradient(90deg,color-mix(in srgb,${COLORS.red} 7%,transparent),transparent 30%);filter:saturate(.82)}
      #page-draft .player.de59-draft-orange{background-image:linear-gradient(90deg,color-mix(in srgb,${COLORS.orange} 6%,transparent),transparent 30%)}
      #page-draft .player.de59-draft-blue::before,#page-draft .player.de59-draft-green::before,#page-draft .player.de59-draft-purple::before,#page-draft .player.de59-draft-teal::before{width:4px;opacity:1}

      #deTagLegend59{position:fixed;inset:0;z-index:2147482500;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,9,14,.76);backdrop-filter:blur(7px)}
      #deTagLegend59.open{display:flex}
      #deTagLegend59 .de59-legend-card{width:min(100%,520px);max-height:min(720px,calc(100vh - 36px));overflow:auto;border:1px solid #314553;border-radius:18px;background:linear-gradient(180deg,#121b24,#0d151d);box-shadow:0 24px 70px #00000075;padding:20px;box-sizing:border-box}
      #deTagLegend59 .de59-legend-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      #deTagLegend59 h2{margin:0;font-size:20px}.de59-legend-sub{margin:6px 0 0;color:#8fa1b0;font-size:12px;line-height:1.45}
      #deTagLegend59 .de59-close{width:34px;height:34px;border:1px solid #304250;border-radius:10px;background:#101923;color:#b8c5cf;font-size:20px;cursor:pointer}
      .de59-legend-list{display:grid;gap:8px;margin-top:16px}.de59-legend-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;padding:10px 11px;border:1px solid #263744;border-radius:12px;background:#101821}
      .de59-legend-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;border:1px solid color-mix(in srgb,var(--tag-color) 40%,#344654);background:color-mix(in srgb,var(--tag-color) 10%,#111a22);font-size:16px}
      .de59-legend-row b{font-size:11px}.de59-legend-row p{margin:3px 0 0;color:#91a1ae;font-size:10px;line-height:1.45}
      .de59-priority-note{margin-top:13px;padding:11px 12px;border:1px solid #2b4050;border-radius:12px;background:#101b24;color:#9eb0be;font-size:10px;line-height:1.5}.de59-priority-note b{color:#dce6ed}

      @media(max-width:620px){.de59-filter{padding:7px 9px}.de59-filter .de59-label{display:none}.de59-filter[data-key="ALL"] .de59-label,.de59-legend-btn .de59-label{display:inline}.de59-tagbar{margin-bottom:9px}#deTagLegend59{align-items:flex-end;padding:10px}#deTagLegend59 .de59-legend-card{width:100%;border-radius:18px 18px 14px 14px;max-height:82vh}}
      @media(prefers-reduced-motion:reduce){.tag,.tag-choice,.de59-filter{transition:none!important}.tag:hover,.tag-choice:hover,.de59-filter:hover{transform:none!important}}
    `;document.head.appendChild(s);
  }

  function makeLegend(){
    if(document.getElementById('deTagLegend59'))return;
    const root=document.createElement('div');root.id='deTagLegend59';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
    root.innerHTML='<div class="de59-legend-card"><div class="de59-legend-head"><div><h2>Tag Legend</h2><div class="de59-legend-sub">Use tags as your quick draft-day read on a player. A player can have more than one.</div></div><button class="de59-close" aria-label="Close">×</button></div><div class="de59-legend-list"></div><div class="de59-priority-note"><b>Card-edge priority:</b> Avoid → Target → Safe Pick → Risk → Sleeper → Breakout → Hesitant. If a player has multiple tags, this only decides the edge color; all tags still stay on the player.</div></div>';
    document.body.appendChild(root);
    const list=root.querySelector('.de59-legend-list');
    list.innerHTML=PRIORITY.map(k=>{const t=tagInfo(k);return '<div class="de59-legend-row" style="--tag-color:'+t.color+'"><span class="de59-legend-icon">'+t.emoji+'</span><div><b style="color:'+t.color+'">'+t.name+'</b><p>'+COPY[k]+'</p></div></div>'}).join('');
    const close=()=>root.classList.remove('open');root.querySelector('.de59-close').onclick=close;root.addEventListener('click',e=>{if(e.target===root)close()});
  }
  function openLegend(){makeLegend();document.getElementById('deTagLegend59')?.classList.add('open')}

  function barHtml(){
    const a=active();
    const all={name:'All',emoji:'🏷️',color:'#8fa4b5'};
    const items=[['ALL',all],...['green','blue','purple','teal','yellow','orange','red'].map(k=>[k,tagInfo(k)])];
    return items.map(([k,t])=>'<button type="button" class="de59-filter'+(a===k?' active':'')+'" data-key="'+k+'" style="--tag-color:'+t.color+'" title="'+t.name+'"><span>'+t.emoji+'</span><span class="de59-label">'+t.name+'</span><span class="de59-count">'+count(k)+'</span></button>').join('')+'<button type="button" class="de59-filter de59-legend-btn" data-legend="1" title="Tag legend"><span>?</span><span class="de59-label">Legend</span></button>';
  }

  function ensureBars(){
    injectCss();makeLegend();
    [['page-adp','adpList'],['page-rankings','rankList'],['page-draft','draftList']].forEach(([pageId,listId])=>{
      const page=document.getElementById(pageId),list=document.getElementById(listId);if(!page||!list)return;
      let bar=page.querySelector(':scope > .de59-tagbar');
      if(!bar){bar=document.createElement('div');bar.className='de59-tagbar';bar.setAttribute('aria-label','Tag filters');list.parentNode.insertBefore(bar,list)}
      bar.innerHTML=barHtml();
      bar.querySelectorAll('[data-key]').forEach(btn=>btn.onclick=()=>{try{setActiveTagFilter(btn.dataset.key)}catch(_){}});
      bar.querySelector('[data-legend]')?.addEventListener('click',openLegend);
    });
  }

  function cardClasses(p,mode){
    const pr=priorityFor(p);if(!pr)return '';
    let out=' de59-tagged de59-priority-'+pr;
    if(mode==='draft')out+=' de59-draft-'+pr;
    return out;
  }
  function decorateRowHtml(out,p,mode){
    const cls=cardClasses(p,mode);if(!cls||typeof out!=='string')return out;
    return out.replace('class="player rankings ', 'class="player rankings'+cls+' ');
  }

  function wrapRows(){
    try{
      const base=rankRow;if(typeof base==='function'&&!base.__de59Wrapped){
        const wrapped=function(p,mode='rankings'){return decorateRowHtml(base.apply(this,arguments),p,mode)};wrapped.__de59Wrapped=true;rankRow=wrapped;try{window.rankRow=wrapped}catch(_){}
      }
    }catch(_){}
    try{
      const base=marketRow;if(typeof base==='function'&&!base.__de59Wrapped){
        const wrapped=function(p){let out=base.apply(this,arguments),owned=null;try{owned=findPersonalByName(p?.name)}catch(_){};const cls=cardClasses(owned,'market');return cls?out.replace('class="player market"','class="player market'+cls+'"'):out};wrapped.__de59Wrapped=true;marketRow=wrapped;try{window.marketRow=wrapped}catch(_){}
      }
    }catch(_){}
  }

  function wrapRenderers(){
    ['renderTagDrawer','renderAdp','renderRankings','renderDraft'].forEach(name=>{
      try{
        const base=eval(name);if(typeof base!=='function'||base.__de59RenderWrapped)return;
        const wrapped=function(){const out=base.apply(this,arguments);queueMicrotask(ensureBars);return out};wrapped.__de59RenderWrapped=true;eval(name+'=wrapped');try{window[name]=wrapped}catch(_){}
      }catch(_){}
    });
  }

  function refresh(){
    const t=getTags();if(t?.green)t.green.name='Safe Pick';
    wrapRows();wrapRenderers();ensureBars();
    try{renderAdp()}catch(_){}try{renderRankings()}catch(_){}try{renderDraft()}catch(_){}try{renderTagDrawer()}catch(_){}
  }

  injectCss();makeLegend();wrapRows();wrapRenderers();ensureBars();
  setTimeout(refresh,100);setTimeout(refresh,700);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('deTagLegend59')?.classList.contains('open'))document.getElementById('deTagLegend59').classList.remove('open')});
})();
