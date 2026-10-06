import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {normalizeDraft,reviewPackage,parseReview,brief} from './publication/studio-model.mjs';
import vm from 'node:vm';
const data=JSON.parse(await readFile(new URL('./docs-site/artifacts.json',import.meta.url)));
test('unknown direct-link sort and filter parameters default to a usable catalog',async()=>{
 const script=await readFile('docs-site/catalog.js','utf8');
 for(const search of ['?sort=unknown','?sort=__proto__&type=wrong&author=wrong&status=wrong']){
  const fields={};for(const [id,values] of Object.entries({sort:['recent','title','type','author'],type:['','ページ'],author:['','Codex'],status:['','比較']}))fields[id]={tagName:'SELECT',value:values[0],options:values.map(value=>({value}))};
  fields.query={tagName:'INPUT',value:''};fields.count={};fields.empty={};fields.zoom={addEventListener(){}};
  const cards=data.artifacts.map(a=>({dataset:{...a,updated:a.updated},textContent:a.title}));
  const works={children:cards,append(){}};let href='';
  const context={URLSearchParams,location:{search,pathname:'/site-lab-artifacts/',hash:''},history:{replaceState(a,b,url){href=url}},document:{getElementById:id=>fields[id],querySelector:()=>({addEventListener(){}})},setTimeout};
  context.document.getElementById=id=>id==='works'?works:fields[id];vm.runInNewContext(script,context);
  assert.equal(fields.sort.value,'recent');assert.equal(fields.count.textContent,'17개 / 전체 17개');assert.equal(href,'/site-lab-artifacts/');
 }
});
test('nested GitHub Pages memos survive normalization, JSON and Markdown exports',()=>{
 for(const route of ['/site-lab-artifacts/preview/','/site-lab-artifacts/preview/guides/education/','/site-lab-artifacts/preview/privacy/','/public-preview/guides/life/']){
  const draft={notes:[{id:'note-1',route,target:'page',text:'간격 넓게'}]};
  assert.equal(normalizeDraft(draft).notes[0].route,route);
  assert.equal(parseReview(JSON.stringify(reviewPackage(draft,route))).notes[0].route,route);
  assert.ok(brief(draft).includes(route));
 }
 for(const route of ['https://bad.test/','/site-lab-artifacts/preview/../../secret/','/site-lab-artifacts/preview/unknown/'])assert.equal(normalizeDraft({notes:[{route,text:'test'}]}).notes[0].route,'/public-preview/');
});
test('catalog connects every unique artifact to an existing screen and source',async()=>{
 assert.equal(data.artifacts.length,17);assert.equal(new Set(data.artifacts.map(a=>a.id)).size,17);
 for(const a of data.artifacts){assert.ok(a.description&&a.author&&a.status);assert.ok(a.sourceURL.startsWith(data.repository+'/blob/main/'));await stat(a.sourcePath);const path=a.relativeURL.split('?')[0];await stat(join('docs-site',path.endsWith('/')?path+'index.html':path));}
});
test('all generated preview paths stay in the GitHub project and retain demo status',async()=>{
 const html=await readFile('docs-site/preview/index.html','utf8');
 assert.ok(html.includes('/site-lab-artifacts/preview/assets/ui.js'));assert.ok(html.includes('디자인 미리보기'));assert.ok(!html.includes('chatgpt.site'));
 const notices=await readFile('docs-site/preview/THIRD_PARTY_NOTICES.txt','utf8');assert.ok(notices.includes('MIT License'));assert.ok(notices.includes('CC0'));
});
test('public allowlist has no local paths, session identifiers or token patterns',async()=>{
 async function walk(dir){let files=[];for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='.git')continue;const path=join(dir,entry.name);files.push(...(entry.isDirectory()?await walk(path):[path]));}return files;}
 for(const file of await walk('.')){if(file.endsWith('catalog.test.mjs'))continue;if(!/\.(html|js|mjs|json|md|txt|yml|css)$/.test(file))continue;const text=await readFile(file,'utf8');assert.ok(!/\/Users\/|session_reference|sk-proj-[A-Za-z0-9]|gh[pousr]_[A-Za-z0-9]{20}|Bearer\s+[A-Za-z0-9]/.test(text),file);}
});
test('index and static agent catalogs offer every artifact without fetching an API',async()=>{
 const html=await readFile('docs-site/index.html','utf8'),md=await readFile('ARTIFACTS.md','utf8'),js=await readFile('docs-site/catalog.js','utf8');
 for(const a of data.artifacts){assert.ok(html.includes('data-id="'+a.id+'"'));assert.ok(md.includes(a.url));}
 assert.ok(html.includes('id="sort"'));assert.ok(html.includes('id="author"'));assert.ok(!js.includes('fetch('));
});
