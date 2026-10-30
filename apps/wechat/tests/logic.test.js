'use strict';

const assert = require('node:assert/strict');
const rules = require('../js/engine');
const { GameController, cleanSaved } = require('../js/controller');
const { levels, actions, initialState, step, isWon, isGateOpen, same, solve } = rules;

let count = 0;
function test(name, run) { run(); count++; console.log('PASS ' + name); }
function replay(level, route, start) {
  return route.reduce((state, action) => {
    const next = step(level, state, action);
    assert.notEqual(next, state, 'Unexpected blocked action: ' + action);
    return next;
  }, start || initialState(level));
}
function memoryStorage(initial) {
  let data = initial == null ? null : JSON.parse(JSON.stringify(initial));
  const writes = [];
  return {
    get: () => data,
    set: value => { data = JSON.parse(JSON.stringify(value)); writes.push(data); },
    writes,
    read: () => data
  };
}
function win(controller) {
  const route = solve(controller.level, controller.state);
  assert.ok(route && route.length, 'Expected a non-empty solution');
  let event;
  route.forEach(action => { event = controller.act(action); });
  assert.ok(controller.isWon);
  assert.equal(event.kind, 'win');
  return route;
}

test('all eight gardens have valid cells, metadata, and verified shortest solutions', () => {
  assert.equal(levels.length, 8);
  assert.deepEqual(actions, ['up', 'right', 'down', 'left', 'wait']);
  levels.forEach((level, index) => {
    assert.equal(level.id, index + 1);
    assert.ok(level.title && level.description && level.hint);
    assert.ok(level.grid.every(row => row.length === level.grid[0].length));
    [level.start, level.goal, level.echoGoal].concat(level.switches, level.gates).forEach(point => {
      assert.equal(level.grid[point.y][point.x], '.');
    });
    const route = solve(level);
    assert.ok(route, 'Unsolvable garden: ' + level.id);
    assert.equal(route.length, level.par);
    assert.ok(isWon(level, replay(level, route)));
  });
  assert.deepEqual(levels.map(level => level.par), [4, 6, 6, 7, 9, 12, 18, 15]);
});

test('echo trails the player by exactly three effective actions', () => {
  const level = levels[0];
  let state = initialState(level);
  const positions = [state.p];
  for (let i = 1; i <= 4; i++) {
    state = step(level, state, 'right');
    positions.push(state.p);
    assert.deepEqual(state.e, positions[Math.max(0, i - 3)]);
    assert.equal(state.queue.length, 3);
  }
  assert.deepEqual(state.e, { x: 2, y: 3 });
});

test('waiting advances time without changing player position and solves the close pair', () => {
  const level = levels[1];
  const state = replay(level, ['right', 'right', 'right', 'up', 'up']);
  assert.ok(same(state.p, level.goal));
  assert.ok(!isWon(level, state));
  const next = step(level, state, 'wait');
  assert.deepEqual(next.p, state.p);
  assert.equal(next.moves, state.moves + 1);
  assert.ok(isWon(level, next));
});

test('wall and invalid actions consume no time and leave old snapshots untouched', () => {
  const level = levels[0], state = initialState(level);
  const before = JSON.stringify(state);
  assert.equal(step(level, state, 'up'), state);
  assert.equal(step(level, state, 'left'), state);
  assert.equal(step(level, state, 'unknown'), state);
  assert.equal(JSON.stringify(state), before);
  const next = step(level, state, 'right');
  assert.notEqual(next, state);
  assert.notEqual(next.queue, state.queue);
  assert.notEqual(next.queue[0], state.queue[1]);
  assert.equal(JSON.stringify(state), before);
});

test('gate pressure is checked before movement; either actor can hold a switch', () => {
  const level = levels[2];
  let state = initialState(level);
  assert.ok(!isGateOpen(level, state));
  state = step(level, state, 'right');
  assert.ok(isGateOpen(level, state));
  state = step(level, state, 'right');
  assert.ok(!isGateOpen(level, state));
  assert.equal(step(level, state, 'right'), state);
  state = step(level, step(level, state, 'wait'), 'wait');
  assert.ok(isGateOpen(level, state));
  state = step(level, state, 'right');
  assert.ok(same(state.p, level.gates[0]));
  assert.ok(!isGateOpen(level, state));
  state = step(level, state, 'right');
  assert.ok(isWon(level, state));
});

test('echo can replay through a closed gate and a gate occupant can leave', () => {
  const level = levels[2];
  let state = replay(level, solve(level));
  assert.ok(!isGateOpen(level, state));
  state = step(level, step(level, state, 'wait'), 'wait');
  assert.ok(same(state.e, level.gates[0]));
  const occupant = replay(level, solve(level).slice(0, -1));
  assert.ok(!isGateOpen(level, occupant));
  assert.ok(same(occupant.p, level.gates[0]));
  assert.notEqual(step(level, occupant, 'right'), occupant);
});

test('garden five written wait strategy is valid', () => {
  assert.ok(isWon(levels[4], replay(levels[4], ['right', 'wait', 'wait', 'right', 'up', 'right', 'up', 'right', 'wait'])));
});

test('solver resumes from an intermediate state, recognizes wins, and reports unreachable goals', () => {
  const level = levels[5], route = solve(level);
  const halfway = replay(level, route.slice(0, 5));
  const remaining = solve(level, halfway);
  assert.ok(remaining && remaining.length);
  assert.ok(isWon(level, replay(level, remaining, halfway)));
  assert.deepEqual(solve(level, replay(level, route)), []);
  const impossible = { grid: ['#####', '#.#.#', '#####'], start: { x: 1, y: 1 }, goal: { x: 3, y: 1 },
    echoGoal: { x: 1, y: 1 }, switches: [], gates: [] };
  assert.equal(solve(impossible), null);
});

test('new controller begins in the first garden and rejects locked or malformed level requests', () => {
  const storage = memoryStorage();
  const controller = new GameController(storage);
  assert.equal(controller.index, 0);
  assert.equal(controller.unlockedIndex, 0);
  assert.equal(controller.isWon, false);
  assert.deepEqual(controller.saved, { completed: [], best: {}, current: 0, sound: false });
  const state = controller.state;
  [1, 7, -1, 0.5, NaN, '0'].forEach(index => assert.equal(controller.loadLevel(index), null));
  assert.equal(controller.state, state);
  assert.equal(controller.next(), null);
  assert.equal(controller.act('unknown'), null);
  assert.equal(storage.writes.length, 0);
});

test('controller undo restores player, echo, queue and move count together', () => {
  const controller = new GameController();
  const original = controller.state;
  const blocked = controller.act('up');
  assert.equal(blocked.kind, 'blocked');
  assert.equal(controller.history.length, 0);
  assert.equal(controller.act('right').kind, 'move');
  const moved = controller.state;
  assert.equal(controller.act('wait').kind, 'wait');
  assert.equal(controller.undo().kind, 'undo');
  assert.equal(controller.state, moved);
  assert.equal(controller.undo().kind, 'undo');
  assert.equal(controller.state, original);
  assert.equal(controller.undo(), null);
});

test('winning records best score, unlocks the next garden, and stops further moves', () => {
  const storage = memoryStorage(), controller = new GameController(storage);
  win(controller);
  assert.equal(controller.state.moves, 4);
  assert.deepEqual(controller.saved.completed, [0]);
  assert.equal(controller.saved.best[0], 4);
  assert.equal(controller.unlockedIndex, 1);
  assert.deepEqual(storage.read(), { completed: [0], best: { 0: 4 }, current: 0, sound: false });
  const winner = controller.state;
  assert.equal(controller.act('wait'), null);
  assert.equal(controller.state, winner);
  assert.equal(controller.hint(), null);
});

test('undoing a win keeps earned completion, while allowing a replay of the final step', () => {
  const controller = new GameController();
  win(controller);
  controller.undo();
  assert.ok(!controller.isWon);
  assert.equal(controller.state.moves, 3);
  assert.deepEqual(controller.saved.completed, [0]);
  assert.equal(controller.saved.best[0], 4);
  assert.equal(controller.act('right').kind, 'win');
  assert.deepEqual(controller.saved.completed, [0]);
});

test('best score improves after a shorter replay and never worsens', () => {
  const controller = new GameController();
  controller.act('wait');
  win(controller);
  assert.equal(controller.saved.best[0], 5);
  controller.reset();
  win(controller);
  assert.equal(controller.saved.best[0], 4);
  controller.reset();
  controller.act('wait');
  win(controller);
  assert.equal(controller.saved.best[0], 4);
});

test('all eight gardens can be completed through the public controller API', () => {
  const storage = memoryStorage(), controller = new GameController(storage);
  levels.forEach((level, index) => {
    assert.equal(controller.index, index);
    assert.equal(controller.level, level);
    assert.equal(controller.state.moves, 0);
    assert.deepEqual(controller.history, []);
    win(controller);
    assert.equal(controller.saved.best[index], level.par);
    assert.equal(controller.next().kind, 'load');
  });
  assert.equal(controller.index, 0);
  assert.equal(controller.unlockedIndex, levels.length - 1);
  assert.equal(controller.isWon, false);
  assert.deepEqual(controller.saved.completed, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(storage.read().current, 0);
});

test('hint explains a solvable next action without changing gameplay state', () => {
  const controller = new GameController();
  controller.act('right');
  const before = JSON.stringify(controller.state), historyLength = controller.history.length;
  const hint = controller.hint();
  assert.equal(hint.kind, 'hint');
  assert.match(hint.message, /向右/);
  assert.equal(JSON.stringify(controller.state), before);
  assert.equal(controller.history.length, historyLength);
});

test('cold start restores completed levels, current garden, best scores and sound but not moves', () => {
  const storage = memoryStorage({ completed: [0, 1, 2], best: { 0: 4, 1: 7, 2: 6 }, current: 3, sound: true });
  const controller = new GameController(storage);
  assert.equal(controller.index, 3);
  assert.equal(controller.unlockedIndex, 3);
  assert.equal(controller.saved.sound, true);
  assert.equal(controller.saved.best[1], 7);
  assert.deepEqual(controller.state, initialState(levels[3]));
  assert.deepEqual(controller.history, []);
  controller.act('up');
  const restarted = new GameController(storage);
  assert.equal(restarted.index, 3);
  assert.equal(restarted.state.moves, 0);
});

test('reset returns the current garden to its starting state and clears undo history', () => {
  const controller = new GameController();
  controller.act('right');
  controller.act('wait');
  assert.equal(controller.reset().kind, 'load');
  assert.deepEqual(controller.state, initialState(levels[0]));
  assert.deepEqual(controller.history, []);
  assert.equal(controller.undo(), null);
});

test('corrupt storage is sanitized without mutating caller data', () => {
  const corrupt = { completed: [1, 0, 1, -1, '2', 99, null, 7], best: { 0: 1, 1: 8, 7: 15 },
    current: 999, sound: 'true', state: { moves: 999 } };
  const before = JSON.stringify(corrupt);
  assert.deepEqual(cleanSaved(corrupt), { completed: [0, 1], best: { 1: 8 }, current: 2, sound: false });
  assert.equal(JSON.stringify(corrupt), before);
  [null, [], '{broken', 42, true].forEach(input => {
    assert.deepEqual(cleanSaved(input), { completed: [], best: {}, current: 0, sound: false });
  });
  assert.equal(cleanSaved({ current: Infinity }).current, 0);
  assert.equal(cleanSaved({ current: -4 }).current, 0);
  assert.equal(cleanSaved({ completed: [7], current: 7 }).current, 0);
  assert.deepEqual(cleanSaved('{"completed":[0],"current":1,"sound":true}'),
    { completed: [0], best: {}, current: 1, sound: true });
});

test('storage read failures preserve a playable in-memory session', () => {
  const controller = new GameController({ get: () => { throw new Error('unavailable'); } });
  assert.equal(controller.index, 0);
  assert.equal(controller.storageError, true);
  assert.equal(controller.act('right').kind, 'move');
  assert.equal(controller.state.moves, 1);
});

test('storage write failures do not prevent winning, unlocking, sound toggles or level changes', () => {
  const controller = new GameController({ get: () => null, set: () => { throw new Error('quota exceeded'); } });
  win(controller);
  assert.equal(controller.storageError, true);
  assert.match(controller.feedback, /暂未保存/);
  assert.deepEqual(controller.saved.completed, [0]);
  assert.equal(controller.next().kind, 'load');
  assert.equal(controller.index, 1);
  assert.equal(controller.setSound(true).kind, 'sound');
  assert.equal(controller.saved.sound, true);
});

test('storage writes contain only saved fields and cannot mutate the controller', () => {
  let lastKeys;
  const controller = new GameController({ get: () => null, set: snapshot => {
    lastKeys = Object.keys(snapshot).sort();
    snapshot.completed.length = 0;
    snapshot.best[0] = 999;
    snapshot.current = 999;
    snapshot.sound = 'corrupted';
  } });
  win(controller);
  assert.deepEqual(lastKeys, ['best', 'completed', 'current', 'sound']);
  assert.deepEqual(controller.saved.completed, [0]);
  assert.equal(controller.saved.best[0], 4);
  assert.equal(controller.saved.current, 0);
  assert.equal(controller.saved.sound, false);
});

test('sound preference is persisted and unchanged toggles are no-ops', () => {
  const storage = memoryStorage(), controller = new GameController(storage);
  assert.equal(controller.setSound(false), null);
  assert.equal(controller.setSound(true).kind, 'sound');
  assert.equal(controller.saved.sound, true);
  assert.equal(new GameController(storage).saved.sound, true);
  assert.equal(controller.setSound(true), null);
  assert.equal(controller.setSound(false).kind, 'sound');
  assert.equal(new GameController(storage).saved.sound, false);
});

console.log('\n' + count + ' checks passed. Eight shortest routes: ' + levels.map(level => level.par).join(', ') + '.');
