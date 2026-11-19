/* My brief page: saved videos + notes + short questions -> /shortlist on the brief Worker */
document.addEventListener('DOMContentLoaded',function(){
  var API='https://tcvp-briefs.lava-media-usa.workers.dev', SL=window.tcvpShortlist, ST=window.MB_STUDIOS||{}, TOP=window.MB_TOP||[], t0=Date.now();
  var form=document.getElementById('mb-form'), empty=document.getElementById('mb-empty'), vids=document.getElementById('mb-vids'), to=document.getElementById('mb-to');
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function track(e,p){try{window.gtag&&gtag('event',e,p||{});}catch(_){}}
  function data(){return SL?SL.data():{items:[],answers:{},contact:{}};}
  var q=new URLSearchParams(location.search);
  if(q.get('id')&&/^[a-z0-9]{12}$/.test(q.get('id'))){
    fetch(API+'/s/'+q.get('id')).then(function(r){return r.json();}).then(function(j){if(!j.ok)return;var b=j.brief,d=data();
      if(d.items.length&&!confirm('Replace the videos currently saved in this browser with the brief "'+b.company+'"?'))return;
      d.items=b.items.map(function(x,i){return {k:'b:'+i+':'+(x.u||x.em),t:x.t,c:x.c,d:x.d,sn:x.sn,th:x.th,em:x.em,u:x.u,note:x.note};});d.answers=b.answers||{};d.contact=Object.assign({},d.contact,{name:b.name,company:b.company});
      SL.set(d);history.replaceState(null,'','/my-brief/');draw();}).catch(function(){});
  }
  function draw(){
    var d=data();empty.hidden=!!d.items.length;form.hidden=!d.items.length;if(!d.items.length)return;
    vids.innerHTML=d.items.map(function(x,i){return '<article class="mb-v" data-k="'+esc(x.k)+'">'+
      '<a class="tp-thumb mb-play" data-cursor="play" href="'+esc(x.u||'#')+'" target="_blank" rel="noopener nofollow" data-i="'+i+'">'+(x.th?'<img src="'+esc(x.th)+'" alt="'+esc(x.t)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'<span class="tp-n disp">'+(i+1)+'</span><span class="tp-play" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></span></a>'+
      '<div><button type="button" class="mb-rm" data-k="'+esc(x.k)+'">Remove ✕</button><h3>'+esc(x.t)+'</h3><div class="mb-by">'+(x.sn?'by '+esc(x.sn):'')+(x.c&&x.t.indexOf(x.c)<0?' · client: '+esc(x.c):'')+'</div>'+
      '<label>What do you like about this video?<textarea data-note="'+esc(x.k)+'" maxlength="600" placeholder="e.g. the pace and music, how the product UI is animated, real customers on camera">'+esc(x.note||'')+'</textarea></label></div></article>';}).join('');
    vids.querySelectorAll('img[src*="#z="]').forEach(function(im){var s=im.getAttribute('src'),m=/#z=([\d.]+)/.exec(s),dy=/[&#]dy=(-?[\d.]+)/.exec(s);if(m)im.style.setProperty('--z',m[1]);if(dy)im.style.setProperty('--dy',dy[1]+'%');});
    var a=d.answers||{},c=d.contact||{};
    ['goal','story','length','budget','deadline'].forEach(function(k){var el=form.elements[k];if(el&&!el._set){el.value=a[k]||'';el._set=1;}});
    ['name','company','email'].forEach(function(k){var el=form.elements[k];if(el&&!el._set){el.value=c[k]||'';el._set=1;}});
    var wh=(a.where||'').split(', ').filter(Boolean);document.querySelectorAll('#mb-where button').forEach(function(b){b.classList.toggle('on',wh.indexOf(b.dataset.v)>=0);});
    recips();
  }
  function recips(){
    var d=data(),makers=[],seen={};
    d.items.forEach(function(x){if(x.d&&ST[x.d]&&ST[x.d].e&&!seen[x.d]){seen[x.d]=1;makers.push(x.d);}});
    var top=TOP.filter(function(dm){return !seen[dm];});
    var prev={};to.querySelectorAll('input[name=studio]').forEach(function(b){prev[b.value]=b.checked;});
    var had=Object.keys(prev).length;
    function row(dm,why,on){var s=ST[dm]||{n:dm,r:999};var c=had?(prev[dm]!==undefined?prev[dm]:false):on;return '<label class="mb-st"><input type="checkbox" name="studio" value="'+esc(dm)+'"'+(c?' checked':'')+'> '+esc(s.n)+' <em>'+why+(s.r<=20?' · #'+s.r+' in the 2026 ranking':'')+'</em></label>';}
    var h='<label style="margin-bottom:10px">Send it to studios (optional)</label>';
    h+=makers.map(function(dm){var n=d.items.filter(function(x){return x.d===dm;}).length;return row(dm,'made '+(n>1?n+' of your videos':'one of your videos'),true);}).join('');
    h+=top.slice(0,3).map(function(dm){return row(dm,'top studio',true);}).join('');
    if(top.length>3) h+='<details class="vi-more"><summary>Send to more top studios</summary><div class="vi-presets">'+[5,10,15].filter(function(n){return n<=top.length;}).map(function(n){return '<button type="button" class="vi-preset" data-n="'+n+'">Top '+n+'</button>';}).join('')+'</div>'+top.slice(3,15).map(function(dm){return row(dm,'top studio',false);}).join('')+'</details>';
    h+='<p class="mb-legal" style="margin-top:6px">Untick all to just get your brief page and PDF and share it yourself.</p>';
    to.innerHTML=h;label();
  }
  function sel(){return [].slice.call(to.querySelectorAll('input[name=studio]:checked')).map(function(b){return b.value;});}
  function label(){var n=sel().length;document.getElementById('mb-submit').textContent=n?'Send to '+n+' studio'+(n>1?'s':'')+' & get my brief':'Get my brief link & PDF';}
  function saveForm(){var d=data();d.answers=d.answers||{};['goal','story','length','budget','deadline'].forEach(function(k){d.answers[k]=form.elements[k].value;});
    d.answers.where=[].slice.call(document.querySelectorAll('#mb-where button.on')).map(function(b){return b.dataset.v;}).join(', ');
    d.contact={name:form.elements.name.value,company:form.elements.company.value,email:form.elements.email.value};
    vids.querySelectorAll('textarea[data-note]').forEach(function(t){var x=d.items.filter(function(i){return i.k===t.getAttribute('data-note');})[0];if(x)x.note=t.value;});
    try{localStorage.setItem('tcvp_brief_v1',JSON.stringify(d));}catch(e){}}
  form.addEventListener('input',function(){clearTimeout(form._t);form._t=setTimeout(saveForm,300);});
  form.addEventListener('change',function(e){if(e.target.name==='studio'){to.querySelectorAll('.vi-preset').forEach(function(x){x.classList.remove('on');});label();}});
  document.getElementById('mb-where').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;b.classList.toggle('on');saveForm();});
  to.addEventListener('click',function(e){var b=e.target.closest('.vi-preset');if(!b)return;var n=+b.dataset.n,i=0;to.querySelectorAll('.vi-preset').forEach(function(x){x.classList.toggle('on',x===b);});
    to.querySelectorAll('label.mb-st input').forEach(function(c){var mk=/made /.test(c.parentNode.textContent);if(mk)return;c.checked=i<n;i++;});label();});
  vids.addEventListener('click',function(e){var rm=e.target.closest('.mb-rm');if(rm){saveForm();SL.remove(rm.dataset.k);draw();return;}
    var a=e.target.closest('.mb-play');if(a&&window.tcvpModal){var x=data().items[+a.dataset.i];if(x&&x.em){e.preventDefault();tcvpModal.open(x.em,x.t);}}});
  draw();
  if(window.tcvpTsNeed)tcvpTsNeed(form);
  form.addEventListener('submit',function(e){e.preventDefault();saveForm();
    var d=data(),st=form.querySelector('.bf-status'),c=d.contact;
    if(!c.name||!c.company||!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c.email||'')){st.textContent='Please fill in your name, company and a valid work email.';st.className='bf-status err';return;}
    var slot=form.querySelector('.cf-turnstile-slot'),token=(window.turnstile&&slot&&slot.dataset.w)?turnstile.getResponse(slot.dataset.w):'';
    if(!token){st.textContent='Please complete the security check above.';st.className='bf-status err';return;}
    var btn=document.getElementById('mb-submit');btn.disabled=true;st.textContent='Sending…';st.className='bf-status';var s=sel();
    fetch(API+'/shortlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:c.name,company:c.company,email:c.email,items:d.items.map(function(x){return {t:x.t,c:x.c,sn:x.sn,d:x.d,u:x.u,th:x.th||'',em:x.em,note:x.note||''};}),answers:d.answers,studios:s,website:form.elements.website.value,t0:t0,token:token})})
      .then(function(r){return r.json();}).then(function(j){
        if(j.ok){st.innerHTML='<b>Almost done!</b> Check your inbox and click the confirmation link — '+(s.length?'your brief goes to '+s.length+' studio'+(s.length>1?'s':'')+' after that, and ':'')+'you get your brief page and PDF.';st.className='bf-status ok';track('shortlist_submit',{videos:d.items.length,studios:s.length});}
        else{var m={captcha:'Security check failed — please try again.',email:'Please use a valid work email address.',rate:'Too many requests from this connection today — please try again tomorrow.',timing:'Please take a moment to review and send again.',fields:'Please fill in your name, company and a valid work email.',items:'Save at least one video first.',content:'Your text looks like spam — please rephrase.',size:'Your brief is too long — please shorten the notes.'};st.textContent=m[j.error]||'Something went wrong — please try again.';st.className='bf-status err';}
      }).catch(function(){st.textContent='Network error — please try again.';st.className='bf-status err';})
      .finally(function(){btn.disabled=false;try{turnstile.reset(slot.dataset.w);}catch(_){}});
  });
});
