/* Video examples & guides: pop-up with details, studio site and "Order a video like this" brief (same logic as the prices page). */
(function(){
  var D=window.EX_DATA;if(!D)return;
  var IND={healthcare:'Healthcare & Medical',tech:'B2B Tech & SaaS',manufacturing:'Manufacturing & Industrial'};
  var IND_ALL={healthcare:'Healthcare',tech:'B2B Tech & SaaS',manufacturing:'Manufacturing',finance:'Finance',consumer:'Consumer & retail',education:'Education',nonprofit_gov:'Nonprofit & government',professional:'Professional services'};
  var TKEY={explainer:'explainer',brand_film:'brand',motion_graphics:'animation','3d_animation':'animation',ai_video:'ai'};
  var TLAB={corporate:'corporate video',explainer:'explainer videos',brand:'brand films & commercials',animation:'animation & 3D',ai:'AI video'};
  var CAT={brand_film:'Brand film & commercial',explainer:'Explainer video',testimonial:'Customer story',product:'Product video',training:'Training video',event:'Event video',recruiting:'Recruiting video',motion_graphics:'Motion graphics','3d_animation':'3D animation',ai_video:'AI video',corporate:'Company overview video'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(n){return n>=1000?'$'+(n%1000===0?n/1000:(n/1000).toFixed(1))+'k':'$'+n;}
  function track(e,p){try{window.gtag&&gtag('event',e,p||{});}catch(_){}}
  function st(d){return D.st[d]||{n:d,u:'https://'+d,r:999,e:0};}
  function leadersFor(v){var key=IND[v.ind]?'i:'+v.ind:(TKEY[v.cat]||'corporate'),lab=IND[v.ind]||TLAB[TKEY[v.cat]||'corporate'];
    var full=(D.lead[key]||D.lead.corporate||[]),list=[];
    full.forEach(function(d,i){if(d!==v.d&&st(d).e&&list.length<3)list.push({d:d,n:i+1});});return{list:list,label:lab};}
  function popup(v){
    var S=st(v.d),L=leadersFor(v),live=window.TCVP_BRIEF_LIVE===true,canOwn=!!S.e,t=v.t;
    var pr=v.p?money(v.p[0])+(v.p[1]&&v.p[1]!==v.p[0]?' – '+money(v.p[1]):''):'';
    var el=document.createElement('div');el.className='vinfo';
    var rows=(canOwn?'<label><input type="checkbox" name="studio" value="'+esc(v.d)+'" checked> '+esc(S.n)+' <em>made this video</em></label>':'')+
      L.list.map(function(o){var s2=st(o.d);return '<label><input type="checkbox" name="studio" value="'+esc(o.d)+'" checked> '+esc(s2.n)+' <em>#'+o.n+' in '+esc(L.label)+(s2.r<=20?' · ranked #'+s2.r+' overall':'')+'</em></label>';}).join('');
    var meta=[CAT[v.cat]||'',IND_ALL[v.ind]||'',v.y||'',v.c?'client: '+v.c:''].filter(Boolean).join(' · ');
    el.innerHTML='<div class="vi-top"><div>'+(pr?'<div class="vi-price">'+esc(pr)+'</div><div class="vi-basis">What the studio says it cost · <a href="'+esc(v.pu)+'">price guide</a></div>':'<div class="vi-basis" style="font-size:13px">Real client work</div>')+'</div>'+
      '<div class="vi-actions">'+(live&&(canOwn||L.list.length)?'<button type="button" class="btn btn-dark vi-open">Order a video like this</button>':'')+'<a class="btn btn-ghost" href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="examples-popup">'+esc(S.n)+' site ↗</a></div></div>'+
      '<div class="vi-title">'+esc(t)+'</div><div class="vi-meta">'+esc(meta)+'</div>'+
      '<div class="vi-studio">Made by <a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="examples-popup">'+esc(S.n)+'</a>'+(S.r<=20?' · #'+S.r+' in the 2026 ranking':'')+(v.pg?' · <a href="'+esc(v.pg)+'" target="_blank" rel="noopener nofollow">see it on the studio’s site ↗</a>':'')+'</div>'+
      (v.no?'<div class="vi-note">'+esc(v.no)+'</div>':'')+
      (live?'<form class="vi-brief briefform" data-uid="examples-video" data-theme="light" data-context="'+esc('Re: video “'+t+'” by '+S.n+' — seen on '+document.title)+'" novalidate>'+
        '<div class="bf-row"><label>Your name<input name="name" autocomplete="name" required maxlength="80"></label><label>Company<input name="company" autocomplete="organization" required maxlength="120"></label></div>'+
        '<label>Work email<input name="email" type="email" autocomplete="email" required maxlength="160"></label>'+
        '<label>Message<textarea name="details" maxlength="1500" placeholder="What do you need, by when, and roughly what budget?">I’d like a video similar to “'+esc(t)+'”. </textarea></label>'+
        '<div class="vi-to"><h4>Send to</h4>'+rows+'</div>'+
        '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="cf-turnstile-slot"></div>'+
        '<div class="bf-foot"><button type="submit" class="btn btn-dark">Send brief <span class="bf-count"></span></button><span class="bf-status" role="status" aria-live="polite"></span></div>'+
        '<p class="bf-legal">You will get an email to confirm before anything is sent. Your brief goes only to the studios you tick; a copy goes to the publisher of this ranking, Lava Media.</p></form>':'');
    var ob=el.querySelector('.vi-open');if(ob)ob.addEventListener('click',function(){el.classList.add('brief-open');ob.remove();var f=el.querySelector('form');if(f&&!f._init){f._init=1;window.tcvpBriefInit&&window.tcvpBriefInit(f);}setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'nearest'});var i=el.querySelector('input[name=name]');if(i)i.focus();},50);track('example_brief_open',{studio:S.n});});
    window.tcvpModal.open(v.em||'',t,el);track('example_video_open',{studio:S.n});
  }
  document.addEventListener('click',function(e){var a=e.target.closest('.ex-thumb');if(!a||!window.tcvpModal)return;var v=D.v[a.getAttribute('data-k')];if(!v)return;e.preventDefault();e.stopPropagation();popup(v);},true);
})();
