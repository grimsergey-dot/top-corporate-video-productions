(function(){
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
      len=path.getTotalLength();path.style.strokeDasharray=len+' '+len;
      samples=[];var maxY=0;for(var s=0;s<=400;s++){var l=len*s/400,pt=path.getPointAtLength(l);maxY=Math.max(maxY,pt.y);samples.push([l,maxY]);}
    }
    function target(){ // length whose y reaches the viewport's lower third
      var y=scrollY+innerHeight*0.62, lo=0, hi=samples.length-1;
      if(scrollY<5) return len*0.02;
      while(lo<hi){var m=(lo+hi)>>1; if(samples[m][1]<y) lo=m+1; else hi=m;}
      return samples[lo][0];
    }
    function tick(){var t=target();drawn=reduce?t:lerp(drawn,t,0.085);path.style.strokeDashoffset=(len-drawn).toFixed(1);requestAnimationFrame(tick);}
    build();drawn=target();addEventListener('resize',function(){build();});
    new ResizeObserver(function(){build();}).observe(document.querySelector('.page'));
    requestAnimationFrame(tick);
  }

  /* ---------- cuberto-style cursor ---------- */
  var fine=matchMedia('(pointer: fine)').matches;
  var cursorEl=document.getElementById('cursor');
  if(cursorEl&&fine){var cur=cursorEl;
    var mx=-100,my=-100,cx=-100,cy=-100;
    addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;cur.classList.add('on');},{passive:true});
    document.addEventListener('mouseleave',function(){cur.classList.remove('on');});
    (function loop(){cx=lerp(cx,mx,0.2);cy=lerp(cy,my,0.2);cur.style.transform='translate3d('+cx+'px,'+cy+'px,0)';requestAnimationFrame(loop);})();
    document.addEventListener('mouseover',function(e){
      var t=e.target.closest('[data-cursor],a,button');
      cur.classList.toggle('is-play',!!(t&&t.getAttribute('data-cursor')==='play'));
      cur.classList.toggle('is-link',!!(t&&!t.hasAttribute('data-cursor')));
    });
  }

  /* ---------- hero fallback tilt (if no WebGL) ---------- */

  /* ---------- details: expand in place ---------- */
  document.querySelectorAll('[data-details]').forEach(function(btn){
    var panel=document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click',function(){
      var open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',!open);
      btn.querySelector('.lbl').textContent=open?'Details':'Close';
      if(open){panel.style.height=panel.scrollHeight+'px';requestAnimationFrame(function(){panel.style.height='0px';});panel.classList.remove('open');}
      else{panel.classList.add('open');panel.style.height=panel.scrollHeight+'px';panel.addEventListener('transitionend',function f(){if(btn.getAttribute('aria-expanded')==='true')panel.style.height='auto';panel.removeEventListener('transitionend',f);});}
    });
  });

  /* ---------- video modal ---------- */
  var modal=document.getElementById('vmodal');
  if(modal){
    var frame=modal.querySelector('.vframe');
    function open(src,title){frame.innerHTML='<iframe src="'+src+'" title="'+(title||'Showreel')+'" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';modal.hidden=false;document.body.style.overflow='hidden';requestAnimationFrame(function(){modal.classList.add('show');});}
    function close(){modal.classList.remove('show');setTimeout(function(){modal.hidden=true;frame.innerHTML='';document.body.style.overflow='';},300);}
    document.querySelectorAll('[data-video]').forEach(function(el){el.addEventListener('click',function(e){
      var v=el.getAttribute('data-video');if(!v)return;e.preventDefault();open(v,el.getAttribute('data-title'));});});
    modal.addEventListener('click',function(e){if(e.target===modal||e.target.closest('.vclose'))close();});
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)close();});
  }

  /* ---------- tiles, accordion ---------- */
  document.querySelectorAll('.tilerow').forEach(function(row){var tiles=[].slice.call(row.children);
    tiles.forEach(function(t){t.addEventListener('mouseenter',function(){tiles.forEach(function(x){x.classList.toggle('on',x===t);});});});});
  document.querySelectorAll('.acc').forEach(function(a){a.addEventListener('click',function(){a.setAttribute('aria-expanded',a.getAttribute('aria-expanded')!=='true');});});

  /* ---------- reveal on scroll ---------- */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});
})();
