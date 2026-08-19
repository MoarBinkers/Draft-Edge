// v76 — one owner for Live Draft onboarding and the current Draft Legend.
(()=>{
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));

  function css(){
    if($('whDraftHelp76Css'))return;
    const s=document.createElement('style');s.id='whDraftHelp76Css';s.textContent=`
      #whDraftGuide76{margin:0 0 16px;border:1px solid #2b3d4b;background:#0d151c;border-radius:14px;overflow:hidden}
      #whDraftGuide76 .wh76-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 15px;border-bottom:1px solid #21313d}
      #whDraftGuide76 h3{margin:0;font-size:12px;font-weight:1000;color:#eef4f8;letter-spacing:.01em}
      #whDraftGuide76 .wh76-desc{margin-top:5px;max-width:760px;font-size:10px;line-height:1.5;color:#93a5b3}
      #whDraftGuide76 .wh76-badge{flex:0 0 auto;border:1px solid #34546a;background:#10202b;color:#9bc9e6;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:950;letter-spacing:.06em;text-transform:uppercase}
      #whDraftGuide76 .wh76-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0}
      #whDraftGuide76 .wh76-step{padding:13px 14px;border-right:1px solid #21313d;min-height:92px}
      #whDraftGuide76 .wh76-step:last-child{border-right:0}
      #whDraftGuide76 .wh76-num{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#172733;border:1px solid #38556a;color:#b9d7ea;font-size:9px;font-weight:1000;margin-bottom:7px}
      #whDraftGuide76 .wh76-title{font-size:10px;font-weight:1000;color:#dce7ee;margin-bottom:4px}
      #whDraftGuide76 .wh76-copy{font-size:9px;line-height:1.48;color:#8498a7}
      #whDraftGuide76 .wh76-auto{padding:10px 14px;border-top:1px solid #21313d;background:#0b1319;font-size:9px;line-height:1.5;color:#8295a3}
      #whDraftGuide76 .wh76-auto b{color:#b8c9d4}
      #whDraftGuide76 .wh76-help-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
      .wh76-help-btn{appearance:none;border:1px solid #344a5a;background:#101b23;color:#b4c4cf;border-radius:8px;padding:6px 9px;font-size:9px;font-weight:950;cursor:pointer}
      .wh76-help-btn:hover{border-color:#527189;color:#e3edf3}
      #whLegend76{position:fixed;inset:0;z-index:2147483500;background:rgba(3,8,12,.78);display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
      #whLegend76.open{display:flex}
      #whLegend76 .wh76-modal{width:min(720px,100%);max-height:min(760px,90vh);overflow:auto;border:1px solid #304654;background:#0d151c;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.55)}
      #whLegend76 .wh76-modal-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;border-bottom:1px solid #263744;background:#0d151c}
      #whLegend76 .wh76-modal-head h2{margin:0;font-size:15px;color:#f0f5f8}
      #whLegend76 .wh76-close{appearance:none;border:0;background:transparent;color:#9dafbb;font-size:24px;line-height:1;cursor:pointer;padding:0 3px}
      #whLegend76 .wh76-body{padding:14px 16px 17px}
      #whLegend76 .wh76-intro{font-size:10px;line-height:1.55;color:#93a5b2;margin-bottom:12px}
      #whLegend76 .wh76-legend-row{display:grid;grid-template-columns:155px 1fr;gap:13px;padding:11px 0;border-top:1px solid #1f2e38}
      #whLegend76 .wh76-legend-row:first-of-type{border-top:0}
      #whLegend76 .wh76-term{font-size:10px;font-weight:1000;color:#dce7ed}
      #whLegend76 .wh76-explain{font-size:9px;line-height:1.55;color:#899ca9}
      #whLegend76 .wh76-green{display:inline-block;border:1px solid #32754b;background:#12301f;color:#86efac;border-radius:7px;padding:3px 6px}
      #whLegend76 .wh76-risk{display:inline-block;border:1px solid #6c5530;background:#211a10;color:#e6bd67;border-radius:7px;padding:3px 6px}
      #whLegend76 .wh76-red{display:inline-block;border:1px solid #713843;background:#2c181d;color:#f3a2ad;border-radius:7px;padding:3px 6px}
      @media(max-width:760px){#whDraftGuide76 .wh76-steps{grid-template-columns:1fr 1fr}#whDraftGuide76 .wh76-step:nth-child(2){border-right:0}#whDraftGuide76 .wh76-step:nth-child(-n+2){border-bottom:1px solid #21313d}#whLegend76 .wh76-legend-row{grid-template-columns:1fr;gap:5px}}
      @media(max-width:480px){#whDraftGuide76 .wh76-top{display:block}#whDraftGuide76 .wh76-badge{display:inline-block;margin-top:9px}#whDraftGuide76 .wh76-steps{grid-template-columns:1fr}#whDraftGuide76 .wh76-step{border-right:0!important;border-bottom:1px solid #21313d!important;min-height:0}#whDraftGuide76 .wh76-step:last-child{border-bottom:0!important}}
    `;document.head.appendChild(s);
  }

  function guide(){
    css();
    const page=$('page-draft');if(!page||$('whDraftGuide76'))return;
    const controls=page.querySelector('.controls');
    const list=$('draftList');
    const anchor=controls||list;if(!anchor)return;
    const box=document.createElement('div');box.id='whDraftGuide76';
    box.innerHTML=`
      <div class="wh76-top">
        <div><h3>How Live Draft Works</h3><div class="wh76-desc">Connect your Sleeper draft and Workhorse follows the room for you. Workhorse does <b>not</b> make picks on Sleeper — it keeps your board updated, removes drafted players, tracks your turns, and compares the live board with your rankings and Sleeper ADP.</div></div>
        <span class="wh76-badge">Sleeper connected</span>
      </div>
      <div class="wh76-steps">
        <div class="wh76-step"><div class="wh76-num">1</div><div class="wh76-title">Copy your Sleeper draft</div><div class="wh76-copy">Open the draft in Sleeper. Copy the draft link. A Draft ID or League ID also works.</div></div>
        <div class="wh76-step"><div class="wh76-num">2</div><div class="wh76-title">Paste it and connect</div><div class="wh76-copy">Paste it into the box below and press <b>Connect Sleeper</b>. Workhorse finds the draft and reads its scoring/roster settings.</div></div>
        <div class="wh76-step"><div class="wh76-num">3</div><div class="wh76-title">Choose your draft slot</div><div class="wh76-copy">Select the number you are drafting from. This tells Workhorse which picks and roster belong to you, including snake turns.</div></div>
        <div class="wh76-step"><div class="wh76-num">4</div><div class="wh76-title">Draft normally in Sleeper</div><div class="wh76-copy">Leave Workhorse open beside Sleeper. Picks sync automatically; drafted players disappear and your current/next pick updates as the draft moves.</div></div>
      </div>
      <div class="wh76-auto"><b>Automatic after connecting:</b> scoring format is detected, Workhorse switches to the matching Sleeper ADP format, picks refresh automatically, your roster is tracked, and Value Now / wait-risk signals use the live draft position.<div class="wh76-help-actions"><button type="button" class="wh76-help-btn" id="whOpenLegend76">Open Draft Legend</button></div></div>`;
    anchor.parentNode?.insertBefore(box,anchor);
    $('whOpenLegend76')?.addEventListener('click',openLegend);
  }

  function ensureLegend(){
    css();if($('whLegend76'))return;
    const modal=document.createElement('div');modal.id='whLegend76';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Draft Legend');
    modal.innerHTML=`<div class="wh76-modal"><div class="wh76-modal-head"><h2>Draft Legend</h2><button type="button" class="wh76-close" aria-label="Close">×</button></div><div class="wh76-body">
      <div class="wh76-intro">These signals are decision helpers, not commands. Your personal ranking stays the foundation; Sleeper ADP and the live draft tell you how much urgency or value exists around it.</div>
      <div class="wh76-legend-row"><div class="wh76-term"><span class="wh76-green">Value Now</span></div><div class="wh76-explain"><b>Green no longer means “Green Light.”</b> A positive number means the draft has moved past where <em>you</em> ranked the player. Example: <b>+8</b> means the current pick is eight spots later than your personal overall rank. It signals value versus your board — not an automatic instruction to draft him.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">Sleeper Rank</div><div class="wh76-explain">The current Sleeper redraft ranking/ADP for the format Workhorse is using. When a Sleeper draft is connected, Workhorse automatically switches to the detected PPR, Half PPR, or Superflex format.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">ADP Move</div><div class="wh76-explain">Shows the player's latest real movement in Sleeper rank. Positive means the player moved up the Sleeper board; negative means he moved down.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">Market before your next pick</div><div class="wh76-explain">Sleeper generally values the player earlier than your next turn. Waiting carries more market risk.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">Market later than your next pick</div><div class="wh76-explain">Sleeper generally values the player after your next turn. If the room cooperates, you may be able to wait instead of reaching now.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term"><span class="wh76-risk">Safe to wait / Lean wait</span></div><div class="wh76-explain">Workhorse sees limited short-term pressure before your next pick. This uses the Sleeper market, how many picks are between your turns, positional needs in the room, recent position runs, and positional drop-off.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term"><span class="wh76-red">Getting risky / High risk</span></div><div class="wh76-explain">There is meaningful evidence the player may not make it back to you. It is a risk estimate, not a guarantee that another manager will take him.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">Injury Status</div><div class="wh76-explain"><b>Q</b> = Questionable, <b>D</b> = Doubtful, <b>OUT</b> = Out, <b>IR</b> = Injured Reserve, <b>PUP</b> = Physically Unable to Perform, and <b>SUS</b> = Suspended. These come from the current Sleeper player-status data.</div></div>
      <div class="wh76-legend-row"><div class="wh76-term">Your tags</div><div class="wh76-explain">Target, Avoid, Safe Pick, Risk, Sleeper, Breakout, and Hesitant are your own labels. They never change a player's Sleeper ADP or automatically move your ranking.</div></div>
    </div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.wh76-close')?.addEventListener('click',closeLegend);
    modal.addEventListener('mousedown',e=>{if(e.target===modal)closeLegend()});
  }
  function openLegend(){ensureLegend();$('whLegend76')?.classList.add('open')}
  function closeLegend(){$('whLegend76')?.classList.remove('open')}

  function replaceOldGreenLightCopy(){
    // One-time text cleanup only; no observer, rerender, or DOM movement during dragging.
    const roots=[$('page-draft'),...document.querySelectorAll('.modal')].filter(Boolean);
    for(const root of roots){
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      let node;while((node=walker.nextNode())){
        if(/green\s*light/i.test(node.nodeValue||''))node.nodeValue=String(node.nodeValue).replace(/green\s*light/gi,'Value Now');
      }
    }
  }

  document.addEventListener('click',e=>{
    const trigger=e.target.closest?.('button,a,[role="button"]');if(!trigger||trigger.closest('#whLegend76'))return;
    const text=String(trigger.textContent||'').trim();
    if(/^legend$/i.test(text)||/^draft legend$/i.test(text)){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openLegend();
    }
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('whLegend76')?.classList.contains('open'))closeLegend()});

  guide();ensureLegend();replaceOldGreenLightCopy();
  [250,900,2200].forEach(ms=>setTimeout(()=>{guide();replaceOldGreenLightCopy()},ms));
  window.WorkhorseDraftHelp={openLegend,refresh:()=>{guide();replaceOldGreenLightCopy()}};
})();