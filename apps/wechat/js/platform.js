'use strict';

const STORAGE_KEY='three-beats-wechat-v1';
function createPlatform(api){
  const audio={};let suspended=false;
  function windowInfo(){
    const info=typeof api.getWindowInfo==='function'?api.getWindowInfo():api.getSystemInfoSync();
    let menu=null;try{if(typeof api.getMenuButtonBoundingClientRect==='function')menu=api.getMenuButtonBoundingClientRect();}catch(_){}
    const safe=info.safeArea||{};
    return {width:info.windowWidth,height:info.windowHeight,dpr:Math.min(info.pixelRatio||1,3),
      top:Math.max(14,safe.top||info.statusBarHeight||20),bottom:Math.min(34,Math.max(10,(info.screenHeight||info.windowHeight)-(safe.bottom||info.screenHeight||info.windowHeight))),
      menuLeft:menu&&menu.width>0?menu.left:null};
  }
  function play(kind,enabled){
    if(!enabled||suspended||typeof api.createInnerAudioContext!=='function')return;
    const name=kind==='win'?'win':kind==='blocked'?'blocked':kind==='wait'?'wait':'move';
    try{if(!audio[name]){const a=api.createInnerAudioContext();a.src='assets/audio/'+name+'.wav';a.volume=name==='win'?.45:.3;a.obeyMuteSwitch=true;a.onError(()=>{});audio[name]=a;}const a=audio[name];a.stop();a.play();}catch(_){}
  }
  function stopAll(){Object.keys(audio).forEach(k=>{try{audio[k].stop();}catch(_){}});}
  function share(){try{if(typeof api.shareAppMessage==='function')api.shareAppMessage({title:'慢三拍｜和三步前的自己一起点亮花园',imageUrl:'assets/share.png',query:''});}catch(_){}}
  function initShare(){try{if(typeof api.showShareMenu==='function')api.showShareMenu({withShareTicket:false});if(typeof api.onShareAppMessage==='function')api.onShareAppMessage(()=>({title:'慢三拍｜和三步前的自己一起点亮花园',imageUrl:'assets/share.png'}));}catch(_){} }
  if(typeof api.onAudioInterruptionBegin==='function')api.onAudioInterruptionBegin(()=>{suspended=true;stopAll();});
  if(typeof api.onAudioInterruptionEnd==='function')api.onAudioInterruptionEnd(()=>{suspended=false;});
  return {storage:{get(){return api.getStorageSync(STORAGE_KEY)||null;},set(value){api.setStorageSync(STORAGE_KEY,value);}},windowInfo,play,share,initShare,
    hide(){suspended=true;stopAll();},show(){suspended=false;},stopAll};
}
module.exports={createPlatform,STORAGE_KEY};
