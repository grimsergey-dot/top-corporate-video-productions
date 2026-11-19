/* "My brief": save videos from any pop-up, header counter, first-time guide. Data stays in this browser (localStorage). */
(function(){
  var KEY='tcvp_brief_v1',SEEN='tcvp_brief_guide';
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');d.items=d.items||[];d.answers=d.answers||{};d.contact=d.contact||{};return d;}catch(e){return {items:[],answers:{},contact:{}};}}
  function save(d){try{localStorage.setItem(KEY,JSON.stringify(d));}catch(e){}render();}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function track(e,p){try{window.gtag&&gtag('event',e,p||{});}catch(_){}}
  var API={
    data:load,
    has:function(k){return load().items.some(function(x){return x.k===k;});},
    count:function(){return load().items.length;},
    add:function(it){var d=load();if(d.items.some(function(x){return x.k===it.k;}))return;if(d.items.length>=12){alert('You can save up to 12 videos in one brief.');return;}d.items.push(it);save(d);track('brief_save',{studio:it.sn||''});first();bump();},
    remove:function(k){var d=load();d.items=d.items.filter(function(x){return x.k!==k;});save(d);},
    set:function(d){save(d);},
    button:function(it){ /* returns a toggle button element for a pop-up */
      var b=document.createElement('button');b.type='button';b.className='btn btn-ghost vi-save';
      function upd(){var on=API.has(it.k);b.classList.toggle('on',on);b.innerHTML=on?'<span aria-hidden="true">✓</span> Saved to my brief':'<span aria-hidden="true">♡</span> Save to my brief';b.setAttribute('aria-pressed',on);}
      b.addEventListener('click',function(){if(API.has(it.k))API.remove(it.k);else API.add(it);upd();});upd();return b;}
  };
  window.tcvpShortlist=API;
  /* header pill (desktop) + floating pill (mobile) */
  var pill,fab;
  function mk(){
    var nav=document.querySelector('.nav');
    if(nav&&!pill){pill=document.createElement('a');pill.href='/my-brief/';pill.className='sl-pill';pill.innerHTML='<span class="sl-ic" aria-hidden="true">♡</span> My brief <b>0</b>';var m=nav.querySelector('.btn');nav.insertBefore(pill,m||null);}
    if(!fab){fab=document.createElement('a');fab.href='/my-brief/';fab.className='sl-fab';fab.innerHTML='<span aria-hidden="true">♡</span> My brief <b>0</b>';document.body.appendChild(fab);}
  }
  function render(){mk();var n=load().items.length,onPage=location.pathname.indexOf('/my-brief/')===0;
    [pill,fab].forEach(function(el){if(!el)return;el.querySelector('b').textContent=n;el.hidden=!n&&!onPage;});
    if(fab)fab.classList.toggle('sl-hide',onPage);}
  function bump(){[pill,fab].forEach(function(el){if(!el)return;el.classList.remove('sl-bump');void el.offsetWidth;el.classList.add('sl-bump');});}
  function first(){
    try{if(localStorage.getItem(SEEN))return;localStorage.setItem(SEEN,'1');}catch(e){return;}
    var g=document.createElement('div');g.className='sl-guide';g.setAttribute('role','dialog');g.setAttribute('aria-label','How My brief works');
    g.innerHTML='<div class="sl-g-in"><div class="sl-g-h">Saved to your brief ♡</div><ol><li><b>Save</b> every video you like — from the rankings, best-of lists, examples and prices.</li><li>Open <b>My brief</b> and note what you like in each one.</li><li>Answer a few short questions and get a ready <b>brief page &amp; PDF</b> — or send it to top studios.</li></ol><div class="sl-g-b"><a class="btn btn-dark btn-sm" href="/my-brief/">Open My brief</a><button type="button" class="btn btn-ghost btn-sm sl-g-x">Keep browsing</button></div></div>';
    document.body.appendChild(g);
    var anchor=(pill&&pill.offsetParent)?pill:fab;
    function place(){if(anchor&&anchor.classList.contains('sl-ghost')){var r=anchor.getBoundingClientRect();g.style.top=(r.bottom+12)+'px';g.style.left=Math.max(12,Math.min(window.innerWidth-372,r.right-360))+'px';g.classList.add('sl-g-top');}else g.classList.add('sl-g-bottom');}
    var ghost=null;
    if(anchor===pill&&pill.offsetParent){var r0=pill.getBoundingClientRect(),gt=r0.top<8||r0.bottom>window.innerHeight?16:r0.top;ghost=pill.cloneNode(true);ghost.classList.add('sl-ghost');ghost.style.cssText='position:fixed;left:'+r0.left+'px;top:'+gt+'px;width:'+r0.width+'px;height:'+r0.height+'px;margin:0';document.body.appendChild(ghost);anchor=ghost;}
    else if(fab)fab.classList.add('sl-lift');
    place();requestAnimationFrame(function(){g.classList.add('show');});
    function close(){g.classList.remove('show');if(ghost)ghost.remove();if(fab)fab.classList.remove('sl-lift');setTimeout(function(){g.remove();},300);}
    g.querySelector('.sl-g-x').addEventListener('click',close);setTimeout(function(){document.addEventListener('click',function h(e){if(!g.contains(e.target)&&!e.target.closest('.vi-save')){close();document.removeEventListener('click',h);}});},50);
    track('brief_guide_shown');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  window.addEventListener('storage',function(e){if(e.key===KEY)render();});
})();
