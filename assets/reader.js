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
 if(!section||section.dataset.loaded==='true')return;
 if(pendingPages.has(section.id))return pendingPages.get(section.id);
 const work=(async()=>{
  try{
   const number=Number(section.id.slice(5));
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
 document.querySelectorAll('section.page:not([data-loaded="true"])').forEach(page=>pageObserver.observe(page));
}));

const media=JSON.parse(document.getElementById('recordings').textContent),audio=document.getElementById('audio'),status=document.getElementById('status'),seek=document.getElementById('seek'),clock=document.getElementById('clock'),timeline=document.getElementById('timeline');
let current=null,stopped=false,dragging=false;
const time=x=>`${Math.floor(x/60)}:${String(Math.floor(x%60)).padStart(2,'0')}`;
function progress(value,duration){
 seek.style.setProperty('--progress',`${duration?100*value/duration:0}%`);
 seek.setAttribute('aria-valuetext',`${time(value)} / ${time(duration)}`);
 clock.textContent=`${time(value)} / ${time(duration)}`;
}
function update(){
 if(!current)return;
 const duration=Number.isFinite(audio.duration)?audio.duration:0;
 timeline.hidden=false;seek.disabled=duration<=0;seek.max=duration;
 if(!dragging){seek.value=audio.currentTime;progress(audio.currentTime,duration)}
 const label=stopped?'已停止':audio.ended?'播放完毕':audio.paused?'已暂停':'正在播放';
 const message=`${label} · ${media[current].reader}`;
 if(status.textContent!==message)status.textContent=message;
 document.querySelectorAll('[data-action="play"]').forEach(b=>b.dataset.playing=String(b.dataset.poem===current&&!audio.paused&&!stopped));
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
 catch(e){status.textContent='未能播放，请检查网络后重试。';console.error(e)}
}
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');if(!b)return;
 if(b.dataset.action==='play')play(b.dataset.poem);
 else{stopped=true;dragging=false;audio.pause();audio.currentTime=0;update()}
});
for(const event of ['timeupdate','play','pause','loadedmetadata','durationchange','ended'])audio.addEventListener(event,update);
document.getElementById('poems').addEventListener('change',e=>{if(e.target.value)location.hash='page-'+e.target.value});
