// Choose the two-row layout from the actual one-row content width.
// Measurements and the final state are applied in the same frame.
const readerHeader=document.querySelector('header');
const readerNav=readerHeader.querySelector('.reader-nav');
// Preserve the idle navigation position when playback moves to a second row.
const idleHintWidth=document.getElementById('status').getBoundingClientRect().width;
let headerLayoutQueued=false;
function fitReaderHeader(){
 headerLayoutQueued=false;
 readerHeader.dataset.layout='wide';
 readerHeader.dataset.hideHint='false';
 const navStyle=getComputedStyle(readerNav);
 const children=[...readerNav.children].filter(e=>getComputedStyle(e).display!=='none');
 const needed=children.reduce((sum,e)=>sum+e.getBoundingClientRect().width,0)
  +parseFloat(navStyle.columnGap)*(children.length-1)
  +parseFloat(navStyle.paddingLeft)+parseFloat(navStyle.paddingRight);
 const overflows=needed>readerNav.getBoundingClientRect().width+.5;
 const idle=document.getElementById('playback').dataset.idle==='true';
 const controls=children.filter(e=>e.id!=='playback');
 const controlsWidth=controls.reduce((sum,e)=>sum+e.getBoundingClientRect().width,0)
  +parseFloat(navStyle.columnGap)*(controls.length-1);
 const navWidth=readerNav.getBoundingClientRect().width;
 const hiddenOffset=Math.max(0,navWidth-controlsWidth)*.4;
 const idleNeeded=controlsWidth+parseFloat(navStyle.columnGap)+idleHintWidth+parseFloat(navStyle.paddingRight);
 const idleOffset=idleNeeded>navWidth+.5?hiddenOffset:
  navStyle.justifyContent==='center'?Math.max(0,(navWidth-idleNeeded)/2):0;
 readerNav.style.setProperty('--hint-hidden-offset',hiddenOffset+'px');
 readerNav.style.setProperty('--compact-leading-offset',(idleOffset+parseFloat(getComputedStyle(readerHeader).columnGap)-parseFloat(navStyle.columnGap))+'px');
 readerHeader.style.setProperty('--compact-column-gap',navStyle.columnGap);
 readerHeader.dataset.hideHint=String(overflows&&idle);
 readerHeader.dataset.layout=overflows&&!idle?'compact':'wide';
 document.documentElement.style.scrollPaddingTop=(readerHeader.getBoundingClientRect().height+8)+'px';
}
function scheduleHeaderLayout(){
 if(!headerLayoutQueued){headerLayoutQueued=true;requestAnimationFrame(fitReaderHeader)}
}
window.addEventListener('resize',scheduleHeaderLayout);
new MutationObserver(scheduleHeaderLayout).observe(document.getElementById('status'),{childList:true,subtree:true,characterData:true});
const headerPlayback=document.getElementById('playback');
new MutationObserver(scheduleHeaderLayout).observe(headerPlayback,{attributes:true,attributeFilter:['data-idle']});
const headerTimeline=document.getElementById('timeline');
let timelineHidden=headerTimeline.hidden;
new MutationObserver(()=>{
 if(timelineHidden!==headerTimeline.hidden){timelineHidden=headerTimeline.hidden;scheduleHeaderLayout()}
}).observe(headerTimeline,{attributes:true,attributeFilter:['hidden']});
document.fonts.ready.then(scheduleHeaderLayout);
fitReaderHeader();

// Only trusted, locally generated book assets are inserted into the page.
const bookAssets=JSON.parse(document.getElementById('book-assets').textContent);
async function fetchBookAsset(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
 return response.text();
}
let glyphPromise;
function loadGlyphs(){
 if(!glyphPromise)glyphPromise=fetchBookAsset(bookAssets.glyphs).then(text=>{
  document.getElementById('book-glyphs').innerHTML=text;
 }).catch(error=>{glyphPromise=null;throw error});
 return glyphPromise;
}
const pendingPages=new Map();
async function loadBookPage(section){
 // Inline sections such as listening notes are not lazy-loaded book pages.
 if(!section||!/^page-\d+$/.test(section.id)||section.dataset.loaded==='true')return;
 const number=Number(section.id.slice(5));
 if(!Number.isInteger(number)||number<1||number>bookAssets.pages.length)return;
 if(pendingPages.has(section.id))return pendingPages.get(section.id);
 const work=(async()=>{
  try{
   const needsCommon=!bookAssets.commonPages||bookAssets.commonPages[number-1];
   const [,text]=await Promise.all([needsCommon?loadGlyphs():null,fetchBookAsset(bookAssets.pages[number-1])]);
   section.innerHTML=text;section.dataset.loaded='true';section.setAttribute('aria-busy','false');
   if(typeof update==='function')update();
  }catch(error){
   section.innerHTML='<div class="page-error">书页加载失败，请检查网络。<button type="button">重试</button></div>';
   section.setAttribute('aria-busy','false');
   section.querySelector('button').onclick=()=>loadBookPage(section);
   console.error(error);
  }finally{pendingPages.delete(section.id)}
 })();
 pendingPages.set(section.id,work);return work;
}
// Keep speculative work small on phones; visible/target pages go first.
const nearbyPages=new Set();
let activePages=0;
function pumpPages(){
 const candidates=[...nearbyPages].sort((a,b)=>Math.abs(a.getBoundingClientRect().top)-Math.abs(b.getBoundingClientRect().top));
 for(const section of candidates){
  if(activePages>=2)break;
  nearbyPages.delete(section);
  if(section.dataset.loaded==='true'||pendingPages.has(section.id))continue;
  activePages++;
  loadBookPage(section).finally(()=>{activePages--;pumpPages()});
 }
}
const pageObserver=new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(entry.isIntersecting&&entry.target.dataset.loaded!=='true')nearbyPages.add(entry.target);
  else nearbyPages.delete(entry.target);
 }
 pumpPages();
},{rootMargin:matchMedia('(max-width:650px)').matches?'150px 0px':'400px 0px'});
function loadHashPage(){
 if(/^#page-\d+$/.test(location.hash)){
  const section=document.getElementById(location.hash.slice(1));
  if(section){loadBookPage(section);requestAnimationFrame(()=>section.scrollIntoView())}
 }
}
window.addEventListener('hashchange',loadHashPage);
loadHashPage();
// Let an initial page bookmark scroll before scheduling neighboring pages.
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 document.querySelectorAll('section.page[id^="page-"]:not([data-loaded="true"])').forEach(page=>pageObserver.observe(page));
}));

const media=JSON.parse(document.getElementById('recordings').textContent),audio=document.getElementById('audio'),status=document.getElementById('status'),seek=document.getElementById('seek'),clock=document.getElementById('clock'),timeline=document.getElementById('timeline');
const playToggle=document.getElementById('play-toggle');
const idlePlaybackMessage=status.textContent;
let current=null,stopped=false,dragging=false;
function updatePageButtons(){
 document.querySelectorAll('[data-action="play"]').forEach(b=>{
  const playing=b.dataset.poem===current&&!audio.paused&&!audio.ended&&!stopped;
  b.dataset.playing=String(playing);
  const label=(playing?'暂停第':'播放第')+b.dataset.poem+'首';
  b.setAttribute('aria-label',label);b.title=label;
 });
}
const time=x=>`${Math.floor(x/60)}:${String(Math.floor(x%60)).padStart(2,'0')}`;
function progress(value,duration){
 seek.style.setProperty('--progress',`${duration?100*value/duration:0}%`);
 seek.setAttribute('aria-valuetext',`${time(value)} / ${time(duration)}`);
 clock.textContent=`${time(value)} / ${time(duration)}`;
}
function update(){
 if(!current)return;
 if(stopped){
  timeline.hidden=true;
  if(document.getElementById('playback').dataset.idle!=='true')document.getElementById('playback').dataset.idle='true';
  if(status.textContent!==idlePlaybackMessage)status.textContent=idlePlaybackMessage;
  updatePageButtons();
  return;
 }
 if(document.getElementById('playback').dataset.idle==='true')document.getElementById('playback').dataset.idle='false';
 const duration=Number.isFinite(audio.duration)?audio.duration:0;
 timeline.hidden=false;seek.disabled=duration<=0;seek.max=duration;
 if(!dragging){seek.value=audio.currentTime;progress(audio.currentTime,duration)}
 const label=stopped?'已停止':audio.ended?'播放完毕':audio.paused?'已暂停':'正在播放';
 const playing=!audio.paused&&!audio.ended&&!stopped;
 playToggle.dataset.playing=String(playing);
 playToggle.setAttribute('aria-label',playing?'暂停':'播放');
 playToggle.title=playing?'暂停':'播放';
 const message=label;
 if(status.textContent!==message)status.textContent=message;
 updatePageButtons();
}
seek.addEventListener('pointerdown',()=>{dragging=true});
function finishSeek(){dragging=false;update()}
window.addEventListener('pointerup',finishSeek);
window.addEventListener('pointercancel',finishSeek);
seek.addEventListener('input',()=>{
 if(seek.disabled)return;
 stopped=false;audio.currentTime=Number(seek.value);
 progress(Number(seek.value),Number(seek.max));
});
seek.addEventListener('change',finishSeek);
async function play(n){
 stopped=false;
 if(current===n&&!audio.paused){audio.pause();return}
 if(current!==n){audio.pause();current=n;dragging=false;audio.src=media[n].src;audio.load();seek.value=0;progress(0,0);update()}
 try{await audio.play()}
 catch(e){if(current!==n||stopped)return;status.textContent='未能播放，请检查网络后重试。';console.error(e)}
}
playToggle.addEventListener('click',()=>{if(current)play(current)});
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');if(!b)return;
 if(b.dataset.action==='play')play(b.dataset.poem);
 else{stopped=true;dragging=false;audio.pause();audio.currentTime=0;update()}
});
for(const event of ['timeupdate','play','pause','loadedmetadata','durationchange','ended'])audio.addEventListener(event,update);
document.getElementById('poems').addEventListener('change',e=>{if(e.target.value)location.hash='page-'+e.target.value});
