/* Public brief page /b/?id=... — reads the brief from the Worker */
document.addEventListener('DOMContentLoaded',function(){
  var API='https://tcvp-briefs.lava-media-usa.workers.dev', q=new URLSearchParams(location.search), id=q.get('id')||'';
  var Q=[['goal','Goal',1],['audience','Audience',1],['story','Key message',1],['script','Script & voice-over',1],['length','Length'],['formats','Formats & cut-downs'],['where','Where it will be shown'],['assets','Assets we can provide',1],['budget','Budget'],['deadline','Deadline'],['musts','Must-haves & reviews',1],['scope','Scope of work',1],['tender','Tender timeline',1],['submit','Proposals must include',1],['criteria','Evaluation criteria',1],['rights','Rights & delivery',1]];
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function $(i){return document.getElementById(i);}
  if(!/^[a-z0-9]{12}$/.test(id)){$('bv-co').textContent='This brief link is not valid';return;}
  fetch(API+'/s/'+id).then(function(r){return r.json();}).then(function(j){
    if(!j.ok){$('bv-co').textContent='This brief was not found';$('bv-by').textContent='The link may be mistyped, or the brief has expired.';return;}
    var b=j.brief, dt=new Date(b.at);
    document.title='Video brief — '+b.company;
    $('bv-co').textContent=b.company;
    $('bv-by').textContent='Prepared by '+b.name+' · '+dt.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})+' · '+b.items.length+' reference video'+(b.items.length>1?'s':'');
    $('bv-pdf').href=API+'/pdf/'+id;$('bv-act').hidden=false;
    $('bv-copy').addEventListener('click',function(){var u=location.origin+'/b/?id='+id;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){$('bv-copy').textContent='Link copied ✓';}).catch(function(){prompt('Copy this link:',u);});});
    if(q.get('new')){var n=+q.get('sent')||0;$('bv-note').innerHTML='<div class="bv-note"><b>Your brief is ready.</b> '+(n?'We sent it to '+n+' studio'+(n>1?'s':'')+(b.sentTo&&b.sentTo.length?' ('+esc(b.sentTo.join(', '))+')':'')+' — they will reply to you directly. ':'')+'We also emailed you this link, the PDF and a private link to edit the brief.</div>';try{gtag('event','shortlist_confirmed',{brief_type:'full',studios:n});}catch(_){}}
    $('bv-qa').innerHTML=Q.filter(function(x){return b.answers&&b.answers[x[0]];}).map(function(x){return '<div'+(x[2]?' class="full"':'')+'><h3>'+x[1]+'</h3><p>'+esc(b.answers[x[0]])+'</p></div>';}).join('');
    $('bv-vh').hidden=false;$('bv-cta').hidden=false;
    $('bv-vids').innerHTML=b.items.map(function(x,i){return '<article class="bv-v"><a class="tp-thumb bv-play" data-cursor="play" href="'+esc(x.u||'#')+'" target="_blank" rel="noopener nofollow" data-i="'+i+'">'+(x.th?'<img src="'+esc(x.th)+'" alt="'+esc(x.t)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'<span class="tp-n disp">'+(i+1)+'</span><span class="tp-play" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg></span></a>'+
      '<div class="bv-b"><h3>'+esc(x.t)+'</h3><div class="mb-by">'+(x.sn?'by '+esc(x.sn):'')+'</div>'+(x.note?'<div class="bv-like"><b>What I like</b>'+esc(x.note)+'</div>':'')+'</div></article>';}).join('');
    $('bv-vids').addEventListener('click',function(e){var a=e.target.closest('.bv-play');if(!a||!window.tcvpModal)return;var x=b.items[+a.dataset.i];if(x&&x.em){e.preventDefault();tcvpModal.open(x.em,x.t);}});
  }).catch(function(){$('bv-co').textContent='Could not load the brief';$('bv-by').textContent='Please check your connection and reload the page.';});
});
