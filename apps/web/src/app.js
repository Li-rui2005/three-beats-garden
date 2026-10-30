import {levels, initialState, step, isWon, solve, isGateOpen} from './engine.js';

const $ = id => document.getElementById(id);
const eq = (a,b) => a.x === b.x && a.y === b.y;
const coordinate = p => `${String.fromCharCode(65+p.x)}${p.y+1}`;
const names = {up:'向上 ↑',right:'向右 →',down:'向下 ↓',left:'向左 ←',wait:'等一拍 · 空格'};
let saved = {completed:[],best:{},current:0};
try {const data=JSON.parse(localStorage.getItem('three-beats-v1')||'null'); if(data && Array.isArray(data.completed)) saved={...saved,...data,completed:data.completed.filter(x=>Number.isInteger(x)&&x>=0&&x<levels.length),best:data.best||{}};} catch {}
let index = Math.max(0,Math.min(Math.floor(Number(saved.current)||0),levels.length-1,unlocked()));
let state, history=[], soundOn=false, audio, touchStart=null;
let geometry;
function persist(){try{localStorage.setItem('three-beats-v1',JSON.stringify(saved));}catch{}}
function unlocked(){return Math.min(levels.length-1,saved.completed.length?Math.max(...saved.completed)+1:0);}
function feedback(text,important=false){$('feedback').textContent=text;$('feedback').classList.toggle('important',important);}
function note(freq=330,duration=.1,volume=.035,delay=0){if(!soundOn)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.02);}catch{}}
function flower(cx,cy,color,lit=false,scale=1){return `<g transform="translate(${cx} ${cy}) scale(${scale})" opacity="${lit?1:.6}">${Array.from({length:6},(_,i)=>`<ellipse cx="0" cy="-12" rx="5.3" ry="8.5" fill="${color}" transform="rotate(${i*60})"/>`).join('')}<circle r="6" fill="#173c32"/><circle r="2.5" fill="${color}"/></g>`;}
function shrub(cx,cy,seed){const rotate=seed%4*40;return `<g transform="translate(${cx} ${cy}) rotate(${rotate})" opacity="${.45+seed%3*.1}"><path d="M0 16V-14M0 5L-12-7M0-1L12-13" fill="none" stroke="#56785a" stroke-width="1.3"/><ellipse cx="-8" cy="0" rx="5" ry="10" fill="#41694f" transform="rotate(-42 -8 0)"/><ellipse cx="8" cy="-8" rx="5" ry="11" fill="#567a56" transform="rotate(42 8 -8)"/><ellipse cx="0" cy="-14" rx="4.5" ry="9" fill="#6e8b60"/></g>`;}
function buildBoard(){
 const l=levels[index],rows=l.grid.length,cols=l.grid[0].length,c=Math.min(57,420/Math.max(rows,cols));
 const x0=(560-cols*c)/2,y0=(470-rows*c)/2+4;geometry={c,x0,y0};const xy=p=>[x0+(p.x+.5)*c,y0+(p.y+.5)*c];
 let tiles='',labels='',decor='';
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const cx=x0+(x+.5)*c,cy=y0+(y+.5)*c;
  if(l.grid[y][x]==='#')tiles+=shrub(cx,cy,x*17+y*11);else tiles+=`<rect x="${cx-c/2+2.5}" y="${cy-c/2+2.5}" width="${c-5}" height="${c-5}" rx="8" fill="${(x+y)%2?'#244b3c':'#294e3e'}" stroke="#91b07c" stroke-opacity=".10"/><circle cx="${cx-15}" cy="${cy+15}" r="1" fill="#8da375" opacity=".3"/>`;
 }
 for(let x=0;x<cols;x++)labels+=`<text x="${x0+(x+.5)*c}" y="${y0-13}" text-anchor="middle">${String.fromCharCode(65+x)}</text>`;
 for(let y=0;y<rows;y++)labels+=`<text x="${x0-15}" y="${y0+(y+.5)*c+3}" text-anchor="middle">${y+1}</text>`;
 let targets='';for(const [p,color,type] of [[l.goal,'#f3c76e','gold'],[l.echoGoal,'#8cd4bd','mint']]){const [x,y]=xy(p);targets+=`<g id="target-${type}"><circle class="target-ring" cx="${x}" cy="${y}" r="${c*.34}" fill="${color}" fill-opacity=".055" stroke="${color}" stroke-width="1" stroke-dasharray="2 4"/>${flower(x,y,color,false,.9)}</g>`;}
 const switches=l.switches.map((p,i)=>{const[x,y]=xy(p);return `<g class="switch"><rect x="${x-16}" y="${y-16}" width="32" height="32" rx="6" fill="#bdcea2" fill-opacity=".1" stroke="#c8dd9e" stroke-opacity=".7"/><path d="M${x-7} ${y}L${x} ${y-7}L${x+7} ${y}L${x} ${y+7}Z" fill="none" stroke="#d5e6b4"/><circle cx="${x}" cy="${y}" r="2" fill="#d5e6b4"/></g>`;}).join('');
 const gates=l.gates.map(p=>{const[x,y]=xy(p);return `<g class="gate" transform="translate(${x} ${y})"><rect x="-21" y="-21" width="42" height="42" rx="6" fill="#6e8b60" fill-opacity=".35" stroke="#bdcea2" stroke-opacity=".5"/><g class="gate-bars"><path d="M-12-16V16M0-16V16M12-16V16" stroke="#c6d2a5" stroke-width="3" stroke-linecap="round"/></g><path d="M-5 0L0-5L5 0L0 5Z" fill="#dce9b9"/></g>`;}).join('');
 decor+=`<g opacity=".25" stroke="#a9bd83" fill="none"><path d="M20 37h20M30 27v20"/><circle cx="529" cy="427" r="10"/><path d="M518 418l22 18M520 436l18-18"/></g><text x="30" y="440" fill="#a7c091" opacity=".3" font-size="8" letter-spacing="2">${String(index+1).padStart(2,'0')} / 08</text>`;
 $('board').innerHTML=`<defs><filter id="orb-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter></defs>${decor}<g>${tiles}</g><g font-family="Arial,sans-serif" font-size="8" fill="#83a083" opacity=".65">${labels}</g>${targets}${switches}${gates}<path id="echo-path" class="echo-path" fill="none" stroke="#a9d7b5" stroke-width="1.5" opacity=".25"/><g id="footprints"></g><g id="echo-actor" class="actor"><circle r="23" fill="#8cd4bd" opacity=".10" filter="url(#orb-glow)"/><path d="M-15 2C-15-10-8-17 0-17S15-10 15 2V15L9 11L4 15L-2 11L-8 15L-15 11Z" fill="#8cd4bd" fill-opacity=".85" stroke="#b1e6cc" stroke-width="1.3"/><ellipse cx="-5" cy="-1" rx="1.6" ry="2.3" fill="#224a3d"/><ellipse cx="5" cy="-1" rx="1.6" ry="2.3" fill="#224a3d"/><path d="M-3 6q3 2 6 0" fill="none" stroke="#3b7b62" stroke-linecap="round"/></g><g id="player-actor" class="actor"><ellipse cy="17" rx="14" ry="4" fill="#07291b" opacity=".45"/><circle r="23" fill="#f3c76e" opacity=".22" filter="url(#orb-glow)"/><circle r="15" fill="#e0aa4d"/><circle cy="-2" r="14" fill="#f3c76e"/><ellipse cx="-4" cy="-8" rx="6" ry="3" transform="rotate(-25 -4 -8)" fill="#ffe4a8" opacity=".65"/><ellipse cx="-5" cy="0" rx="1.6" ry="2.3" fill="#674b26"/><ellipse cx="5" cy="0" rx="1.6" ry="2.3" fill="#674b26"/><path d="M-3 6q3 2 6 0" fill="none" stroke="#98713c" stroke-linecap="round"/><path d="M0-16q-1-9 8-9q0 8-8 9" fill="#c6df8e" stroke="#173c32" stroke-width="1"/></g>`;
}
function render(){
 const l=levels[index],{c,x0,y0}=geometry,xy=p=>[x0+(p.x+.5)*c,y0+(p.y+.5)*c];
 const overlap=eq(state.p,state.e);let [px,py]=xy(state.p),[ex,ey]=xy(state.e);if(overlap){px+=7;ex-=7;ey-=6;}
 $('player-actor').style.transform=`translate(${px}px,${py}px)`;$('echo-actor').style.transform=`translate(${ex}px,${ey}px)`;
 $('echo-actor').style.opacity=overlap?'.65':'1';
 $('echo-path').setAttribute('d',[state.e,...state.queue,state.p].map((p,i)=>`${i?'L':'M'}${xy(p).join(' ')}`).join(' '));
 $('footprints').innerHTML=state.queue.map((p,i)=>{const[x,y]=xy(p);return `<circle cx="${x}" cy="${y}" r="${3+i}" fill="#a4d1ac" opacity="${.12+i*.08}"/>`;}).join('');
 document.querySelectorAll('.gate-bars').forEach(g=>g.style.opacity=isGateOpen(l,state)?'.12':'1');
 document.querySelectorAll('.gate').forEach(g=>g.style.opacity=isGateOpen(l,state)?'.4':'1');
 document.querySelectorAll('.switch').forEach((g,i)=>g.style.opacity=eq(state.p,l.switches[i])||eq(state.e,l.switches[i])?'1':'.55');
 $('target-gold').style.opacity=eq(state.p,l.goal)?'1':'.7';$('target-mint').style.opacity=eq(state.e,l.echoGoal)?'1':'.7';
 $('moves').textContent=String(state.moves).padStart(2,'0');$('par').textContent=l.par;
 $('queue').innerHTML=state.queue.map((p,i)=>`<div class="queue-item"><div class="queue-box ${i===0?'first':''}" title="${i+1}步后，回声到${coordinate(p)}"><i>+${i+1}</i><b>${coordinate(p)}</b></div></div>`).join('');
 $('undo').disabled=history.length===0;
 $('board').setAttribute('aria-label',`第${index+1}关 ${l.title}。你在${coordinate(state.p)}，回声在${coordinate(state.e)}，金色花座${coordinate(l.goal)}，青色花座${coordinate(l.echoGoal)}。已走${state.moves}步。`);
 const won=isWon(l,state);$('win-panel').hidden=!won;
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=won);
 $('hint').disabled=won;
 if(won)showWin();
}
function nav(){
 $('levels').innerHTML=levels.map((l,i)=>`<button class="${i===index?'active ':''}${saved.completed.includes(i)?'completed':''}" data-level="${i}" aria-label="第${i+1}关 ${l.title}${saved.completed.includes(i)?'，已完成':''}${i>unlocked()?'，尚未解锁':''}" ${i>unlocked()?'disabled':''} ${i===index?'aria-current="step"':''}>${String(i+1).padStart(2,'0')}</button>`).join('');
 $('progress-text').textContent=`已点亮 ${saved.completed.length} / ${levels.length} 座花园`;$('progress-fill').style.width=`${saved.completed.length/levels.length*100}%`;
}
function loadLevel(i){index=i;saved.current=i;persist();state=initialState(levels[i]);history=[];$('chapter-number').textContent=String(i+1).padStart(2,'0');$('level-title').textContent=levels[i].title;$('level-description').textContent=levels[i].description;$('board-caption').textContent=levels[i].gates.length?'方形机关，可以替你开门':'同时抵达，让花盛开';buildBoard();nav();render();feedback(i===0?'先试着向右走。回声要等三拍，才会跟上你。':levels[i].hint);}
function showWin(){
 const last=index===levels.length-1;
 if(!saved.completed.includes(index)){saved.completed.push(index);persist();}
 if(!saved.best[index] || state.moves<saved.best[index]){saved.best[index]=state.moves;persist();}
 $('win-kicker').textContent=last?'ALL GARDENS AWAKENED':'GARDEN AWAKENED';$('win-title').textContent=last?'每一个你，都刚好。':'刚刚好，遇见你。';
 $('win-detail').textContent=`${state.moves} 步点亮花园${state.moves===levels[index].par?' · 恰好是最短路线 ✧':` · 最佳 ${saved.best[index]} 步`}`;
 $('next').innerHTML=last?'回到第一座花园 <span>↶</span>':'下一座花园 <span>→</span>';nav();feedback(last?'八座花园都亮了。谢谢你，等了另一个自己。':'花园醒来了。现在的你，和过去的你，刚好相遇。',true);
}
function act(action){
 if($('help-dialog').open||isWon(levels[index],state))return;
 const next=step(levels[index],state,action);
 if(next===state){$('board-wrap').classList.remove('board-shake');void $('board-wrap').offsetWidth;$('board-wrap').classList.add('board-shake');feedback('这里还过不去。撞墙不计步，可以换个方向。');note(140,.08,.02);return;}
 history.push(state);state=next;render();
 if(isWon(levels[index],state)){[392,494,587,784].forEach((f,i)=>note(f,.45,.04,i*.12));}
 else{note(action==='wait'?294:330+state.p.x*26+state.p.y*12,.12);feedback(action==='wait'?`你等了一拍。回声下一步会到 ${coordinate(state.queue[0])}。`:`回声下一步会到 ${coordinate(state.queue[0])}。${isGateOpen(levels[index],state)&&levels[index].gates.length?'机关被压住了，门已打开。':''}`);}
}
function undo(){if(!history.length)return;state=history.pop();render();feedback('退回上一拍。过去也一起回来了。');note(270,.12);}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>act(b.dataset.action)));
$('undo').addEventListener('click',undo);$('reset').addEventListener('click',()=>loadLevel(index));
$('next').addEventListener('click',()=>loadLevel((index+1)%levels.length));$('replay').addEventListener('click',()=>loadLevel(index));
$('levels').addEventListener('click',e=>{const b=e.target.closest('[data-level]');if(b&&!b.disabled)loadLevel(Number(b.dataset.level));});
$('hint').addEventListener('click',()=>{const result=solve(levels[index],state);feedback(result?.length?`下一拍可以${names[result[0]]}。${levels[index].hint}`:'这条路暂时无法相遇。试着撤销几拍，或者从头来过。',true);});
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');$('sound').querySelector('span').textContent=soundOn?'声音开':'声音关';if(soundOn)note(440,.18);});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());$('start-help').addEventListener('click',()=>$('help-dialog').close());
$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('keydown',e=>{if($('help-dialog').open||e.altKey||e.ctrlKey||e.metaKey)return;const k=e.key.toLowerCase();const action={arrowup:'up',w:'up',arrowright:'right',d:'right',arrowdown:'down',s:'down',arrowleft:'left',a:'left',' ':'wait'}[k];if(action){if(k===' '&&isWon(levels[index],state))return;e.preventDefault();if(!e.repeat)act(action);}else if(k==='z'){e.preventDefault();undo();}else if(k==='r'){e.preventDefault();loadLevel(index);}});
$('board-wrap').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;touchStart={x:e.clientX,y:e.clientY};});
$('board-wrap').addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<18)return;act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');});
$('board-wrap').addEventListener('pointercancel',()=>touchStart=null);
loadLevel(index);
