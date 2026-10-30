"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // js/engine.js
  var require_engine = __commonJS({
    "js/engine.js"(exports, module) {
      var actions = ["up", "right", "down", "left", "wait"];
      var vectors = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0], wait: [0, 0] };
      var same = (a, b) => a.x === b.x && a.y === b.y;
      var at = (x, y) => ({ x, y });
      var make = (id, title, kicker, description, hint, grid, start, goal, echoGoal, switches = [], gates = []) => ({ id, title, kicker, description, hint, grid, start: at(...start), goal: at(...goal), echoGoal: at(...echoGoal), switches: switches.map((p) => at(...p)), gates: gates.map((p) => at(...p)), par: [4, 6, 6, 7, 9, 12, 18, 15][id - 1] });
      var levels = [
        make(1, "初次回响", "01 / 向过去打个招呼", "先经过青色花座，再走到金色花座。回声会慢你三步。", "一路向右。第 4 步时，回声会来到你第 1 步的位置。", [
          "#######",
          "#######",
          "#######",
          "#.....#",
          "#######",
          "#######",
          "#######"
        ], [1, 3], [5, 3], [2, 3]),
        make(2, "等一等自己", "02 / 停留也是一步", "你可以停留。点击「等一拍」会让回声继续追上来。", "先经过下方的青色花座，再向上走到金色花座。到了以后，等一拍。", [
          "#######",
          "#######",
          "####.##",
          "####.##",
          "#....##",
          "#######",
          "#######"
        ], [1, 4], [4, 2], [4, 4]),
        make(3, "留一道门", "03 / 让过去帮个忙", "站在方形机关上，藤门就会打开。你和回声都能触发它。", "走到门前，等回声站上机关，再穿过去。门后的花座上不必着急。", [
          "#######",
          "#######",
          "#######",
          "#.....#",
          "#######",
          "#######",
          "#######"
        ], [1, 3], [5, 3], [3, 3], [[2, 3]], [[4, 3]]),
        make(4, "绕一点远路", "04 / 先安排，再出发", "机关在岔路里。给过去的自己留下一份工作。", "先踏上上方的机关，再回主路。门前等一拍，回声会替你开门。", [
          "#######",
          "#######",
          "#..####",
          "#.....#",
          "#..####",
          "#######",
          "#######"
        ], [1, 3], [5, 3], [3, 3], [[2, 2]], [[4, 3]]),
        make(5, "多留两拍", "05 / 把停留交给回声", "两道门，需要更长的开门时间。你停多久，回声也会停多久。", "先在机关上等两次，再沿路穿过两道门。到金色花座后，再等回声。", [
          "#######",
          "#######",
          "####..#",
          "###..##",
          "#...###",
          "#######",
          "#######"
        ], [1, 4], [5, 2], [4, 3], [[2, 4]], [[3, 3], [4, 2]]),
        make(6, "接力", "06 / 下一份约定", "机关之间可以接力。规划好脚步，花园会替你把门留着。", "第一个机关与第一道门之间隔了一格。第二个机关在转角，别错过。", [
          "#######",
          "#####.#",
          "####..#",
          "###..##",
          "#...###",
          "#.#####",
          "#######"
        ], [1, 5], [5, 1], [4, 2], [[1, 4], [4, 3]], [[3, 4], [5, 2]]),
        make(7, "远路的意义", "07 / 未来藏在转角", "花座就在附近，但通向它的回声，需要走一条远路。", "从中央小路向上，绕到右上方机关，再向下。你需要回声从门的上方追来。", [
          "#######",
          "#.....#",
          "#.###.#",
          "#...#.#",
          "###.#.#",
          "#.....#",
          "#######"
        ], [1, 5], [5, 5], [5, 2], [[5, 1]], [[5, 3]]),
        make(8, "此刻，刚刚好", "08 / 把时间种成花", "最后一朵花。两次约定，两段回响，最后同时抵达。", "两处机关可以接力开门。走到每道门前，让三步前的自己替你留住时间。", [
          "#######",
          "#.....#",
          "#.###.#",
          "#...#.#",
          "#.###.#",
          "#.....#",
          "#######"
        ], [1, 5], [5, 5], [5, 2], [[1, 3], [5, 1]], [[2, 1], [5, 3]])
      ];
      function initialState(level) {
        const p = { ...level.start };
        return { p, e: { ...p }, queue: [{ ...p }, { ...p }, { ...p }], moves: 0 };
      }
      function isGateOpen(level, state) {
        return level.switches.some((p) => same(p, state.p) || same(p, state.e));
      }
      function step(level, state, action) {
        const delta = vectors[action];
        if (!delta) return state;
        const p = { x: state.p.x + delta[0], y: state.p.y + delta[1] };
        if (!level.grid[p.y] || level.grid[p.y][p.x] !== ".") return state;
        if (action !== "wait" && level.gates.some((g) => same(g, p)) && !isGateOpen(level, state)) return state;
        const queue = [...state.queue.map((p2) => ({ ...p2 })), p];
        const e = queue.shift();
        return { p, e, queue, moves: state.moves + 1 };
      }
      function isWon(level, state) {
        return same(state.p, level.goal) && same(state.e, level.echoGoal);
      }
      var stateKey = (s) => [s.p, s.e, ...s.queue].map((p) => p.x + "," + p.y).join("|");
      function solve(level, state = initialState(level)) {
        if (isWon(level, state)) return [];
        const nodes = [{ state, parent: -1, action: null }];
        const seen = /* @__PURE__ */ new Set([stateKey(state)]);
        for (let i = 0; i < nodes.length; i++) {
          const current = nodes[i];
          for (const action of actions) {
            const next = step(level, current.state, action);
            if (next === current.state) continue;
            const key = stateKey(next);
            if (seen.has(key)) continue;
            seen.add(key);
            const index = nodes.push({ state: next, parent: i, action }) - 1;
            if (isWon(level, next)) {
              const solution = [];
              for (let j = index; nodes[j].parent !== -1; j = nodes[j].parent) solution.push(nodes[j].action);
              return solution.reverse();
            }
          }
        }
        return null;
      }
      module.exports = { actions, levels, same, initialState, isGateOpen, step, isWon, solve };
    }
  });

  // js/controller.js
  var require_controller = __commonJS({
    "js/controller.js"(exports, module) {
      "use strict";
      var rules = require_engine();
      var { levels } = rules;
      var actionNames = { up: "向上 ↑", right: "向右 →", down: "向下 ↓", left: "向左 ←", wait: "等一拍" };
      var coordinate = (point) => String.fromCharCode(65 + point.x) + (point.y + 1);
      function cleanSaved(input) {
        if (typeof input === "string") {
          try {
            input = JSON.parse(input);
          } catch (_) {
            input = null;
          }
        }
        const data = input && typeof input === "object" && !Array.isArray(input) ? input : {};
        const validIndex = (index) => Number.isInteger(index) && index >= 0 && index < levels.length;
        const candidates = new Set(Array.isArray(data.completed) ? data.completed.filter(validIndex) : []);
        const completed = [];
        for (let index = 0; index < levels.length && candidates.has(index); index++) completed.push(index);
        const best = {};
        if (data.best && typeof data.best === "object" && !Array.isArray(data.best)) {
          completed.forEach((index) => {
            const score = data.best[index];
            if (Number.isSafeInteger(score) && score >= levels[index].par) best[index] = score;
          });
        }
        const unlocked = Math.min(levels.length - 1, completed.length ? completed[completed.length - 1] + 1 : 0);
        const requested = Number.isFinite(data.current) ? Math.floor(data.current) : 0;
        const current = Math.max(0, Math.min(requested, unlocked));
        return { completed, best, current, sound: data.sound === true };
      }
      var GameController = class {
        constructor(storage) {
          this.storage = storage || {};
          this.storageError = false;
          let input = null;
          try {
            if (typeof this.storage.get === "function") input = this.storage.get();
          } catch (_) {
            this.storageError = true;
          }
          this.saved = cleanSaved(input);
          this.index = this.saved.current;
          this.state = rules.initialState(this.level);
          this.history = [];
          this.feedback = this.index === 0 ? "先向右走。回声会比你慢三拍，点击「等一拍」也能推进时间。" : this.level.hint;
        }
        get level() {
          return levels[this.index];
        }
        get unlockedIndex() {
          return Math.min(levels.length - 1, this.saved.completed.length ? Math.max.apply(null, this.saved.completed) + 1 : 0);
        }
        get isWon() {
          return rules.isWon(this.level, this.state);
        }
        persist() {
          if (typeof this.storage.set !== "function") return true;
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
          return this.event("load", index === 0 ? "先向右走。回声慢三拍，点击「等一拍」也能推进时间。" : this.level.hint);
        }
        act(action) {
          if (this.isWon || rules.actions.indexOf(action) === -1) return null;
          const next = rules.step(this.level, this.state, action);
          if (next === this.state) {
            return this.event("blocked", "这里还过不去。撞墙不计步，换个方向试试。");
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
            const message = this.index === levels.length - 1 ? "八座花园都亮了。谢谢你，等了另一个自己。" : "花园醒来了。现在的你和过去的你，刚好相遇。";
            return this.event("win", message + (stored ? "" : " 当前进度暂未保存。"));
          }
          const gateMessage = this.level.gates.length && rules.isGateOpen(this.level, this.state) ? " 机关被压住了，门已打开。" : "";
          return this.event(
            action === "wait" ? "wait" : "move",
            (action === "wait" ? "你等了一拍。" : "") + "回声下一拍会到 " + coordinate(this.state.queue[0]) + "。" + gateMessage
          );
        }
        undo() {
          if (!this.history.length) return null;
          this.state = this.history.pop();
          return this.event("undo", "退回上一拍。过去的你，也一起回来了。");
        }
        reset() {
          return this.loadLevel(this.index);
        }
        hint() {
          if (this.isWon) return null;
          const route = rules.solve(this.level, this.state);
          return this.event("hint", route && route.length ? "下一拍可以" + actionNames[route[0]] + "。" + this.level.hint : "这条路暂时无法相遇。试着撤销几拍，或者从头来过。");
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
          return this.event("sound", (enabled ? "声音已开启。" : "声音已关闭。") + (stored ? "" : " 此设置暂未保存。"));
        }
      };
      module.exports = { GameController, cleanSaved };
    }
  });

  // js/renderer.js
  var require_renderer = __commonJS({
    "js/renderer.js"(exports, module) {
      "use strict";
      var COLORS = { paper: "#f3f2ea", ink: "#243c34", muted: "#7b8873", line: "#d9dfce", green: "#153c32", gold: "#f3c76e", mint: "#8cd4bd", lime: "#d1ec9e" };
      var coordinate = (p) => String.fromCharCode(65 + p.x) + (p.y + 1);
      var same = (a, b) => a.x === b.x && a.y === b.y;
      var Renderer = class {
        constructor(canvas2) {
          this.canvas = canvas2;
          this.ctx = canvas2.getContext("2d");
          this.hits = [];
          this.metrics = null;
          this.board = null;
        }
        resize(info) {
          this.metrics = info;
          this.canvas.width = Math.round(info.width * info.dpr);
          this.canvas.height = Math.round(info.height * info.dpr);
        }
        round(x, y, w, h, r, fill, stroke) {
          const c = this.ctx;
          r = Math.min(r, w / 2, h / 2);
          c.beginPath();
          c.moveTo(x + r, y);
          c.arcTo(x + w, y, x + w, y + h, r);
          c.arcTo(x + w, y + h, x, y + h, r);
          c.arcTo(x, y + h, x, y, r);
          c.arcTo(x, y, x + w, y, r);
          c.closePath();
          if (fill) {
            c.fillStyle = fill;
            c.fill();
          }
          if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = 1;
            c.stroke();
          }
        }
        text(text, x, y, size = 12, color = COLORS.ink, align = "left", weight = "normal") {
          const c = this.ctx;
          c.font = weight + " " + size + "px sans-serif";
          c.textAlign = align;
          c.textBaseline = "middle";
          c.fillStyle = color;
          c.fillText(String(text), x, y);
        }
        line(x, y, x2, y2, color, width = 1) {
          const c = this.ctx;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x2, y2);
          c.strokeStyle = color;
          c.lineWidth = width;
          c.stroke();
        }
        circle(x, y, r, fill, stroke) {
          const c = this.ctx;
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          if (fill) {
            c.fillStyle = fill;
            c.fill();
          }
          if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = 1;
            c.stroke();
          }
        }
        wrap(text, x, y, maxWidth, size = 11, color = COLORS.muted, lineHeight = 17, maxLines = 2) {
          const c = this.ctx;
          c.font = size + "px sans-serif";
          let rows = [], row = "";
          for (const ch of String(text)) {
            if (ch === "\n" || row && c.measureText(row + ch).width > maxWidth) {
              rows.push(row);
              row = ch === "\n" ? "" : ch;
            } else row += ch;
          }
          if (row) rows.push(row);
          rows = rows.slice(0, maxLines);
          rows.forEach((s, i) => this.text(s, x, y + i * lineHeight, size, color));
          return rows.length * lineHeight;
        }
        button(id, label, x, y, w, h, options = {}) {
          const disabled = !!options.disabled;
          this.round(x, y, w, h, options.radius || 8, options.primary ? COLORS.ink : options.fill || "#e8eddf", options.primary ? null : options.stroke || "#d3ddc7");
          this.text(label, x + w / 2, y + h / 2, options.size || 12, disabled ? "#abb49d" : options.primary ? COLORS.paper : COLORS.ink, "center", options.primary ? "bold" : "normal");
          this.hits.push({ id, x, y, w, h, disabled });
        }
        hit(x, y) {
          for (let i = this.hits.length - 1; i >= 0; i--) {
            const r = this.hits[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
          }
          return null;
        }
        orb(x, y, r, type, alpha = 1) {
          const c = this.ctx;
          c.save();
          c.globalAlpha = alpha;
          this.circle(x, y + r * 0.85, r * 0.75, "rgba(0,20,12,.18)");
          if (type === "echo") {
            c.beginPath();
            c.moveTo(x - r, y + r);
            c.lineTo(x - r, y);
            c.bezierCurveTo(x - r, y - r * 1.3, x + r, y - r * 1.3, x + r, y);
            c.lineTo(x + r, y + r);
            for (let i = 0; i < 4; i++) c.lineTo(x + r - i * r * 0.5 - r * 0.25, y + r * (i % 2 ? 0.72 : 0.95));
            c.closePath();
            c.fillStyle = COLORS.mint;
            c.fill();
          } else {
            this.circle(x, y, r, COLORS.gold);
            c.save();
            c.translate(x - r * 0.3, y - r * 0.45);
            c.rotate(-0.5);
            c.scale(1.8, 0.7);
            this.circle(0, 0, r * 0.25, "#ffe4a8");
            c.restore();
            c.beginPath();
            c.moveTo(x, y - r);
            c.quadraticCurveTo(x, y - r * 1.8, x + r * 0.55, y - r * 1.6);
            c.quadraticCurveTo(x + r * 0.65, y - r * 1.05, x, y - r);
            c.fillStyle = COLORS.lime;
            c.fill();
          }
          this.circle(x - r * 0.34, y, r * 0.1, "#36523b");
          this.circle(x + r * 0.34, y, r * 0.1, "#36523b");
          c.beginPath();
          c.moveTo(x - r * 0.2, y + r * 0.4);
          c.quadraticCurveTo(x, y + r * 0.6, x + r * 0.2, y + r * 0.4);
          c.strokeStyle = type === "echo" ? "#4b8f76" : "#ad8445";
          c.lineWidth = 1.2;
          c.stroke();
          c.restore();
        }
        flower(x, y, r, color, active = false) {
          const c = this.ctx;
          c.save();
          c.translate(x, y);
          c.globalAlpha = active ? 1 : 0.6;
          for (let i = 0; i < 6; i++) {
            c.rotate(Math.PI / 3);
            c.beginPath();
            c.ellipse(0, -r * 0.55, r * 0.23, r * 0.4, 0, 0, Math.PI * 2);
            c.fillStyle = color;
            c.fill();
          }
          this.circle(0, 0, r * 0.3, COLORS.green);
          this.circle(0, 0, r * 0.12, color);
          c.restore();
        }
        shrub(x, y, r, seed) {
          const c = this.ctx;
          c.save();
          c.translate(x, y);
          c.rotate(seed % 5 * 0.7);
          c.globalAlpha = 0.65;
          this.line(0, r * 0.6, 0, -r * 0.7, "#698357", 1);
          for (const [lx, ly, rot, color] of [[-r * 0.3, 0, -0.6, "#436b50"], [r * 0.32, -r * 0.25, 0.6, "#557b55"], [0, -r * 0.6, 0, "#6d8b60"]]) {
            c.save();
            c.translate(lx, ly);
            c.rotate(rot);
            c.beginPath();
            c.ellipse(0, 0, r * 0.24, r * 0.5, 0, 0, Math.PI * 2);
            c.fillStyle = color;
            c.fill();
            c.restore();
          }
          c.restore();
        }
        drawBoard(controller, rect, anim) {
          const c = this.ctx, l = controller.level, s = controller.state;
          const open = l.switches.some((p2) => same(p2, s.p) || same(p2, s.e));
          const cell = Math.min((rect.w - 42) / l.grid[0].length, (rect.h - 57) / l.grid.length);
          const ox = rect.x + (rect.w - cell * l.grid[0].length) / 2, oy = rect.y + 27 + (rect.h - 42 - cell * l.grid.length) / 2;
          const xy = (p2) => ({ x: ox + (p2.x + 0.5) * cell, y: oy + (p2.y + 0.5) * cell });
          this.round(rect.x, rect.y, rect.w, rect.h, 17, COLORS.green);
          this.circle(rect.x + 16, rect.y + 17, 2.4, COLORS.lime);
          this.text("THE ECHO GARDEN", rect.x + 25, rect.y + 17, 8, "#cfdfbd");
          this.text("步数 " + String(s.moves).padStart(2, "0") + "  /  最短 " + l.par, rect.x + rect.w - 13, rect.y + 17, 9, "#b3c7a9", "right");
          c.save();
          this.round(rect.x, rect.y, rect.w, rect.h, 17, null, null);
          c.clip();
          c.globalAlpha = 0.2;
          for (let i = 0; i < 4; i++) {
            c.beginPath();
            c.arc(rect.x + 16, rect.y + rect.h - 10, 30 + i * 44, 0.9 * Math.PI, 1.9 * Math.PI);
            c.strokeStyle = "#65885c";
            c.lineWidth = 1;
            c.stroke();
          }
          c.restore();
          for (let y = 0; y < l.grid.length; y++) for (let x = 0; x < l.grid[y].length; x++) {
            const p2 = xy({ x, y });
            if (l.grid[y][x] === "#") this.shrub(p2.x, p2.y, cell * 0.4, x * 17 + y * 11);
            else this.round(p2.x - cell / 2 + 1.5, p2.y - cell / 2 + 1.5, cell - 3, cell - 3, Math.max(3, cell * 0.13), (x + y) % 2 ? "#244b3c" : "#294e3e");
          }
          for (let x = 0; x < l.grid[0].length; x++) this.text(String.fromCharCode(65 + x), ox + (x + 0.5) * cell, oy - 8, Math.max(6, cell * 0.17), "#86a181", "center");
          for (let y = 0; y < l.grid.length; y++) this.text(y + 1, ox - 9, oy + (y + 0.5) * cell, Math.max(6, cell * 0.17), "#86a181", "center");
          for (const [p2, col, active] of [[l.goal, COLORS.gold, same(s.p, l.goal)], [l.echoGoal, COLORS.mint, same(s.e, l.echoGoal)]]) {
            const q = xy(p2);
            c.save();
            c.setLineDash([2, 3]);
            this.circle(q.x, q.y, cell * 0.38, null, col);
            c.restore();
            this.flower(q.x, q.y, cell * 0.35, col, active);
          }
          l.switches.forEach((p2) => {
            const q = xy(p2), r2 = cell * 0.29;
            this.round(q.x - r2, q.y - r2, r2 * 2, r2 * 2, 4, open ? "#56754c" : "#395a43", "#a1b87e");
            c.beginPath();
            c.moveTo(q.x, q.y - r2 * 0.5);
            c.lineTo(q.x + r2 * 0.5, q.y);
            c.lineTo(q.x, q.y + r2 * 0.5);
            c.lineTo(q.x - r2 * 0.5, q.y);
            c.closePath();
            c.strokeStyle = "#ccdfa7";
            c.lineWidth = 1;
            c.stroke();
          });
          l.gates.forEach((p2) => {
            const q = xy(p2), r2 = cell * 0.36;
            c.save();
            c.globalAlpha = open ? 0.25 : 1;
            this.round(q.x - r2, q.y - r2, r2 * 2, r2 * 2, 4, "#61794b", "#a4b887");
            [-0.4, 0, 0.4].forEach((dx) => this.line(q.x + r2 * dx * 1.5, q.y - r2 * 0.75, q.x + r2 * dx * 1.5, q.y + r2 * 0.75, "#d7e6b1", 1.8));
            c.restore();
          });
          c.save();
          c.globalAlpha = 0.3;
          c.setLineDash([2, 4]);
          const trail = [s.e, ...s.queue, s.p];
          c.beginPath();
          trail.forEach((p2, i) => {
            const q = xy(p2);
            if (i) c.lineTo(q.x, q.y);
            else c.moveTo(q.x, q.y);
          });
          c.strokeStyle = COLORS.mint;
          c.lineWidth = 1;
          c.stroke();
          c.restore();
          s.queue.forEach((p2, i) => {
            const q = xy(p2);
            this.circle(q.x, q.y, 2 + i * 0.5, "rgba(160,209,172,.3)");
          });
          let p = xy(s.p), e = xy(s.e);
          if (anim && anim.old) {
            const t = 1 - Math.pow(1 - anim.t, 3), op = xy(anim.old.p), oe = xy(anim.old.e);
            p = { x: op.x + (p.x - op.x) * t, y: op.y + (p.y - op.y) * t };
            e = { x: oe.x + (e.x - oe.x) * t, y: oe.y + (e.y - oe.y) * t };
          }
          const overlap = Math.abs(p.x - e.x) < cell * 0.1 && Math.abs(p.y - e.y) < cell * 0.1;
          const r = cell * 0.28;
          this.orb(e.x - (overlap ? r * 0.45 : 0), e.y - (overlap ? r * 0.35 : 0), r, "echo", overlap ? 0.65 : 0.95);
          this.orb(p.x + (overlap ? r * 0.35 : 0), p.y, r, "player");
          const ly = rect.y + rect.h - 12;
          this.circle(rect.x + 17, ly, 2.5, COLORS.gold);
          this.text("此刻的你", rect.x + 24, ly, 8, "#b4c9ad");
          this.circle(rect.x + 93, ly, 2.5, COLORS.mint);
          this.text("三步前的你", rect.x + 100, ly, 8, "#b4c9ad");
          this.text(l.gates.length ? "方形机关可开门" : "同时抵达，让花盛开", rect.x + rect.w - 13, ly, 8, "#91af91", "right");
        }
        draw(controller, view, anim) {
          const c = this.ctx, m = this.metrics, w = m.width, h = m.height;
          c.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
          c.clearRect(0, 0, w, h);
          c.fillStyle = COLORS.paper;
          c.fillRect(0, 0, w, h);
          this.hits = [];
          const margin = Math.max(16, Math.min(30, w * 0.047)), inner = w - margin * 2;
          const top = Math.max(14, m.top);
          const bottom = Math.max(10, m.bottom);
          const reserve = top + 49 + 47 + 50 + 101 + 35 + 46 + bottom;
          const bh = Math.max(169, Math.min(inner * 0.97, h - reserve));
          const titleY = top + 59;
          const boardY = top + 96;
          this.board = { x: margin, y: boardY, w: inner, h: bh };
          this.circle(margin + 14, top + 13, 14, COLORS.ink);
          this.text("↶", margin + 14, top + 12, 22, COLORS.paper, "center");
          this.text("慢三拍", margin + 36, top + 8, 20, COLORS.ink, "left", "bold");
          this.text("THREE BEATS LATER", margin + 36, top + 27, 7, COLORS.muted);
          const right = Math.max(margin + 153, Math.min(w - margin, m.menuLeft ? m.menuLeft - 9 : w - margin));
          this.button("sound", controller.saved.sound ? "♪ 开" : "♪ 关", right - 74, top - 1, 36, 30, { fill: COLORS.paper, stroke: COLORS.line, size: 10 });
          this.button("help", "?", right - 32, top - 1, 30, 30, { fill: COLORS.paper, size: 14 });
          this.text(String(controller.index + 1).padStart(2, "0") + " / 08", margin, titleY, 10, COLORS.muted);
          this.text(controller.level.title, margin + 53, titleY, 18, COLORS.ink, "left", "bold");
          this.wrap(controller.level.description, margin, titleY + 23, inner, 10, COLORS.muted, 14, 1);
          this.drawBoard(controller, this.board, anim);
          const queueY = boardY + bh + 11;
          this.text("回声预告", margin, queueY + 10, 10, "#536c4c");
          this.text("接下来会走到", margin, queueY + 25, 8, COLORS.muted);
          const qx = margin + 85, qw = (inner - 85 - 12) / 3;
          controller.state.queue.forEach((p, i) => {
            this.round(qx + i * (qw + 6), queueY, qw, 36, 6, i === 0 ? "#e0e9d4" : "#e8eddf", i === 0 ? "#a7bc90" : "#d4ddca");
            this.text("+" + (i + 1), qx + i * (qw + 6) + 10, queueY + 18, 8, COLORS.muted);
            this.text(coordinate(p), qx + i * (qw + 6) + qw * 0.64, queueY + 18, 12, "#536e4c", "center");
          });
          const controlY = queueY + 48, waitW = Math.min(96, inner * 0.27), gap = 6, aw = (inner - waitW - gap * 4) / 4;
          [["left", "←"], ["up", "↑"], ["down", "↓"], ["right", "→"]].forEach(([a, label], i) => this.button(a, label, margin + i * (aw + gap), controlY, aw, 44, { size: 21, disabled: controller.isWon }));
          this.button("wait", "等一拍", margin + 4 * (aw + gap), controlY, waitW, 44, { primary: true, disabled: controller.isWon, size: 13 });
          const utilityY = controlY + 51, uw = (inner - gap * 2) / 3;
          [["undo", "↶ 撤销"], ["reset", "⟳ 重来"], ["hint", "✧ 提示"]].forEach(([a, label], i) => this.button(a, label, margin + i * (uw + gap), utilityY, uw, 30, { size: 11, fill: COLORS.paper, disabled: a === "undo" ? !controller.history.length : a === "hint" && controller.isWon }));
          const feedY = utilityY + 45;
          this.wrap(controller.feedback, margin, feedY, inner, 10, COLORS.muted, 14, 2);
          const chaptersY = feedY + 31;
          this.line(margin, chaptersY - 9, w - margin, chaptersY - 9, COLORS.line);
          const cw = Math.min(34, (inner - 41) / 8);
          this.text("花园", margin, chaptersY + 12, 9, COLORS.muted);
          const navX = margin + 37, space = (inner - 37) / 8;
          for (let i = 0; i < 8; i++) {
            const x = navX + i * space + (space - cw) / 2, active = i === controller.index, done = controller.saved.completed.indexOf(i) !== -1;
            this.button("level:" + i, String(i + 1).padStart(2, "0"), x, chaptersY - 3, cw, 32, { radius: 16, primary: active, fill: COLORS.paper, size: 10, disabled: i > controller.unlockedIndex });
            if (done) this.circle(x + cw / 2, chaptersY + 33, 2, "#91aa65");
          }
          const footer = Math.min(h - bottom - 4, chaptersY + 48);
          if (footer > chaptersY + 41) this.text("不必走得更快。等一等，也是一种前进。", w / 2, footer, 8, "#9ba58e", "center");
          if (view.modal === "help") this.help(w, h);
          else if (controller.isWon && view.modal !== "none") this.win(controller, w, h);
          if (view.modal === "notice") this.notice(w, h, view.notice || "");
        }
        backdrop(w, h) {
          const c = this.ctx;
          c.fillStyle = "rgba(9,32,24,.52)";
          c.fillRect(0, 0, w, h);
          this.hits = [];
        }
        help(w, h) {
          this.backdrop(w, h);
          const bw = Math.min(w - 32, 410), bh = Math.min(h - 58, 512), x = (w - bw) / 2, y = (h - bh) / 2;
          this.round(x, y, bw, bh, 17, COLORS.paper);
          this.text("A SMALL GUIDE", x + 25, y + 26, 8, COLORS.muted);
          this.text("给回声一点时间。", x + 25, y + 57, 23, COLORS.ink, "left", "bold");
          this.button("closeHelp", "×", x + bw - 43, y + 12, 29, 29, { fill: COLORS.paper, size: 21 });
          const lines = [["01  你走一步，它慢三拍", "金色是你，青色是回声。每次移动或等待后，回声会来到你三步前的位置。"], ["02  两个人，同时抵达", "你到金色花座，回声到青色花座，同时停住，小花园就会醒来。"], ["03  替彼此留一扇门", "任一角色压住方形机关，就能打开同纹样的门。门在行动开始时判定，回声可以穿门。"]];
          let yy = y + 98;
          const compact = bh < 480;
          for (const [title, body] of lines) {
            this.text(title, x + 25, yy, 13, COLORS.ink, "left", "bold");
            const used = this.wrap(body, x + 25, yy + 24, bw - 50, compact ? 10 : 11, COLORS.muted, 17, 3);
            yy += used + 40;
          }
          this.wrap("棋盘上滑动或点方向按钮。等一拍、撤销和提示都可以使用。撞墙不计步。", x + 25, yy - 1, bw - 50, 10, COLORS.muted, 16, 2);
          this.text("关卡与进度仅保存在本机 · 无广告与付费", x + bw / 2, y + bh - 80, 9, COLORS.muted, "center");
          this.button("closeHelp", "知道了，去碰个面", x + 25, y + bh - 58, bw - 50, 39, { primary: true });
        }
        win(controller, w, h) {
          this.backdrop(w, h);
          const bw = Math.min(w - 46, 350), bh = 334, x = (w - bw) / 2, y = Math.max(24, (h - bh) / 2);
          this.round(x, y, bw, bh, 18, COLORS.paper);
          this.flower(w / 2, y + 46, 25, "#8bA457", true);
          this.text(controller.index === 7 ? "ALL GARDENS AWAKENED" : "GARDEN AWAKENED", w / 2, y + 90, 8, COLORS.muted, "center");
          this.text(controller.index === 7 ? "每一个你，都刚好。" : "刚刚好，遇见你。", w / 2, y + 125, 23, COLORS.ink, "center", "bold");
          this.text(controller.state.moves + " 步点亮花园" + (controller.state.moves === controller.level.par ? " · 最短路线" : " · 最佳 " + controller.saved.best[controller.index] + " 步"), w / 2, y + 158, 11, COLORS.muted, "center");
          this.button("next", controller.index === 7 ? "回到第一座花园" : "下一座花园 →", x + 26, y + 188, bw - 52, 43, { primary: true, size: 13 });
          this.button("share", "分享这座小花园", x + 26, y + 242, (bw - 60) * 0.62, 36, { fill: "#e4ebd8", size: 11 });
          this.button("replay", "再走一次", x + 34 + (bw - 60) * 0.62, y + 242, (bw - 60) * 0.38, 36, { fill: COLORS.paper, size: 10 });
          this.text("已点亮 " + controller.saved.completed.length + " / 8 座花园", w / 2, y + 307, 9, COLORS.muted, "center");
        }
        notice(w, h, message) {
          this.backdrop(w, h);
          const bw = Math.min(w - 40, 340), bh = 195, x = (w - bw) / 2, y = (h - bh) / 2;
          this.round(x, y, bw, bh, 16, COLORS.paper);
          this.text("花园手记", x + 24, y + 29, 17, COLORS.ink, "left", "bold");
          this.wrap(message, x + 24, y + 66, bw - 48, 12, COLORS.muted, 19, 3);
          this.button("closeNotice", "知道了", x + 24, y + 138, bw - 48, 36, { primary: true });
        }
      };
      module.exports = { Renderer, COLORS };
    }
  });

  // js/platform.js
  var require_platform = __commonJS({
    "js/platform.js"(exports, module) {
      "use strict";
      var STORAGE_KEY = "three-beats-wechat-v1";
      function createPlatform(api) {
        const audio = {};
        let suspended = false;
        function windowInfo() {
          const info = typeof api.getWindowInfo === "function" ? api.getWindowInfo() : api.getSystemInfoSync();
          let menu = null;
          try {
            if (typeof api.getMenuButtonBoundingClientRect === "function") menu = api.getMenuButtonBoundingClientRect();
          } catch (_) {
          }
          const safe = info.safeArea || {};
          return {
            width: info.windowWidth,
            height: info.windowHeight,
            dpr: Math.min(info.pixelRatio || 1, 3),
            top: Math.max(14, safe.top || info.statusBarHeight || 20),
            bottom: Math.min(34, Math.max(10, (info.screenHeight || info.windowHeight) - (safe.bottom || info.screenHeight || info.windowHeight))),
            menuLeft: menu && menu.width > 0 ? menu.left : null
          };
        }
        function play(kind, enabled) {
          if (!enabled || suspended || typeof api.createInnerAudioContext !== "function") return;
          const name = kind === "win" ? "win" : kind === "blocked" ? "blocked" : kind === "wait" ? "wait" : "move";
          try {
            if (!audio[name]) {
              const a2 = api.createInnerAudioContext();
              a2.src = "assets/audio/" + name + ".wav";
              a2.volume = name === "win" ? 0.45 : 0.3;
              a2.obeyMuteSwitch = true;
              a2.onError(() => {
              });
              audio[name] = a2;
            }
            const a = audio[name];
            a.stop();
            a.play();
          } catch (_) {
          }
        }
        function stopAll() {
          Object.keys(audio).forEach((k) => {
            try {
              audio[k].stop();
            } catch (_) {
            }
          });
        }
        function share() {
          try {
            if (typeof api.shareAppMessage === "function") api.shareAppMessage({ title: "慢三拍｜和三步前的自己一起点亮花园", imageUrl: "assets/share.png", query: "" });
          } catch (_) {
          }
        }
        function initShare() {
          try {
            if (typeof api.showShareMenu === "function") api.showShareMenu({ withShareTicket: false });
            if (typeof api.onShareAppMessage === "function") api.onShareAppMessage(() => ({ title: "慢三拍｜和三步前的自己一起点亮花园", imageUrl: "assets/share.png" }));
          } catch (_) {
          }
        }
        if (typeof api.onAudioInterruptionBegin === "function") api.onAudioInterruptionBegin(() => {
          suspended = true;
          stopAll();
        });
        if (typeof api.onAudioInterruptionEnd === "function") api.onAudioInterruptionEnd(() => {
          suspended = false;
        });
        return {
          storage: { get() {
            return api.getStorageSync(STORAGE_KEY) || null;
          }, set(value) {
            api.setStorageSync(STORAGE_KEY, value);
          } },
          windowInfo,
          play,
          share,
          initShare,
          hide() {
            suspended = true;
            stopAll();
          },
          show() {
            suspended = false;
          },
          stopAll
        };
      }
      module.exports = { createPlatform, STORAGE_KEY };
    }
  });

  // game.js
  var require_game = __commonJS({
    "game.js"(exports, module) {
      "use strict";
      var { GameController } = require_controller();
      var { Renderer } = require_renderer();
      var { createPlatform } = require_platform();
      var platform = createPlatform(wx);
      var game = new GameController(platform.storage);
      var canvas2 = wx.createCanvas();
      var renderer = new Renderer(canvas2);
      var view = { modal: null, notice: "" };
      var gesture = null;
      var animation = null;
      var framePending = false;
      var visible = true;
      var now = () => Date.now();
      var requestFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (callback) => setTimeout(() => callback(now()), 16);
      function draw() {
        framePending = false;
        if (!visible) return;
        let progress = null;
        if (animation) {
          const t = Math.min(1, (now() - animation.start) / 170);
          progress = { old: animation.old, t };
          if (t === 1) animation = null;
        }
        renderer.draw(game, view, progress);
        if (animation) invalidate();
      }
      function invalidate() {
        if (!framePending && visible) {
          framePending = true;
          requestFrame(draw);
        }
      }
      function resize() {
        renderer.resize(platform.windowInfo());
        animation = null;
        invalidate();
      }
      function dispatch(id) {
        if (!id) return;
        let result = null;
        const old = game.state;
        if (["up", "right", "down", "left", "wait"].indexOf(id) !== -1) result = game.act(id);
        else if (id === "undo") result = game.undo();
        else if (id === "reset" || id === "replay") {
          result = game.reset();
          view.modal = null;
        } else if (id === "hint") result = game.hint();
        else if (id === "next") {
          result = game.next();
          view.modal = null;
        } else if (id === "sound") {
          result = game.setSound(!game.saved.sound);
          if (!game.saved.sound) platform.stopAll();
        } else if (id === "help") {
          view.modal = "help";
        } else if (id === "closeHelp") {
          view.modal = null;
        } else if (id === "closeNotice") {
          view.modal = null;
        } else if (id === "share") {
          platform.share();
        } else if (id.indexOf("level:") === 0) {
          result = game.loadLevel(Number(id.slice(6)));
          view.modal = null;
        }
        if (result) {
          if (result.kind === "move" || result.kind === "wait" || result.kind === "win" || result.kind === "undo") animation = { old, start: now() };
          if (result.kind !== "load" && result.kind !== "hint") platform.play(result.kind, game.saved.sound);
          if (result.kind === "win") view.modal = "win";
        }
        invalidate();
      }
      function point(event, end = false) {
        const a = end ? event.changedTouches : event.touches;
        const p = a && a[0];
        if (!p) return null;
        return { x: typeof p.clientX === "number" ? p.clientX : p.x, y: typeof p.clientY === "number" ? p.clientY : p.y };
      }
      wx.onTouchStart((event) => {
        const p = point(event);
        if (!p) return;
        const hit = renderer.hit(p.x, p.y);
        gesture = { x: p.x, y: p.y, hit, board: !view.modal && !game.isWon && renderer.board && p.x >= renderer.board.x && p.x <= renderer.board.x + renderer.board.w && p.y >= renderer.board.y && p.y <= renderer.board.y + renderer.board.h };
      });
      wx.onTouchEnd((event) => {
        if (!gesture) return;
        const p = point(event, true), start = gesture;
        gesture = null;
        if (!p) return;
        const dx = p.x - start.x, dy = p.y - start.y;
        if (start.board && Math.max(Math.abs(dx), Math.abs(dy)) >= 20) {
          dispatch(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
          return;
        }
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 16) return;
        const hit = renderer.hit(p.x, p.y);
        if (hit && start.hit && hit.id === start.hit.id) {
          if (hit.disabled) {
            if (hit.id.indexOf("level:") === 0) {
              game.feedback = "先点亮前一座花园，再来这里碰个面。";
              invalidate();
            }
            return;
          }
          dispatch(hit.id);
        }
      });
      if (typeof wx.onTouchCancel === "function") wx.onTouchCancel(() => {
        gesture = null;
      });
      if (typeof wx.onWindowResize === "function") wx.onWindowResize(() => resize());
      if (typeof wx.onHide === "function") wx.onHide(() => {
        visible = false;
        gesture = null;
        animation = null;
        framePending = false;
        platform.hide();
      });
      if (typeof wx.onShow === "function") wx.onShow(() => {
        visible = true;
        platform.show();
        resize();
      });
      platform.initShare();
      resize();
      module.exports = { game, renderer, view, dispatch, resize };
    }
  });

  // dev/preview-entry.js
  var canvas = document.getElementById("game-canvas");
  var events = {};
  var audioEvents = {};
  function on(key, callback) {
    events[key] = callback;
  }
  function touch(event) {
    const rect = canvas.getBoundingClientRect();
    return { clientX: event.clientX - rect.left, clientY: event.clientY - rect.top };
  }
  function toast(text) {
    const box = document.getElementById("toast");
    box.textContent = text;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 2600);
  }
  window.wx = {
    createCanvas: () => canvas,
    getWindowInfo: () => ({ windowWidth: canvas.clientWidth, windowHeight: canvas.clientHeight, screenHeight: canvas.clientHeight, pixelRatio: devicePixelRatio, safeArea: { top: 18, bottom: canvas.clientHeight - 14 } }),
    getMenuButtonBoundingClientRect: () => ({ left: canvas.clientWidth - 18, top: 18, width: 0, height: 30 }),
    getStorageSync: (key) => {
      const text = localStorage.getItem("preview:" + key);
      return text ? JSON.parse(text) : null;
    },
    setStorageSync: (key, value) => localStorage.setItem("preview:" + key, JSON.stringify(value)),
    onTouchStart: (fn) => on("start", fn),
    onTouchEnd: (fn) => on("end", fn),
    onTouchCancel: (fn) => on("cancel", fn),
    onWindowResize: (fn) => on("resize", fn),
    onHide: (fn) => on("hide", fn),
    onShow: (fn) => on("show", fn),
    showShareMenu: () => {
    },
    onShareAppMessage: (fn) => on("share", fn),
    shareAppMessage: () => toast("分享入口已接入。真实分享卡片需要在微信中测试。"),
    onAudioInterruptionBegin: (fn) => audioEvents.begin = fn,
    onAudioInterruptionEnd: (fn) => audioEvents.end = fn,
    createInnerAudioContext: () => {
      const a = new Audio();
      return { set src(v) {
        a.src = "../" + v;
      }, set volume(v) {
        a.volume = v;
      }, set obeyMuteSwitch(v) {
      }, onError(fn) {
        a.addEventListener("error", fn);
      }, stop() {
        a.pause();
        a.currentTime = 0;
      }, play() {
        const task = a.play();
        if (task && task.catch) task.catch(() => {
        });
      } };
    }
  };
  var boot = require_game();
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (events.start) events.start({ touches: [touch(e)] });
  });
  canvas.addEventListener("pointerup", (e) => {
    if (events.end) events.end({ changedTouches: [touch(e)] });
  });
  canvas.addEventListener("pointercancel", () => {
    if (events.cancel) events.cancel({});
  });
  window.addEventListener("resize", () => {
    if (events.resize) events.resize({});
  });
  document.addEventListener("visibilitychange", () => {
    const fn = document.hidden ? events.hide : events.show;
    if (fn) fn({});
  });
  document.addEventListener("keydown", (event) => {
    const action = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left", " ": "wait", z: "undo", r: "reset" }[event.key];
    if (action && !boot.view.modal) {
      event.preventDefault();
      if (!event.repeat) boot.dispatch(action);
    }
  });
})();
