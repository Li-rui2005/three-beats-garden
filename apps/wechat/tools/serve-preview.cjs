'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const port=Number(process.argv[2]||4176);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid preview port');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}if(name==='/')name='/dev/index.html';const target=path.resolve(root,'.'+name);if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);});});
server.listen(port,'127.0.0.1',()=>console.log('Browser adaptation preview (not WeChat): http://127.0.0.1:'+port));
