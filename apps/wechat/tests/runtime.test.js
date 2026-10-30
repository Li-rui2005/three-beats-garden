'use strict';

// Runs the real game entrypoint and Canvas renderer against a deterministic wx host.
// Inputs go through registered touch callbacks, not directly through the controller.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { solve, levels } = require('../js/engine');
const { STORAGE_KEY } = require('../js/platform');

const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'game.js');
let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }

function boot(options) {
  options = options || {};
  const events = {}, shares = [], menus = [], audios = [], frames = [];
  const storage = options.storage || new Map();
  const calls = { draws: 0, methods: {}, texts: [] };
  let clock = 1000;
  let info = Object.assign({ windowWidth: 390, windowHeight: 844, screenHeight: 844,
    pixelRatio: 2, statusBarHeight: 24, safeArea: { top: 24, bottom: 810 } }, options.info);
  const context = new Proxy({ font: '12px sans-serif' }, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'measureText') return text => {
        const size = Number((String(target.font).match(/([\d.]+)px/) || [0, 12])[1]);
        return { width: Array.from(String(text)).length * size * 0.7 };
      };
      return (...args) => {
        calls.methods[key] = (calls.methods[key] || 0) + 1;
        if (key === 'clearRect') calls.draws++;
        if (key === 'fillText') calls.texts.push(String(args[0]));
      };
    },
    set(target, key, value) { target[key] = value; return true; }
  });
  const canvas = { width: 0, height: 0, getContext(kind) { assert.equal(kind, '2d'); return context; } };
  const wx = {
    createCanvas: () => canvas,
    getWindowInfo: () => info,
    getSystemInfoSync: () => info,
    getMenuButtonBoundingClientRect: () => ({ left: 292, width: 86, top: 25, bottom: 57 }),
    getStorageSync: key => storage.get(key),
    setStorageSync: (key, value) => { storage.set(key, JSON.parse(JSON.stringify(value))); },
    onTouchStart: fn => { events.touchStart = fn; },
    onTouchEnd: fn => { events.touchEnd = fn; },
    onTouchCancel: fn => { events.touchCancel = fn; },
    onWindowResize: fn => { events.resize = fn; },
    onHide: fn => { events.hide = fn; },
    onShow: fn => { events.show = fn; },
    onAudioInterruptionBegin: fn => { events.audioBegin = fn; },
    onAudioInterruptionEnd: fn => { events.audioEnd = fn; },
    showShareMenu: value => menus.push(value),
    onShareAppMessage: fn => { events.share = fn; },
    shareAppMessage: value => shares.push(value),
    createInnerAudioContext: () => {
      if (options.audioUnavailable) throw new Error('Audio unavailable');
      const audio = { src: '', plays: 0, stops: 0, play() { this.plays++; }, stop() { this.stops++; }, onError(fn) { this.errorHandler = fn; } };
      audios.push(audio);
      return audio;
    }
  };
  if (options.legacyWindowInfo) delete wx.getWindowInfo;
  const module = { exports: {} };
  const sandbox = {
    module, exports: module.exports, require: createRequire(entry), wx, console,
    Date: { now: () => clock },
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    setTimeout: callback => { frames.push(callback); return frames.length; }
  };
  vm.runInNewContext(fs.readFileSync(entry, 'utf8'), sandbox, { filename: entry });
  const api = module.exports;
  assert.ok(api.game && api.renderer && api.view, 'Entry must expose game/renderer/view for host tests');
  function flush() {
    let remaining = 100;
    while (frames.length && remaining--) {
      clock += 20;
      frames.shift()(clock);
    }
    assert.ok(remaining > 0, 'Animation should settle instead of redrawing forever');
  }
  flush();
  function touch(x, y, endX, endY, useLegacy) {
    const start = useLegacy ? { x, y } : { clientX: x, clientY: y };
    const end = useLegacy ? { x: endX, y: endY } : { clientX: endX, clientY: endY };
    events.touchStart({ touches: [start], changedTouches: [] });
    events.touchEnd({ touches: [], changedTouches: [end] });
    flush();
  }
  function button(id) {
    const hit = api.renderer.hits.find(value => value.id === id);
    assert.ok(hit, 'Expected a visible hit area: ' + id);
    return hit;
  }
  function click(id) {
    const hit = button(id);
    touch(hit.x + hit.w / 2, hit.y + hit.h / 2, hit.x + hit.w / 2, hit.y + hit.h / 2);
  }
  function swipe(action, useLegacy) {
    const board = api.renderer.board, x = board.x + board.w / 2, y = board.y + board.h / 2;
    const delta = { right: [36, 0], left: [-36, 0], down: [0, 36], up: [0, -36] }[action];
    touch(x, y, x + delta[0], y + delta[1], useLegacy);
  }
  function resize(nextInfo) {
    info = Object.assign({}, info, nextInfo);
    events.resize({ windowWidth: info.windowWidth, windowHeight: info.windowHeight });
    flush();
  }
  return Object.assign({}, api, { wx, events, shares, menus, audios, calls, canvas, storage, flush, click, swipe, touch, button, resize });
}

test('real entry creates a DPR-scaled Canvas and registers touch, share and lifecycle handlers', () => {
  const host = boot();
  assert.equal(host.canvas.width, 780);
  assert.equal(host.canvas.height, 1688);
  assert.ok(host.calls.draws > 0);
  ['touchStart', 'touchEnd', 'touchCancel', 'resize', 'hide', 'show', 'share'].forEach(name => assert.equal(typeof host.events[name], 'function'));
  assert.ok(host.calls.methods.fillText > 0 && host.calls.methods.ellipse > 0);
  assert.ok(host.calls.texts.includes('慢三拍'));
  assert.equal(host.menus.length, 1);
});

test('touch buttons, swipes, legacy coordinates and undo alter the actual game state', () => {
  const host = boot();
  host.click('up');
  assert.equal(host.game.state.moves, 0);
  assert.match(host.game.feedback, /不计步/);
  host.click('right');
  assert.equal(host.game.state.p.x, 2);
  host.swipe('right', true);
  assert.equal(host.game.state.p.x, 3);
  host.click('wait');
  assert.equal(host.game.state.moves, 3);
  assert.equal(host.game.state.e.x, 1);
  host.click('undo');
  assert.equal(host.game.state.moves, 2);
  host.click('reset');
  assert.equal(host.game.state.moves, 0);
});

test('cancelled gestures and long drags off a button do not become unintended taps', () => {
  const host = boot(), hit = host.button('right');
  host.events.touchStart({ touches: [{ clientX: hit.x + 5, clientY: hit.y + 5 }] });
  host.events.touchCancel();
  host.events.touchEnd({ changedTouches: [{ clientX: hit.x + 5, clientY: hit.y + 5 }] });
  host.flush();
  assert.equal(host.game.state.moves, 0);
  host.touch(hit.x + 5, hit.y + 5, hit.x + 80, hit.y + 5);
  assert.equal(host.game.state.moves, 0);
});

test('help is modal, removes background hit areas, and its close control restores movement', () => {
  const host = boot();
  const before = host.game.state.moves;
  host.click('help');
  assert.equal(host.view.modal, 'help');
  assert.ok(!host.renderer.hits.some(hit => hit.id === 'right'));
  host.swipe('right');
  assert.equal(host.game.state.moves, before);
  host.click('closeHelp');
  assert.equal(host.view.modal, null);
  host.click('right');
  assert.equal(host.game.state.moves, before + 1);
});

test('locked chapters and hint touch controls keep movement snapshots intact', () => {
  const host = boot();
  host.click('level:1');
  assert.equal(host.game.index, 0);
  assert.match(host.game.feedback, /前一座/);
  host.click('hint');
  assert.match(host.game.feedback, /向右/);
  assert.equal(host.game.state.moves, 0);
  assert.deepEqual(host.game.history, []);
});

test('all eight gardens complete through registered touch callbacks and real victory overlays', () => {
  const host = boot();
  levels.forEach((level, index) => {
    assert.equal(host.game.index, index);
    const route = solve(level);
    route.forEach((action, stepIndex) => {
      // Exercise both gesture and button paths throughout the authored routes.
      if (action !== 'wait' && stepIndex % 2 === 0) host.swipe(action);
      else host.click(action);
    });
    assert.equal(host.game.isWon, true);
    assert.equal(host.view.modal, 'win');
    assert.ok(!host.renderer.hits.some(hit => hit.id === 'right'));
    assert.ok(host.renderer.hits.some(hit => hit.id === 'next'));
    assert.equal(host.game.saved.best[index], level.par);
    host.click('next');
  });
  assert.equal(host.game.index, 0);
  assert.equal(host.game.isWon, false);
  assert.equal(host.game.saved.completed.length, 8);
  assert.equal(host.storage.get(STORAGE_KEY).completed.length, 8);
});

test('victory share button uses a packaged image and wx share registration contains the game title', () => {
  const host = boot();
  solve(host.game.level).forEach(action => host.click(action));
  host.click('share');
  assert.equal(host.shares.length, 1);
  const share = host.shares[0], menuShare = host.events.share();
  assert.match(share.title, /慢三拍/);
  assert.equal(share.imageUrl, 'assets/share.png');
  assert.equal(menuShare.imageUrl, share.imageUrl);
  assert.ok(fs.existsSync(path.join(root, share.imageUrl)));
  host.click('replay');
  assert.equal(host.game.state.moves, 0);
  assert.equal(host.game.isWon, false);
});

test('wx storage restores completed gardens, current selection and sound after a fresh entry boot', () => {
  const storage = new Map(), host = boot({ storage });
  host.click('sound');
  solve(host.game.level).forEach(action => host.click(action));
  host.click('next');
  host.click('right');
  const restarted = boot({ storage });
  assert.equal(restarted.game.index, 1);
  assert.equal(restarted.game.state.moves, 0);
  assert.deepEqual(restarted.game.saved.completed, [0]);
  assert.equal(restarted.game.saved.sound, true);
});

test('onHide pauses redraw/audio; onShow and resize preserve progress and redraw the new Canvas', () => {
  const host = boot();
  host.click('sound');
  host.click('right');
  const before = host.game.state;
  const lastDraws = host.calls.draws;
  host.events.hide();
  host.flush();
  assert.equal(host.calls.draws, lastDraws);
  assert.ok(host.audios.every(audio => audio.stops > 0));
  host.events.show();
  host.flush();
  assert.equal(host.game.state, before);
  assert.ok(host.calls.draws > lastDraws);
  host.resize({ windowWidth: 360, windowHeight: 720, screenHeight: 720, pixelRatio: 3,
    safeArea: { top: 20, bottom: 700 } });
  assert.equal(host.canvas.width, 1080);
  assert.equal(host.canvas.height, 2160);
  assert.equal(host.game.state, before);
  host.click('right');
  assert.equal(host.game.state.moves, 2);
});

test('audio interruption blocks playback until resumed and no-audio devices remain playable', () => {
  const host = boot();
  host.click('sound');
  const plays = () => host.audios.reduce((sum, audio) => sum + audio.plays, 0);
  const initial = plays();
  assert.ok(initial > 0);
  host.events.audioBegin();
  host.click('right');
  assert.equal(plays(), initial);
  host.events.audioEnd();
  host.click('wait');
  assert.ok(plays() > initial);
  host.audios.forEach(audio => assert.ok(fs.existsSync(path.join(root, audio.src))));
  const silentHost = boot({ audioUnavailable: true });
  silentHost.click('sound');
  silentHost.click('right');
  assert.equal(silentHost.game.state.moves, 1);
});

test('legacy window-info fallback and several portrait sizes keep controls within the viewport', () => {
  const host = boot({ legacyWindowInfo: true });
  [[320, 568], [375, 667], [390, 844], [430, 932], [768, 1024]].forEach(([width, height]) => {
    host.resize({ windowWidth: width, windowHeight: height, screenHeight: height,
      safeArea: { top: 24, bottom: height - 20 } });
    for (const hit of host.renderer.hits) {
      assert.ok(hit.x >= 0 && hit.y >= 0, hit.id + ' begins outside the viewport');
      assert.ok(hit.x + hit.w <= width + 1, hit.id + ' exceeds viewport width at ' + width);
      assert.ok(hit.y + hit.h <= height + 1, hit.id + ' exceeds viewport height at ' + height);
    }
  });
});

console.log('\n' + passed + ' runtime checks passed. Actual wx touch callbacks completed all eight gardens.');
