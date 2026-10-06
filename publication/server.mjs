// Local verification only. Production hosting must independently enforce these
// headers/status codes before release; writing a _headers file is not proof.
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFiles } from './build.mjs';

export async function startPreview({ port = 5174, host = '127.0.0.1' } = {}) {
  const { files, headers } = await createFiles();
  const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', xml: 'application/xml; charset=utf-8', txt: 'text/plain; charset=utf-8', avif:'image/avif',webp:'image/webp',jpg:'image/jpeg' };
  const server = createServer((req, res) => {
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const finish = (status, body) => { res.statusCode = status; res.end(req.method === 'HEAD' ? undefined : body); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return finish(405, 'Method not allowed'); }
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return finish(400, 'Bad request'); }
    if (path === '/public-preview') { res.setHeader('Location', '/public-preview/'); return finish(308, ''); }
    if (!path.startsWith('/public-preview/') || /[\\\x00]/.test(path) || path.split('/').some(x => x === '.' || x === '..')) return finish(404, 'Not found');
    let name = path.slice('/public-preview/'.length);
    if (!name || name.endsWith('/')) name += 'index.html';
    if (!files.has(name) || name === '_headers') return finish(404, 'Not found');
    res.setHeader('Content-Type', types[name.split('.').at(-1)] || 'application/octet-stream');
    if(name.startsWith('assets/media/'))res.setHeader('Cache-Control','private, max-age=31536000, immutable');
    finish(200, files.get(name));
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(port, host, ok); });
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startPreview();
  console.log(`Private preview verification: http://127.0.0.1:${server.address().port}/public-preview/`);
}
