// v57 — improve browser/iPhone password-save support for Draft Edge auth.
(()=>{
  let pendingSignup=null;
  let lastStored='';

  const el=id=>document.getElementById(id);

  function isSignup(){
    try{if(typeof authMode!=='undefined')return authMode==='signup'}catch(_){}
    return /create account/i.test(el('authTitle')?.textContent||'');
  }

  function ensureSemanticForm(){
    let form=el('deAuthForm57');
    if(!form){
      form=document.createElement('form');
      form.id='deAuthForm57';
      form.setAttribute('aria-hidden','true');
      form.style.display='none';
      form.addEventListener('submit',e=>e.preventDefault());
      (el('authGate')||document.body).appendChild(form);
    }

    const email=el('authEmail');
    const password=el('authPassword');
    const submit=el('authSubmit');
    if(email){
      email.setAttribute('name','username');
      email.setAttribute('autocomplete','username');
      email.setAttribute('autocapitalize','none');
      email.setAttribute('spellcheck','false');
      email.setAttribute('form','deAuthForm57');
    }
    if(password){
      password.setAttribute('name','password');
      password.setAttribute('autocomplete',isSignup()?'new-password':'current-password');
      password.setAttribute('form','deAuthForm57');
    }
    if(submit){
      submit.setAttribute('type','submit');
      submit.setAttribute('form','deAuthForm57');
    }
  }

  async function offerCredentialSave(email,password){
    if(!email||!password)return;
    const key=email+'\n'+password;
    if(key===lastStored)return;
    lastStored=key;
    try{
      if(!navigator.credentials?.store||typeof PasswordCredential==='undefined')return;
      const credential=new PasswordCredential({id:email,password,name:email});
      await navigator.credentials.store(credential);
    }catch(_){/* Browser/password manager decides whether to offer saving. */}
  }

  function watchSuccess(){
    const msg=el('authMessage');
    if(!msg||msg.dataset.deSaveWatch57)return;
    msg.dataset.deSaveWatch57='1';
    const check=()=>{
      const text=(msg.textContent||'').trim();
      if(pendingSignup&&/^Account created\b/i.test(text)){
        const creds=pendingSignup;
        pendingSignup=null;
        offerCredentialSave(creds.email,creds.password);
      }
    };
    new MutationObserver(check).observe(msg,{childList:true,characterData:true,subtree:true});
    check();
  }

  document.addEventListener('click',e=>{
    const target=e.target.closest?.('#authSubmit,#authToggle');
    if(!target)return;
    if(target.id==='authToggle'){
      setTimeout(ensureSemanticForm,0);
      return;
    }
    ensureSemanticForm();
    if(isSignup()){
      const email=(el('authEmail')?.value||'').trim();
      const password=el('authPassword')?.value||'';
      if(email&&password.length>=6)pendingSignup={email,password};
    }else{
      pendingSignup=null;
    }
  },true);

  function init(){ensureSemanticForm();watchSuccess()}
  init();
  setTimeout(init,250);
  setTimeout(init,1000);
  const title=el('authTitle');
  if(title)new MutationObserver(ensureSemanticForm).observe(title,{childList:true,characterData:true,subtree:true});
})();
