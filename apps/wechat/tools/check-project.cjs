'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const config=JSON.parse(read('project.config.json')),game=JSON.parse(read('game.json'));
assert.equal(config.compileType,'minigame');assert.equal(game.deviceOrientation,'portrait');
assert.equal(typeof game.showStatusBar,'boolean');
['game.js','js/engine.js','js/controller.js','js/renderer.js','js/platform.js','assets/icon.png','assets/share.png','assets/audio/move.wav','assets/audio/wait.wav','assets/audio/blocked.wav','assets/audio/win.wav'].forEach(file=>assert.ok(fs.existsSync(path.join(root,file)),file+' missing'));
const runtime=['game.js','js/engine.js','js/controller.js','js/renderer.js','js/platform.js'];
for(const file of runtime){const code=read(file);assert.ok(!/\b(?:document|localStorage|XMLHttpRequest|fetch)\b/.test(code),'Unexpected browser API in '+file);for(const match of code.matchAll(/require\(['"]([^'"]+)['"]\)/g)){assert.ok(match[1].startsWith('.'),'Unexpected external module');assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),match[1]+'.js')),'Missing local module '+match[1]);}}
const png=fs.readFileSync(path.join(root,'assets/share.png'));assert.equal(png.readUInt32BE(16),500);assert.equal(png.readUInt32BE(20),400);
assert.ok(config.appid===''||/^wx[0-9a-f]{16}$/i.test(config.appid),'Invalid AppID');
console.log('Project files, native wx runtime, CommonJS imports, portrait configuration, local audio, and share image: OK.');
console.log(config.appid?'AppID configured.':'AppID is intentionally empty. Fill your real Mini Game AppID before importing for account-bound preview/upload.');
