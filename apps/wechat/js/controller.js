'use strict';

const rules = require('./engine');
const { levels } = rules;
const actionNames = { up: '向上 ↑', right: '向右 →', down: '向下 ↓', left: '向左 ←', wait: '等一拍' };
const coordinate = point => String.fromCharCode(65 + point.x) + (point.y + 1);

function cleanSaved(input) {
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch (_) { input = null; }
  }
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const validIndex = index => Number.isInteger(index) && index >= 0 && index < levels.length;
  const candidates = new Set(Array.isArray(data.completed) ? data.completed.filter(validIndex) : []);
  const completed = [];
  // Legitimate play unlocks gardens in order; do not trust isolated later indices in corrupt saves.
  for (let index = 0; index < levels.length && candidates.has(index); index++) completed.push(index);
  const best = {};
  if (data.best && typeof data.best === 'object' && !Array.isArray(data.best)) {
    completed.forEach(index => {
      const score = data.best[index];
      if (Number.isSafeInteger(score) && score >= levels[index].par) best[index] = score;
    });
  }
  const unlocked = Math.min(levels.length - 1, completed.length ? completed[completed.length - 1] + 1 : 0);
  const requested = Number.isFinite(data.current) ? Math.floor(data.current) : 0;
  const current = Math.max(0, Math.min(requested, unlocked));
  return { completed, best, current, sound: data.sound === true };
}

/** UI-independent game/session state, suitable for wx storage or an in-memory adapter. */
class GameController {
  constructor(storage) {
    this.storage = storage || {};
    this.storageError = false;
    let input = null;
    try {
      if (typeof this.storage.get === 'function') input = this.storage.get();
    } catch (_) {
      this.storageError = true;
    }
    this.saved = cleanSaved(input);
    this.index = this.saved.current;
    this.state = rules.initialState(this.level);
    this.history = [];
    this.feedback = this.index === 0
      ? '先向右走。回声会比你慢三拍，点击「等一拍」也能推进时间。'
      : this.level.hint;
  }

  get level() { return levels[this.index]; }
  get unlockedIndex() {
    return Math.min(levels.length - 1, this.saved.completed.length
      ? Math.max.apply(null, this.saved.completed) + 1 : 0);
  }
  get isWon() { return rules.isWon(this.level, this.state); }

  persist() {
    if (typeof this.storage.set !== 'function') return true;
    // The platform adapter receives only supported saved fields, never live move snapshots.
    const snapshot = {
      completed: this.saved.completed.slice(),
      best: Object.assign({}, this.saved.best),
      current: this.saved.current,
      sound: this.saved.sound
    };
    try {
      this.storage.set(snapshot);
      this.storageError = false;
      return true;
    } catch (_) {
      this.storageError = true;
      return false;
    }
  }

  event(kind, message) {
    this.feedback = message;
    return { kind, message };
  }

  loadLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= levels.length || index > this.unlockedIndex) return null;
    this.index = index;
    this.saved.current = index;
    this.state = rules.initialState(this.level);
    this.history = [];
    this.persist();
    return this.event('load', index === 0
      ? '先向右走。回声慢三拍，点击「等一拍」也能推进时间。'
      : this.level.hint);
  }

  act(action) {
    if (this.isWon || rules.actions.indexOf(action) === -1) return null;
    const next = rules.step(this.level, this.state, action);
    if (next === this.state) {
      return this.event('blocked', '这里还过不去。撞墙不计步，换个方向试试。');
    }
    this.history.push(this.state);
    this.state = next;
    if (this.isWon) {
      if (this.saved.completed.indexOf(this.index) === -1) {
        this.saved.completed.push(this.index);
        this.saved.completed.sort((a, b) => a - b);
      }
      if (!this.saved.best[this.index] || this.state.moves < this.saved.best[this.index]) {
        this.saved.best[this.index] = this.state.moves;
      }
      const stored = this.persist();
      const message = this.index === levels.length - 1
        ? '八座花园都亮了。谢谢你，等了另一个自己。'
        : '花园醒来了。现在的你和过去的你，刚好相遇。';
      return this.event('win', message + (stored ? '' : ' 当前进度暂未保存。'));
    }
    const gateMessage = this.level.gates.length && rules.isGateOpen(this.level, this.state)
      ? ' 机关被压住了，门已打开。' : '';
    return this.event(action === 'wait' ? 'wait' : 'move',
      (action === 'wait' ? '你等了一拍。' : '') + '回声下一拍会到 ' + coordinate(this.state.queue[0]) + '。' + gateMessage);
  }

  undo() {
    if (!this.history.length) return null;
    this.state = this.history.pop();
    // Completion and personal-best records remain earned even after undoing the final beat.
    return this.event('undo', '退回上一拍。过去的你，也一起回来了。');
  }

  reset() { return this.loadLevel(this.index); }

  hint() {
    if (this.isWon) return null;
    const route = rules.solve(this.level, this.state);
    return this.event('hint', route && route.length
      ? '下一拍可以' + actionNames[route[0]] + '。' + this.level.hint
      : '这条路暂时无法相遇。试着撤销几拍，或者从头来过。');
  }

  next() {
    if (!this.isWon) return null;
    return this.loadLevel((this.index + 1) % levels.length);
  }

  setSound(value) {
    const enabled = value === true;
    if (enabled === this.saved.sound) return null;
    this.saved.sound = enabled;
    const stored = this.persist();
    return this.event('sound', (enabled ? '声音已开启。' : '声音已关闭。')
      + (stored ? '' : ' 此设置暂未保存。'));
  }
}

module.exports = { GameController, cleanSaved };
