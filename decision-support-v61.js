// v61 — decision support: round bands, edge heat, smart search, player compare, and draft recap.
(()=>{
  const PROFILE_KEY='de61_player_profiles_v1';
  const PROFILE_TTL=24*60*60*1000;
  const POSITIONS=['QB','RB','WR','TE'];
  const TAG_LABELS={green:'safe pick',blue:'target',purple:'sleeper',teal:'breakout',yellow:'hesitant',orange:'risk',red:'avoid'};
  const TEAM_NAMES={
    ARI:'cardinals arizona',ATL:'falcons atlanta',BAL:'ravens baltimore',BUF:'bills buffalo',CAR:'panthers carolina',CHI:'bears chicago',CIN:'bengals cincinnati',CLE:'browns cleveland',DAL:'cowboys dallas',DEN:'broncos denver',DET:'lions detroit',GB:'packers green bay',HOU:'texans houston',IND:'colts indianapolis',JAX:'jaguars jacksonville',KC:'chiefs kansas city',LV:'raiders las vegas',LAC:'chargers los angeles',LAR:'rams los angeles',MIA:'dolphins miami',MIN:'vikings minnesota',NE:'patriots new england',NO:'saints new orleans',NYG:'giants new york',NYJ:'jets new york',PHI:'eagles philadelphia',PIT:'steelers pittsburgh',SEA:'seahawks seattle',SF:'49ers niners san francisco',TB:'buccaneers bucs tampa bay',TEN:'titans tennessee',WAS:'commanders washington'};
  let profilesById=new Map(),profilesByName=new Map(),profileLoading=null;
  let liveTeams=12,liveDraftId='',liveDraftStatus='',draftStatusTimer=null,lastRecapPrompt='';

  const $=id=>document.getElementById(id);
  const nrm=v=>{try{return typeof norm==='function'?norm(v):String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}catch(_){return String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'')}};
  const esc61=v=>{try{return typeof esc==='function'?esc(String(v??'')):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}catch(_){return String(v??'')}};
  const signed=n=>Number(n)>0?'+'+Number(n):String(Number(n)||0);
  const ps=()=>{try{return Array.isArray(players)?players:[]}catch(_){return []}};
  const pool=()=>{try{return Array.isArray(sleeperPool)?sleeperPool:[]}catch(_){return []}};
  const marketEntry=p=>{try{return typeof marketFor==='function'?marketFor(p):null}catch(_){return null}};
  const personalByName=name=>{try{return typeof findPersonalByName==='function'?findPersonalByName(name):ps().find(p=>nrm(p.name)===nrm(name))}catch(_){return null}};

  function injectCss(){
    if($('deDecision61Css'))return;
    const s=document.createElement('style');s.id='deDecision61Css';s.textContent=`
      .edge.de61-heat{display:inline-flex;align-items:center;justify-content:center;min-width:42px;padding:5px 8px;border-radius:8px;border:1px solid transparent;transition:filter .15s ease,transform .15s ease}
      .edge.de61-pos1{background:#12261b;border-color:#24563a;color:#78e7a3}.edge.de61-pos2{background:#12301f;border-color:#32754b;color:#86efac;box-shadow:0 0 16px #22c55e16}.edge.de61-pos3{background:#123622;border-color:#3d8a58;color:#a7f3c0;box-shadow:0 0 22px #22c55e24}
      .edge.de61-neg1{background:#29191c;border-color:#5f333a;color:#f4a0aa}.edge.de61-neg2{background:#32191e;border-color:#7a3843;color:#fda4af;box-shadow:0 0 16px #fb71851a}.edge.de61-neg3{background:#3a181f;border-color:#91404c;color:#fecdd3;box-shadow:0 0 22px #fb71852a}
      .player:hover .edge.de61-heat{filter:brightness(1.08)}
      .de61-round-band{display:flex;align-items:center;gap:9px;margin:12px 0 7px;color:#7f93a3;font-size:9px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;pointer-events:none}
      .de61-round-band::before,.de61-round-band::after{content:'';height:1px;background:linear-gradient(90deg,transparent,#304250);flex:1}.de61-round-band::after{background:linear-gradient(90deg,#304250,transparent)}
      .de61-round-band span{padding:4px 8px;border:1px solid #2a3b49;border-radius:999px;background:#0e171f;color:#93a8b8;white-space:nowrap}
      .de61-smart-hint{font-size:9px;color:#768a9a;margin:-7px 0 10px;padding-left:3px}
      .de61-hidden-search{display:none!important}
      .de61-no-results{padding:20px 4px;color:#8fa0ae;font-size:11px}
      .de61-toolbtn{white-space:nowrap}
      #deCompare61,#deRecap61{position:fixed;inset:0;z-index:2147482300;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,9,14,.78);backdrop-filter:blur(8px)}
      #deCompare61.open,#deRecap61.open{display:flex}
      .de61-modal-card{width:min(100%,920px);max-height:calc(100vh - 36px);overflow:auto;border:1px solid #304452;border-radius:18px;background:linear-gradient(180deg,#121b24,#0d151d);box-shadow:0 28px 80px #0000007a;padding:20px;box-sizing:border-box}
      .de61-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:15px}.de61-modal-head h2{margin:0;font-size:21px}.de61-modal-head p{margin:6px 0 0;color:#8fa1b0;font-size:11px;line-height:1.5}
      .de61-close{width:35px;height:35px;flex:0 0 auto;border:1px solid #304250;border-radius:10px;background:#101923;color:#b8c5cf;font-size:20px;cursor:pointer}
      .de61-compare-pickers{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:end}.de61-pick label{display:block;margin:0 0 6px;color:#8498a8;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.de61-pick input{width:100%;box-sizing:border-box;border:1px solid #314453;border-radius:11px;background:#0a1219;color:#eef5fa;padding:12px 13px;font:inherit;font-size:14px;outline:none}.de61-pick input:focus{border-color:#55a8e2;box-shadow:0 0 0 3px #3a91cd22}.de61-vs{padding:12px 4px;color:#6e8292;font-size:10px;font-weight:1000}
      .de61-compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.de61-player-card{border:1px solid #2a3c4a;border-radius:15px;background:#0f1820;padding:15px}.de61-profile-head{display:flex;align-items:center;gap:11px}.de61-profile-head img{width:48px;height:48px;object-fit:cover;border-radius:12px;background:#18232d}.de61-profile-head h3{margin:0;font-size:16px}.de61-profile-head .small{margin-top:3px}.de61-compare-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}.de61-stat{padding:9px;border:1px solid #263744;border-radius:10px;background:#101821;min-width:0}.de61-stat b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.de61-stat span{display:block;margin-top:3px;color:#7e92a2;font-size:8px;text-transform:uppercase;letter-spacing:.05em}.de61-compare-section{margin-top:13px;padding-top:12px;border-top:1px solid #23323e}.de61-compare-section h4{margin:0 0 8px;color:#8da1b0;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.de61-profile-table{display:grid;grid-template-columns:1fr 1fr;gap:6px}.de61-fact{display:flex;justify-content:space-between;gap:9px;padding:6px 0;border-bottom:1px solid #1e2b36;font-size:10px}.de61-fact span:first-child{color:#7f92a0}.de61-note{color:#aebbc5;font-size:10px;line-height:1.5;white-space:pre-wrap}.de61-empty{padding:30px 10px;text-align:center;color:#7f91a0;font-size:11px}
      .de61-recap-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.de61-recap-card{padding:12px;border:1px solid #2a3b48;border-radius:12px;background:#101821}.de61-recap-card b{display:block;font-size:19px}.de61-recap-card span{display:block;color:#8194a3;font-size:9px;margin-top:3px}.de61-recap-section{margin-top:16px}.de61-recap-section h3{margin:0 0 8px;font-size:11px;color:#a8b6c1;text-transform:uppercase;letter-spacing:.08em}.de61-recap-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #21303b;font-size:10px}.de61-recap-row:last-child{border-bottom:0}.de61-recap-row .meta{color:#8294a2;font-size:9px}.de61-good{color:#7ce2a0}.de61-bad{color:#f3a0aa}.de61-recap-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;padding:10px 12px;border:1px solid #346348;border-radius:12px;background:#102219;color:#a7e8bc;font-size:10px}.de61-recap-banner button{border:1px solid #4d8b65;border-radius:9px;background:#173522;color:#c9f4d6;padding:7px 10px;font-weight:900;cursor:pointer}
      @media(max-width:700px){.de61-compare-pickers{grid-template-columns:1fr}.de61-vs{display:none}.de61-compare-grid{grid-template-columns:1fr}.de61-recap-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.de61-compare-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#deCompare61,#deRecap61{align-items:flex-end;padding:10px}.de61-modal-card{border-radius:18px 18px 14px 14px;max-height:86vh}}
      @media(prefers-reduced-motion:reduce){.edge.de61-heat{transition:none!important}}
    `;document.head.appendChild(s);
  }

  function profileAge(pr){
    if(!pr?.birth_date)return '—';
    const d=new Date(pr.birth_date+'T00:00:00');if(Number.isNaN(d.getTime()))return '—';
    const now=new Date();let a=now.getFullYear()-d.getFullYear();const m=now.getMonth()-d.getMonth();if(m<0||(m===0&&now.getDate()<d.getDate()))a--;return a>0&&a<60?String(a):'—';
  }
  function slimProfile(id,p){return {id:String(id),name:p.full_name||[p.first_name,p.last_name].filter(Boolean).join(' '),position:p.position||p.fantasy_positions?.[0]||'',team:p.team||'FA',birth_date:p.birth_date||null,years_exp:p.years_exp??null,height:p.height||null,weight:p.weight||null,college:p.college||null,depth_chart_position:p.depth_chart_position??null,number:p.number??null,status:p.status||null}}
  function indexProfiles(arr){
    profilesById=new Map();profilesByName=new Map();
    for(const pr of arr||[]){if(pr?.id)profilesById.set(String(pr.id),pr);if(pr?.name)profilesByName.set(nrm(pr.name),pr)}
  }
  function loadProfileCache(){
    try{const c=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');if(c&&Date.now()-Number(c.at||0)<PROFILE_TTL&&Array.isArray(c.rows)){indexProfiles(c.rows);return true}}catch(_){}return false;
  }
  async function loadProfiles(force=false){
    if(!force&&profilesById.size>100)return profilesById;if(profileLoading)return profileLoading;
    profileLoading=(async()=>{
      if(!force&&loadProfileCache())return profilesById;
      const rows=[];
      for(const pos of POSITIONS){
        try{
          const url='https://api.sleeper.app/v1/players/nfl?position='+pos+'&active=true';
          const data=typeof sleeper==='function'?await sleeper(url):await (await fetch(url)).json();
          for(const [id,p] of Object.entries(data||{}))if(p)rows.push(slimProfile(id,p));
        }catch(e){console.warn('Draft Edge profile lookup failed for '+pos,e)}
      }
      if(rows.length){indexProfiles(rows);try{localStorage.setItem(PROFILE_KEY,JSON.stringify({at:Date.now(),rows}))}catch(_){}}
      return profilesById;
    })().finally(()=>{profileLoading=null});return profileLoading;
  }
  function profileFor(p){
    if(!p)return null;const m=marketEntry(p),id=String(m?.id||p.sleeperId||p.id||'');return (id&&profilesById.get(id))||profilesByName.get(nrm(p.name))||null;
  }

  function tagWords(p){return (p?.tags||[]).map(k=>TAG_LABELS[k]||k).join(' ')}
  function searchableText(p){
    const pr=profileFor(p)||{},team=String(p?.team||pr.team||'').toUpperCase(),exp=Number(pr.years_exp);
    const pieces=[p?.name,p?.position,team,TEAM_NAMES[team]||'',tagWords(p),p?.note,pr.college,pr.status];
    if(Number.isFinite(exp)){pieces.push(exp===0?'rookie year1 first year':'veteran');pieces.push('year'+(exp+1),'year '+(exp+1),exp+' years experience',exp+'yr')}
    const age=profileAge(pr);if(age!=='—')pieces.push('age '+age,age+' years old');
    return pieces.filter(Boolean).join(' ').toLowerCase();
  }
  function smartMatch(p,q){
    q=String(q||'').trim().toLowerCase();if(!q)return true;
    const text=searchableText(p);
    const normalized=q.replace(/safe\s+pick/g,'safepick').replace(/year\s+(\d+)/g,'year$1');
    const hay=text.replace(/safe\s+pick/g,'safepick').replace(/year\s+(\d+)/g,'year$1');
    return normalized.split(/\s+/).filter(Boolean).every(tok=>hay.includes(tok));
  }

  function playerFromRow(row,kind){
    if(!row)return null;
    if(kind!=='adp'){
      const i=Number(row.dataset.index);return Number.isInteger(i)?ps()[i]||null:null;
    }
    const name=row.dataset.de61Name||row.querySelector('.name')?.textContent||'';return personalByName(name)||pool().find(p=>nrm(p.name)===nrm(name))||null;
  }
  function applySmartFilter(kind){
    const input=$(kind==='adp'?'adpSearch':kind==='rankings'?'rankSearch':'draftSearch');
    const list=$(kind==='adp'?'adpList':kind==='rankings'?'rankList':'draftList');if(!input||!list)return;
    const q=input.value.trim();let shown=0;
    list.querySelectorAll('.player').forEach(row=>{const p=playerFromRow(row,kind),ok=!q||smartMatch(p,q);row.classList.toggle('de61-hidden-search',!ok);if(ok)shown++});
    list.querySelectorAll('.de61-no-results').forEach(x=>x.remove());
    if(q&&!shown){const e=document.createElement('div');e.className='de61-no-results';e.textContent='No players match “'+q+'”. Try a name, team, position, tag, note, rookie, college, or experience term.';list.appendChild(e)}
  }
  function addSearchHints(){
    [['adpSearch','adpList'],['rankSearch','rankList'],['draftSearch','draftList']].forEach(([iid,lid])=>{const input=$(iid),list=$(lid);if(!input||!list||input.dataset.de61Hint)return;input.dataset.de61Hint='1';input.placeholder=iid==='rankSearch'?'Search: player, MIN WR, rookie RB, Target…':'Search: player, team, position, rookie, tag…';const hint=document.createElement('div');hint.className='de61-smart-hint';hint.textContent='Smart search: try “MIN WR”, “rookie RB”, “Target”, a college, or words from your notes.';list.parentNode.insertBefore(hint,list)});
  }

  function heatClass(edge){const n=Number(edge);if(!Number.isFinite(n)||n===0)return '';const a=Math.abs(n),level=a>=24?3:a>=12?2:1;return ' de61-heat '+(n>0?'de61-pos':'de61-neg')+level}
  function wrapRows(){
    try{const base=rankRow;if(typeof base==='function'&&!base.__de61Wrapped){const wrapped=function(p,mode='rankings'){let out=base.apply(this,arguments),m=marketEntry(p),edge=m?.rank!=null?Number(m.rank)-Number(p.overall):null;out=out.replace('class="edge '+(edge>0?'good':edge<0?'bad':'')+'"','class="edge '+(edge>0?'good':edge<0?'bad':'')+heatClass(edge)+'"');return out};wrapped.__de61Wrapped=true;rankRow=wrapped;try{window.rankRow=wrapped}catch(_){}}}catch(_){}
    try{const base=marketRow;if(typeof base==='function'&&!base.__de61Wrapped){const wrapped=function(p){let out=base.apply(this,arguments);return out.replace('class="player market','data-de61-name="'+esc61(p?.name||'')+'" class="player market')};wrapped.__de61Wrapped=true;marketRow=wrapped;try{window.marketRow=wrapped}catch(_){}}}catch(_){}
  }

  function currentPos(kind){try{return kind==='adp'?adpPos:kind==='rankings'?rankPos:draftPos}catch(_){return 'ALL'}}
  function roundNumberForRow(row,kind){
    if(kind==='adp'){const n=Number((row.querySelector('.metric .num')?.textContent||'').replace(/[^0-9]/g,''));return Number.isFinite(n)&&n>0?n:null}
    const p=playerFromRow(row,kind);return Number(p?.overall)||null;
  }
  function addRoundBands(kind){
    const list=$(kind==='adp'?'adpList':kind==='rankings'?'rankList':'draftList');if(!list)return;list.querySelectorAll('.de61-round-band').forEach(x=>x.remove());if(currentPos(kind)!=='ALL')return;
    const teams=kind==='draft'?(liveTeams||12):12;let lastRound=0;
    list.querySelectorAll(':scope > .player').forEach(row=>{if(row.classList.contains('de61-hidden-search'))return;const rank=roundNumberForRow(row,kind);if(!rank)return;const rnd=Math.floor((rank-1)/teams)+1;if(rnd!==lastRound){const b=document.createElement('div');b.className='de61-round-band';b.innerHTML='<span>Round '+rnd+' · picks '+(((rnd-1)*teams)+1)+'–'+(rnd*teams)+'</span>';row.before(b);lastRound=rnd}});
  }

  function afterRender(kind){queueMicrotask(()=>{applySmartFilter(kind);addRoundBands(kind);ensureTools()})}
  function wrapRenderers(){
    [['renderAdp','adp'],['renderRankings','rankings'],['renderDraft','draft']].forEach(([name,kind])=>{try{const base=eval(name);if(typeof base!=='function'||base.__de61Wrapped)return;const wrapped=function(){const input=$(kind==='adp'?'adpSearch':kind==='rankings'?'rankSearch':'draftSearch'),q=input?.value||'';if(input&&q)input.value='';const out=base.apply(this,arguments);if(input)input.value=q;afterRender(kind);return out};wrapped.__de61Wrapped=true;eval(name+'=wrapped');try{window[name]=wrapped}catch(_){}}catch(_){}});
  }

  function ensureCompareModal(){
    if($('deCompare61'))return;const root=document.createElement('div');root.id='deCompare61';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
    root.innerHTML='<div class="de61-modal-card"><div class="de61-modal-head"><div><h2>Compare Players</h2><p>Compare your rankings, Sleeper market view, tags, notes, and player profile side by side.</p></div><button class="de61-close" aria-label="Close">×</button></div><div class="de61-compare-pickers"><div class="de61-pick"><label>Player 1</label><input id="deCompareA61" list="deCompareList61" placeholder="Search a player"></div><div class="de61-vs">VS</div><div class="de61-pick"><label>Player 2</label><input id="deCompareB61" list="deCompareList61" placeholder="Search a player"></div></div><datalist id="deCompareList61"></datalist><div id="deCompareBody61" class="de61-empty">Choose two players to compare.</div></div>';
    document.body.appendChild(root);const close=()=>root.classList.remove('open');root.querySelector('.de61-close').onclick=close;root.addEventListener('click',e=>{if(e.target===root)close()});['deCompareA61','deCompareB61'].forEach(id=>$(id).addEventListener('input',renderCompare));
  }
  function allComparePlayers(){const map=new Map();for(const p of [...ps(),...pool()])if(p?.name&&!map.has(nrm(p.name)))map.set(nrm(p.name),p);return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)))}
  function fillCompareList(){const dl=$('deCompareList61');if(!dl)return;dl.innerHTML=allComparePlayers().map(p=>'<option value="'+esc61(p.name)+'">'+esc61((p.position||'')+' · '+(p.team||'FA'))+'</option>').join('')}
  function findComparePlayer(name){return allComparePlayers().find(p=>nrm(p.name)===nrm(name))||null}
  function profileFacts(p){const pr=profileFor(p)||{},exp=Number(pr.years_exp);return [['Age',profileAge(pr)],['Experience',Number.isFinite(exp)?(exp===0?'Rookie':exp+' yr'+(exp===1?'':'s')):'—'],['Height',pr.height||'—'],['Weight',pr.weight?pr.weight+' lb':'—'],['College',pr.college||'—'],['Depth',pr.depth_chart_position!=null?'#'+pr.depth_chart_position:'—']]}
  function compareCard(p){
    if(!p)return '<div class="de61-player-card de61-empty">Choose a player.</div>';const owned=personalByName(p.name),base=owned||p,m=marketEntry(base)||marketEntry(p),edge=owned&&m?.rank!=null?Number(m.rank)-Number(owned.overall):null,mv=Number(m?.move)||0;let img='';try{img=typeof imgUrl==='function'?imgUrl(base):''}catch(_){}
    let tags='<span class="small">No personal tags</span>';if(owned){try{tags=typeof tagsHtml==='function'?tagsHtml(owned):(owned.tags||[]).map(k=>esc61(TAG_LABELS[k]||k)).join(' · ')}catch(_){}}
    return '<div class="de61-player-card"><div class="de61-profile-head"><img src="'+esc61(img)+'" onerror="this.style.visibility=\'hidden\'"><div><h3>'+esc61(p.name)+'</h3><div class="small">'+esc61(p.position||m?.pos||'')+' · '+esc61(p.team||m?.team||'FA')+'</div></div></div><div class="de61-compare-stats">'+
      '<div class="de61-stat"><b>'+(owned?'#'+owned.overall:'—')+'</b><span>My Rank</span></div><div class="de61-stat"><b>'+(owned?owned.position+'#'+owned.posRank:'—')+'</b><span>My Pos</span></div><div class="de61-stat"><b>'+(m?.rank!=null?'#'+m.rank:'—')+'</b><span>Sleeper</span></div><div class="de61-stat"><b>'+(m?.posRank?(m.pos||p.position)+'#'+m.posRank:'—')+'</b><span>Sleeper Pos</span></div><div class="de61-stat"><b class="'+(edge>0?'de61-good':edge<0?'de61-bad':'')+'">'+(edge==null?'—':signed(edge))+'</b><span>My Edge</span></div><div class="de61-stat"><b class="'+(mv>0?'de61-good':mv<0?'de61-bad':'')+'">'+signed(mv)+'</b><span>ADP Move</span></div></div><div class="de61-compare-section"><h4>Tags</h4><div>'+tags+'</div></div><div class="de61-compare-section"><h4>Player Profile</h4><div class="de61-profile-table">'+profileFacts(base).map(([k,v])=>'<div class="de61-fact"><span>'+k+'</span><b>'+esc61(v)+'</b></div>').join('')+'</div></div><div class="de61-compare-section"><h4>Your Note</h4><div class="de61-note">'+esc61(owned?.note||'No note yet.')+'</div></div></div>';
  }
  async function openCompare(prefill=''){ensureCompareModal();fillCompareList();$('deCompare61').classList.add('open');if(prefill&&!$('deCompareA61').value)$('deCompareA61').value=prefill;renderCompare();loadProfiles().then(()=>renderCompare()).catch(()=>{})}
  function renderCompare(){const body=$('deCompareBody61');if(!body)return;const a=findComparePlayer($('deCompareA61')?.value),b=findComparePlayer($('deCompareB61')?.value);if(!a&&!b){body.className='de61-empty';body.textContent='Choose two players to compare.';return}body.className='de61-compare-grid';body.innerHTML=compareCard(a)+compareCard(b)}

  function draftIdCandidate(){
    try{const saved=currentList?.()?.draftPrefs?.draftId;if(saved)return String(saved)}catch(_){}
    const raw=$('draftId')?.value?.trim()||localStorage.getItem('de34_draft_input')||'';const m=String(raw).match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||String(raw).match(/\b\d{8,}\b/);return m?.[1]||'';
  }
  async function resolveDraftMeta(){
    const id=draftIdCandidate();if(!id)return null;try{const d=await sleeper('https://api.sleeper.app/v1/draft/'+id);if(d?.draft_id){liveDraftId=String(d.draft_id);liveTeams=Math.max(1,Number(d.settings?.teams)||12);liveDraftStatus=String(d.status||'');return d}}catch(_){}
    try{const l=await sleeper('https://api.sleeper.app/v1/league/'+id);if(l?.draft_id){const d=await sleeper('https://api.sleeper.app/v1/draft/'+l.draft_id);if(d?.draft_id){liveDraftId=String(d.draft_id);liveTeams=Math.max(1,Number(d.settings?.teams)||Number(l.total_rosters)||12);liveDraftStatus=String(d.status||'');return d}}}catch(_){}return null;
  }
  function playerForPick(pick){const id=String(pick?.player_id||'');let hit=null;for(const p of ps()){const m=marketEntry(p);if(id&&String(m?.id||p.sleeperId||p.id||'')===id){hit=p;break}}if(hit)return hit;const meta=pick?.metadata||{},name=[meta.first_name,meta.last_name].filter(Boolean).join(' ').trim();return personalByName(name)}
  function pickName(pick){const p=playerForPick(pick);if(p)return p.name;const m=pick?.metadata||{};return [m.first_name,m.last_name].filter(Boolean).join(' ').trim()||('Player '+String(pick?.player_id||''))}
  async function recapData(){
    const meta=await resolveDraftMeta();if(!meta||!liveDraftId)throw new Error('Connect a Sleeper draft first to build your draft recap.');
    const all=await sleeper('https://api.sleeper.app/v1/draft/'+liveDraftId+'/picks');const mine=window.DraftEdgeDraftOwnership?.ownPicks?.()||[];
    return {meta,all:Array.isArray(all)?all:[],mine:Array.isArray(mine)?mine:[]};
  }
  function ensureRecapModal(){
    if($('deRecap61'))return;const root=document.createElement('div');root.id='deRecap61';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.innerHTML='<div class="de61-modal-card"><div class="de61-modal-head"><div><h2 id="deRecapTitle61">Draft Recap</h2><p id="deRecapSub61">Your Draft Edge results.</p></div><button class="de61-close" aria-label="Close">×</button></div><div id="deRecapBody61" class="de61-empty">Loading draft recap…</div></div>';document.body.appendChild(root);const close=()=>root.classList.remove('open');root.querySelector('.de61-close').onclick=close;root.addEventListener('click',e=>{if(e.target===root)close()});
  }
  async function openRecap(){ensureRecapModal();$('deRecap61').classList.add('open');$('deRecapBody61').className='de61-empty';$('deRecapBody61').textContent='Loading draft recap…';try{const d=await recapData();renderRecap(d)}catch(e){$('deRecapBody61').textContent=e?.message||String(e)}}
  function renderRecap({meta,all,mine}){
    const complete=String(meta.status)==='complete';$('deRecapTitle61').textContent=complete?'Draft Complete · Recap':'Live Draft Snapshot';$('deRecapSub61').textContent=(Number(meta.settings?.teams)||liveTeams||12)+' teams · '+mine.length+' of your picks recorded'+(complete?' · final':' · updates as the draft continues');
    const targetTotal=ps().filter(p=>(p.tags||[]).includes('blue')).length,targetMine=mine.filter(pk=>(playerForPick(pk)?.tags||[]).includes('blue')).length,safeMine=mine.filter(pk=>(playerForPick(pk)?.tags||[]).includes('green')).length,sleeperMine=mine.filter(pk=>(playerForPick(pk)?.tags||[]).includes('purple')).length,avoidMine=mine.filter(pk=>(playerForPick(pk)?.tags||[]).includes('red')).length;
    const values=mine.map(pk=>{const p=playerForPick(pk),m=p?marketEntry(p):null,pick=Number(pk.pick_no)||0;return {pk,p,pick,market:m?.rank!=null?pick-Number(m.rank):null,mine:p?.overall?pick-Number(p.overall):null}});
    const bestMarket=values.filter(x=>Number.isFinite(x.market)).sort((a,b)=>b.market-a.market).slice(0,5),bestPersonal=values.filter(x=>Number.isFinite(x.mine)).sort((a,b)=>b.mine-a.mine).slice(0,5);
    const ownNos=mine.map(x=>Number(x.pick_no)||0).filter(Boolean).sort((a,b)=>a-b);const ownKeys=new Set(mine.map(x=>String(x.pick_no||'')+':'+String(x.player_id||'')));const passed=all.filter(pk=>!ownKeys.has(String(pk.pick_no||'')+':'+String(pk.player_id||''))).map(pk=>{const p=playerForPick(pk),pick=Number(pk.pick_no)||0,hadChance=ownNos.some(n=>n<pick);return {pk,p,pick,hadChance}}).filter(x=>x.hadChance&&x.p?.overall).sort((a,b)=>a.p.overall-b.p.overall).slice(0,5);
    const body=$('deRecapBody61');body.className='';body.innerHTML='<div class="de61-recap-summary"><div class="de61-recap-card"><b>'+mine.length+'</b><span>Your Picks</span></div><div class="de61-recap-card"><b>'+targetMine+(targetTotal?' / '+targetTotal:'')+'</b><span>Targets Landed</span></div><div class="de61-recap-card"><b>'+safeMine+'</b><span>Safe Picks</span></div><div class="de61-recap-card"><b>'+sleeperMine+'</b><span>Sleepers Landed</span></div></div>'+
      (avoidMine?'<div class="de61-recap-section"><div class="de61-recap-row"><span class="de61-bad"><b>⚠ '+avoidMine+' Avoid-tagged pick'+(avoidMine===1?'':'s')+'</b></span><span class="meta">Worth reviewing after the draft</span></div></div>':'')+
      recapSection('Biggest Value vs Sleeper ADP',bestMarket,x=>'<span><b>'+esc61(pickName(x.pk))+'</b><div class="meta">Pick #'+x.pick+' · Sleeper '+(marketEntry(x.p)?.rank?'#'+marketEntry(x.p).rank:'—')+'</div></span><b class="'+(x.market>0?'de61-good':x.market<0?'de61-bad':'')+'">'+signed(x.market)+' picks</b>')+
      recapSection('Best Value vs Your Rankings',bestPersonal,x=>'<span><b>'+esc61(pickName(x.pk))+'</b><div class="meta">Pick #'+x.pick+' · Your rank #'+x.p.overall+'</div></span><b class="'+(x.mine>0?'de61-good':x.mine<0?'de61-bad':'')+'">'+signed(x.mine)+' picks</b>')+
      recapSection('Highest-Ranked Players You Passed On',passed,x=>'<span><b>'+esc61(pickName(x.pk))+'</b><div class="meta">Your rank #'+x.p.overall+' · drafted at #'+x.pick+'</div></span><span class="meta">Available at one of your earlier picks</span>');
  }
  function recapSection(title,rows,fn){return '<div class="de61-recap-section"><h3>'+title+'</h3>'+(rows.length?rows.map(x=>'<div class="de61-recap-row">'+fn(x)+'</div>').join(''):'<div class="small">Not enough draft data yet.</div>')+'</div>'}

  function ensureTools(){
    injectCss();addSearchHints();ensureCompareModal();ensureRecapModal();
    [['page-rankings',false],['page-adp',false],['page-draft',true]].forEach(([pid,isDraft])=>{const page=$(pid),controls=page?.querySelector('.controls');if(!controls)return;const cid='deCompareBtn61-'+pid;if(!$(cid)){const b=document.createElement('button');b.id=cid;b.className='btn de61-toolbtn';b.type='button';b.textContent='⇄ Compare';b.onclick=()=>openCompare();controls.appendChild(b)}if(isDraft&&!$('deRecapBtn61')){const r=document.createElement('button');r.id='deRecapBtn61';r.className='btn de61-toolbtn';r.type='button';r.textContent='Draft Recap';r.onclick=openRecap;controls.appendChild(r)}});
  }

  function installSmartSearch(){
    [['adpSearch','adp'],['rankSearch','rankings'],['draftSearch','draft']].forEach(([id,kind])=>{const input=$(id);if(!input||input.dataset.de61Search)return;input.dataset.de61Search='1';input.addEventListener('input',()=>{requestAnimationFrame(()=>{applySmartFilter(kind);addRoundBands(kind)})},true)});
  }
  async function checkDraftStatus(){const meta=await resolveDraftMeta();if(!meta||String(meta.status)!=='complete'||!liveDraftId||lastRecapPrompt===liveDraftId)return;lastRecapPrompt=liveDraftId;const list=$('draftList');if(!list)return;let banner=$('deRecapBanner61');if(!banner){banner=document.createElement('div');banner.id='deRecapBanner61';banner.className='de61-recap-banner';list.parentNode.insertBefore(banner,list)}banner.innerHTML='<span><b>Draft complete.</b> Your Draft Edge recap is ready.</span><button type="button">View Recap</button>';banner.querySelector('button').onclick=openRecap}
  function startDraftStatusWatch(){clearInterval(draftStatusTimer);draftStatusTimer=setInterval(()=>checkDraftStatus().catch(()=>{}),30000);setTimeout(()=>checkDraftStatus().catch(()=>{}),1500)}

  function init(){injectCss();wrapRows();wrapRenderers();ensureTools();installSmartSearch();loadProfiles().then(()=>{['adp','rankings','draft'].forEach(applySmartFilter);fillCompareList()}).catch(()=>{});resolveDraftMeta().then(()=>addRoundBands('draft')).catch(()=>{});startDraftStatusWatch();}
  init();setTimeout(init,500);setTimeout(init,1800);
  document.addEventListener('click',e=>{if(e.target.closest?.('#connectDraft'))setTimeout(()=>{resolveDraftMeta().then(()=>{addRoundBands('draft');checkDraftStatus()}).catch(()=>{})},500)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('deCompare61')?.classList.contains('open'))$('deCompare61').classList.remove('open');if($('deRecap61')?.classList.contains('open'))$('deRecap61').classList.remove('open')}});
  window.DraftEdgeDecisionSupport={openCompare,openRecap,loadProfiles,smartMatch};
})();
