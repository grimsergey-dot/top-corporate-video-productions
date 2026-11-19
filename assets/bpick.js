/* Brief template pages: filter the full video pool, save videos to the brief (same storage as My brief). */
document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('pick');if(!box)return;
  var grid=document.getElementById('bp-grid'),cnt=document.getElementById('bp-count'),more=document.getElementById('bp-more'),clr=document.getElementById('bp-clear'),qi=document.getElementById('bp-q'),so=document.getElementById('bp-sort');
  var SL=window.tcvpShortlist,POOL=[],STY={live_action:'Live action','2d_animation':'2D animation','3d_animation':'3D animation',motion_graphics:'Motion graphics',mixed:'Mixed media',ai:'AI'};
  var IND={healthcare:'Healthcare',tech:'B2B Tech & SaaS',manufacturing:'Manufacturing',finance:'Finance',consumer:'Consumer & retail',education:'Education',nonprofit_gov:'Nonprofit & government',professional:'Professional services',other:'Other'};
  var ANIM={'2d_animation':1,motion_graphics:1,'3d_animation':1};
  var S={look:{},cat:{},ind:{},bud:{},yr:{}},PAGE=24,shown=PAGE;
  if(box.dataset.preset==='anim')S.look.anim=1;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function track(e,p){try{window.gtag&&gtag('event',e,p||{});}catch(_){}}
  function money(n){if(n>=1e6)return '$'+(Math.round(n/1e4)/100)+'M';if(n>=1000)return '$'+(n%1000?(Math.round(n/100)/10):n/1000)+'k';return '$'+n;}
  function on(g){return Object.keys(S[g]);}
  function syncChips(){document.querySelectorAll('.bp-fg').forEach(function(f){var g=f.dataset.g;f.querySelectorAll('.chip').forEach(function(c){c.classList.toggle('on',!!S[g][c.dataset.v]);c.setAttribute('aria-pressed',!!S[g][c.dataset.v]);});});
    var any=(qi.value.trim()!=='')||['look','cat','ind','bud','yr'].some(function(g){return on(g).length;});clr.hidden=!any;}
  function lookOk(x,v){if(v==='anim')return !!ANIM[x.style]||x.cat==='motion_graphics'||x.cat==='3d_animation';if(x.style===v)return true;
    return (v==='motion_graphics'&&x.cat==='motion_graphics')||(v==='3d_animation'&&x.cat==='3d_animation')||(v==='ai'&&x.cat==='ai_video');}
  function budOk(x,v){if(!x.lo)return false;var p=x.hi?(x.lo+x.hi)/2:x.lo;return v==='lt10'?p<10000:v==='10-25'?p>=10000&&p<25000:v==='25-50'?p>=25000&&p<50000:p>=50000;}
  function yrOk(x,v){var y=x.y||0;return v==='2025'?y>=2025:v==='2023'?(y>=2023&&y<=2024):(y>0&&y<2023);}
  function match(x,toks){var l=on('look'),c=on('cat'),i=on('ind'),b=on('bud'),y=on('yr');
    if(l.length&&!l.some(function(v){return lookOk(x,v);}))return false;
    if(c.length&&!S.cat[x.cat])return false;
    if(i.length&&!S.ind[x.ind||'other'])return false;
    if(b.length&&!b.some(function(v){return budOk(x,v);}))return false;
    if(y.length&&!y.some(function(v){return yrOk(x,v);}))return false;
    if(toks.length){var h=(x.t+' '+x.c+' '+x.sn).toLowerCase();if(!toks.every(function(t){return h.indexOf(t)>=0;}))return false;}
    return true;}
  function hsh(t){var h=2166136261;for(var i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function mix(L){var by={},ord=[];L.slice().sort(function(a,b){return ((b.y||0)-(a.y||0))||(a.r-b.r);}).forEach(function(x){if(!by[x.d]){by[x.d]=[];ord.push(x.d);}by[x.d].push(x);});
    ord.sort(function(a,b){return hsh('bp'+a)-hsh('bp'+b);});var out=[],i=0,left=L.length;while(out.length<left){ord.forEach(function(d){if(by[d][i])out.push(by[d][i]);});i++;}return out;}
  function sorted(L){var s=so.value;if(s==='mix')return mix(L);varP=function(x){return x.lo?(x.hi?(x.lo+x.hi)/2:x.lo):null;};
    return L.slice().sort(function(a,b){
      if(s==='top')return (a.r-b.r)||((b.y||0)-(a.y||0));
      if(s==='plo'||s==='phi'){var pa=P(a),pb=P(b);if(pa==null&&pb==null)return (b.y||0)-(a.y||0);if(pa==null)return 1;if(pb==null)return -1;return s==='plo'?pa-pb:pb-pa;}
      return ((b.y||0)-(a.y||0))||(a.r-b.r);});}
  function key(x){return 'x:'+x.k;}
  function card(x){var sv=SL&&SL.has(key(x));
    return '<article class="pc-vc bp-vc" data-k="'+esc(x.k)+'"><a class="pc-thumb bp-thumb" href="'+esc(x.u)+'" target="_blank" rel="noopener nofollow" data-cursor="play">'+(x.th?'<img src="'+esc(x.th)+'" alt="'+esc(x.t)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+
      '<span class="pc-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></span>'+(STY[x.style]?'<span class="pc-tag">'+STY[x.style]+'</span>':'')+'</a>'+
      '<div class="pc-vb"><h3>'+esc(x.t)+'</h3><div class="pc-meta">'+(x.c?'Client: '+esc(x.c):'')+(x.ind&&IND[x.ind]?(x.c?' · ':'')+IND[x.ind]:'')+(x.y?' · '+x.y:'')+'</div>'+
      (x.lo?'<div class="bp-price">Cost: '+(x.b?esc(x.b):money(x.lo)+(x.hi&&x.hi!==x.lo?' – '+money(x.hi):''))+'</div>':'')+
      '<div class="pc-by">'+esc(x.sn)+(x.r<=20?' <em>#'+x.r+'</em>':'')+'</div>'+
      '<button type="button" class="bp-save'+(sv?' on':'')+'" aria-pressed="'+!!sv+'">'+(sv?'<span aria-hidden="true">✓</span> Saved':'<span aria-hidden="true">♡</span> Save to brief')+'</button></div></article>';}
  var cur=[];
  function draw(reset){if(reset)shown=PAGE;var toks=qi.value.toLowerCase().split(/\s+/).filter(Boolean);
    cur=sorted(POOL.filter(function(x){return match(x,toks);}));
    grid.innerHTML=cur.length?cur.slice(0,shown).map(card).join(''):'<p class="muted bp-none">No videos match these filters. <button type="button" class="bp-clear" data-clear>Clear filters</button></p>';
    grid.querySelectorAll('img[src*="#z="]').forEach(function(im){var s=im.getAttribute('src'),m=/#z=([\d.]+)/.exec(s),dy=/[&#]dy=(-?[\d.]+)/.exec(s);if(m)im.style.setProperty('--z',m[1]);if(dy)im.style.setProperty('--dy',dy[1]+'%');});
    cnt.textContent=cur.length+' video'+(cur.length===1?'':'s');more.hidden=cur.length<=shown;syncChips();}
  function refreshSaved(){grid.querySelectorAll('.bp-vc').forEach(function(a){var x=byK[a.dataset.k];if(!x)return;var b=a.querySelector('.bp-save'),sv=SL&&SL.has(key(x));if(!b)return;b.classList.toggle('on',!!sv);b.setAttribute('aria-pressed',!!sv);b.innerHTML=sv?'<span aria-hidden="true">✓</span> Saved':'<span aria-hidden="true">♡</span> Save to brief';});bar();}
  var byK={};
  document.getElementById('bp-filters').addEventListener('click',function(e){var c=e.target.closest('.bp-fg .chip');if(!c)return;var g=c.closest('.bp-fg').dataset.g,v=c.dataset.v;if(S[g][v])delete S[g][v];else S[g][v]=1;draw(true);track('brief_filter',{group:g,value:v});});
  clr.addEventListener('click',function(){S={look:{},cat:{},ind:{},bud:{},yr:{}};qi.value='';draw(true);});
  grid.addEventListener('click',function(e){
    if(e.target.closest('[data-clear]')){clr.click();return;}
    var a=e.target.closest('.bp-vc');if(!a)return;var x=byK[a.dataset.k];if(!x)return;
    if(e.target.closest('.bp-save')){if(!SL)return;if(SL.has(key(x)))SL.remove(key(x));else SL.add({k:key(x),t:x.t,c:x.c,d:x.d,sn:x.sn,th:x.th,em:x.em,u:x.u});refreshSaved();return;}
    if(e.target.closest('.bp-thumb')&&window.tcvpModal&&x.em){e.preventDefault();tcvpModal.open(x.em,x.t);track('brief_pick_play');}});
  more.addEventListener('click',function(){shown+=PAGE*2;draw(false);});
  var qt;qi.addEventListener('input',function(){clearTimeout(qt);qt=setTimeout(function(){draw(true);},200);});
  so.addEventListener('change',function(){draw(true);});
  document.addEventListener('tcvp:brief',refreshSaved);
  /* sticky "go to brief" bar */
  var sb=document.createElement('a');sb.href='#brief';sb.className='bp-sticky';sb.hidden=true;document.body.appendChild(sb);
  var briefEl=document.getElementById('brief'),inView=false;
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){inView=es[0].isIntersecting;bar();},{threshold:0.05}).observe(briefEl);
  function bar(){var n=SL?SL.count():0;sb.hidden=!n||inView;sb.innerHTML='<b>'+n+'</b> saved · <span>Continue to your brief ↓</span>';}
  bar();
  /* copy plain template */
  var cb=document.getElementById('bp-copybtn');if(cb)cb.addEventListener('click',function(){var t=window.tcvpBriefText?window.tcvpBriefText():document.getElementById('bp-plain').textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){cb.textContent='Copied ✓';setTimeout(function(){cb.textContent='Copy template';},1600);}).catch(function(){var r=document.createRange();r.selectNodeContents(document.getElementById('bp-plain'));var s=getSelection();s.removeAllRanges();s.addRange(r);});track('brief_template_copy');});
  syncChips();
  fetch(window.BP_POOL).then(function(r){return r.json();}).then(function(j){
    POOL=j.v.map(function(a){return {k:a[0],t:a[1],c:a[2],d:a[3],sn:a[4],r:a[5],th:a[6],em:a[7],u:a[8],cat:a[9],style:a[10],ind:a[11],y:a[12],lo:a[13],hi:a[14],b:a[15]};});
    POOL.forEach(function(x){byK[x.k]=x;});draw(true);}).catch(function(){});
});
