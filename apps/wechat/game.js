'use strict';

const {GameController}=require('./js/controller');
const {Renderer}=require('./js/renderer');
const {createPlatform}=require('./js/platform');

const platform=createPlatform(wx);
const game=new GameController(platform.storage);
// The first wx Canvas is the visible main-screen canvas.
const canvas=wx.createCanvas();
const renderer=new Renderer(canvas);
const view={modal:null,notice:''};
let gesture=null,animation=null,framePending=false,visible=true;
const now=()=>Date.now();
const requestFrame=typeof requestAnimationFrame==='function'?requestAnimationFrame:callback=>setTimeout(()=>callback(now()),16);

function draw(){
  framePending=false;if(!visible)return;
  let progress=null;if(animation){const t=Math.min(1,(now()-animation.start)/170);progress={old:animation.old,t};if(t===1)animation=null;}
  renderer.draw(game,view,progress);
  if(animation)invalidate();
}
function invalidate(){if(!framePending&&visible){framePending=true;requestFrame(draw);}}
function resize(){renderer.resize(platform.windowInfo());animation=null;invalidate();}
function dispatch(id){
  if(!id)return;let result=null;const old=game.state;
  if(['up','right','down','left','wait'].indexOf(id)!==-1)result=game.act(id);
  else if(id==='undo')result=game.undo();
  else if(id==='reset'||id==='replay'){result=game.reset();view.modal=null;}
  else if(id==='hint')result=game.hint();
  else if(id==='next'){result=game.next();view.modal=null;}
  else if(id==='sound'){result=game.setSound(!game.saved.sound);if(!game.saved.sound)platform.stopAll();}
  else if(id==='help'){view.modal='help';}
  else if(id==='closeHelp'){view.modal=null;}
  else if(id==='closeNotice'){view.modal=null;}
  else if(id==='share'){platform.share();}
  else if(id.indexOf('level:')===0){result=game.loadLevel(Number(id.slice(6)));view.modal=null;}
  if(result){
    if(result.kind==='move'||result.kind==='wait'||result.kind==='win'||result.kind==='undo')animation={old,start:now()};
    if(result.kind!=='load'&&result.kind!=='hint')platform.play(result.kind,game.saved.sound);
    if(result.kind==='win')view.modal='win';
  }
  invalidate();
}
function point(event,end=false){const a=end?event.changedTouches:event.touches;const p=a&&a[0];if(!p)return null;return {x:typeof p.clientX==='number'?p.clientX:p.x,y:typeof p.clientY==='number'?p.clientY:p.y};}
wx.onTouchStart(event=>{const p=point(event);if(!p)return;const hit=renderer.hit(p.x,p.y);gesture={x:p.x,y:p.y,hit,board:!view.modal&&!game.isWon&&renderer.board&&p.x>=renderer.board.x&&p.x<=renderer.board.x+renderer.board.w&&p.y>=renderer.board.y&&p.y<=renderer.board.y+renderer.board.h};});
wx.onTouchEnd(event=>{if(!gesture)return;const p=point(event,true),start=gesture;gesture=null;if(!p)return;const dx=p.x-start.x,dy=p.y-start.y;
  if(start.board&&Math.max(Math.abs(dx),Math.abs(dy))>=20){dispatch(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');return;}
  if(Math.max(Math.abs(dx),Math.abs(dy))>16)return;const hit=renderer.hit(p.x,p.y);if(hit&&start.hit&&hit.id===start.hit.id){if(hit.disabled){if(hit.id.indexOf('level:')===0){game.feedback='先点亮前一座花园，再来这里碰个面。';invalidate();}return;}dispatch(hit.id);}
});
if(typeof wx.onTouchCancel==='function')wx.onTouchCancel(()=>{gesture=null;});
if(typeof wx.onWindowResize==='function')wx.onWindowResize(()=>resize());
if(typeof wx.onHide==='function')wx.onHide(()=>{visible=false;gesture=null;animation=null;framePending=false;platform.hide();});
if(typeof wx.onShow==='function')wx.onShow(()=>{visible=true;platform.show();resize();});
platform.initShare();
resize();
// Also used by the bundled browser preview and runtime verification harness.
module.exports={game,renderer,view,dispatch,resize};
