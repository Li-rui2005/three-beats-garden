'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const scripts=['apps/web/test-engine.js','apps/wechat/tools/check-project.cjs','apps/wechat/tests/logic.test.js','apps/wechat/tests/runtime.test.js'];
for(const script of scripts){const result=spawnSync(process.execPath,[path.join(root,script)],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log('All 41 gameplay/logic checks and WeChat project checks passed. No device/account tests were run.');
