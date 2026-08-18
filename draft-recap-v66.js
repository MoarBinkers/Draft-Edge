// v66 — reliable on-demand draft recap + completion prompt. Uses fresh Sleeper picks and selected slot directly.
(()=>{
  const $=id=>document.getElementById(id);
  const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ps=()=>{try{return Array.isArray(players)?players:[]}catch(_){return []}};
  const market=p=>{try{return typeof marketFor==='function'?marketFor(p):null}catch(_){return null}};
  const personal=name=>{try{if(typeof findPersonalByName==='function')return findPersonalByName(name)}catch(_){}return ps().find(p=>norm(p?.name)===norm(name))||null};

  function rawDraftId(){
    try{const x=currentList?.()?.draftPrefs?.draftId;if(x)return String(x)}catch(_){}
    const raw=$('draftId')?.value?.trim()||localStorage.getItem('de34_draft_input')||'';
    const m=String(raw).match(/\/draft(?:\/nfl)?\/(\d{8,})/i)||String(raw).match(/\b\d{8,}\b/);
    return m?.[1]||'';
  }

  async function resolveMeta(){
    const id=rawDraftId();
    if(!id)throw new Error('Connect a Sleeper draft first.');
    try{
      const d=await sleeper('https://api.sleeper.app/v1/draft/'+id);
      if(d?.draft_id)return d;
    }catch(_){}
    try{
      const l=await sleeper('https://api.sleeper.app/v1/league/'+id);
      if(l?.draft_id){
        const d=await sleeper('https://api.sleeper.app/v1/draft/'+l.draft_id);
        if(d?.draft_id)return d;
      }
      const ds=await sleeper('https://api.sleeper.app/v1/league/'+id+'/drafts');
      const d=Array.isArray(ds)?(ds.find(x=>x.status==='drafting')||ds.find(x=>x.status==='complete')||ds.find(x=>x.status==='pre_draft')||ds[0]):null;
      if(d?.draft_id)return d;
    }catch(_){}
    throw new Error('Could not find that Sleeper draft.');
  }

  function selectedSlot(draftId){
    const ui=Number($('deDraftSlot')?.value||0);
    if(ui>0)return ui;
    try{const live=Number(window.DraftEdgeDraftOwnership?.selectedSlot?.()||0);if(live>0)return live}catch(_){}
    try{
      const saved=Number(localStorage.getItem('de41_draft_slot:'+draftId)||currentList?.()?.draftPrefs?.slot||0);
      if(saved>0)return saved;
    }catch(_){}
    return 0;
  }

  function userIdsForSlot(draft,slot){
    const order=draft?.draft_order||{};
    return Object.entries(order).filter(([,s])=>Number(s)===Number(slot)).map(([uid])=>String(uid));
  }
  function rosterForSlot(draft,slot){
    const map=draft?.slot_to_roster_id||{};
    const v=map[String(slot)]??map[slot];
    return v==null?'':String(v);
  }
  function isOwnPick(pk,draft,slot){
    if(!pk||!slot)return false;
    const users=userIdsForSlot(draft,slot),pickedBy=String(pk.picked_by||'').trim();
    if(pickedBy&&users.length)return users.includes(pickedBy);
    if(Number(pk.draft_slot)===Number(slot))return true;
    const roster=rosterForSlot(draft,slot);
    if(roster&&String(pk.roster_id||'')===roster)return true;
    return false;
  }

  function pForPick(pk){
    const id=String(pk?.player_id||'');
    for(const p of ps()){
      const m=market(p);
      if(id&&String(m?.id||p?.sleeperId||p?.id||'')===id)return p;
    }
    const md=pk?.metadata||{},name=[md.first_name,md.last_name].filter(Boolean).join(' ').trim();
    return personal(name);
  }
  function pickName(pk){return pForPick(pk)?.name||[pk?.metadata?.first_name,pk?.metadata?.last_name].filter(Boolean).join(' ').trim()||'Unknown player'}

  function injectCss(){
    if($('deRecap66Css'))return;
    const s=document.createElement('style');s.id='deRecap66Css';s.textContent=`
      #deRecap66{position:fixed;inset:0;z-index:2147482300;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,9,14,.78);backdrop-filter:blur(8px)}
      #deRecap66.open{display:flex}.de66-card{width:min(100%,850px);max-height:calc(100vh - 36px);overflow:auto;border:1px solid #304452;border-radius:18px;background:linear-gradient(180deg,#121b24,#0d151d);padding:20px;box-sizing:border-box}.de66-head{display:flex;justify-content:space-between;gap:12px}.de66-head h2{margin:0}.de66-close{width:35px;height:35px;border:1px solid #304250;border-radius:10px;background:#101923;color:#b8c5cf;font-size:20px;cursor:pointer}.de66-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:15px}.de66-box{padding:12px;border:1px solid #2a3b48;border-radius:12px;background:#101821}.de66-box b{display:block;font-size:19px}.de66-box span{display:block;color:#8194a3;font-size:9px;margin-top:3px}.de66-section{margin-top:16px}.de66-section h3{font-size:11px;text-transform:uppercase;color:#a8b6c1}.de66-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #21303b;font-size:10px}.de66-good{color:#7ce2a0}.de66-bad{color:#f3a0aa}
      #deRecapPrompt66{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;padding:11px 13px;border:1px solid #346348;border-radius:12px;background:#102219;color:#a7e8bc;font-size:10px}#deRecapPrompt66 button{border:1px solid #4d8b65;border-radius:9px;background:#173522;color:#c9f4d6;padding:7px 10px;font-weight:900;cursor:pointer}
      @media(max-width:700px){.de66-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#deRecap66{align-items:flex-end;padding:10px}.de66-card{max-height:86vh}}
    `;document.head.appendChild(s);
  }

  function ensureModal(){
    if($('deRecap66'))return;
    const r=document.createElement('div');r.id='deRecap66';r.setAttribute('role','dialog');r.setAttribute('aria-modal','true');
    r.innerHTML='<div class="de66-card"><div class="de66-head"><div><h2>Draft Recap</h2><div class="small">How your draft matched your Draft Edge board.</div></div><button class="de66-close" aria-label="Close">×</button></div><div id="de66Body" class="small" style="margin-top:16px">Connect a Sleeper draft, choose your draft slot, then open the recap.</div></div>';
    document.body.appendChild(r);
    const close=()=>r.classList.remove('open');r.querySelector('.de66-close').onclick=close;r.addEventListener('click',e=>{if(e.target===r)close()});
  }
  function section(title,rows,fn){return '<div class="de66-section"><h3>'+title+'</h3>'+(rows.length?rows.map(x=>'<div class="de66-row">'+fn(x)+'</div>').join(''):'<div class="small">Not enough data yet.</div>')+'</div>'}

  async function open(){
    ensureModal();$('deRecap66').classList.add('open');
    const body=$('de66Body');body.className='small';body.textContent='Building recap…';
    try{
      const d=await resolveMeta(),slot=selectedSlot(String(d.draft_id));
      if(!slot)throw new Error('Choose your draft slot first so Draft Edge knows which picks are yours.');
      const all=await sleeper('https://api.sleeper.app/v1/draft/'+d.draft_id+'/picks');
      const picks=Array.isArray(all)?all:[],own=picks.filter(pk=>isOwnPick(pk,d,slot)).sort((a,b)=>(Number(a.pick_no)||0)-(Number(b.pick_no)||0));
      if(!own.length&&picks.length)throw new Error('No picks matched Draft Slot '+slot+'. Check that the selected slot is yours, then try again.');
      const rows=own.map(pk=>{const p=pForPick(pk),m=p?market(p):null,pick=Number(pk.pick_no)||0;return {pk,p,m,pick,market:m?.rank!=null?pick-Number(m.rank):null,personal:p?.overall?pick-Number(p.overall):null}});
      const tagged=k=>rows.filter(x=>(x.p?.tags||[]).includes(k)).length;
      const bestM=rows.filter(x=>Number.isFinite(x.market)).sort((a,b)=>b.market-a.market).slice(0,5);
      const bestP=rows.filter(x=>Number.isFinite(x.personal)).sort((a,b)=>b.personal-a.personal).slice(0,5);
      body.className='';
      body.innerHTML='<div class="de66-summary"><div class="de66-box"><b>'+own.length+'</b><span>Your Picks</span></div><div class="de66-box"><b>'+tagged('blue')+'</b><span>Targets Landed</span></div><div class="de66-box"><b>'+tagged('green')+'</b><span>Safe Picks</span></div><div class="de66-box"><b>'+tagged('purple')+'</b><span>Sleepers Landed</span></div></div>'+
        (tagged('red')?'<div class="de66-section"><div class="de66-row"><span class="de66-bad"><b>⚠ '+tagged('red')+' Avoid-tagged pick'+(tagged('red')===1?'':'s')+'</b></span><span>Worth reviewing</span></div></div>':'')+
        section('Best Value vs Sleeper ADP',bestM,x=>'<span><b>'+esc(pickName(x.pk))+'</b><div class="small">Pick #'+x.pick+' · Sleeper '+(x.m?.rank?'#'+x.m.rank:'—')+'</div></span><b class="'+(x.market>0?'de66-good':x.market<0?'de66-bad':'')+'">'+(x.market>0?'+':'')+x.market+' picks</b>')+
        section('Best Value vs Your Rankings',bestP,x=>'<span><b>'+esc(pickName(x.pk))+'</b><div class="small">Pick #'+x.pick+' · Your rank #'+x.p.overall+'</div></span><b class="'+(x.personal>0?'de66-good':x.personal<0?'de66-bad':'')+'">'+(x.personal>0?'+':'')+x.personal+' picks</b>');
    }catch(e){body.className='small';body.textContent=e?.message||'Could not build the recap.'}
  }

  function ensureButton(){
    ensureModal();
    const c=$('page-draft')?.querySelector('.controls');
    if(!c||$('deRecapBtn66'))return;
    $('deRecapBtn65')?.remove();
    const b=document.createElement('button');b.id='deRecapBtn66';b.type='button';b.className='btn';b.textContent='Draft Recap';b.onclick=open;c.appendChild(b);
  }
  function ensurePrompt(){
    const summary=$('deDraftRoomSummary'),list=$('draftList');
    if(!summary||!list)return;
    const complete=/\bcomplete\b/i.test(summary.textContent||'');
    let p=$('deRecapPrompt66');
    if(!complete){p?.remove();return}
    if(p)return;
    p=document.createElement('div');p.id='deRecapPrompt66';p.innerHTML='<span><b>Draft complete.</b> Your Draft Edge recap is ready.</span><button type="button">View Recap</button>';p.querySelector('button').onclick=open;list.parentNode.insertBefore(p,list);
  }
  function install(){injectCss();ensureButton();ensurePrompt()}

  install();setTimeout(install,250);setTimeout(install,1000);
  let scheduled=false;
  const ob=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install()})});
  ob.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$('deRecap66')?.classList.remove('open')});
  window.DraftEdgeRecap={open,check:ensurePrompt};
})();
