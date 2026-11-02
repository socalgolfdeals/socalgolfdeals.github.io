'use strict';
const $=id=>document.getElementById(id);
const t12=h=>{const[a,b]=h.split(':').map(Number);return((a+11)%12+1)+':'+String(b).padStart(2,'0')+(a<12?' AM':' PM')};
const money=p=>'$'+(p%1?p.toFixed(2):String(p));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=n=>n.replace(/\s*\(.*?\)/g,'').replace(/ Golf (Course|Club|Courses)$/,'').replace(' Country Club - ',' · ');
const dayL=d=>DL[d]||(DL[d]=new Date(d+'T12:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}));
const FEEDBACK='mailto:golfisnotgay@gmail.com?subject='+encodeURIComponent('Ticker feedback')+'&body='+encodeURIComponent('What happened or your idea:\n\nPage / course:\n\nPhone & browser:\n');
// Curated searches: config objects so V2 can expose per-user fields (budget, maxMi, tiers, days)
const SEARCHES=[
 {id:'wknd',label:'Weekend mornings',title:'Weekend mornings',f:(c,t)=>[0,6].includes(dow(t.d))&&t.h<'12:00'},
 {id:'u50',label:'Under $50',title:'Best rounds under $50',f:(c,t)=>t.p<=50},
 {id:'prem',label:'Premier on sale',title:'Premier courses on sale',f:(c,t)=>c.tier==='Premier'&&(t.p<=90||(c.own&&t.p<=.75*c.own))},
 {id:'short',label:'Short courses',title:'Short / executive courses',f:c=>c.kind==='Executive'||c.kind==='Par-3'}];
// People list (V2 meet-in-the-middle ready); V1 uses people[0]
const store={get(){try{return JSON.parse(localStorage.getItem('tt_people'))||[]}catch(e){return[]}},set(p){try{localStorage.setItem('tt_people',JSON.stringify(p))}catch(e){}}};
let D,Z,people=store.get(),cur=localStorage.getItem('tt_search')||'wknd',sort=localStorage.getItem('tt_sort')||'value',NP=+localStorage.getItem('tt_players')||2;
const me=()=>people[0];
const miles=(c)=>{const p=me();if(!p||c.lat==null)return null;const R=3958.8,r=x=>x*Math.PI/180,dLa=r(c.lat-p.lat),dLo=r(c.lon-p.lon);
 const a=Math.sin(dLa/2)**2+Math.cos(r(p.lat))*Math.cos(r(c.lat))*Math.sin(dLo/2)**2;return Math.round(2*R*Math.asin(Math.sqrt(a)))};
const TODAY=new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'}),today=()=>TODAY;const DOW={},dow=d=>DOW[d]??(DOW[d]=new Date(d+'T12:00').getDay());const DL={};
const okTime=(c,t)=>t.d>today()&&(t.h<='14:00'||c.lit)&&(t.pl||'12').includes(String(NP));
const pnote=t=>t.pc&&t.pc!==NP?`Price checked for ${t.pc} players; ${NP}-player price not confirmed`:'';
function chk(t){const[d,h]=t.chk.split(' ');return dayL(d)+(h?', '+t12(h):'')+' PT'}
function spark(tr){if(!tr)return'';const v=tr.map(x=>x[1]),mn=Math.min(...v),mx=Math.max(...v),pts=v.map((y,i)=>(i*300/(v.length-1)).toFixed(0)+','+(40-(mx>mn?(y-mn)/(mx-mn)*36:18)).toFixed(0)).join(' ');
 return`<svg class="spark" viewBox="0 0 300 44" preserveAspectRatio="none" role="img" aria-label="Lowest price on each of ${v.length} check dates"><polyline fill="none" stroke="#00C805" stroke-width="2" points="${pts}"/></svg><div class="mut">Lowest price per check date, ${esc(tr[0][0])} to ${esc(tr[tr.length-1][0])}</div>`}
function results(){const s=SEARCHES.find(x=>x.id===cur)||SEARCHES[0];
 return D.courses.map(c=>{const t=c.t.filter(x=>okTime(c,x)&&s.f(c,x));if(!t.length)return null;const lo=t.reduce((a,b)=>b.p<a.p?b:a);return{c,t,lo,mi:miles(c)}}).filter(Boolean)}
function sorted(r){const k={price:x=>x.lo.p,dist:x=>x.mi==null?1e9:x.mi,rating:x=>-(x.c.s||0),value:x=>x.c.s?x.lo.p/(x.c.s**1.5)*(1+(x.mi==null?20:x.mi)/60):1e9}[sort];return r.sort((a,b)=>k(a)-k(b))}
let LAST=[];function detail(x){const c=x.c;return`<div class="det mut">${c.notes&&/review|condition|greens/i.test(c.notes)?`<div class="note">${esc(c.notes.slice(0,160))}</div>`:''}
<div class="times">${x.t.slice(0,12).map(t=>`<a class="press ${t.hot?'hot':''}" href="${esc(t.u)}" target="_blank" rel="noopener">${dayL(t.d).split(',')[0]} ${t12(t.h)} · ${money(t.p)}<span>${t.ho===9?'9 holes · ':''}${t.walk?'walk · ':''}${t.hot?'Hot Deal · ':''}${esc(t.src)}${t.pc&&t.pc!==NP?' · 2-player price':''}</span></a>`).join('')}</div>
${spark(c.trend)}<div>${c.lit?'Lit course: evening times allowed. ':''}${pnote(x.lo)?'<div class="note">'+pnote(x.lo)+'</div>':''}Checked ${chk(x.lo)} · per person, ${NP} player${NP>1?'s':''}${x.lo.ho===9?', 9 holes':''}${x.lo.walk?', walking':', cart incl.'}.${c.gp?` <a class="lk" href="${esc(c.gp)}" target="_blank" rel="noopener">GolfPass reviews</a>`:''}</div>
<a class="btn press" style="margin-top:12px" href="${esc(x.lo.u)}" target="_blank" rel="noopener">Book ${esc(clean(c.n))} · ${money(x.lo.p)}</a>`}
function pct(c,p){return c.own&&p<c.own?Math.round((1-p/c.own)*100):0}
function render(){
 $('chips').innerHTML=SEARCHES.map(s=>`<button type="button" class="chip press" data-s="${s.id}" aria-pressed="${s.id===cur}">${s.label}</button>`).join('');
 $('seg').innerHTML='<span class="lb">Players</span>'+[1,2,3,4].map(n=>`<button type="button" role="radio" aria-checked="${n===NP}" data-np="${n}" class="press">${n}</button>`).join('');
 $('sort').value=sort;$('locLbl').textContent=me()?me().label:'Set location';
 const s=SEARCHES.find(x=>x.id===cur);$('listT').textContent=s.title;
 const r=sorted(results());LAST=r;
 // hero: cheapest weekend morning overall
 const w=D.courses.flatMap(c=>c.t.filter(t=>okTime(c,t)&&SEARCHES[0].f(c,t)).map(t=>({c,t}))).sort((a,b)=>a.t.p-b.t.p)[0];
 if(w){$('heroP').textContent=money(w.t.p);$('heroP').classList.remove('sk');const p=pct(w.c,w.t.p);
  $('heroSub').innerHTML=`${p>=5?'▼ '+p+'% below course rate · ':''}${esc(clean(w.c.n))} · ${dayL(w.t.d).split(',')[0]} ${t12(w.t.h)}${w.t.ho===9?' · 9 holes':''}${miles(w.c)!=null?' · '+miles(w.c)+' mi away':''}`}
 $('list').innerHTML=r.length?r.map((x,i)=>{const c=x.c,p=pct(c,x.lo.p),id='c'+i;return`<article class="card rise" style="animation-delay:${Math.min(i,10)*40}ms">
<button type="button" class="row" aria-expanded="false" aria-controls="${id}"><div class="n"><b>${esc(clean(c.n))}</b><div class="mut">${c.tier} · ${c.s?'★ '+c.s+' ('+c.r.toLocaleString()+')':'Not rated yet'} · ${c.kind}${c.par?', par '+c.par:''}${x.mi!=null?' · '+x.mi+' mi away':''}</div>${p>=5?`<span class="badge">▼ ${p}% below course rate</span>`:''}</div>
<div><div class="pill ${p>=5?'dn':''}">${money(x.lo.p)}</div><div class="when mut">${dayL(x.lo.d).split(',')[0]} ${t12(x.lo.h)}${x.lo.ho===9?' · 9 holes':''}</div>${pnote(x.lo)?'<div class="pn when">2-player price</div>':''}</div></button>
<div class="more" id="${id}"><div></div></div></article>`}).join('')
 :`<div class="empty"><b>No rounds match right now</b><span class="mut">Prices refresh every Monday and Thursday.</span><button type="button" class="btn press" data-s="u50">See rounds under $50</button></div>`;
 const dd=[];for(const c of D.courses){const ds=c.t.filter(t=>t.deal&&okTime(c,t));if(ds.length){const b=ds.reduce((a,b)=>b.p<a.p?b:a);dd.push({kind:'tee',n:c.n,...b})}}
 dd.sort((a,b)=>a.p-b.p);if(NP%2===0)dd.push(...D.deals.filter(x=>x.kind==='offer'));
 $('deals').innerHTML=dd.length?dd.map(x=>{const c=D.courses.find(k=>k.n===x.n),m=c?miles(c):null;return`<a class="dcard press ${x.kind}" href="${esc(x.u)}" target="_blank" rel="noopener"><b class="g">${money(x.p)}</b><div class="n">${esc(clean(x.n))}</div><div class="mut">${x.kind==='offer'?esc(x.label)+' · '+esc(x.when):(x.hot?'Hot Deal · ':'')+dayL(x.d).split(',')[0]+' '+t12(x.h)+(x.ho===9?' · 9 holes':'')}${m!=null?' · '+m+' mi':''}</div></a>`}).join(''):'<div class="mut">No standout deals this week. Check back Thursday.</div>';
 $('foot').innerHTML=`Prices checked ${chk({chk:D.checked})} · per person for your group of ${NP}, cart included unless noted. Only times with ${NP} open spot${NP>1?'s':''} are shown. GolfNow prices are per person for any group size · Book on the course or GolfNow site. No times after 2 PM unless the course is lit. "Below course rate" compares with the course's own regular rate in the same check.<br><a href="${FEEDBACK}">Report a bug or send feedback</a>`;
}
document.addEventListener('click',e=>{const np=e.target.closest('[data-np]');if(np){NP=+np.dataset.np;localStorage.setItem('tt_players',NP);render();return}const s=e.target.closest('[data-s]');if(s){cur=s.dataset.s;localStorage.setItem('tt_search',cur);render();return}
 const r=e.target.closest('.row');if(r){const c=r.parentNode,o=!c.classList.contains('open');c.classList.toggle('open',o);r.setAttribute('aria-expanded',o)}});
$('sort').onchange=e=>{sort=e.target.value;localStorage.setItem('tt_sort',sort);render()};
const sheet=(o)=>{$('locSheet').hidden=!o;if(o){loadZ().catch(()=>{});$('zipErr').textContent='';$('zip').focus()}};
$('locBtn').onclick=()=>sheet(true);$('lsClose').onclick=()=>{sessionStorage.setItem('tt_skip','1');sheet(false)};
const setMe=p=>{people[0]=p;store.set(people);sheet(false);render()};
$('geoBtn').onclick=()=>{if(!navigator.geolocation){$('zipErr').textContent='Location isn’t available here. Enter a ZIP instead.';return}
 $('geoBtn').textContent='Finding you…';navigator.geolocation.getCurrentPosition(p=>{$('geoBtn').textContent='Use my location';setMe({lat:p.coords.latitude,lon:p.coords.longitude,label:'Near you'})},
 ()=>{$('geoBtn').textContent='Use my location';$('zipErr').textContent='No problem. Type your ZIP instead.';$('zip').focus()},{timeout:8000,maximumAge:6e5})};
$('zipF').onsubmit=e=>{e.preventDefault();const z=$('zip').value.trim();loadZ().then(Z=>{const c=Z[z];if(!/^\d{5}$/.test(z)||!c){$('zipErr').textContent='We couldn’t find that California ZIP. Try another.';return}setMe({lat:c[0],lon:c[1],label:z})}).catch(()=>{$('zipErr').textContent='Couldn’t load ZIP list. Try again.'})};
const loadZ=()=>Z?Promise.resolve(Z):fetch('zips.json').then(r=>r.json()).then(z=>Z=z);
fetch('data.json').then(r=>r.json()).then(d=>{D=d;if(!SEARCHES.some(s=>s.id===cur))cur='wknd';render();
 if(!me()&&!sessionStorage.getItem('tt_skip'))setTimeout(()=>sheet(true),900)}).catch(()=>{$('list').innerHTML='<div class="empty"><b>Couldn’t load tee times</b><span class="mut">Check your connection and refresh.</span></div>'});
