(function(){
  var line=document.getElementById('scrollline');
  if(line){var onScroll=function(){var d=document.documentElement;var max=Math.max(1,d.scrollHeight-innerHeight);var p=Math.min(1,Math.max(0.12,scrollY/max+0.08));line.setAttribute('stroke-dashoffset',(1-p).toFixed(3));};addEventListener('scroll',onScroll,{passive:true});onScroll();}
  var hero=document.querySelector('[data-hero]'),cr=document.getElementById('crystal');
  if(hero&&cr){hero.addEventListener('mousemove',function(e){var r=hero.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;cr.style.transform='rotateX('+(-y*22)+'deg) rotateY('+(x*34)+'deg)';});
    hero.addEventListener('mouseleave',function(){cr.style.transform='';});}
  document.querySelectorAll('.reel').forEach(function(reel){var b=reel.querySelector('.playbtn');if(!b)return;
    reel.addEventListener('mousemove',function(e){var r=reel.getBoundingClientRect();b.style.transform='translate('+(e.clientX-r.left-56)+'px,'+(e.clientY-r.top-56)+'px) scale(1)';});
    reel.addEventListener('mouseleave',function(){b.style.transform='';});});
  var prof=document.getElementById('profile');
  if(prof&&window.TOP){
    document.querySelectorAll('[data-open]').forEach(function(btn){btn.addEventListener('click',function(){
      var t=TOP[+btn.getAttribute('data-open')];
      prof.querySelectorAll('[data-f]').forEach(function(el){el.textContent=t[el.getAttribute('data-f')]||'—';});
      prof.querySelector('[data-f-href]').href=t.url;
      prof.hidden=false;prof.scrollIntoView({behavior:'smooth',block:'start'});});});
    prof.querySelector('[data-close]').addEventListener('click',function(){prof.hidden=true;});
  }
  document.querySelectorAll('.tilerow').forEach(function(row){var tiles=[].slice.call(row.children);
    tiles.forEach(function(t){t.addEventListener('mouseenter',function(){tiles.forEach(function(x){x.classList.toggle('on',x===t);});});});});
  document.querySelectorAll('.acc').forEach(function(a){a.addEventListener('click',function(){a.setAttribute('aria-expanded',a.getAttribute('aria-expanded')!=='true');});});
})();
