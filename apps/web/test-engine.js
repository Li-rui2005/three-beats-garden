import assert from 'node:assert/strict';
import { levels, initialState, step, isWon, solve, isGateOpen, same } from './src/engine.js';

let cases=0;
const check = (name, test) => {test();cases++;console.log('PASS '+name);};
const replay = (level, moves) => moves.reduce((state,move)=>{
 const next=step(level,state,move);
 assert.notEqual(next,state,`Unexpected blocked move ${move} at ${state.p.x},${state.p.y}`);
 return next;
},initialState(level));

check('all eight authored gardens are structurally valid and have verified shortest solutions',()=>{
 assert.equal(levels.length,8);
 for(const l of levels){
  assert.ok(l.grid.every(row=>row.length===l.grid[0].length));
  for(const p of [l.start,l.goal,l.echoGoal,...l.switches,...l.gates]) assert.equal(l.grid[p.y]?.[p.x],'.');
  assert.ok(l.par>0);
  const route=solve(l);
  assert.ok(route,`Garden ${l.id} is unsolvable`);
  assert.equal(route.length,l.par,`Garden ${l.id} par does not match BFS`);
  assert.ok(isWon(l,replay(l,route)),`Garden ${l.id} route does not reach both flowers`);
 }
});

check('echo reaches each player position exactly three valid actions later',()=>{
 const l=levels[0];let s=initialState(l);
 const positions=[{...s.p}];
 for(let i=0;i<4;i++){
  s=step(l,s,'right');positions.push({...s.p});
  assert.deepEqual(s.e,positions[Math.max(0,i+1-3)]);
 }
 assert.deepEqual(s.e,{x:2,y:3});
 assert.ok(isWon(l,s));
});

check('blocked moves never consume a beat or mutate snapshots',()=>{
 const l=levels[0],s=initialState(l),before=JSON.stringify(s);
 assert.equal(step(l,s,'up'),s);
 assert.equal(step(l,s,'left'),s);
 assert.equal(step(l,s,'unknown'),s);
 assert.equal(JSON.stringify(s),before);
 const n=step(l,s,'right');
 assert.notEqual(n,s);
 assert.equal(JSON.stringify(s),before);
 assert.equal(n.moves,1);
});

check('waiting advances the echo, keeps the player still, and solves a close pair of flowers',()=>{
 const l=levels[1];let s=replay(l,['right','right','right','up','up']);
 assert.ok(same(s.p,l.goal));assert.ok(!isWon(l,s));
 const n=step(l,s,'wait');
 assert.deepEqual(n.p,s.p);assert.equal(n.moves,s.moves+1);assert.ok(isWon(l,n));
});

check('both present and echo can hold a switch; a closing door lets an occupant leave',()=>{
 const l=levels[2];let s=initialState(l);
 assert.ok(!isGateOpen(l,s));
 s=step(l,s,'right');assert.ok(isGateOpen(l,s));
 s=step(l,s,'right');assert.ok(!isGateOpen(l,s));
 assert.equal(step(l,s,'right'),s,'closed gate must block player');
 s=step(l,s,'wait');s=step(l,s,'wait');
 assert.ok(isGateOpen(l,s),'echo should now hold the switch');
 s=step(l,s,'right');assert.ok(same(s.p,l.gates[0]));
 assert.ok(!isGateOpen(l,s),'pressure is checked before the action');
 s=step(l,s,'right');assert.ok(isWon(l,s));
});

check('replay passes through a closed door because it follows history',()=>{
 const l=levels[2];let s=replay(l,['right','right','wait','wait','right','right']);
 assert.ok(!isGateOpen(l,s));
 s=step(l,s,'wait');s=step(l,s,'wait');
 assert.ok(same(s.e,l.gates[0]));
});

check('garden five written wait strategy works, including the final beat',()=>{
 assert.ok(isWon(levels[4],replay(levels[4],['right','wait','wait','right','up','right','up','right','wait'])));
});

check('solver can resume from a mid-game state and handles unreachable states',()=>{
 const l=levels[5],route=solve(l),mid=replay(l,route.slice(0,5));
 const remaining=solve(l,mid);assert.ok(remaining?.length);
 assert.ok(isWon(l,remaining.reduce((s,a)=>step(l,s,a),mid)));
 assert.deepEqual(solve(l,route.reduce((s,a)=>step(l,s,a),initialState(l))),[]);
 const trapped={grid:['#####','#.#.#','#####'],start:{x:1,y:1},goal:{x:3,y:1},echoGoal:{x:1,y:1},switches:[],gates:[]};
 assert.equal(solve(trapped),null);
});

console.log(`${cases} checks passed. Shortest routes: ${levels.map(l=>l.par).join(', ')}.`);
