(()=>{
 const section=document.querySelector('#readers'),stage=section.querySelector('.book-grid'),cards=[...stage.children];
 const desktop=matchMedia('(min-width:901px)');
 let flat=false,active=0,phase=0,motion=null,layoutMotion=null,visible=false,userPaused=false,indexHovered=false,timer=null,indexIntent=null;
 const labels=cards.map(card=>{const title=(card.dataset.indexLabel||card.querySelector('h3').innerText).replace(/\s*·\s*诗选/g,'').replace(/\s*[／/]\s*/g,'/').replace(/\s+/g,' ').trim();return title.includes('呼吸结晶')||/[／/]/.test(title)?title:title+' · 诗选'});
 const tools=document.createElement('div');tools.className='deck-tools';tools.innerHTML='<button type="button" class="deck-prev" aria-label="上一本">←</button><span class="deck-counter" aria-hidden="true"></span><button type="button" class="deck-next" aria-label="下一本">→</button><button type="button" class="deck-toggle" aria-pressed="false">暂停轮播</button><button type="button" class="deck-view" aria-pressed="false">平铺显示</button>';
 const index=document.createElement('div');index.className='deck-index';index.setAttribute('role','group');index.setAttribute('aria-label',cards.length+'册读本索引');
 const indexRows=Array.from({length:Math.ceil(cards.length/5)},(_,i)=>{const row=document.createElement('ol');row.className='deck-index-row';row.start=i*5+1;index.append(row);return row});
 const links=cards.map((card,i)=>{const li=document.createElement('li'),a=document.createElement('a');a.href=card.querySelector('.read-link').getAttribute('href');a.innerHTML='<span class="deck-no">'+String(i+1).padStart(2,'0')+'</span><span>'+labels[i]+'</span>';a.style.setProperty('--index-color',getComputedStyle(card.querySelector('.author')).color);li.append(a);indexRows[Math.floor(i/5)].append(li);return a});
 stage.after(tools,index);section.classList.add('deck-enabled');
 const viewButton=tools.querySelector('.deck-view');
 const originalMarkup=cards.flatMap(card=>[...card.querySelectorAll('.author,h3,.book-meta')].map(block=>({block,html:block.innerHTML})));
 function setMarkup(){
  originalMarkup.forEach(({block,html})=>{
   block.innerHTML=!flat&&desktop.matches?html.split(/<br\s*\/?>/i).map(line=>'<span class="deck-align-line">'+line+'</span>').join('<br class="deck-mobile-break">'):html;
  });
 }
 setMarkup();
 function measureAlignment(){
  if(desktop.matches&&!flat){
   const columnWidths=Array(5).fill(0);
   indexRows.forEach(row=>[...row.children].forEach((li,i)=>{
    const a=li.querySelector('a'),style=getComputedStyle(a);
    const natural=[...a.children].reduce((sum,span)=>sum+span.getBoundingClientRect().width,0)+parseFloat(style.columnGap)+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
    // The second row's Hofmannsthal title defines the right-hand reference edge.
    if(i<4)columnWidths[i]=Math.max(columnWidths[i],natural);
    else if(row===indexRows[1])columnWidths[i]=natural;
   }));
   index.style.gridTemplateColumns=columnWidths.map(width=>width+'px').join(' ');
   const minimum=columnWidths.reduce((a,b)=>a+b,0)+12*4;
   const edge=Math.min(410,Math.max(200,(stage.clientWidth-324)/2));
   const aperture=edge*2+cards[0].offsetWidth*.53;
   index.style.width=Math.min(stage.clientWidth,Math.max(aperture,minimum))+'px';
  }else {index.style.removeProperty('width');index.style.removeProperty('grid-template-columns')}

  cards.forEach(card=>{
   const details=card.querySelector('.book-details'),style=getComputedStyle(details);
   const width=details.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
   card.querySelectorAll('.deck-align-line,.read-link').forEach(el=>el.style.setProperty('--deck-travel',Math.max(0,width-el.offsetWidth)+'px'));
   const art=card.querySelector('.book-art'),pencil=card.querySelector('.art-pencil'),number=card.querySelector('.book-number');
   pencil.style.setProperty('--deck-travel',Math.max(0,art.clientWidth-2*pencil.offsetLeft-pencil.offsetWidth)+'px');
   number.style.setProperty('--deck-travel',-(2*number.offsetLeft+number.offsetWidth-art.clientWidth)+'px');
  });
 }
 measureAlignment();document.fonts.ready.then(measureAlignment);

 function render(){
  const edge=Math.min(410,Math.max(200,(stage.clientWidth-324)/2)),radius=edge/Math.sin(.4);
  cards.forEach((card,i)=>{
   let offset=((i-phase+cards.length/2)%cards.length+cards.length)%cards.length-cards.length/2;
   const distance=Math.abs(offset),angle=offset*.1;
   // A shallow open arc; the end card fades behind the stack before wrapping.
   const opacity=Math.max(0,Math.min(1,(4.5-distance)/.35));
   card.style.setProperty('--deck-x',`${Math.sin(angle)*radius}px`);
   card.style.setProperty('--deck-y','0px');
   card.style.setProperty('--deck-content-opacity','1');
   card.style.setProperty('--deck-align',layoutMotion?layoutMotion(i,offset):Math.max(0,Math.min(1,offset)));
   card.style.setProperty('--deck-s',.73-.20*(1-Math.cos(angle))/(1-Math.cos(.4))+.17*Math.exp(-Math.pow(offset/.55,2)));
   card.style.setProperty('--deck-z',Math.round(1000-distance*100));
   card.style.setProperty('--deck-opacity',opacity);
   card.style.pointerEvents=desktop.matches&&!flat&&opacity<.01?'none':'';card.setAttribute('aria-hidden',String(desktop.matches&&!flat&&opacity<.01));
   card.classList.toggle('is-front',i===active);
   card.querySelectorAll('a').forEach(a=>a.tabIndex=desktop.matches&&!flat&&i!==active?-1:0);
   links[i].setAttribute('aria-current',String(i===active));
  });tools.querySelector('.deck-counter').textContent=String(active+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
 }
 function select(n){
  if(flat)return;
  const next=(n+cards.length)%cards.length;if(next===active){schedule();return}active=next;clearTimeout(timer);
  cancelAnimationFrame(motion);
  let delta=((next-phase)%cards.length+cards.length)%cards.length;
  if(delta>cards.length/2)delta-=cards.length;
  const from=phase,to=phase+delta;
  const initial=cards.map(card=>Number(card.style.getPropertyValue('--deck-align'))||0);
  const offsets=cards.map((_,i)=>((i-from+cards.length/2)%cards.length+cards.length)%cards.length-cards.length/2);
  let elapsed=0,pendingLayout=false;
  const layoutStarts=cards.map(()=>null);
  layoutMotion=(i,offset)=>{
   if(i===next){
    const early=Math.min(1,elapsed/(duration*.55));
    return initial[i]*(1-early)*(1-early);
   }
   if(Math.abs(offset-offsets[i])>cards.length/2)return Math.max(0,Math.min(1,offset));
   // Interrupted transitions must follow travel direction, not just current position.
   if(delta>0&&initial[i]>0&&offset<-.001){
    if(layoutStarts[i]===null)layoutStarts[i]=elapsed;
    const settled=Math.min(1,(elapsed-layoutStarts[i])/240);
    if(settled<1)pendingLayout=true;
    const half=settled<.5?1-settled*2:(settled-.5)*2;
    cards[i].style.setProperty('--deck-content-opacity',half*half*(3-2*half));
    return settled<.5?initial[i]:0;
   }
   if(delta<0&&initial[i]<1&&offset>.001){
    if(layoutStarts[i]===null)layoutStarts[i]=elapsed;
    const settled=Math.min(1,(elapsed-layoutStarts[i])/240);
    if(settled<1)pendingLayout=true;
    const half=settled<.5?1-settled*2:(settled-.5)*2;
    cards[i].style.setProperty('--deck-content-opacity',half*half*(3-2*half));
    return settled<.5?initial[i]:1;
   }
   return initial[i];
  };
  if(!desktop.matches){motion=null;layoutMotion=null;phase=to;render();return}
  const start=performance.now(),duration=1800;
  function frame(now){
   const t=Math.min(1,(now-start)/duration),ease=t*t*t*(t*(t*6-15)+10);
   elapsed=now-start;pendingLayout=false;phase=from+(to-from)*ease;render();
   if(t<1||pendingLayout)motion=requestAnimationFrame(frame);else {motion=null;layoutMotion=null;schedule();}
  }
  motion=requestAnimationFrame(frame);
 }
 function schedule(){clearTimeout(timer);if(desktop.matches&&!flat&&!userPaused&&!indexHovered&&motion===null&&visible&&!document.hidden)timer=setTimeout(()=>select(active+1),1800)}
 cards.forEach((card,i)=>{
  card.addEventListener('click',e=>{
   if(!desktop.matches||flat)return;
   if(active!==i){e.preventDefault();select(i);return}
   if(motion!==null){e.preventDefault();return}
   // Only the original cover and button links navigate on the front card.
  });
 });
 index.addEventListener('pointerenter',()=>{indexHovered=true;schedule()});
 index.addEventListener('pointerleave',()=>{indexHovered=false;schedule()});
 links.forEach((a,i)=>{
  a.addEventListener('pointerenter',()=>{
   clearTimeout(indexIntent);
   if(desktop.matches)indexIntent=setTimeout(()=>{indexIntent=null;if(a.matches(':hover'))select(i)},200);
  });
  a.addEventListener('pointerleave',()=>{clearTimeout(indexIntent);indexIntent=null});
  a.addEventListener('click',()=>{clearTimeout(indexIntent);indexIntent=null});
  a.addEventListener('focus',()=>{if(desktop.matches&&a.matches(':focus-visible'))select(i)});
 });
 viewButton.onclick=e=>{
  flat=!flat;clearTimeout(timer);clearTimeout(indexIntent);cancelAnimationFrame(motion);
  motion=null;layoutMotion=null;phase=active;indexHovered=false;
  section.classList.toggle('deck-enabled',!flat);section.classList.toggle('deck-flat',flat);
  if(flat)section.querySelector('.section-heading').insertBefore(viewButton,section.querySelector('.section-index'));else tools.append(viewButton);
  e.currentTarget.textContent=flat?'转盘显示':'平铺显示';e.currentTarget.setAttribute('aria-pressed',String(flat));
  setMarkup();measureAlignment();render();schedule();
  section.scrollIntoView({block:'start',behavior:'instant'});
 };
 tools.querySelector('.deck-prev').onclick=()=>select(active-1);tools.querySelector('.deck-next').onclick=()=>select(active+1);
 tools.querySelector('.deck-toggle').onclick=e=>{userPaused=!userPaused;e.currentTarget.setAttribute('aria-pressed',String(userPaused));e.currentTarget.textContent=userPaused?'继续轮播':'暂停轮播';schedule()};
 index.addEventListener('keydown',e=>{const i=links.indexOf(document.activeElement);if(i<0)return;let n;if(e.key==='ArrowRight')n=i+1;if(e.key==='ArrowLeft')n=i-1;if(e.key==='Home')n=0;if(e.key==='End')n=cards.length-1;if(n!==undefined){e.preventDefault();links[(n+cards.length)%cards.length].focus()}});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{threshold:.15}).observe(stage);
 document.addEventListener('visibilitychange',schedule);window.addEventListener('resize',()=>{measureAlignment();render()});desktop.addEventListener('change',()=>{setMarkup();measureAlignment();render();schedule()});render();schedule();
})();
