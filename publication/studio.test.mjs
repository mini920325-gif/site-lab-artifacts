import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {normalizeDraft,normalizeSettings,parseReview,reviewPackage,safeJSON,brief,contrast,compositionPresets} from './studio-model.mjs';
import {createFiles} from './build.mjs';
test('import validates schema, limits size and rejects arrays',()=>{
 for(const v of ['null','{}','[]',JSON.stringify({format:'community-design-review',version:2,draft:{}}),JSON.stringify({format:'community-design-review',version:1,draft:[]})])assert.throws(()=>parseReview(v));
 assert.throws(()=>parseReview(' '.repeat(1000001)));
 assert.deepEqual(parseReview(JSON.stringify(reviewPackage({name:'검토',design:'atlas',notes:[{id:'a',route:'/public-preview/',target:'hero',label:'첫 화면',text:'여백을 넓게'}]},'/public-preview/'))).notes[0].text,'여백을 넓게');
});
test('untrusted values cannot become CSS, selectors or duplicate note identities',()=>{
 const d=normalizeDraft({id:undefined,settings:{palette:['paper'],colors:{paper:'url(https://evil.test)',ink:'#ABCDEF'},width:99999,fontScale:NaN,font:'evil'},notes:[{id:42,target:123,text:'a'},{id:'same',text:'b'},{id:'same',text:'c'},{id:'imported-2',text:'d'},[]]});
 assert.equal(d.id,'');assert.equal(d.settings.palette,'auto');assert.deepEqual(d.settings.colors,{ink:'#abcdef'});assert.equal(d.settings.width,1440);assert.equal(d.settings.fontScale,100);assert.equal(d.notes[0].target,'page');assert.equal(new Set(d.notes.map(n=>n.id)).size,4);assert.equal(normalizeDraft({notes:Array(200).fill({text:'x'.repeat(3000)})}).notes.length,100);assert.equal(d.notes.every(n=>typeof n.id==='string'),true);
});
test('hostile note text round-trips as data, safe to embed in script and handoff',()=>{
 const n='</script><img src=x onerror=alert(1)> & \u2028';const d=normalizeDraft({name:n,notes:[{text:n}]});const encoded=safeJSON(reviewPackage(d,'/public-preview/'));assert.doesNotMatch(encoded,/<|>|&|\u2028/);assert.equal(JSON.parse(encoded).draft.notes[0].text,n);assert.ok(brief(d).includes(n));assert.equal(contrast('#000000','#ffffff'),21);
});
test('portable bundle contains only public page templates, self-contained runtime and notices retained',async()=>{
 const {files}=await createFiles();const source=files.get('assets/ui.js');new vm.Script(source);const prefix=source.slice('const STUDIO_BUNDLE='.length,source.indexOf(';\n'));const bundle=JSON.parse(prefix);assert.equal(Object.keys(bundle.pages).length,10);assert.ok(bundle.css.includes('.sticky-note'));assert.ok(bundle.runtime.includes('parseReview'));assert.doesNotMatch(bundle.runtime,/eval\(|new Function|fetch\(/);for(const html of Object.values(bundle.pages))assert.doesNotMatch(html,/✳|agent-board|governance/);assert.match(files.get('THIRD_PARTY_NOTICES.txt'),/Permission is hereby granted/);
 const release=await createFiles({preview:false,base:'',origin:'https://example.com'});assert.doesNotMatch(release.files.get('index.html'),/id="studio"|id="design-bar"/);assert.equal(release.files.get('assets/ui.js'),'');
});

test('composition changes preserve color and notes while old files receive safe defaults',()=>{
 const old=parseReview(JSON.stringify({format:'community-design-review',version:1,draft:{settings:{palette:'plum'},notes:[{id:'note',text:'keep'}]}}));
 assert.equal(old.settings.media,'none');assert.equal(old.settings.intro,'auto');
 for(const p of compositionPresets){const next=normalizeDraft({...old,settings:{...old.settings,...p.settings}});assert.equal(next.settings.palette,'plum');assert.deepEqual(next.notes,old.notes);assert.equal(next.settings.media,p.settings.media);}
 const bad=normalizeSettings({media:'url(https://evil)',mediaFit:'javascript:',mediaRatio:'900000',intro:['title']});assert.equal(bad.media,'none');assert.equal(bad.mediaFit,'cover');assert.equal(bad.intro,'auto');
});
test('media has explicit safe hashes, small renditions and lazy portable payload',async()=>{
 const {files}=await createFiles();const source=files.get('assets/ui.js');const bundle=JSON.parse(source.slice('const STUDIO_BUNDLE='.length,source.indexOf(';\n')));
 assert.equal(Object.keys(bundle.images).length,2);assert.equal(bundle.mediaInline,undefined);assert.doesNotMatch(source,/data:image/);assert.equal(Object.keys(bundle.pages).length,10);
 for(const p of Object.values(bundle.images)){assert.equal(p.renditions.length,12);for(const r of p.renditions){assert.ok(files.has('assets/media/'+r.file));if(r.width===160)assert.ok(r.bytes<10000);}}
 const portable=files.get(bundle.portableMediaURL.replace('/public-preview/',''));const context={};vm.runInNewContext(portable,context);assert.equal(Object.keys(context.COMMUNITY_PORTABLE_MEDIA).length,2);for(const data of Object.values(context.COMMUNITY_PORTABLE_MEDIA))assert.match(data,/^data:image\/jpeg;base64,/);
 assert.match(files.get('THIRD_PARTY_NOTICES.txt'),/CC0 1.0/);
 const release=await createFiles({preview:false,base:'',origin:'https://example.com'});assert.equal([...release.files.keys()].some(k=>k.startsWith('assets/media/')),false);
});
