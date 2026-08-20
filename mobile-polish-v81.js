// v81 — mobile-only polish for Workhorse, especially Live Draft readability and touch targets.
(()=>{
  if(document.getElementById('workhorseMobilePolish81'))return;
  const s=document.createElement('style');
  s.id='workhorseMobilePolish81';
  s.textContent=`
    @media(max-width:820px){
      html,body{max-width:100%;overflow-x:hidden}
      #page-draft,#page-rankings,#page-adp{max-width:100%;overflow-x:hidden}
      #page-draft input,#page-draft select,#page-draft textarea{font-size:16px!important}
      #page-draft .controls{gap:8px!important;flex-wrap:wrap!important;align-items:stretch!important}
      #page-draft .controls input,#page-draft .controls select,#page-draft .controls button{box-sizing:border-box;min-height:42px}
      #page-draft #draftId{flex:1 1 100%!important;width:100%!important;min-width:0!important}
      #page-draft #connectDraft{min-height:44px;padding-left:14px!important;padding-right:14px!important}
      #page-draft #deDraftSlot{min-width:0!important;max-width:none!important;min-height:42px}

      #page-draft #deDraftRoomSummary{gap:8px!important;margin-bottom:10px!important}
      #page-draft .de-draft-card{padding:11px!important;min-height:66px!important;border-radius:12px!important;box-sizing:border-box}
      #page-draft .de-draft-card .v{font-size:18px!important;line-height:1.15}
      #page-draft .de-draft-card .s{font-size:9.5px!important}
      #page-draft #deDraftContext{gap:8px!important;margin-bottom:10px!important}
      #page-draft .de-draft-panel{padding:11px!important;border-radius:12px!important;min-width:0}
      #page-draft .de-pick-row{gap:7px!important;font-size:10px!important}

      #page-draft #deDraftSmartFilters{gap:6px!important;margin-bottom:10px!important}
      #page-draft #deDraftSmartFilters .de-smart{min-height:40px;padding:8px 11px!important;display:inline-flex;align-items:center;justify-content:center}
      #page-draft #draftPills{max-width:100%!important;width:100%!important;box-sizing:border-box;overflow-x:auto!important;-webkit-overflow-scrolling:touch;scrollbar-width:none}
      #page-draft #draftPills::-webkit-scrollbar{display:none}
      #page-draft #draftPills .pill{min-width:52px!important;min-height:40px;padding:8px 12px!important;flex:0 0 auto}

      #page-draft #whTierContextBar{padding:11px!important;gap:9px!important;border-radius:12px!important;box-sizing:border-box}
      #page-draft .wh-tier-context-copy{min-width:0;flex:1 1 210px}
      #page-draft .wh-tier-context-help{font-size:9.5px!important;line-height:1.4!important}
      #page-draft #whTierContextToggle{min-height:42px;padding:9px 12px!important;flex:0 0 auto}
      #page-draft #whTierContextNote{font-size:9.5px!important}
      #page-draft .wh-tier-badge{margin-left:0!important;margin-top:6px!important;max-width:100%;min-height:30px;box-sizing:border-box;padding:6px 8px!important;font-size:9px!important;line-height:1.25!important;white-space:normal!important;text-align:left}
      #page-draft .wh-tier-detail{padding:10px!important;margin-top:5px!important;box-sizing:border-box}
      #page-draft .wh-tier-detail-title{font-size:9.5px!important;line-height:1.35!important}
      #page-draft .wh-tier-members{gap:7px!important}
      #page-draft .wh-tier-member{min-height:38px;display:inline-flex;align-items:center;padding:7px 9px!important;font-size:10px!important}

      #page-draft #whDraftGuide76{border-radius:12px!important;margin-bottom:12px!important}
      #page-draft #whDraftGuide76 .wh76-top{padding:12px!important}
      #page-draft #whDraftGuide76 .wh76-step{padding:11px 12px!important}
      #page-draft #whDraftGuide76 .wh76-auto{padding:10px 12px!important}
      #page-draft .wh76-help-btn{min-height:40px;padding:8px 11px!important}
      #whLegend76{padding:10px max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))!important}
      #whLegend76 .wh76-modal{max-height:calc(100dvh - 20px)!important;border-radius:14px!important}
      #whLegend76 .wh76-modal-head{padding:11px 12px!important}
      #whLegend76 .wh76-body{padding:11px 12px 14px!important}
      #whLegend76 .wh76-close{min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0!important}

      #page-rankings .player,#page-adp .player,#page-draft .player{max-width:100%;box-sizing:border-box}
      #page-rankings .name-line,#page-adp .name-line,#page-draft .name-line{flex-wrap:wrap;min-width:0}
      #page-rankings .playertext,#page-adp .playertext,#page-draft .playertext{min-width:0}
      #page-rankings .meta,#page-adp .meta,#page-draft .meta{flex-wrap:wrap}
      #page-rankings button,#page-adp button{touch-action:manipulation}
    }

    @media(max-width:760px){
      /* Live Draft becomes a true mobile card instead of a squeezed desktop table. */
      #page-draft .colheads.rankings{display:none!important}
      #page-draft .player.rankings{
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:0!important;
        padding:0!important;
        overflow:hidden;
        border-radius:12px!important;
        align-items:stretch!important;
      }
      #page-draft .player.rankings>.person{
        grid-column:1/-1!important;
        min-width:0!important;
        padding:11px 10px 9px!important;
        box-sizing:border-box;
      }
      #page-draft .player.rankings>.person .avatar{width:42px!important;height:42px!important;flex:0 0 42px!important}
      #page-draft .player.rankings>.person .name{font-size:13px!important;line-height:1.2!important}
      #page-draft .player.rankings>.person .meta{font-size:9px!important;gap:5px!important;margin-top:4px!important}
      #page-draft .player.rankings>.metric{
        min-width:0!important;
        padding:7px 2px 9px!important;
        border-top:1px solid #21313d;
        text-align:center;
        box-sizing:border-box;
      }
      #page-draft .player.rankings>.metric:not(:last-child){border-right:1px solid #1c2a34}
      #page-draft .player.rankings>.metric::before{
        display:block;
        margin-bottom:3px;
        color:#718493;
        font-size:7px;
        font-weight:950;
        letter-spacing:.06em;
        line-height:1;
        text-transform:uppercase;
      }
      #page-draft .player.rankings>.metric:nth-child(2)::before{content:'My rank'}
      #page-draft .player.rankings>.metric:nth-child(3)::before{content:'Pos / Ovr'}
      #page-draft .player.rankings>.metric:nth-child(4)::before{content:'Sleeper'}
      #page-draft .player.rankings>.metric:nth-child(5)::before{content:'Value'}
      #page-draft .player.rankings>.metric .num,
      #page-draft .player.rankings>.metric .edge{font-size:11px!important;line-height:1.15!important}
      #page-draft .player.rankings>.metric:last-child{display:none!important}

      #page-draft .de73-risk{margin-top:7px!important;gap:5px!important;align-items:flex-start!important}
      #page-draft .de73-pill{min-height:30px;padding:6px 8px!important;box-sizing:border-box;font-size:8.5px!important}
      #page-draft .de73-why{font-size:8.5px!important;line-height:1.4!important;overflow-wrap:anywhere}
      #page-draft .draft-insight-line{gap:5px!important}
      #page-draft .draft-chip{font-size:8.5px!important;padding:4px 6px!important}

      #page-draft .de61-round-band{margin:10px 0 6px!important;gap:6px!important}
      #page-draft .de61-round-band span{max-width:calc(100vw - 48px);white-space:normal!important;text-align:center;line-height:1.3}

      #whLegend76 .wh76-legend-row{padding:10px 0!important}
    }

    @media(max-width:520px){
      #page-draft #deDraftRoomSummary{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #page-draft .de-draft-card{padding:10px!important}
      #page-draft .de-draft-card .k{font-size:8px!important;letter-spacing:.07em!important}
      #page-draft .de-draft-card .v{font-size:17px!important}

      #page-draft #whTierContextBar{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:start!important}
      #page-draft .wh-tier-context-copy{grid-column:1;display:block!important}
      #page-draft #whTierContextToggle{grid-column:2;grid-row:1}
      #page-draft #whTierContextNote{grid-column:1/-1}

      #page-draft .player.rankings>.person{padding:10px 9px 8px!important}
      #page-draft .player.rankings>.person .avatar{width:38px!important;height:38px!important;flex-basis:38px!important}
      #page-draft .player.rankings>.person .name{font-size:12px!important}
      #page-draft .player.rankings>.metric::before{font-size:6.5px}
      #page-draft .player.rankings>.metric .num,
      #page-draft .player.rankings>.metric .edge{font-size:10.5px!important}

      #whLegend76 .wh76-modal-head h2{font-size:14px!important}
    }
  `;
  document.head.appendChild(s);
})();
