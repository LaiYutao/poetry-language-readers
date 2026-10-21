(() => {
 const dataNode=document.getElementById('reader-audio-data'); if(!dataNode)return;
 const entries=JSON.parse(dataNode.textContent); const audio=new Audio(); audio.preload='none';
 let active=null, revision=0;
 const bars=[...document.querySelectorAll('.poem-audio')];
 const clock=t=>Number.isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
 function paint(){for(const bar of bars){const current=active&&Number(bar.dataset.poem)===active.n;const b=bar.querySelector('.audio-play'); if(b){b.textContent=current&&!audio.paused?'Ⅱ 暂停':'▶ 播放';b.setAttribute('aria-pressed',String(!!current&&!audio.paused));} const time=bar.querySelector('.audio-time');if(time)time.textContent=current?clock(audio.currentTime)+' / '+clock(audio.duration):''; const seek=bar.querySelector('.audio-seek');if(seek){seek.hidden=!current;seek.value=current&&audio.duration?String(audio.currentTime/audio.duration*1000):'0';}}}
 function status(bar,msg){bar.querySelector('.audio-state').textContent=msg;}
 for(const bar of bars){const entry=entries.find(e=>e.n===Number(bar.dataset.poem));const play=bar.querySelector('.audio-play'); if(!play)continue;
 play.addEventListener('click',async()=>{const ticket=++revision;if(active?.n===entry.n&&!audio.paused){audio.pause();return;} if(active?.n!==entry.n){audio.pause();active=entry;audio.src=entry.src;for(const other of bars)status(other,'');} status(bar,'加载中…');try{await audio.play();if(ticket===revision)status(bar,'');}catch(err){if(ticket===revision)status(bar,'暂时无法播放，请尝试来源链接。');}paint();});
 bar.querySelector('.audio-stop').addEventListener('click',()=>{if(active?.n!==entry.n)return;++revision;audio.pause();audio.currentTime=0;status(bar,'');paint();});
 bar.querySelector('.audio-seek').addEventListener('input',e=>{if(active?.n===entry.n&&Number.isFinite(audio.duration))audio.currentTime=audio.duration*Number(e.target.value)/1000;});
 }
 for(const event of ['play','pause','ended','timeupdate','loadedmetadata'])audio.addEventListener(event,paint);
 audio.addEventListener('ended',()=>{audio.currentTime=0;paint();});
 audio.addEventListener('error',()=>{const bar=bars.find(b=>Number(b.dataset.poem)===active?.n);if(bar)status(bar,'音频读取失败，可打开来源页面。');paint();});
 window.addEventListener('pagehide',()=>audio.pause());
})();
