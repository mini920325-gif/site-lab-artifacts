import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./docs-site/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.webp':'image/webp','.avif':'image/avif','.jpg':'image/jpeg'};
createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const base='/site-lab-artifacts/';
 if(path==='/site-lab-artifacts'){res.writeHead(308,{'Location':base});return res.end();}
 if(!path.startsWith(base)||/[\\\0]/.test(path)||path.split('/').some(x=>x==='..'||x==='.'||x.startsWith('.'))){res.writeHead(404);return res.end();}
 let name=path.slice(base.length);if(!name||name.endsWith('/'))name+='index.html';
 const file=resolve(root,name);if(!file.startsWith(root)||name.endsWith('_headers')){res.writeHead(404);return res.end();}
 try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end('Not found');}
}).listen(8794,'127.0.0.1',()=>console.log('http://127.0.0.1:8794/site-lab-artifacts/'));
