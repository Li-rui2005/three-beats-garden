'use strict';
const fs=require('node:fs'),path=require('node:path');
const appid=(process.argv[2]||'').trim();
if(!/^wx[0-9a-f]{16}$/i.test(appid)){console.error('用法：node tools/set-appid.cjs wx开头的真实AppID\n请使用小游戏账号后台的 AppID。');process.exit(1);}
const target=path.resolve(__dirname,'../project.config.json');
const config=JSON.parse(fs.readFileSync(target,'utf8'));config.appid=appid;
fs.writeFileSync(target,JSON.stringify(config,null,2)+'\n','utf8');
console.log('已设置小游戏 AppID。请在微信开发者工具中重新导入或检查项目详情；如果存在 project.private.config.json，也需确认其同名配置没有覆盖。');
