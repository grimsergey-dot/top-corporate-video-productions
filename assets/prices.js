/* Corporate Video Prices calculator */
(function(){
  'use strict';
  var BUDGETS={lt10:[0,9999],'10-25':[10000,25000],'25-50':[25000,50000],'50-100':[50000,100000],'100-200':[100000,200000],'200p':[200000,Infinity]};
  var BANDS=[[0,9999,'Under $10k'],[10000,49999,'$10k–$50k'],[50000,199999,'$50k–$200k'],[200000,Infinity,'$200k+']];
  var PER_PROJECT={'per video':1,'starting at':1,'per campaign':1};
  var BASIS={clutch_budget:'Clutch-reported budget',case_study_price:'Price stated in case study',published_tier_example:'Package example',studio_published_price_for_type:'Studio’s published price for this type'};
  var D=null,form=document.getElementById('pc-form');if(!form)return;
  var $=function(id){return document.getElementById(id);};
  var lim={v:12,s:12,t:20},tab='pub';
  function track(n,p){try{if(window.gtag)gtag('event',n,p||{});}catch(e){}}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(n){if(n==null||!isFinite(n))return '';if(n>=1e6)return '$'+(n/1e6).toFixed(n%1e6?1:0)+'M';if(n>=1000){var k=n/1000;return '$'+(k>=100||k%1===0?Math.round(k):k.toFixed(1))+'k';}return '$'+n;}
  function range(lo,hi,un){if(hi&&hi!==lo&&isFinite(hi))return money(lo)+'–'+money(hi);return (un==='starting at'||hi===Infinity?'from ':'')+money(lo);}
  function st(){var f=new FormData(form);return{type:f.get('type')||'',ind:f.get('ind')||'',budget:f.get('budget')||''};}
  function band(){var s=st();return s.budget?BUDGETS[s.budget]:null;}
  function hiOf(lo,hi,open){return hi!=null?hi:(open?Infinity:lo);}
  function fits(lo,hi,b){return !b||(lo<=b[1]&&hi>=b[0]);}
  function studio(d){return D.studios[d]||{n:d,r:999,u:'#',i:[]};}
  function inInd(d,ind){return studio(d).i.indexOf(ind)>=0;}
  function cap(list,n,key){var c={},o=[];list.forEach(function(x){var k=x[key||'d'];c[k]=(c[k]||0)+1;if(c[k]<=n)o.push(x);});return o;}
  function median(a){if(!a.length)return null;a=a.slice().sort(function(x,y){return x-y;});var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function typeLabel(t){for(var i=0;i<D.types.length;i++)if(D.types[i][0]===t)return D.types[i][1];return 'Video';}
  function indLabel(k){for(var i=0;i<D.inds.length;i++)if(D.inds[i][0]===k)return D.inds[i][1];return '';}

  /* ---------- filtering ---------- */
  function pubRows(){var s=st(),b=band();return D.prices.filter(function(p){
    if(s.type&&p.t!==s.type)return false;
    if(s.ind&&!(p.ind===s.ind||(p.ind==null&&inInd(p.d,s.ind))))return false;
    if(b){if(!PER_PROJECT[p.un])return false;if(!fits(p.lo,hiOf(p.lo,p.hi,p.un==='starting at'),b))return false;}
    return true;});}
  function projRows(ignoreBudget){var s=st(),b=ignoreBudget?null:band();return D.projects.filter(function(p){
    if(s.type&&p.t!==s.type)return false;if(s.ind&&p.ind!==s.ind)return false;
    return fits(p.lo,hiOf(p.lo,p.hi,true),b);});}
  function vidFit(v,b){return fits(v.lo,hiOf(v.lo,v.hi,v.pb==='studio_published_price_for_type'||/^from/i.test(v.pl||'')),b);}
  function videos(){
    var s=st(),b=band(),out=[],seen={};
    function add(list,tag){list.forEach(function(v){var k=v.d+'|'+v.u;if(seen[k])return;seen[k]=1;out.push({v:v,tag:tag});});}
    var all=D.videos;
    var exact=all.filter(function(v){return(!s.type||v.t===s.type)&&(!s.ind||v.ind===s.ind)&&vidFit(v,b);});
    add(cap(exact,2),'');
    if(out.length<10&&s.ind)add(cap(all.filter(function(v){return(!s.type||v.t===s.type)&&vidFit(v,b)&&v.ind!==s.ind;}),2),'Same type, other industry');
    if(out.length<10&&s.type)add(cap(all.filter(function(v){return(!s.ind||v.ind===s.ind)&&vidFit(v,b)&&v.t!==s.type;}),2),'Same industry, other type');
    if(out.length<10&&b)add(cap(all.filter(function(v){return(!s.type||v.t===s.type)&&!vidFit(v,b);}),2),'Same type, different budget');
    if(out.length<10)add(cap(all.filter(function(v){return !s.type||v.t===s.type;}),3),'Related');
    return out;}
  function studiosFit(){
    var s=st(),b=band(),res={};
    function rec(d){return res[d]||(res[d]={d:d,minPub:null,nProj:0,nInBand:0,ind:false});}
    D.prices.forEach(function(p){if(!PER_PROJECT[p.un])return;if(s.type&&p.t!==s.type)return;if(s.ind&&!(p.ind===s.ind||(p.ind==null&&inInd(p.d,s.ind))))return;
      var r=rec(p.d);r.minPub=r.minPub==null?p.lo:Math.min(r.minPub,p.lo);});
    D.projects.forEach(function(p){if(s.type&&p.t!==s.type)return;if(s.ind&&p.ind!==s.ind&&!inInd(p.d,s.ind))return;
      var r=rec(p.d);r.nProj++;if(s.ind&&p.ind===s.ind)r.ind=true;if(b&&fits(p.lo,hiOf(p.lo,p.hi,true),b))r.nInBand++;});
    return Object.keys(res).map(function(d){return res[d];}).filter(function(r){
      if(!b)return true;return (r.minPub!=null&&r.minPub<=b[1])||r.nInBand>0;})
      .sort(function(x,y){return studio(x.d).r-studio(y.d).r;});}

  /* ---------- rendering ---------- */
  function renderSummary(){
    var s=st(),per={};
    pubRows().forEach(function(p){if(!PER_PROJECT[p.un])return;per[p.d]=Math.min(per[p.d]==null?Infinity:per[p.d],p.lo);});
    var vals=Object.keys(per).map(function(k){return per[k];}),m=median(vals);
    $('pc-med').textContent=m?money(Math.round(m/50)*50):'—';
    $('pc-med-s').textContent=vals.length?('Median of the lowest published price at '+vals.length+' studio'+(vals.length>1?'s':'')+(st().budget?' within your budget':'')):'No published prices for this combination yet';
    var pj=projRows(true),n=pj.length,bc=[0,0,0,0],b=band();
    pj.forEach(function(p){for(var i=0;i<4;i++)if(p.lo>=BANDS[i][0]&&p.lo<=BANDS[i][1]){bc[i]++;break;}});
    $('pc-bars').innerHTML=n?BANDS.map(function(x,i){var pc=Math.round(100*bc[i]/n),hl=b&&x[0]<=b[1]&&x[1]>=b[0];
      return '<div class="pc-bar'+(hl?' hl':'')+'"><span class="l">'+x[2]+'</span><span class="t"><i style="width:'+Math.max(pc,2)+'%"></i></span><span class="n">'+pc+'%</span></div>';}).join(''):'<p class="pc-empty">No client-reported budgets for this combination yet.</p>';
    $('pc-bars-s').textContent=n?(n+' project'+(n>1?'s':'')+' reported on Clutch'+(s.type?' · '+typeLabel(s.type):'')+(s.ind?' · '+indLabel(s.ind):'')):'Try a broader filter';
    var fitN=studiosFit().length;$('pc-nst').textContent=fitN;
    $('pc-nst-s').textContent=fitN?'with matching prices or projects':'Nothing yet, try a broader filter';}
  function vlabel(v){if(v.pb==='clutch_budget'){if(!v.lo)return 'Under '+money((v.hi||9999)+1);if(v.hi==null)return money(v.lo)+'+';return money(v.lo)+'–'+money(v.hi%1000===999?v.hi+1:v.hi);}
    if(v.pl&&v.pl.length<=26&&/^(from|\$|under|less|up to)/i.test(v.pl))return v.pl;var open=v.pb==='studio_published_price_for_type';return (open&&!v.hi?'from ':'')+range(v.lo,v.hi);}
  function vtitle(v){var t=v.ti||'';if(!t||/^https?:/i.test(t)||/^untitled/i.test(t))t=(v.c?v.c+' — ':'')+(v.t?typeLabel(v.t):'Video');return t;}
  function vcard(o){var v=o.v,S=studio(v.d),lbl=vlabel(v);
    var attrs=v.em?' data-video="'+esc(v.em)+'" data-title="'+esc(vtitle(v))+'" data-price="1" data-cursor="play"':'';
    return '<article class="pc-vc">'+
      '<a class="pc-thumb" href="'+esc(v.u)+'" target="_blank" rel="noopener nofollow" data-studio="'+esc(S.n)+'"'+attrs+'>'+
      (v.th?'<img src="'+esc(v.th)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+
      '<span class="pc-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></span>'+
      (o.tag?'<span class="pc-tag">'+esc(o.tag)+'</span>':'')+'</a>'+
      '<div class="pc-vb"><div class="pc-price">'+esc(lbl)+'</div><div class="pc-basis">'+esc(BASIS[v.pb]||'')+(v.src?' · <a href="'+esc(v.src)+'" target="_blank" rel="noopener nofollow">source</a>':'')+'</div>'+
      '<h3>'+esc(v.ti||'Untitled video')+'</h3><div class="pc-meta">'+(v.c?esc(v.c)+' · ':'')+(v.t?esc(typeLabel(v.t)):'')+(v.y?' · '+v.y:'')+'</div>'+
      '<a class="pc-by" href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-video">'+esc(S.n)+(S.r<=20?' <em>#'+S.r+'</em>':'')+' ↗</a></div></article>';}
  function renderVideos(){var list=videos(),box=$('pc-videos');
    if(!list.length){box.innerHTML='<div class="pc-empty-box">The video catalogue for this combination is still being built. We add priced videos every week, so check back soon or <a href="/feedback/">suggest a studio</a>.</div>';$('pc-videos-more').hidden=true;return;}
    box.innerHTML=list.slice(0,lim.v).map(vcard).join('')+(list.length<10?'<div class="pc-empty-box pc-soon">Only '+list.length+' priced video'+(list.length>1?'s':'')+' match so far. We are expanding the catalogue with more studios.</div>':'');
    $('pc-videos-more').hidden=list.length<=lim.v;}
  function scard(r){var S=studio(r.d),b=band(),ev=[];
    if(r.minPub!=null)ev.push('<li><b>From '+money(r.minPub)+'</b> published price</li>');
    if(b&&r.nInBand)ev.push('<li><b>'+r.nInBand+'</b> client project'+(r.nInBand>1?'s':'')+' in your range</li>');
    else if(r.nProj)ev.push('<li><b>'+r.nProj+'</b> client-reported budget'+(r.nProj>1?'s':'')+'</li>');
    if(st().ind&&(r.ind||inInd(r.d,st().ind)))ev.push('<li>Works in '+esc(indLabel(st().ind))+'</li>');
    return '<div class="pc-s1"><div class="pc-rank">'+(S.r<=20?'#'+S.r:'Listed')+'</div><div class="pc-sn"><a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-studio">'+esc(S.n)+' ↗</a><ul>'+ev.join('')+'</ul></div></div>';}
  function renderStudios(){var list=studiosFit(),box=$('pc-studios');
    box.innerHTML=list.length?list.slice(0,lim.s).map(scard).join(''):'<div class="pc-empty-box">No studio in our data matches all three filters yet. Try “Any industry” or a wider budget.</div>';
    $('pc-studios-more').hidden=list.length<=lim.s;}
  function renderTable(){var box=$('pc-table'),rows,html;
    var pub=cap(pubRows().sort(function(a,b){return studio(a.d).r-studio(b.d).r||a.lo-b.lo;}),3);
    var proj=cap(projRows().sort(function(a,b){return (b.dt||'').localeCompare(a.dt||'');}),3);
    $('pc-n-pub').textContent='('+pub.length+')';$('pc-n-proj').textContent='('+proj.length+')';
    if(tab==='pub'){rows=pub;html='<table><thead><tr><th>Studio</th><th>What you get</th><th>Price</th><th>Type</th><th>Source</th></tr></thead><tbody>'+
      rows.slice(0,lim.t).map(function(p){var S=studio(p.d);return '<tr><td><a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-table">'+esc(S.n)+'</a></td><td>'+esc(p.w)+'</td><td class="num">'+esc(range(p.lo,p.hi,p.un))+(p.un&&p.un!=='per video'&&p.un!=='starting at'?' <span class="u">'+esc(p.un)+'</span>':'')+'</td><td>'+esc(p.t?typeLabel(p.t):'Other')+'</td><td>'+(p.ex?'<a href="'+esc(p.ex)+'" target="_blank" rel="noopener nofollow">example</a> · ':'')+(p.src?'<a href="'+esc(p.src)+'" target="_blank" rel="noopener nofollow">page</a>':'')+'</td></tr>';}).join('')+'</tbody></table>';}
    else{rows=proj;html='<table><thead><tr><th>Studio</th><th>Project</th><th>Client</th><th>Budget</th><th>Date</th><th>Source</th></tr></thead><tbody>'+
      rows.slice(0,lim.t).map(function(p){var S=studio(p.d);return '<tr><td><a href="'+esc(S.u)+'" target="_blank" rel="noopener" data-studio="'+esc(S.n)+'" data-place="prices-table">'+esc(S.n)+'</a></td><td>'+esc(p.ti)+'</td><td>'+esc(p.c)+'</td><td class="num">'+esc(p.br)+'</td><td>'+esc(p.dt)+'</td><td>'+(p.v?'<a href="'+esc(p.v)+'" target="_blank" rel="noopener nofollow">video</a> · ':'')+(p.url?'<a href="'+esc(p.url)+'" target="_blank" rel="noopener nofollow">'+(p.src==='site'?'case study':'review')+'</a>':'')+'</td></tr>';}).join('')+'</tbody></table>';}
    box.innerHTML=rows.length?'<div class="pc-tscroll">'+html+'</div>':'<div class="pc-empty-box">Nothing for this combination yet. Try a broader filter.</div>';
    $('pc-table-more').hidden=rows.length<=lim.t;}
  function render(){renderSummary();renderVideos();renderStudios();renderTable();}

  /* ---------- state & events ---------- */
  function fromUrl(){var q=new URLSearchParams(location.search);['type','ind','budget'].forEach(function(k){var v=q.get(k),el=form.elements[k];if(v&&el&&el.querySelector('option[value="'+v.replace(/"/g,'')+'"]'))el.value=v;});}
  function toUrl(){var s=st(),q=new URLSearchParams();Object.keys(s).forEach(function(k){if(s[k])q.set(k,s[k]);});var u=location.pathname+(q.toString()?'?'+q:'')+location.hash;history.replaceState(null,'',u);}
  form.addEventListener('change',function(){lim={v:12,s:12,t:20};toUrl();render();var s=st();track('price_filter',{video_type:s.type||'any',industry:s.ind||'any',budget:s.budget||'any'});});
  $('pc-reset').addEventListener('click',function(){form.reset();lim={v:12,s:12,t:20};toUrl();render();});
  $('pc-videos-more').addEventListener('click',function(){lim.v+=12;renderVideos();});
  $('pc-studios-more').addEventListener('click',function(){lim.s=999;renderStudios();});
  $('pc-table-more').addEventListener('click',function(){lim.t+=40;renderTable();});
  document.querySelectorAll('.pc-tab').forEach(function(b){b.addEventListener('click',function(){tab=b.getAttribute('data-tab');document.querySelectorAll('.pc-tab').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-selected',on);});lim.t=20;renderTable();});});
  fromUrl();
  fetch(window.PC_DATA_URL).then(function(r){return r.json();}).then(function(j){D=j;render();}).catch(function(){$('pc-videos').innerHTML='<div class="pc-empty-box">Could not load the price data. Please reload the page.</div>';});
})();
