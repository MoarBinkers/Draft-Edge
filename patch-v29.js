(()=>{
  const HISTORY_KEY="de29_adp_history";
  let adpHistory29={};
  try{adpHistory29=JSON.parse(localStorage.getItem(HISTORY_KEY)||"{}")||{}}catch(_){adpHistory29={}}

  function cleanPlayerName(value){
    let s=String(value||"").trim().replace(/\s+/g," ");
    s=s.replace(/\s+(?:lll|iii|3rd)\.?$/i," III")
       .replace(/\s+(?:ll|ii|2nd)\.?$/i," II")
       .replace(/\s+(?:iv|4th)\.?$/i," IV")
       .replace(/\s+jr\.?$/i," Jr.")
       .replace(/\s+sr\.?$/i," Sr.");
    return s;
  }
  window.cleanPlayerName=cleanPlayerName;

  norm=function(value){
    return cleanPlayerName(value).toLowerCase()
      .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,"")
      .replace(/[^a-z0-9]/g,"");
  };

  function marketMatch(value){
    let name=typeof value==="string"?value:value?.name;
    let sleeperId=typeof value==="object"?(value?.sleeperId||value?.id):null;
    if(name&&market[name])return {name,entry:market[name]};
    let n=norm(name);
    for(const [key,entry] of Object.entries(market)){
      if(!entry||typeof entry!=="object")continue;
      if(sleeperId&&entry.id&&String(entry.id)===String(sleeperId))return {name:key,entry};
      if(n&&norm(key)===n)return {name:key,entry};
    }
    return null;
  }

  marketFor=function(p){return marketMatch(p)?.entry||null};
  imgUrl=function(p){let m=marketFor(p);return m?.id?"https://sleepercdn.com/content/nfl/players/thumb/"+encodeURIComponent(m.id)+".jpg":""};
  moveText=function(p){
    let m=Number(marketFor(p)?.move)||0;
    return {text:m>0?"+"+m:String(m),cls:m>0?"up":m<0?"down":"flat"};
  };

  function historyKey(p){let m=marketFor(p);return m?.id?"id:"+m.id:"name:"+norm(p?.name||p)}
  function historyFor(p){
    let key=historyKey(p),list=Array.isArray(adpHistory29[key])?adpHistory29[key].slice():[];
    if(!list.length){
      let n=norm(p?.name||p);
      for(const [oldName,oldList] of Object.entries(history||{})){
        if(norm(oldName)===n&&Array.isArray(oldList)){list=oldList.map(x=>({t:x.t,rank:Number(x.rank),label:null})).filter(x=>Number.isFinite(x.rank));break}
      }
    }
    let current=marketFor(p)?.rank;
    if(Number.isFinite(current)&&(!list.length||list[list.length-1].rank!==current))list.push({t:Date.now(),rank:current,label:"Current"});
    return list.filter(x=>Number.isFinite(Number(x.rank))).slice(-60)
  }

  function historyGraph(p){
    let all=historyFor(p),pts=all.slice(-20);
    if(!pts.length)return '<div class="small" style="padding:14px 0">No ADP snapshots yet.</div>';
    let ranks=pts.map(x=>Number(x.rank)),min=Math.min(...ranks),max=Math.max(...ranks),range=Math.max(1,max-min);
    let W=500,H=180,L=42,R=18,T=18,B=32,innerW=W-L-R,innerH=H-T-B;
    let coords=pts.map((x,i)=>({x:L+(pts.length===1?innerW/2:(i/(pts.length-1))*innerW),y:T+((Number(x.rank)-min)/range)*innerH,rank:Number(x.rank)}));
    let d=coords.map((c,i)=>(i?"L":"M")+c.x.toFixed(1)+" "+c.y.toFixed(1)).join(" ");
    let first=ranks[0],last=ranks[ranks.length-1],delta=first-last,color=delta>0?"#4ade80":delta<0?"#fb7185":"#8292a0";
    let dots=coords.map((c,i)=>'<circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="4" fill="'+color+'"><title>#'+c.rank+'</title></circle>').join("");
    let labels='<text x="5" y="'+(T+5)+'" fill="#8fa0af" font-size="11">#'+min+'</text><text x="5" y="'+(T+innerH)+'" fill="#8fa0af" font-size="11">#'+max+'</text>';
    let graph='<div style="background:#0d141b;border:1px solid #2c3c4b;border-radius:14px;padding:12px;margin-top:8px"><svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block"><line x1="'+L+'" y1="'+(T+innerH)+'" x2="'+(W-R)+'" y2="'+(T+innerH)+'" stroke="#2d3c49"/><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(T+innerH)+'" stroke="#2d3c49"/>'+labels+(pts.length>1?'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>':'')+dots+'</svg>'+(pts.length===1?'<div class="small" style="text-align:center;margin-top:-8px">One snapshot saved. The trend line appears after the next snapshot.</div>':'')+'</div>';
    let rows=all.slice(-12).reverse().map((x,idx,rev)=>{
      let originalIndex=all.length-1-idx,prev=originalIndex>0?Number(all[originalIndex-1].rank):null,change=prev==null?null:prev-Number(x.rank);
      let when=x.label||(x.t?new Date(x.t).toLocaleString():"Previous saved rank");
      return '<div class="historyrow"><span>'+esc(when)+'</span><span style="display:flex;gap:14px;align-items:center"><b>#'+Number(x.rank)+'</b><b class="move '+(change>0?'up':change<0?'down':'flat')+'">'+(change==null?'':change>0?'+'+change:String(change))+'</b></span></div>'
    }).join("");
    return graph+'<div style="margin-top:10px">'+rows+'</div>'
  }

  marketHeads=function(){return '<div class="colheads market"><div>Player</div><div>Sleeper Rank</div><div>Pos Rank</div><div>ADP Change</div></div>'};

  rankRow=function(p,mode="rankings"){
    let i=players.indexOf(p),m=marketFor(p),mv=moveText(p);
    let myPrimary=rankPos==="ALL"?p.overall:p.posRank;
    let mySecondary=rankPos==="ALL"?p.position+p.posRank:p.overall;
    let edge=m?.rank!=null?m.rank-p.overall:null;
    let draftControl=mode==="draft"?'<button class="draft-btn" onclick="event.stopPropagation();toggleDraft('+i+')">Draft</button>':"";
    return '<div class="player rankings '+(mode==="draft"&&p.drafted?"drafted":"")+'" draggable="'+(mode==="rankings")+'" data-index="'+i+'">'+
    '<div class="person" onclick="openDetail('+i+')"><img class="avatar" src="'+imgUrl(p)+'" onerror="this.style.visibility=\'hidden\'"><div class="playertext"><div class="name-line"><span class="name">'+esc(cleanPlayerName(p.name))+'</span><span class="tags">'+tagsHtml(p)+'</span>'+noteHtml(p,i)+'</div><div class="meta"><span class="pos '+p.position+'">'+p.position+'</span><span>'+esc(p.team)+'</span><span>Bye '+esc(p.bye)+'</span>'+draftControl+'</div>'+notePreview(p)+'</div></div>'+
    '<div class="metric"><div class="num">#'+myPrimary+'</div></div><div class="metric"><div class="num">'+(rankPos==="ALL"?p.position+"#"+p.posRank:"#"+mySecondary)+'</div></div><div class="metric"><div class="num">'+(m?.rank!=null?"#"+m.rank:"—")+'</div></div><div class="metric"><div class="edge '+(edge==null?"":edge>0?"good":edge<0?"bad":"")+'">'+(edge==null?"—":(edge>0?"+":"")+edge)+'</div></div><div class="metric"><div class="move '+mv.cls+'">'+mv.text+'</div></div></div>'
  };

  marketRow=function(p){
    let owned=findPersonalByName(p.name),i=owned?players.indexOf(owned):-1,m=marketFor(p),mv=moveText(p);
    let add=i<0?'<button class="market-add" data-market-add="'+esc(p.name)+'">＋ Add</button>':"";
    return '<div class="player market"><div class="person" data-market-player="'+encodeURIComponent(p.name)+'"><img class="avatar" src="'+imgUrl(p)+'" onerror="this.style.visibility=\'hidden\'"><div class="playertext"><div class="name-line"><span class="name">'+esc(cleanPlayerName(p.name))+'</span><span class="tags">'+(owned?tagsHtml(owned):"")+'</span>'+(owned?noteHtml(owned,i):"")+'</div><div class="meta"><span class="pos '+p.position+'">'+p.position+'</span><span>'+esc(p.team||"FA")+'</span>'+add+'</div>'+(owned?notePreview(owned):"")+'</div></div><div class="metric"><div class="num">'+(m?.rank!=null?"#"+m.rank:"—")+'</div></div><div class="metric"><div class="num">'+(m?.posRank?p.position+"#"+m.posRank:"—")+'</div></div><div class="metric"><div class="move '+mv.cls+'">'+mv.text+'</div></div></div>'
  };

  function removePlayer(i){
    let p=players[i];if(!p)return;
    if(!confirm('Remove "'+cleanPlayerName(p.name)+'" from this ranking list?'))return;
    let pos=p.position;players.splice(i,1);
    players.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999)).forEach((x,n)=>x.overall=n+1);
    let posPlayers=players.filter(x=>x.position===pos).sort((a,b)=>(Number(a.posRank)||9999)-(Number(b.posRank)||9999));
    posPlayers.forEach((x,n)=>x.posRank=n+1);
    save();document.getElementById("drawer").classList.remove("open");renderEverything();
  }
  window.removePlayer=removePlayer;

  openDetail=function(i){
    let p=players[i];if(!p)return;let m=marketFor(p),edge=m?.rank!=null?m.rank-p.overall:null;
    document.getElementById("drawerContent").innerHTML='<div class="detailhead"><img class="detailimg" src="'+imgUrl(p)+'" onerror="this.style.visibility=\'hidden\'"><div><h2 style="margin:0">'+esc(cleanPlayerName(p.name))+'</h2><div class="small">'+esc(p.team)+' · '+p.position+' · '+p.position+p.posRank+'</div></div></div><div class="stats"><div class="stat"><b>#'+p.overall+'</b><span>My Overall</span></div><div class="stat"><b>'+(m?.rank!=null?'#'+m.rank:'—')+'</b><span>Sleeper Rank</span></div><div class="stat"><b>'+(edge==null?'—':(edge>0?'+':'')+edge)+'</b><span>My Edge</span></div></div><div class="section"><h3>ADP History</h3>'+historyGraph(p)+'</div><div class="section"><h3>Tags & Note</h3><div class="tags">'+tagsHtml(p)+' <button class="btn" onclick="openEdit('+i+')" style="padding:6px 10px">＋ Add Tags & Note</button></div></div><div class="section"><h3>Notes</h3><div style="font-size:12px;color:#b8c4ce;white-space:pre-wrap;line-height:1.55">'+esc(p.note||'No notes yet.')+'</div></div><div class="section" style="padding-top:12px;border-top:1px solid #293744"><button class="btn" onclick="removePlayer('+i+')" style="border-color:#6b3440;color:#fb9aaa;background:#25161b">Remove Player From List</button></div>';
    document.getElementById("drawer").classList.add("open")
  };

  window.openMarketDetail=function(name){
    let p=sleeperPool.find(x=>norm(x.name)===norm(name))||{name};let owned=findPersonalByName(name),m=marketFor(p),mv=moveText(p);
    if(owned){openDetail(players.indexOf(owned));return}
    document.getElementById("drawerContent").innerHTML='<div class="detailhead"><img class="detailimg" src="'+imgUrl(p)+'" onerror="this.style.visibility=\'hidden\'"><div><h2 style="margin:0">'+esc(cleanPlayerName(p.name))+'</h2><div class="small">'+esc(p.team||'FA')+' · '+esc(p.position||m?.pos||'')+'</div></div></div><div class="stats"><div class="stat"><b>'+(m?.rank!=null?'#'+m.rank:'—')+'</b><span>Sleeper Rank</span></div><div class="stat"><b>'+(m?.posRank?(p.position||m.pos)+'#'+m.posRank:'—')+'</b><span>Pos Rank</span></div><div class="stat"><b class="move '+mv.cls+'">'+mv.text+'</b><span>ADP Change</span></div></div><div class="section"><h3>ADP History</h3>'+historyGraph(p)+'</div><div class="section"><button class="btn primary" data-detail-add="'+encodeURIComponent(p.name)+'">＋ Add To My Rankings</button></div>';
    document.getElementById("drawer").classList.add("open");
    let b=document.querySelector('[data-detail-add]');if(b)b.onclick=()=>{addPlayerFromPoolName(decodeURIComponent(b.dataset.detailAdd));document.getElementById("drawer").classList.remove("open")}
  };

  let adpList=document.getElementById("adpList");
  if(adpList&&!adpList.dataset.v29Click){adpList.dataset.v29Click="1";adpList.addEventListener("click",e=>{if(e.target.closest("[data-market-add]"))return;let row=e.target.closest("[data-market-player]");if(row)openMarketDetail(decodeURIComponent(row.dataset.marketPlayer))})}

  playerTemplate=function(src,overall,posRank){return {overall,name:cleanPlayerName(src.name),position:src.position||src.pos||"NA",team:src.team||"FA",bye:src.bye??"—",posRank,tier:null,tags:[],note:"",drafted:false,sleeperId:src.id||src.sleeperId||null}};

  const oldLoadActiveList=loadActiveList;
  loadActiveList=function(){oldLoadActiveList();sanitizeCurrentPlayers()};
  function sanitizeCurrentPlayers(){
    let seen=new Set(),changed=false,next=[];
    for(let p of players){
      let cleaned=cleanPlayerName(p.name);if(cleaned!==p.name){p.name=cleaned;changed=true}
      let m=marketMatch(p);if(m?.entry?.id&&!p.sleeperId){p.sleeperId=m.entry.id;changed=true}
      let key=(p.sleeperId?'id:'+p.sleeperId:p.position+':'+norm(p.name));
      if(seen.has(key)){changed=true;continue}seen.add(key);next.push(p)
    }
    if(next.length!==players.length)players=next;
    players.slice().sort((a,b)=>(Number(a.overall)||99999)-(Number(b.overall)||99999)).forEach((p,i)=>p.overall=i+1);
    POS.forEach(pos=>players.filter(p=>p.position===pos).sort((a,b)=>(Number(a.posRank)||9999)-(Number(b.posRank)||9999)).forEach((p,i)=>p.posRank=i+1));
    if(changed)save()
  }

  const oldConfirmImportList=confirmImportList;
  confirmImportList=async function(){
    if(Array.isArray(pendingImport))pendingImport=pendingImport.map(p=>({...p,name:cleanPlayerName(p.name)}));
    return oldConfirmImportList()
  };

  const oldExportCurrentList=exportCurrentList;
  exportCurrentList=function(){
    players.forEach(p=>p.name=cleanPlayerName(p.name));
    return oldExportCurrentList()
  };
  document.getElementById("exportRankings").onclick=exportCurrentList;

  refreshCurrentAdp=async function(){
    document.getElementById("liveText").textContent="Updating current ADP…";
    try{
      let data=await sleeper("https://api.sleeper.app/v1/players/nfl"),arr=[];
      Object.entries(data).forEach(([id,p])=>{
        if(!p||p.active===false||typeof p.search_rank!=="number"||!(p.search_rank>0))return;
        let fps=p.fantasy_positions||[],pos=fps.find(x=>MARKET_POS.includes(x))||p.position;if(!MARKET_POS.includes(pos))return;
        let full=cleanPlayerName(p.full_name||((p.first_name||"")+" "+(p.last_name||"")).trim());if(!full)return;
        arr.push({id,p,pos,full})
      });
      arr.sort((a,b)=>a.p.search_rank-b.p.search_rank);
      let posCounts={},changed=0,newPool=[],now=Date.now();
      arr.forEach((x,i)=>{
        posCounts[x.pos]=(posCounts[x.pos]||0)+1;
        let oldHit=marketMatch({name:x.full,id:x.id})?.entry,oldRank=Number(oldHit?.rank),rank=i+1;
        let hit={id:x.id,rank,posRank:posCounts[x.pos],team:x.p.team||"FA",pos:x.pos,searchRank:x.p.search_rank,move:Number.isFinite(oldRank)?oldRank-rank:0,updatedAt:now};
        if(Number.isFinite(oldRank)&&oldRank!==rank)changed++;
        let key="id:"+x.id,h=Array.isArray(adpHistory29[key])?adpHistory29[key]:[];
        if(!h.length&&Number.isFinite(oldRank))h.push({t:null,rank:oldRank,label:"Previous saved rank"});
        let last=h[h.length-1],shouldAdd=!last||Number(last.rank)!==rank||!last.t||now-Number(last.t)>300000;
        if(shouldAdd)h.push({t:now,rank,label:null});if(h.length>120)h=h.slice(-120);adpHistory29[key]=h;
        let previousKey=marketMatch({name:x.full,id:x.id})?.name;if(previousKey&&previousKey!==x.full)delete market[previousKey];
        market[x.full]=hit;
        if(POS.includes(x.pos))newPool.push({id:x.id,name:x.full,position:x.pos,team:x.p.team||"FA",bye:"—",tier:null,tags:[],note:"",drafted:false})
      });
      sleeperPool=newPool;localStorage.setItem("de_sleeper_pool",JSON.stringify(newPool));localStorage.setItem(HISTORY_KEY,JSON.stringify(adpHistory29));
      sanitizeCurrentPlayers();save();
      let d=new Date();document.getElementById("liveText").textContent="Current ADP updated "+d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
      document.getElementById("adpStatus").textContent=changed?changed+" player"+(changed===1?"":"s")+" moved since your last refresh":"No rank changes since your last refresh";
      renderEverything()
    }catch(e){document.getElementById("liveText").textContent="Couldn’t update ADP";document.getElementById("adpStatus").textContent=e.message}
  };
  document.getElementById("topUpdate").onclick=refreshCurrentAdp;

  sanitizeCurrentPlayers();renderEverything();
  setTimeout(()=>refreshCurrentAdp(),800);
})();
