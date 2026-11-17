(function(){
  function track(n,p){try{if(window.gtag)gtag('event',n,p||{});}catch(e){}}
  window.__track=track;
  document.addEventListener('click',function(e){var a=e.target.closest('a[data-studio]');if(a&&!a.hasAttribute('data-video'))track('studio_site_click',{studio:a.getAttribute('data-studio'),place:a.getAttribute('data-place')||''});},true);
  var lerp=function(a,b,t){return a+(b-a)*t;};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll-drawn ribbon (lusion-style) ---------- */
  var svg=document.getElementById('ribbon');
  if(svg){
    var path=svg.querySelector('#ribbon-path'), base=svg.querySelector('#ribbon-base');
    // normalized control points: x in [0,1] of width, y in [0,1] of page height
    var P=[[1.04,.012],[.80,.035],[.64,.06],[.86,.095],[1.0,.12],[.95,.16],[.62,.18],[.10,.205],[-.04,.24],[.08,.28],[.35,.30],[.92,.33],[1.03,.37],[.90,.41],[.40,.43],[.04,.47],[-.03,.52],[.12,.56],[.55,.58],[.97,.62],[1.03,.67],[.80,.71],[.30,.73],[-.02,.77],[.03,.82],[.40,.85],[.88,.88],[1.02,.92],[.70,.96],[.30,.985]];
    var len=0, samples=[], drawn=0, W=0, H=0;
    function build(){
      var page=document.querySelector('.page');W=page.offsetWidth;H=page.offsetHeight;
      svg.setAttribute('viewBox','0 0 '+W+' '+H);svg.style.height=H+'px';
      var pts=P.map(function(p){return [p[0]*W,p[1]*H];});
      // Catmull-Rom -> cubic Bezier
      var d='M'+pts[0][0]+' '+pts[0][1];
      for(var i=0;i<pts.length-1;i++){var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
        d+=' C'+(p1[0]+(p2[0]-p0[0])/6)+' '+(p1[1]+(p2[1]-p0[1])/6)+','+(p2[0]-(p3[0]-p1[0])/6)+' '+(p2[1]-(p3[1]-p1[1])/6)+','+p2[0]+' '+p2[1];}
      path.setAttribute('d',d);base.setAttribute('d',d);
      path.setAttribute('stroke-width',W<720?12:W<1180?18:26);len=path.getTotalLength();path.style.strokeDasharray=len+' '+len;
      samples=[];var maxY=0;for(var s=0;s<=400;s++){var l=len*s/400,pt=path.getPointAtLength(l);maxY=Math.max(maxY,pt.y);samples.push([l,maxY]);}
    }
    function target(){ // length whose y reaches the viewport's lower third
      var y=scrollY+innerHeight*0.62, lo=0, hi=samples.length-1;
      if(scrollY<5) return len*0.02;
      while(lo<hi){var m=(lo+hi)>>1; if(samples[m][1]<y) lo=m+1; else hi=m;}
      return samples[lo][0];
    }
    function tick(){var t=target();drawn=reduce?t:lerp(drawn,t,0.085);path.style.strokeDashoffset=(len-drawn).toFixed(1);requestAnimationFrame(tick);}
    build();drawn=target();var rbT;function rebuild(){clearTimeout(rbT);rbT=setTimeout(build,300);}
    addEventListener('resize',rebuild);
    new ResizeObserver(rebuild).observe(document.querySelector('.page'));
    requestAnimationFrame(tick);
  }

  /* ---------- cuberto-style cursor ---------- */
  var fine=matchMedia('(pointer: fine)').matches;
  var cursorEl=document.getElementById('cursor');
  if(cursorEl&&fine){var cur=cursorEl;
    var mx=-100,my=-100,cx=-100,cy=-100;
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cur.classList.add('on');},{passive:true});
    document.addEventListener('mouseleave',function(){cur.classList.remove('on');});
    (function loop(){var nx=lerp(cx,mx,0.22),ny=lerp(cy,my,0.22);if(Math.abs(nx-cx)>.05||Math.abs(ny-cy)>.05){cx=nx;cy=ny;cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)';}requestAnimationFrame(loop);})();
    document.addEventListener('mouseover',function(e){
      var t=e.target.closest('[data-cursor],a,button');
      cur.classList.toggle('is-play',!!(t&&t.getAttribute('data-cursor')==='play'));
      cur.classList.toggle('is-link',!!(t&&!t.hasAttribute('data-cursor')));
    });
  }

  /* ---------- hero fallback tilt (if no WebGL) ---------- */

  /* ---------- details: expand in place (CSS grid-rows transition) ---------- */
  document.querySelectorAll('[data-details]').forEach(function(btn){
    var panel=document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click',function(){
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',!open);
      btn.querySelector('.lbl').textContent=open?'Details':'Close';
      panel.classList.toggle('open',!open);
      if(!open) track('details_open',{studio:btn.getAttribute('data-studio')||''});
    });
  });

  /* ---------- video modal ---------- */
  var modal=document.getElementById('vmodal');
  if(modal){
    var frame=modal.querySelector('.vframe');
    function open(src,title){frame.innerHTML='<iframe src="'+src+'" title="'+(title||'Showreel')+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';modal.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(function(){modal.classList.add('show');});}
    function close(){modal.classList.remove('show');setTimeout(function(){modal.hidden=true;frame.innerHTML='';document.body.style.overflow='';},300);}
    document.addEventListener('click',function(e){var el=e.target.closest('[data-video]');if(!el)return;
      var v=el.getAttribute('data-video');if(!v)return;e.preventDefault();open(v,el.getAttribute('data-title'));track(el.hasAttribute('data-price')?'price_video_play':'reel_play',{studio:el.getAttribute('data-studio')||''});});
    modal.addEventListener('click',function(e){if(e.target===modal||e.target.closest('.vclose'))close();});
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)close();});
  }

  /* ---------- feedback form ---------- */
  var fb=document.getElementById('fbform');
  if(fb){fb.addEventListener('submit',function(e){e.preventDefault();
    var st=fb.querySelector('.fb-status'),btn=fb.querySelector('button[type=submit]');
    if(fb.querySelector('[name=botcheck]').checked)return;
    var key=fb.getAttribute('data-key');
    if(!key||key.indexOf('PLACEHOLDER')>-1){st.textContent='The form is being connected — please try again shortly.';st.className='fb-status err';return;}
    btn.disabled=true;st.textContent='Sending…';st.className='fb-status';
    var data=Object.fromEntries(new FormData(fb).entries());data.access_key=key;data.subject='Top Corporate Video Productions — '+(data.topic||'feedback');data.from_name='topcorporatevideoproduction.com';
    fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json();}).then(function(j){if(j.success){fb.reset();st.textContent='Thank you — we read every message and reply within a few days.';st.className='fb-status ok';track('feedback_submit',{topic:data.topic||''});}else{throw 0;}})
      .catch(function(){st.textContent='Something went wrong. Please try again in a minute.';st.className='fb-status err';})
      .finally(function(){btn.disabled=false;});
  });}

  /* ---------- brief forms ---------- */
  var BRIEF_API='https://tcvp-briefs.lava-media-usa.workers.dev/brief', TS_KEY='0x4AAAAAAGFxLy0uhEwTKJCC', t0=Date.now();
  var forms=[].slice.call(document.querySelectorAll('.briefform'));
  if(forms.length){
    window.__tsReady=function(){forms.forEach(function(f){var slot=f.querySelector('.cf-turnstile-slot');if(slot&&!slot.dataset.w){slot.dataset.w=turnstile.render(slot,{sitekey:TS_KEY,theme:'dark',size:'flexible',action:'brief'});}});};
    var sc=document.createElement('script');sc.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__tsReady';sc.async=true;sc.defer=true;document.head.appendChild(sc);
    forms.forEach(function(f){
      var boxes=[].slice.call(f.querySelectorAll('input[name=studio]')),cnt=f.querySelector('.bf-count'),st=f.querySelector('.bf-status');
      function upd(){var n=boxes.filter(function(b){return b.checked;}).length;cnt.textContent='to '+n+' studio'+(n===1?'':'s');}
      f.querySelectorAll('.preset').forEach(function(p){p.addEventListener('click',function(){var n=+p.dataset.n;f.querySelectorAll('.preset').forEach(function(x){x.classList.toggle('on',x===p);});var k=0;boxes.forEach(function(b,i){b.checked=!b.disabled&&i<n;});upd();});});
      boxes.forEach(function(b){b.addEventListener('change',function(){f.querySelectorAll('.preset').forEach(function(x){x.classList.remove('on');});upd();});});upd();
      f.addEventListener('submit',function(e){e.preventDefault();
        var fd=new FormData(f),sel=boxes.filter(function(b){return b.checked;}).map(function(b){return b.value;});
        if(!fd.get('name')||!fd.get('company')||!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(fd.get('email')||'')){st.textContent='Please fill in your name, company and a valid work email.';st.className='bf-status err';return;}
        if(!sel.length){st.textContent='Choose at least one studio.';st.className='bf-status err';return;}
        var slot=f.querySelector('.cf-turnstile-slot'),token=(window.turnstile&&slot.dataset.w)?turnstile.getResponse(slot.dataset.w):'';
        if(!token){st.textContent='Please complete the security check above.';st.className='bf-status err';return;}
        var btn=f.querySelector('button[type=submit]');btn.disabled=true;st.textContent='Sending…';st.className='bf-status';
        var details=(fd.get('vtype')?'Video type: '+fd.get('vtype')+'\n':'')+(fd.get('details')||'');
        fetch(BRIEF_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fd.get('name'),company:fd.get('company'),email:fd.get('email'),budget:fd.get('budget'),details:details,studios:sel,website:fd.get('website'),t0:t0,token:token,page:location.pathname,pageTitle:document.title})})
          .then(function(r){return r.json();}).then(function(j){
            if(j.ok){f.reset();upd();st.innerHTML='<b>Almost done!</b> Check your inbox and click the confirmation link — your brief goes out after that.';st.className='bf-status ok';track('brief_submit',{studios:sel.length,page:location.pathname});}
            else{var m={captcha:'Security check failed — please try again.',email:'Please use a valid work email address.',rate:'Too many briefs from this connection today — please try again tomorrow.',busy:'We are at today\'s limit — please try again tomorrow.',timing:'Please take a moment to review the form and send again.',studios:'Choose at least one studio.',fields:'Please fill in your name, company and a valid work email.',links:'Please remove extra links from your message.',content:'Your message looks like spam — please rephrase.'};st.textContent=m[j.error]||'Something went wrong — please try again.';st.className='bf-status err';}
          }).catch(function(){st.textContent='Network error — please try again.';st.className='bf-status err';})
          .finally(function(){btn.disabled=false;try{turnstile.reset(slot.dataset.w);}catch(e){}});
      });
    });
  }

  /* ---------- mobile nav ---------- */
  var bg=document.querySelector('.burger'),mn=document.getElementById('mnav');
  if(bg&&mn){bg.addEventListener('click',function(){var o=bg.getAttribute('aria-expanded')!=='true';bg.setAttribute('aria-expanded',o);mn.classList.toggle('open',o);});}

  /* ---------- tiles, accordion ---------- */
  document.querySelectorAll('.tilerow').forEach(function(row){var tiles=[].slice.call(row.children);
    tiles.forEach(function(t){t.addEventListener('mouseenter',function(){tiles.forEach(function(x){x.classList.toggle('on',x===t);});});});});
  document.querySelectorAll('.acc').forEach(function(a){a.addEventListener('click',function(){a.setAttribute('aria-expanded',a.getAttribute('aria-expanded')!=='true');});});

  /* ---------- reveal on scroll ---------- */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
})();
