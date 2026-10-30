/** Pure rules for Three Beats Later. Coordinates are {x,y}; grid[y][x]. */
const actions = ['up', 'right', 'down', 'left', 'wait'];
const vectors = {up:[0,-1],right:[1,0],down:[0,1],left:[-1,0],wait:[0,0]};
const same = (a,b) => a.x === b.x && a.y === b.y;
const at = (x,y) => ({x,y});
const make = (id,title,kicker,description,hint,grid,start,goal,echoGoal,switches=[],gates=[]) => ({id,title,kicker,description,hint,grid,start:at(...start),goal:at(...goal),echoGoal:at(...echoGoal),switches:switches.map(p=>at(...p)),gates:gates.map(p=>at(...p)),par:[4,6,6,7,9,12,18,15][id-1]});

const levels = [
 make(1,'初次回响','01 / 向过去打个招呼','先经过青色花座，再走到金色花座。回声会慢你三步。','一路向右。第 4 步时，回声会来到你第 1 步的位置。',[
  '#######','#######','#######','#.....#','#######','#######','#######'
 ],[1,3],[5,3],[2,3]),
 make(2,'等一等自己','02 / 停留也是一步','你可以停留。点击「等一拍」会让回声继续追上来。','先经过下方的青色花座，再向上走到金色花座。到了以后，等一拍。',[
  '#######','#######','####.##','####.##','#....##','#######','#######'
 ],[1,4],[4,2],[4,4]),
 make(3,'留一道门','03 / 让过去帮个忙','站在方形机关上，藤门就会打开。你和回声都能触发它。','走到门前，等回声站上机关，再穿过去。门后的花座上不必着急。',[
  '#######','#######','#######','#.....#','#######','#######','#######'
 ],[1,3],[5,3],[3,3],[[2,3]],[[4,3]]),
 make(4,'绕一点远路','04 / 先安排，再出发','机关在岔路里。给过去的自己留下一份工作。','先踏上上方的机关，再回主路。门前等一拍，回声会替你开门。',[
  '#######','#######','#..####','#.....#','#..####','#######','#######'
 ],[1,3],[5,3],[3,3],[[2,2]],[[4,3]]),
 make(5,'多留两拍','05 / 把停留交给回声','两道门，需要更长的开门时间。你停多久，回声也会停多久。','先在机关上等两次，再沿路穿过两道门。到金色花座后，再等回声。',[
  '#######','#######','####..#','###..##','#...###','#######','#######'
 ],[1,4],[5,2],[4,3],[[2,4]],[[3,3],[4,2]]),
 make(6,'接力','06 / 下一份约定','机关之间可以接力。规划好脚步，花园会替你把门留着。','第一个机关与第一道门之间隔了一格。第二个机关在转角，别错过。',[
  '#######','#####.#','####..#','###..##','#...###','#.#####','#######'
 ],[1,5],[5,1],[4,2],[[1,4],[4,3]],[[3,4],[5,2]]),
 make(7,'远路的意义','07 / 未来藏在转角','花座就在附近，但通向它的回声，需要走一条远路。','从中央小路向上，绕到右上方机关，再向下。你需要回声从门的上方追来。',[
  '#######','#.....#','#.###.#','#...#.#','###.#.#','#.....#','#######'
 ],[1,5],[5,5],[5,2],[[5,1]],[[5,3]]),
 make(8,'此刻，刚刚好','08 / 把时间种成花','最后一朵花。两次约定，两段回响，最后同时抵达。','两处机关可以接力开门。走到每道门前，让三步前的自己替你留住时间。',[
  '#######','#.....#','#.###.#','#...#.#','#.###.#','#.....#','#######'
 ],[1,5],[5,5],[5,2],[[1,3],[5,1]],[[2,1],[5,3]])
];

function initialState(level) {
 const p = {...level.start};
 return {p,e:{...p},queue:[{...p},{...p},{...p}],moves:0};
}
function isGateOpen(level,state) {
 return level.switches.some(p=>same(p,state.p)||same(p,state.e));
}
/** A door checks pressure before the action. A replay is never blocked by doors. */
function step(level,state,action) {
 const delta = vectors[action];
 if (!delta) return state;
 const p = {x:state.p.x+delta[0],y:state.p.y+delta[1]};
 if (!level.grid[p.y] || level.grid[p.y][p.x] !== '.') return state;
 if (action!=='wait' && level.gates.some(g=>same(g,p)) && !isGateOpen(level,state)) return state;
 const queue = [...state.queue.map(p=>({...p})),p];
 const e = queue.shift();
 return {p,e,queue,moves:state.moves+1};
}
function isWon(level,state) { return same(state.p,level.goal) && same(state.e,level.echoGoal); }
const stateKey = s => [s.p,s.e,...s.queue].map(p=>p.x+','+p.y).join('|');
function solve(level,state=initialState(level)) {
 if (isWon(level,state)) return [];
 const nodes = [{state,parent:-1,action:null}];
 const seen = new Set([stateKey(state)]);
 for (let i=0;i<nodes.length;i++) {
  const current = nodes[i];
  for (const action of actions) {
   const next = step(level,current.state,action);
   if (next===current.state) continue;
   const key = stateKey(next);
   if (seen.has(key)) continue;
   seen.add(key);
   const index = nodes.push({state:next,parent:i,action})-1;
   if (isWon(level,next)) {
    const solution=[];
    for(let j=index;nodes[j].parent!==-1;j=nodes[j].parent) solution.push(nodes[j].action);
    return solution.reverse();
   }
  }
 }
 return null;
}


module.exports = { actions, levels, same, initialState, isGateOpen, step, isWon, solve };
