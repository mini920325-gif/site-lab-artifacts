import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { publicDiscussion, releaseBlockers, requiredDecisions, privacyHints } from './privacy.mjs';
import { build, createFiles, safeURL, escapeHTML } from './build.mjs';
import { startPreview } from './server.mjs';

test('public projection excludes identity and unpublished descendants, retains replies of deleted parents', () => {
  const comment = { publicId:'c-1', visibility:'public', status:'approved', text:'reply', providerId:'secret', ownerId:'secret', datePublished:'2026-10-05' };
  const record = { ...comment, publicId:'p-1', title:'title', text:'body', topic:'life', reports:['private'], ip:'private', comments:[{...comment, deletedAt:'now', replies:[{...comment, publicId:'c-2'}, {...comment, status:'pending'}]}] };
  const output = publicDiscussion(record);
  assert.deepEqual(Object.keys(output).sort(), ['id','title','text','topic','datePublished','dateModified','author','comments'].sort());
  assert.equal(output.comments[0].text, '');
  assert.equal(output.comments[0].replies.length, 1);
  assert.doesNotMatch(JSON.stringify(output), /secret|private|providerId|ownerId|reports|deletedAt/);
  for (const override of [{visibility:'private'},{status:'pending'},{sample:true},{deletedAt:'now'},{publicId:null}]) assert.equal(publicDiscussion({...record,...override}), null);
  for (const override of [{title:{email:'secret'}},{text:['secret']},{publicId:{secret:1}},{publicId:'bad id'},{comments:{}},{datePublished:'invalid'},{datePublished:'2026-02-30'},{topic:{owner:'secret'}}]) assert.equal(publicDiscussion({...record,...override}),null);
  assert.equal(publicDiscussion({...record,comments:[{...comment,text:{email:'secret'}},{...comment,replies:{}}]}).comments.length,0);
});
test('release fails closed when any required decision is absent; local check is not permission', () => {
  const complete={operator:{displayName:'Test operator',privacyEmail:'privacy@example.com'},publicOrigin:'https://example.com',decisions:Object.fromEntries(requiredDecisions.map(x=>[x,true]))};
  assert.deepEqual(releaseBlockers(complete), []);
  for(const key of requiredDecisions) { const p=structuredClone(complete); delete p.decisions[key]; assert.ok(releaseBlockers(p).includes(key)); }
  for(const value of [false,'true',null,1]) assert.ok(releaseBlockers({...complete,decisions:{...complete.decisions,contentAndPublicationApproved:value}}).includes('contentAndPublicationApproved'));
  assert.equal(releaseBlockers({}).length, requiredDecisions.length+2);
  for(const publicOrigin of ['http://example.com','https://example.com/path','https://user:pass@example.com','https://example.com?secret=1']) assert.ok(releaseBlockers({...complete,publicOrigin}).length);
});
test('unsafe links and HTML are escaped', () => {
  for(const value of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com']) assert.equal(safeURL(value), null);
  assert.equal(safeURL('https://example.com'), 'https://example.com/');
  assert.equal(escapeHTML('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
  assert.ok(privacyHints('연락 010-1234-5678').includes('phone'));
  assert.ok(privacyHints('me@example.com').includes('email'));
});
test('preview artifact is readable without JS, isolated and excluded from indexing', async () => {
  const {files,headers}=await createFiles();
  assert.deepEqual([...files.keys()].filter(x=>!x.startsWith('assets/media/')).sort(), ['index.html','community/index.html','about/index.html','privacy/index.html',...['transition','employment','startup','education','life','benefits'].map(x=>`guides/${x}/index.html`),'sitemap.xml','feed.xml','robots.txt','assets/style.css','assets/ui.js','THIRD_PARTY_NOTICES.txt','_headers'].sort());
  assert.ok(files.has('guides/transition/index.html'));
  const mediaFiles=[...files.keys()].filter(x=>x.startsWith('assets/media/'));assert.equal(mediaFiles.length,25);for(const name of mediaFiles)assert.match(name,/^assets\/media\/(?:(?:books|park)-(?:160|320|640|1200)-[a-f0-9]{12}\.(?:avif|webp|jpg)|portable-[a-f0-9]{12}\.js)$/);
  assert.match(files.get('index.html'), /<h1 id="home-title">각자의 다음을,/);
  assert.match(files.get('guides/transition/index.html'), /<article/);
  for(const [name,content] of files) {
    assert.doesNotMatch(name, /agent-board|governance|evidence|\.map$|\.json$|node_modules/);
    if(name.endsWith('.html')) { assert.match(content,/noindex, nofollow/); assert.doesNotMatch(content,/DiscussionForumPosting|ownerId|providerId|agent-board/); }
  }
  assert.doesNotMatch(files.get('sitemap.xml'), /<url>/);
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(headers['Referrer-Policy'],'no-referrer');
  assert.match(files.get('THIRD_PARTY_NOTICES.txt'), /Permission is hereby granted/);
});
test('public generation has stable page URLs, public-only sitemap and independent crawler policies', async () => {
  const {files}=await createFiles({preview:false,base:'',origin:'https://example.com'});
  assert.equal((files.get('sitemap.xml').match(/<url>/g)||[]).length,7);
  assert.doesNotMatch(files.get('sitemap.xml'), /\/community|\/privacy|\/about|<loc>[^<]*\?/);
  assert.match(files.get('index.html'), /href="https:\/\/example.com\/"/);
  assert.match(files.get('robots.txt'), /GPTBot\nDisallow: \/\n/);
  assert.match(files.get('robots.txt'), /OAI-SearchBot\nAllow: \/\n/);
  assert.match(files.get('community/index.html'), /noindex, nofollow/);
});
test('real public build is blocked by unverified policy and cannot silently publish', async () => {
  await assert.rejects(build({preview:false}), /Public release blocked/);
  const output=await mkdtemp(join(tmpdir(),'community-publication-'));
  try { await writeFile(join(output,'sentinel'),'existing output'); await assert.rejects(build({preview:false,output}),/Public release blocked/); assert.equal(await readFile(join(output,'sentinel'),'utf8'),'existing output'); const result=await build({output}); assert.equal(result.preview,true); assert.ok((await readdir(output)).includes('index.html')); } finally { await rm(output,{recursive:true,force:true}); }
});
test('upstream source provenance matches vendored MIT originals', async () => {
  const expected={'LICENSE.md':'5945082b340fbdc4c507e87bc05c5a064ae22d0679759c738b5a2540fe4cc351','DiscussionList.less':'5a2a46cc40739a18839b855227339906edbb471d7c697f856d9363a940d1cbab','DiscussionListItem.less':'3fcb8bfa9d1e8f6068cfc4ef228ef8e16abb4431bb7d06ba91ed62bb5e9cc4d5'};
  for(const [file,hash] of Object.entries(expected)) assert.equal(createHash('sha256').update(await readFile(new URL('./vendor/flarum/'+file,import.meta.url))).digest('hex'),hash);
});
test('HTTP enforces genuine 404/405, no traversal and security headers', async () => {
  const server=await startPreview({port:0}); const origin=`http://127.0.0.1:${server.address().port}`;
  try {
    const home=await fetch(origin+'/public-preview/'); assert.equal(home.status,200); assert.match(await home.text(),/<h1 id="home-title">각자의 다음을,/); assert.equal(home.headers.get('x-robots-tag'),'noindex, nofollow');
    for(const path of ['/public-preview/missing/','/agent-board/','/public-preview/_headers','/public-preview/%2e%2e%2fAGENTS.md','/public-preview/%5cAGENTS.md']) assert.equal((await fetch(origin+path)).status,404);
    assert.equal((await fetch(origin+'/public-preview/',{method:'POST',body:'private input'})).status,405);
    assert.equal((await fetch(origin+'/public-preview/',{method:'HEAD'})).status,200);
  } finally { await new Promise(ok=>server.close(ok)); }
});
