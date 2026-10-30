'use strict';
const canvas=document.getElementById('game-canvas'),events={},audioEvents={};
function on(key,callback){events[key]=callback;}
function touch(event){const rect=canvas.getBoundingClientRect();return {clientX:event.clientX-rect.left,clientY:event.clientY-rect.top};}
function toast(text){const box=document.getElementById('toast');box.textContent=text;box.style.display='block';setTimeout(()=>box.style.display='none',2600);}
window.wx={
  createCanvas:()=>canvas,
  getWindowInfo:()=>({windowWidth:canvas.clientWidth,windowHeight:canvas.clientHeight,screenHeight:canvas.clientHeight,pixelRatio:devicePixelRatio,safeArea:{top:18,bottom:canvas.clientHeight-14}}),
  getMenuButtonBoundingClientRect:()=>({left:canvas.clientWidth-18,top:18,width:0,height:30}),
  getStorageSync:key=>{const text=localStorage.getItem('preview:'+key);return text?JSON.parse(text):null;},
  setStorageSync:(key,value)=>localStorage.setItem('preview:'+key,JSON.stringify(value)),
  onTouchStart:fn=>on('start',fn),onTouchEnd:fn=>on('end',fn),onTouchCancel:fn=>on('cancel',fn),
  onWindowResize:fn=>on('resize',fn),onHide:fn=>on('hide',fn),onShow:fn=>on('show',fn),
  showShareMenu:()=>{},onShareAppMessage:fn=>on('share',fn),shareAppMessage:()=>toast('分享入口已接入。真实分享卡片需要在微信中测试。'),
  onAudioInterruptionBegin:fn=>audioEvents.begin=fn,onAudioInterruptionEnd:fn=>audioEvents.end=fn,
  createInnerAudioContext:()=>{const a=new Audio();return {set src(v){a.src='../'+v;},set volume(v){a.volume=v;},set obeyMuteSwitch(v){},onError(fn){a.addEventListener('error',fn);},stop(){a.pause();a.currentTime=0;},play(){const task=a.play();if(task&&task.catch)task.catch(()=>{});}};}
};
const boot=require('../game');
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);if(events.start)events.start({touches:[touch(e)]});});
canvas.addEventListener('pointerup',e=>{if(events.end)events.end({changedTouches:[touch(e)]});});
canvas.addEventListener('pointercancel',()=>{if(events.cancel)events.cancel({});});
window.addEventListener('resize',()=>{if(events.resize)events.resize({});});
document.addEventListener('visibilitychange',()=>{const fn=document.hidden?events.hide:events.show;if(fn)fn({});});
document.addEventListener('keydown',event=>{const action={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left',' ':'wait',z:'undo',r:'reset'}[event.key];if(action&&!boot.view.modal){event.preventDefault();if(!event.repeat)boot.dispatch(action);}});
