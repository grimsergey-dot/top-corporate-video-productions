(function(){
  function track(n,p){try{if(window.gtag)gtag('event',n,p||{});}catch(e){}}
  window.__track=track;
  document.addEventListener('click',function(e){var a=e.target.closest('a[data-studio]');if(a&&!a.hasAttribute('data-video'))track('studio_site_click',{studio:a.getAttribute('data-studio'),place:a.getAttribute('data-place')||''});},true);
  var lerp=function(a,b,t){return a+(b-a)*t;};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ribbons threaded through blocks (lusion-style) ----------
     Several ribbons, each tied to a group of blocks. A ribbon loops around its blocks and
     weaves: inside a block it alternates behind / in front of it. Drawn on scroll, rewinds on scroll up. */
  var back=document.getElementById('rib-back'), front=document.getElementById('rib-front');
  if(back&&front){
    var NS='http://www.w3.org/2000/svg', page=document.querySelector('.page'), ribs=[], W=0, H=0;
    function box(sel,i){var el=typeof sel==='string'?document.querySelectorAll(sel)[i||0]:sel;if(!el)return null;var r=el.getBoundingClientRect(),pr=page.getBoundingClientRect();return {x:r.left-pr.left,y:r.top-pr.top,w:r.width,h:r.height,cx:r.left-pr.left+r.width/2,cy:r.top-pr.top+r.height/2};}
    // ellipse loop around a box: start angle a0 (radians), turns, radius pad, slight spiral so it crosses itself
    function loop(b,a0,turns,pad,spiral,n){var out=[],rx=b.w/2+pad,ry=b.h/2+pad*0.8;n=n||Math.round(10*turns);
      for(var i=0;i<=n;i++){var t=i/n,a=a0+t*turns*Math.PI*2,k=1+(spiral||0)*(t-.5);out.push([b.cx+Math.cos(a)*rx*k,b.cy+Math.sin(a)*ry*k]);}return out;}
    function catmull(pts){ // centripetal-ish Catmull-Rom -> cubic Bezier path
      var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
      for(var i=0;i<pts.length-1;i++){var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
        d+=' C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+','+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+','+p2[0].toFixed(1)+' '+p2[1].toFixed(1);}
      return d;}
    // ribbon definitions: points built from live block positions; weave = boxes the ribbon passes behind/over
    function defs(){
      // weave boxes are media only (lens, reel covers): the ribbon may cross OVER them; text blocks are always passed BEHIND
      var out=[], m=W<720, R=function(v){return m?v*0.55:v;};
      if(m){ // phones: one column, so only short loops around media that enter and leave at the right edge
        var a=box('#hero3d'); if(a) out.push({weave:[{cx:a.cx,cy:a.cy,w:a.w*0.6,h:a.h*0.6,x:a.cx-a.w*0.3,y:a.cy-a.h*0.3}],pts:[[W+40,a.y+a.h*0.1]].concat(loop({cx:a.cx,cy:a.cy,w:a.w*0.7,h:a.h*0.7},-Math.PI*0.2,1.15,6,0.2)).concat([[W+40,a.y+a.h*0.95]])});
        [0,1].forEach(function(i){var r=box('#shortlist .feat .reel',i); if(r) out.push({weave:[r],pts:[[W+40,r.y-30]].concat(loop(r,-Math.PI*0.35,1.1,12,0.15)).concat([[W+40,r.y+r.h+40]])});});
        return out;}
      var h1=box('.hero h1'), art=box('#hero3d'), st=box('.stats');
      if(h1&&art&&st){var lensB={cx:art.cx,cy:art.cy,w:art.w*0.62,h:art.h*0.62,x:art.cx-art.w*0.31,y:art.cy-art.h*0.31};
        out.push({weave:[lensB], pts:[[-60,h1.y-R(30)],[W*0.16,h1.y+R(10)],[h1.x+h1.w*0.62,h1.y+h1.h*0.30],[art.x+art.w*0.06,art.cy-art.h*0.28]]
        .concat(loop({cx:art.cx,cy:art.cy,w:art.w*0.66,h:art.h*0.66},Math.PI*1.08,1.4,R(8),0.22))
        .concat([[art.x+art.w*0.97,st.y-R(34)],[W+60,st.y+st.h*0.25]])});}
      var r1=box('#shortlist .feat .reel',0), r2=box('#shortlist .feat .reel',1), sh=box('#shortlist .shead');
      if(r1&&r2&&sh) out.push({weave:[r1,r2], pts:[[W+60,sh.y-R(40)],[W*0.86,sh.y+sh.h*0.6],[r1.x+r1.w*0.75,r1.y-R(30)]]
        .concat(loop(r1,-Math.PI*0.42,1.3,R(18),0.16))
        .concat([[r1.x+r1.w*0.55,r1.y+r1.h+R(70)],[r2.x+r2.w*0.2,r2.y-R(20)]])
        .concat(loop(r2,-Math.PI*0.75,0.95,R(16),-0.12))
        .concat([[W+60,r2.y+r2.h+R(60)]])});
      var t0=box('.tilerow .tile',0), t2=box('.tilerow .tile',2), br=box('#browse');
      if(t0&&t2&&br) out.push({weave:[], pts:[[-60,t0.y-R(70)],[t0.x+t0.w*0.4,t0.y-R(26)],[t0.x+t0.w*0.95,t0.cy],[t2.x+t2.w*0.15,t2.y+t2.h+R(30)],[t2.x+t2.w*0.85,t2.y+t2.h+R(20)],[t2.x+t2.w+R(36),t2.cy],[t2.x+t2.w*0.6,t2.y-R(34)],[t2.x+t2.w*0.2,t2.cy],[W*0.5,br.y+br.h*0.82],[W+60,br.y+br.h+R(40)]]});
      var fq=box('#faq'), cta=box('#feedback-cta .callout');
      if(fq&&cta) out.push({weave:[], pts:[[-60,fq.y+R(40)],[R(30),fq.y+fq.h*0.3],[R(26),fq.y+fq.h*0.75],[cta.x+cta.w*0.12,cta.y-R(26)],[cta.x+cta.w*0.5,cta.cy],[cta.x+cta.w+R(30),cta.y+cta.h*0.2],[cta.x+cta.w-R(40),cta.y+cta.h+R(34)],[cta.x+cta.w*0.35,cta.y+cta.h+R(26)],[-60,cta.y+cta.h+R(80)]]});
      return out;}
    function inside(p,b){return p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h;}
    function mk(svg,cls){var e=document.createElementNS(NS,'path');svg.appendChild(e);return e;}
    function build(){
      ribs.forEach(function(r){r.els.forEach(function(e){e.remove();});});ribs=[];
      W=page.offsetWidth;H=page.offsetHeight;
      [back,front].forEach(function(s){s.setAttribute('viewBox','0 0 '+W+' '+H);s.style.height=H+'px';});
      var sw=W<720?10:W<1180?16:22;
      defs().forEach(function(def,ri){
        var d=catmull(def.pts), probe=mk(back);probe.setAttribute('d',d);var L=probe.getTotalLength();probe.remove();
        // split into segments: runs inside a weave box alternate behind / in front, everything else sits behind content
        var segs=[],cur=null,flip=ri%2,samples=[],maxY=0,step=6;
        var tmp=mk(back);tmp.setAttribute('d',d);
        for(var l2=0;l2<=L+step;l2+=step){var q=tmp.getPointAtLength(Math.min(l2,L)),inb=def.weave.some(function(b){return inside(q,b);});
          maxY=Math.max(maxY,q.y);samples.push([Math.min(l2,L),maxY]);
          var layer=inb?(flip?'f':'b'):'b';
          if(!cur||cur.layer!==layer||cur.inb!==inb){if(cur&&cur.inb&&!inb)flip=1-flip;cur={layer:layer,inb:inb,a:Math.min(l2,L),b:Math.min(l2,L)};segs.push(cur);}else cur.b=Math.min(l2,L);}
        tmp.remove();
        // merge neighbours on the same layer; make front runs a little longer so the crossing reads as "over"
        var merged=[];segs.forEach(function(g){var last=merged[merged.length-1];if(last&&last.layer===g.layer){last.b=g.b;}else merged.push({layer:g.layer,a:g.a,b:g.b});});
        var els=merged.map(function(g){var e=mk(g.layer==='f'?front:back);e.setAttribute('d',d);e.setAttribute('stroke',g.layer==='f'?'url(#rgf)':'url(#rgb)');e.setAttribute('stroke-width',sw);
          if(g.layer==='f')e.setAttribute('filter','url(#ribsh)');e.style.visibility='hidden';e._a=g.a;e._b=g.b;return e;});
        ribs.push({els:els,L:L,samples:samples,drawn:0});
      });
      ribs.forEach(function(r){r.drawn=target(r);paint(r);});
    }
    function target(r){var y=scrollY+innerHeight*0.66,s=r.samples,lo=0,hi=s.length-1;
      if(!s.length||y<s[0][1])return 0;while(lo<hi){var m=(lo+hi)>>1;if(s[m][1]<y)lo=m+1;else hi=m;}return s[lo][0];}
    function paint(r){var D=r.drawn;r.els.forEach(function(e){var vis=Math.min(e._b,D)-e._a;if(vis<1){e.style.visibility='hidden';return;}
      e.style.visibility='visible';e.style.strokeDasharray=vis.toFixed(1)+' '+(r.L*2).toFixed(0);e.style.strokeDashoffset=(-e._a).toFixed(1);});}
    function tick(){ribs.forEach(function(r){var t=target(r);if(Math.abs(t-r.drawn)>0.5){r.drawn=reduce?t:lerp(r.drawn,t,0.09);paint(r);}});requestAnimationFrame(tick);}
    var rbT;function rebuild(){clearTimeout(rbT);rbT=setTimeout(build,250);}
    build();addEventListener('resize',rebuild);addEventListener('load',rebuild);
    if(window.ResizeObserver)new ResizeObserver(rebuild).observe(page);
    requestAnimationFrame(tick);
  }

  /* ---------- cuberto-style cursor ---------- */
  var fine=matchMedia('(pointer: fine)').matches;
  var cursorEl=document.getElementById('cursor');
  if(cursorEl&&fine){var cur=cursorEl;
    var mx=-100,my=-100,cx=-100,cy=-100;
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cur.classList.add('on');},{passive:true});
    document.addEventListener('mouseleave',function(){cur.classList.remove('on');});
    addEventListener('mousedown',function(){cur.classList.add('is-down');});addEventListener('mouseup',function(){cur.classList.remove('is-down');});
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
