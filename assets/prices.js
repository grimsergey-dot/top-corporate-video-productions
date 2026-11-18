/* Corporate Video Prices calculator — exact prices only */
(function(){
  'use strict';
  var BUDGETS={lt5:[0,4999],'5-10':[5000,10000],'10-25':[10000,25000],'25-50':[25000,50000],'50-100':[50000,100000],'100p':[100000,Infinity]};
  var CTX={'client review':'Client-stated cost (Clutch review)','package':'Package price','case study':'Case-study price','blog cost breakdown':'Cost breakdown','service page':'Service page price'};
  var MIN_VIDEOS=10,PER_STUDIO=3,PAGE=12;
  var D=null,form=document.getElementById('pc-form');if(!form)return;
  var $=function(id){return document.getElementById(id);};
  var lim={v:PAGE,s:12,t:20};
  function track(n,p){try{if(window.gtag)gtag('event',n,p||{});}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(n){if(n==null||!isFinite(n))return '';if(n>=1e6)return '$'+(n/1e6).toFixed(n%1e6?1:0)+'M';if(n>=1000){var k=n/1000;return '$'+(k>=100?Math.round(k):(+k.toFixed(1)).toString())+'k';}return '$'+Math.round(n);}
  function price(x){return x.hi?money(x.lo)+'–'+money(x.hi):money(x.lo);}
  function mid(x){return x.hi?(x.lo+x.hi)/2:x.lo;}
  function st(){var f=new FormData(form);return{type:f.get('type')||'',ind:f.get('ind')||'',budget:f.get('budget')||''};}
  function band(){var s=st();return s.budget?BUDGETS[s.budget]:null;}
  function inBand(x,b){return !b||(x.lo<=b[1]&&(x.hi||x.lo)>=b[0]);}
  function dist(x,b){if(!b||inBand(x,b))return 0;var m=mid(x);return m<b[0]?(b[0]-m)/b[0]:(m-b[1])/b[1];}
  function studio(d){return D.studios[d]||{n:d,r:999,u:'#',i:[]};}
  function median(a){if(!a.length)return null;a=a.slice().sort(function(x,y){return x-y;});var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function label(list,k){for(var i=0;i<list.length;i++)if(list[i][0]===k)return list[i][1];return '';}

  /* ---------- videos: exact matches first, then labelled fallbacks; max 3 per studio up front ---------- */
  function videos(){
    var s=st(),b=band(),R=D.videos.filter(function(v){return !v.out;}),O=D.videos.filter(function(v){return v.out;});
    var T=function(v){return !s.type||v.t===s.type;},I=function(v){return !s.ind||v.ind===s.ind;};
    var byRank=function(a,c){return studio(a.d).r-studio(c.d).r||a.lo-c.lo;},byDist=function(a,c){return dist(a,b)-dist(c,b)||byRank(a,c);};
    var tiers=[
      [R.filter(function(v){return T(v)&&I(v)&&inBand(v,b);}).sort(byRank),''],
      [b?R.filter(function(v){return T(v)&&I(v)&&!inBand(v,b);}).sort(byDist):[],'Close to your budget'],
      [s.ind?R.filter(function(v){return T(v)&&!I(v)&&inBand(v,b);}).sort(byRank):[],'Same type, other industry'],
      [s.ind?R.filter(function(v){return T(v)&&!I(v)&&!inBand(v,b);}).sort(byDist):[],'Same type, other industry'],
      [O.filter(T).sort(function(a,c){return (I(c)-I(a))||dist(a,b)-dist(c,b);}),'Not in our ranking']
    ];
    var out=[],seen={},cnt={},rest=[];
    function studiosIn(){var m={};out.forEach(function(o){m[o.v.d]=1;});return Object.keys(m).length;}
    tiers.forEach(function(t,ti){
      if(ti>0&&out.length>=MIN_VIDEOS&&studiosIn()>=4)return;   /* fallbacks only while fewer than 10 videos or 4 studios */
      var q={},order=[];t[0].forEach(function(v){var k=v.d+'|'+v.u;if(seen[k])return;seen[k]=1;if(!q[v.d]){q[v.d]=[];order.push(v.d);}q[v.d].push(v);});
      var key=(ti===0||!b)?function(v){return v.lo;}:function(v){return dist(v,b);};  /* in budget: cheapest first; fallbacks: closest to the budget first */
      order.forEach(function(d){q[d].sort(function(a,c){return key(a)-key(c);});});order.sort(function(a,c){return key(q[a][0])-key(q[c][0]);});
      for(var round=0,more=true;more;round++){more=false;order.forEach(function(d){var v=q[d][round];if(!v)return;more=true;  /* round-robin across studios */
        var o={v:v,tag:t[1]};if((cnt[d]||0)<PER_STUDIO){cnt[d]=(cnt[d]||0)+1;out.push(o);}else rest.push(o);});}
    });
    return out.concat(rest);}
  function pool(){var s=st(),b=band();   /* ranked items matching all filters: videos + package prices */
    return D.videos.filter(function(v){return !v.out&&(!s.type||v.t===s.type)&&(!s.ind||v.ind===s.ind)&&inBand(v,b);})
      .concat(D.prices.filter(function(p){return (!s.type||p.t===s.type)&&(!s.ind||p.ind===s.ind||(p.ind==null&&studio(p.d).i.indexOf(s.ind)>=0))&&inBand(p,b);}));}

  /* ---------- rendering ---------- */
  function renderSummary(){var P=pool(),u={};P.forEach(function(x){u[x.d+'|'+mid(x)]=mid(x);});var vals=Object.keys(u).map(function(k){return u[k];}),m=median(vals);  /* distinct price points per studio */
    $('pc-med').textContent=m?money(Math.round(m/50)*50):'—';
    $('pc-med-s').textContent=P.length?('Across '+P.length+' exact price'+(P.length>1?'s':'')+' that match'):'No exact prices for this combination yet';
    if(P.length){var lo=Math.min.apply(null,P.map(function(x){return x.lo;})),hi=Math.max.apply(null,P.map(function(x){return x.hi||x.lo;}));$('pc-rng').textContent=lo===hi?money(lo):money(lo)+'–'+money(hi);}else $('pc-rng').textContent='—';
    var n={};P.forEach(function(x){n[x.d]=1;});var c=Object.keys(n).length;$('pc-nst').textContent=c;
    $('pc-nst-s').textContent=c?'with an exact price that matches':'Try a broader filter';}
  function vcard(o,i){var v=o.v,S=studio(v.d),t=v.ti||((v.c?v.c+' — ':'')+label(D.types,v.t));
    var attrs=(v.em?' data-video="'+esc(v.em)+'" data-title="'+esc(t)+'" data-price="1"':'')+' data-cursor="play"';
    var tagc=o.tag==='Not in our ranking'?' out':(o.tag==='Close to your budget'?' near':'');
    return '<article class="pc-vc">'+
      '<a class="pc-thumb" href="'+esc(v.u)+'" target="_blank" rel="noopener nofollow" data-i="'+i+'" data-studio="'+esc(S.n)+'"'+attrs+'>'+
      (v.th?'<img src="'+esc(v.th)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+
      '<span class="pc-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></span>'+
      (o.tag?'<span class="pc-tag'+tagc+'">'+esc(o.tag)+'</span>':'')+'</a>'+
      '<div class="pc-vb"><div class="pc-price">'+esc(price(v))+'</div><div class="pc-basis">'+esc(CTX[v.ctx]||'Studio-stated price')+(v.pg?' · <a href="'+esc(v.pg)+'" target="_blank" rel="noopener nofollow">source</a>':'')+'</div>'+
      '<h3>'+esc(t)+'</h3><div class="pc-meta">'+esc(label(D.types,v.t))+(v.ind?' · '+esc(label(D.inds,v.ind)):'')+(v.y?' · '+v.y:'')+'</div>'+
      '<a class="pc-by" href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-video">'+esc(S.n)+(S.r<=20?' <em>#'+S.r+'</em>':'')+' ↗</a></div></article>';}
  function renderVideos(){var list=videos(),box=$('pc-videos');
    if(!list.length){box.innerHTML='<div class="pc-empty-box">No priced videos for this combination yet. We add new ones every week.</div>';$('pc-videos-more').hidden=true;return;}
    CUR_VIDEOS=list.slice(0,lim.v).map(function(o){return o.v;});
    box.innerHTML=list.slice(0,lim.v).map(vcard).join('')+(list.length<MIN_VIDEOS?'<div class="pc-empty-box pc-soon">Only '+list.length+' video'+(list.length>1?'s':'')+' with an exact, studio-stated price so far. Most studios publish only “from” prices for this kind of work; we add new priced videos as they appear.</div>':'');
    $('pc-videos-more').hidden=list.length<=lim.v;}
  function studiosFit(){var m={};pool().forEach(function(x){var r=m[x.d]||(m[x.d]={d:x.d,n:0,lo:Infinity,hi:0,v:0});r.n++;if(x.u)r.v++;r.lo=Math.min(r.lo,x.lo);r.hi=Math.max(r.hi,x.hi||x.lo);});
    return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return a.lo-b.lo||studio(a.d).r-studio(b.d).r;});}
  function scard(r){var S=studio(r.d),pk=r.n-r.v;
    return '<div class="pc-s1"><div class="pc-rank">'+(S.r<=20?'#'+S.r:'Listed')+'</div><div class="pc-sn"><a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-studio">'+esc(S.n)+' ↗</a><ul><li><b>'+(r.lo===r.hi?money(r.lo):money(r.lo)+'–'+money(r.hi))+'</b> exact prices</li><li>'+(r.v?r.v+' priced video'+(r.v>1?'s':''):'')+(r.v&&pk?' · ':'')+(pk?pk+' package'+(pk>1?'s':''):'')+'</li></ul></div></div>';}
  function renderStudios(){var list=studiosFit(),box=$('pc-studios');
    box.innerHTML=list.length?list.slice(0,lim.s).map(scard).join(''):'<div class="pc-empty-box">No ranked studio has an exact price for this combination yet. Try “Any industry” or a wider budget.</div>';
    $('pc-studios-more').hidden=list.length<=lim.s;}
  function capRows(rows){var c={};return rows.filter(function(p){c[p.d]=(c[p.d]||0)+1;return c[p.d]<=3;});}
  function renderTable(){var s=st(),b=band(),box=$('pc-table');
    var rows=capRows(D.prices.filter(function(p){return (!s.type||p.t===s.type)&&(!s.ind||p.ind===s.ind||(p.ind==null&&studio(p.d).i.indexOf(s.ind)>=0))&&inBand(p,b);})
      .sort(function(a,c){return studio(a.d).r-studio(c.d).r||a.lo-c.lo;}));
    box.innerHTML=rows.length?'<div class="pc-tscroll"><table><thead><tr><th>Studio</th><th>Package</th><th>Price</th><th>Type</th><th>Source</th></tr></thead><tbody>'+
      rows.slice(0,lim.t).map(function(p){var S=studio(p.d);return '<tr><td><a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-table">'+esc(S.n)+'</a></td><td>'+esc(p.w)+'</td><td class="num">'+esc(price(p))+'</td><td>'+esc(label(D.types,p.t))+'</td><td>'+(p.ex?'<a href="'+esc(p.ex)+'" target="_blank" rel="noopener nofollow">example</a> · ':'')+(p.src?'<a href="'+esc(p.src)+'" target="_blank" rel="noopener nofollow">page</a>':'')+'</td></tr>';}).join('')+'</tbody></table></div>'
      :'<div class="pc-empty-box">No fixed package prices for this combination yet.</div>';
    $('pc-table-more').hidden=rows.length<=lim.t;}
  /* ---------- video pop-up: details + brief to this studio and the category leaders ---------- */
  var IND_NAMES={healthcare:'Healthcare & Medical',tech:'B2B Tech & SaaS',manufacturing:'Manufacturing & Industrial'};
  function leadersFor(v){var key=v.ind?'i:'+v.ind:v.t,label=v.ind?IND_NAMES[v.ind]:label2(v.t);
    var full=((D.lead||{})[key]||D.lead.corporate||[]),list=[];
    full.forEach(function(d,i){if(d!==v.d&&list.length<3)list.push({d:d,n:i+1});});return {list:list,label:label};}
  function label2(t){return label(D.types,t)||'corporate video';}
  function popup(v){
    var S=studio(v.d),t=v.ti||((v.c?v.c+' — ':'')+label(D.types,v.t)),L=leadersFor(v),live=window.TCVP_BRIEF_LIVE===true,canOwn=!!S.e;
    var el=document.createElement('div');el.className='vinfo';
    var rows=(canOwn?'<label><input type="checkbox" name="studio" value="'+esc(v.d)+'" checked> '+esc(S.n)+' <em>made this video</em></label>':'')+
      L.list.map(function(o){var d=o.d,s2=studio(d);return '<label><input type="checkbox" name="studio" value="'+esc(d)+'" checked> '+esc(s2.n)+' <em>#'+o.n+' in '+esc(L.label)+(s2.r<=20?' · ranked #'+s2.r+' overall':'')+'</em></label>';}).join('');
    el.innerHTML='<div class="vi-top"><div><div class="vi-price">'+esc(price(v))+'</div><div class="vi-basis">'+esc(CTX[v.ctx]||'Studio-stated price')+(v.pg?' · <a href="'+esc(v.pg)+'" target="_blank" rel="noopener nofollow">see source</a>':'')+'</div></div>'+
      '<div class="vi-actions">'+(live&&(canOwn||L.list.length)?'<button type="button" class="btn btn-dark vi-open">Order a video like this</button>':'')+'<a class="btn btn-ghost" href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-popup">'+esc(S.n)+' site ↗</a></div></div>'+
      '<div class="vi-title">'+esc(t)+'</div><div class="vi-meta">'+esc(label(D.types,v.t))+(v.ind?' · '+esc(IND_NAMES[v.ind]):'')+(v.y?' · '+v.y:'')+(v.c?' · client: '+esc(v.c):'')+'</div>'+
      '<div class="vi-studio">Made by <a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-popup">'+esc(S.n)+'</a>'+(S.r<=20?' · #'+S.r+' in the 2026 ranking':(S.out?' · not in our ranking':''))+(v.em?'':' · <a href="'+esc(v.u)+'" target="_blank" rel="noopener nofollow">watch on the studio’s site ↗</a>')+'</div>'+
      '<div class="vi-note">The price is what the studio says this video or package cost. A similar video can cost more or less depending on shoot days, locations, travel, crew, talent, usage rights and deadlines.</div>'+
      (live?'<form class="vi-brief briefform" data-uid="prices-video" data-theme="light" data-context="'+esc('Re: video “'+t+'” ('+price(v)+') by '+S.n+' — seen on the prices page')+'" novalidate>'+
        '<div class="bf-row"><label>Your name<input name="name" autocomplete="name" required maxlength="80"></label><label>Company<input name="company" autocomplete="organization" required maxlength="120"></label></div>'+
        '<label>Work email<input name="email" type="email" autocomplete="email" required maxlength="160"></label>'+
        '<label>Message<textarea name="details" maxlength="1500" placeholder="What do you need, by when, and roughly what budget?">I’d like a video similar to “'+esc(t)+'”. </textarea></label>'+
        '<div class="vi-to"><h4>Send to</h4>'+rows+'</div>'+
        '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="cf-turnstile-slot"></div>'+
        '<div class="bf-foot"><button type="submit" class="btn btn-dark">Send brief <span class="bf-count"></span></button><span class="bf-status" role="status" aria-live="polite"></span></div>'+
        '<p class="bf-legal">You will get an email to confirm before anything is sent. Your brief goes only to the studios you tick; a copy goes to the publisher of this ranking, Lava Media.</p></form>':'');
    var ob=el.querySelector('.vi-open');if(ob)ob.addEventListener('click',function(){el.classList.add('brief-open');ob.remove();var f=el.querySelector('form');if(f&&!f._init){f._init=1;window.tcvpBriefInit&&window.tcvpBriefInit(f);}setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'nearest'});var i=el.querySelector('input[name=name]');if(i)i.focus();},50);track('price_brief_open',{studio:S.n});});
    window.tcvpModal.open(v.em||'',t,el);track('price_video_open',{studio:S.n,has_video:!!v.em});
  }
  $('pc-videos').addEventListener('click',function(e){var a=e.target.closest('.pc-thumb');if(!a||!window.tcvpModal)return;var i=+a.getAttribute('data-i');var v=CUR_VIDEOS[i];if(!v)return;e.preventDefault();e.stopPropagation();popup(v);});
  var CUR_VIDEOS=[];

  function render(){renderSummary();renderVideos();renderStudios();renderTable();}

  /* ---------- state & events ---------- */
  function fromUrl(){var q=new URLSearchParams(location.search);['type','ind','budget'].forEach(function(k){var v=q.get(k),el=form.elements[k];if(v&&el&&el.querySelector('option[value="'+v.replace(/"/g,'')+'"]'))el.value=v;});}
  function toUrl(){var s=st(),q=new URLSearchParams();Object.keys(s).forEach(function(k){var el=form.elements[k];if(s[k]&&!(el&&el.closest('[hidden]')))q.set(k,s[k]);});history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);}
  form.addEventListener('change',function(){lim={v:PAGE,s:12,t:20};toUrl();render();var s=st();track('price_filter',{video_type:s.type||'any',industry:s.ind||'any',budget:s.budget||'any'});});
  $('pc-reset').addEventListener('click',function(){form.reset();lim={v:PAGE,s:12,t:20};toUrl();render();});
  $('pc-videos-more').addEventListener('click',function(){lim.v+=PAGE;renderVideos();});
  $('pc-studios-more').addEventListener('click',function(){lim.s=999;renderStudios();});
  $('pc-table-more').addEventListener('click',function(){lim.t+=40;renderTable();});
  fromUrl();
  fetch(window.PC_DATA_URL).then(function(r){return r.json();}).then(function(j){D=j;render();}).catch(function(){$('pc-videos').innerHTML='<div class="pc-empty-box">Could not load the price data. Please reload the page.</div>';});
})();
