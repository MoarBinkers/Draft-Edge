// v55 — dedicated, phone-friendly Forgot Password popup.
(()=>{
  const LIVE_URL='https://moarbinkers.github.io/Draft-Edge/';
  let sending=false;

  const byId=id=>document.getElementById(id);

  function injectCss(){
    if(byId('deForgot55Css'))return;
    const s=document.createElement('style');
    s.id='deForgot55Css';
    s.textContent=`
      #deForgot55{
        position:fixed;inset:0;z-index:2147483000;display:none;
        align-items:center;justify-content:center;padding:18px;
        background:rgba(4,9,14,.78);backdrop-filter:blur(8px)
      }
      #deForgot55.open{display:flex}
      #deForgot55 .de55-card{
        width:min(100%,420px);box-sizing:border-box;padding:22px;
        border:1px solid rgba(116,168,207,.32);border-radius:18px;
        background:linear-gradient(180deg,#121b24,#0d151d);
        box-shadow:0 24px 70px rgba(0,0,0,.5)
      }
      #deForgot55 .de55-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
      #deForgot55 h2{margin:0;color:#f4f8fb;font-size:20px;letter-spacing:-.02em}
      #deForgot55 .de55-sub{margin:7px 0 0;color:#96a6b5;font-size:13px;line-height:1.5}
      #deForgot55 .de55-close{
        flex:0 0 auto;width:34px;height:34px;border-radius:10px;border:1px solid #2d3d4b;
        background:#101923;color:#aebcca;font-size:20px;line-height:1;cursor:pointer
      }
      #deForgot55 .de55-close:hover{background:#17232e;color:#fff;transform:translateY(-1px)}
      #deForgot55 .de55-email{
        width:100%;box-sizing:border-box;margin-top:18px;padding:13px 14px;
        border:1px solid #314453;border-radius:11px;background:#0a1219;color:#eef5fa;
        font:inherit;font-size:16px;outline:none;transition:border-color .18s,box-shadow .18s
      }
      #deForgot55 .de55-email:focus{border-color:#55a8e2;box-shadow:0 0 0 3px rgba(58,145,205,.16)}
      #deForgot55 .de55-send{
        position:relative;overflow:hidden;width:100%;margin-top:12px;padding:13px 16px;
        border:1px solid #58a9e1;border-radius:11px;background:linear-gradient(135deg,#2588ca,#17649d);
        color:#fff;font-weight:950;font-size:13px;letter-spacing:.015em;cursor:pointer;
        box-shadow:0 10px 25px rgba(14,94,151,.24);transition:transform .18s,filter .18s,box-shadow .18s
      }
      #deForgot55 .de55-send:hover{transform:translateY(-2px);filter:brightness(1.08);box-shadow:0 14px 30px rgba(14,94,151,.34)}
      #deForgot55 .de55-send:active{transform:translateY(0) scale(.99)}
      #deForgot55 .de55-send:disabled{opacity:.58;cursor:not-allowed;transform:none;filter:none}
      #deForgot55 .de55-msg{min-height:20px;margin-top:11px;color:#9eafbd;font-size:12px;line-height:1.5}
      #deForgot55 .de55-msg.ok{color:#86d5aa}
      #deForgot55 .de55-msg.err{color:#f2a4ad}
      #deForgot55 .de55-done{
        display:none;width:100%;margin-top:8px;padding:10px 14px;border:0;border-radius:10px;
        background:#17232d;color:#c9d6df;font-weight:850;cursor:pointer
      }
      #deForgot55.sent .de55-done{display:block}
      @media (max-width:520px){
        #deForgot55{align-items:flex-end;padding:12px}
        #deForgot55 .de55-card{width:100%;padding:20px;border-radius:18px 18px 14px 14px;margin-bottom:max(0px,env(safe-area-inset-bottom))}
      }
    `;
    document.head.appendChild(s);
  }

  function ensurePopup(){
    injectCss();
    if(byId('deForgot55'))return byId('deForgot55');
    const root=document.createElement('div');
    root.id='deForgot55';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-labelledby','deForgotTitle55');
    root.innerHTML=`
      <div class="de55-card">
        <div class="de55-head">
          <div>
            <h2 id="deForgotTitle55">Reset your password</h2>
            <div class="de55-sub">Enter the email on your Draft Edge account. We’ll send you a link to choose a new password.</div>
          </div>
          <button class="de55-close" id="deForgotClose55" aria-label="Close">×</button>
        </div>
        <input class="de55-email" id="deForgotEmail55" type="email" inputmode="email" autocomplete="email" placeholder="Email address">
        <button class="de55-send" id="deForgotSend55">Send Recovery Email</button>
        <div class="de55-msg" id="deForgotMsg55"></div>
        <button class="de55-done" id="deForgotDone55">Done</button>
      </div>`;
    document.body.appendChild(root);

    byId('deForgotClose55').onclick=closePopup;
    byId('deForgotDone55').onclick=closePopup;
    byId('deForgotSend55').onclick=sendRecovery;
    byId('deForgotEmail55').addEventListener('keydown',e=>{if(e.key==='Enter')sendRecovery()});
    root.addEventListener('click',e=>{if(e.target===root)closePopup()});
    return root;
  }

  function setMessage(text,type=''){
    const m=byId('deForgotMsg55');if(!m)return;
    m.textContent=text||'';
    m.classList.toggle('ok',type==='ok');
    m.classList.toggle('err',type==='err');
  }

  function openPopup(){
    const root=ensurePopup();
    root.classList.remove('sent');
    setMessage('');
    const input=byId('deForgotEmail55');
    const existing=byId('authEmail')?.value?.trim();
    if(input){
      if(existing)input.value=existing;
      input.disabled=false;
    }
    const send=byId('deForgotSend55');
    if(send){send.disabled=false;send.textContent='Send Recovery Email'}
    root.classList.add('open');
    setTimeout(()=>input?.focus(),30);
  }

  function closePopup(){
    if(sending)return;
    byId('deForgot55')?.classList.remove('open');
  }

  async function sendRecovery(){
    if(sending)return;
    const input=byId('deForgotEmail55');
    const email=(input?.value||'').trim();
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      setMessage('Enter a valid email address.','err');
      input?.focus();
      return;
    }
    if(!window.supabaseClient){
      setMessage('Account service is still loading. Try again in a moment.','err');
      return;
    }

    sending=true;
    const send=byId('deForgotSend55');
    if(input)input.disabled=true;
    if(send){send.disabled=true;send.textContent='Sending…'}
    setMessage('Sending your recovery email…');

    try{
      const {error}=await window.supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:LIVE_URL});
      if(error)throw error;
      const main=byId('authEmail');if(main)main.value=email;
      byId('deForgot55')?.classList.add('sent');
      setMessage('Email sent. Open the newest Draft Edge recovery email, then use the link to choose your new password.','ok');
      if(send)send.textContent='Recovery Email Sent';
    }catch(e){
      const msg=String(e?.message||'Could not send the recovery email.');
      const friendly=/after \d+ seconds|rate limit|too many/i.test(msg)
        ? 'A recovery email was just requested. Wait about a minute, then try again if you still need another one.'
        : msg;
      setMessage(friendly,'err');
      if(input)input.disabled=false;
      if(send){send.disabled=false;send.textContent='Send Recovery Email'}
    }finally{
      sending=false;
    }
  }

  // Capture the click so older Forgot Password handlers cannot run first.
  document.addEventListener('click',e=>{
    const forgot=e.target.closest?.('#forgotPassword');
    if(!forgot)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openPopup();
  },true);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&byId('deForgot55')?.classList.contains('open'))closePopup();
  });

  ensurePopup();
  window.DraftEdgeForgotPassword={open:openPopup,close:closePopup,send:sendRecovery};
})();
