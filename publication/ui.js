(()=>{
'use strict';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],clone=v=>JSON.parse(JSON.stringify(v));
const layouts=[['editorial','A · 에디토리얼','따뜻한 매거진'],['commons','B · 커먼스','선명한 커뮤니티'],['atlas','C · 아틀라스','대담한 디렉터리']];
const key='community-studio-v1',legacy='community-design-v2';
let seed=null;try{seed=JSON.parse($('#studio-seed')?.textContent||'null');}catch{}
const portable=!!seed;let library={draft:null,applied:null,saved:[]},storageOK=true;
if(!portable)try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&typeof v==='object')library={draft:v.draft,applied:v.applied,saved:(Array.isArray(v.saved)?v.saved:[]).slice(0,30).map(normalizeDraft)};}catch{storageOK=false;}
let draft=normalizeDraft(seed?.draft||library.draft||{});
if(!seed&&!library.draft)try{const x=localStorage.getItem(legacy);if(layoutIds.includes(x))draft.design=x;}catch{}
const requested=new URLSearchParams(location.search).get('design');if(!portable&&layoutIds.includes(requested))draft.design=requested;
const previousApplied=normalizeDraft(library.applied||draft);
let applied=portable?{design:draft.design,settings:clone(draft.settings)}:{design:previousApplied.design,settings:clone(previousApplied.settings)},route=portable&&STUDIO_BUNDLE.pages[seed.route]?seed.route:location.pathname;
let patternIndex=-1;
let editingNote='',picking=false,showNotes=true,lastFocus=null,dirty=false;
const uid=()=> 'd-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
function tell(s){$('#studio-status').textContent=s;}
function persist(){if(portable)return;try{localStorage.setItem(key,JSON.stringify({draft,applied,saved:library.saved}));storageOK=true;}catch{storageOK=false;tell('브라우저 임시 보관이 불가능합니다. 입력은 유지됩니다. HTML 또는 JSON 파일로 저장해 주세요.');}}
function changed(){dirty=true;draft.updatedAt=new Date().toISOString();persist();saveState();}
function effective(){const preset=draft.settings.palette==='auto'?{editorial:'paper',commons:'mint',atlas:'night'}[draft.design]:draft.settings.palette;return {...palettes[preset],...draft.settings.colors};}
function renderDesign(){
 const [id,name,desc]=layouts.find(x=>x[0]===draft.design);document.body.dataset.layout=id;
 $('#theme-output').textContent=name;$('#theme-description').textContent=desc;
 for(const b of all('[data-concept]'))b.setAttribute('aria-pressed',String(b.dataset.concept===id));
 if(!portable)try{history.replaceState(null,'',route+'?design='+id+location.hash);}catch{}
 for(const a of all('a[href]')){const raw=a.getAttribute('href');if(raw.startsWith('#'))continue;const u=new URL(raw,location.href);if(STUDIO_BUNDLE.pages[u.pathname])a.setAttribute('href',u.pathname+'?design='+id+u.hash);}
 const s=draft.settings,c=effective();for(const k of ['paper','surface','ink','muted','line','accent','tint','art'])document.body.style.setProperty('--'+k,c[k]);
 document.body.style.setProperty('--studio-width',s.width+'px');document.body.style.setProperty('--space',s.spacing/100);document.body.style.setProperty('--studio-font-scale',s.fontScale/100);
 if(s.customRadius)document.body.style.setProperty('--radius',s.radius+'px');else document.body.style.removeProperty('--radius');
 document.body.dataset.studioFont=s.font;document.body.dataset.cards=s.cards;document.body.dataset.art=String(s.art);document.body.dataset.sidebar=String(s.sidebar);
 for(const k of ['intro','excerpt','surfaceStyle','media','mediaRatio','mediaFit','mediaFocus'])document.body.dataset[k]=s[k];
 document.body.classList.add('studio-styled');renderMedia();renderControls();
}
let mediaObserver=null;
function renderMedia(){
 mediaObserver?.disconnect();
 const s=draft.settings;
 if($('.media-credit'))$('.media-credit').hidden=s.media==='none';
 for(const row of all('[data-resource]')){
  const photo=STUDIO_BUNDLE.images?.[row.dataset.mediaKey];
  let frame=row.querySelector('.media-frame');
  if(!photo||s.media==='none'){frame?.remove();row.classList.remove('has-media');continue;}
  row.classList.add('has-media');
  if(!frame){
   frame=document.createElement('span');frame.className='media-frame';frame.setAttribute('aria-hidden','true');
   row.querySelector('.public-item-content').insertBefore(frame,row.querySelector('.public-item-main'));
   const initialSize=Math.max(1,Math.ceil(frame.getBoundingClientRect().width))+'px';
   const picture=document.createElement('picture'),img=document.createElement('img');img.sizes=initialSize;
   img.alt='';img.width=photo.width;img.height=photo.height;img.decoding='async';
   const onScreen=row.getBoundingClientRect().top<innerHeight&&row.getBoundingClientRect().bottom>0;
   img.loading=onScreen?'eager':'lazy';
   const inline=STUDIO_BUNDLE.mediaInline?.[row.dataset.mediaKey];
   if(portable&&inline){img.src=inline;}
   else if(!portable){
    for(const format of ['avif','webp']){const source=document.createElement('source');source.type='image/'+format;source.sizes=initialSize;source.srcset=photo.renditions.filter(r=>r.format===format).map(r=>STUDIO_BUNDLE.mediaBase+r.file+' '+r.width+'w').join(', ');picture.append(source);}
    img.srcset=photo.renditions.filter(r=>r.format==='jpg').map(r=>STUDIO_BUNDLE.mediaBase+r.file+' '+r.width+'w').join(', ');
    img.src=STUDIO_BUNDLE.mediaBase+photo.renditions.find(r=>r.format==='jpg'&&r.width===320).file;
   }
   img.onerror=()=>{frame.replaceChildren(document.createTextNode('사진을 불러오지 못했습니다'));frame.classList.add('is-error');};
   picture.append(img);frame.append(picture);
  }
  const size=Math.max(1,Math.ceil(frame.getBoundingClientRect().width))+'px';
  for(const el of frame.querySelectorAll('source,img'))el.sizes=size;
 }
 if(!portable&&typeof ResizeObserver!=='undefined'){
  mediaObserver=new ResizeObserver(entries=>{for(const {target,contentRect} of entries){const size=Math.max(1,Math.ceil(contentRect.width))+'px';for(const el of target.querySelectorAll('source,img'))if(el.sizes!==size)el.sizes=size;}});
  for(const frame of all('.media-frame'))mediaObserver.observe(frame);
 }
}
function renderControls(){
 const s=draft.settings,c=effective();for(const k of ['font','fontScale','width','spacing','radius','cards','sidebar','intro','excerpt','surfaceStyle','media','mediaRatio','mediaFit','mediaFocus'])$('#setting-'+k).value=s[k];
 $('#setting-art').checked=s.art;
 const match=compositionPresets.find(p=>Object.entries(p.settings).every(([k,v])=>s[k]===v));
 patternIndex=match?compositionPresets.indexOf(match):-1;
 $('#pattern-output').textContent=match?match.label:'직접 조절 중';
 for(const b of all('[data-pattern]'))b.setAttribute('aria-pressed',String(b.dataset.pattern===match?.id));
 $('#pattern-context').textContent=$('#resources')?'현재 자료 목록에 바로 반영됩니다.':'이 구성은 자료실 목록에 적용됩니다. 상단 둘러보기에서 확인하세요.';
 for(const k of ['fontScale','spacing'])$('#value-'+k).textContent=s[k]+'%';$('#value-width').textContent=s.width+'px';$('#value-radius').textContent=s.customRadius?s.radius+'px':'시안 기본';
 for(const b of all('[data-palette]'))b.setAttribute('aria-pressed',String(s.palette===b.dataset.palette&&!Object.keys(s.colors).length));
 for(const input of all('[data-color]'))input.value=c[input.dataset.color];
 const ratio=contrast(c.ink,c.paper),accent=contrast(c.accent,c.paper);$('#contrast-readout').textContent=`본문/바탕 대비 ${ratio.toFixed(1)}:1 · 강조/바탕 ${accent.toFixed(1)}:1`+(Math.min(ratio,accent)<4.5?' — 작은 글자의 대비가 낮습니다. 색을 더 구분해 주세요.':'');
}
function tab(name){for(const b of all('[data-tab]')){const on=b.dataset.tab===name;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}for(const p of all('#studio [role=tabpanel]'))p.hidden=p.id!=='pane-'+name;}
function openStudio(name='style'){lastFocus=document.activeElement;tab(name);renderControls();renderNotes();renderSaved();$('#draft-name').value=draft.name;saveState();if(!$('#studio').open)$('#studio').showModal();}
function closeStudio(){$('#studio').close();lastFocus?.focus();}
function saveState(){$('#save-state').textContent=(portable?'파일 편집 중 · 변경 후 파일로 다시 저장하세요.':storageOK?'이 브라우저에 작업 임시 보관 중.':'브라우저 보관 실패 · 파일로 저장해 주세요.')+(dirty?' · 저장 후 변경 있음':'');$('#draft-label').textContent=draft.name;}
function preview(id){draft.design=id;renderDesign();changed();$('#theme-status').textContent='시안을 미리보고 있습니다. 설정·메모를 더해 내 시안으로 저장하세요.';}
$('#design-bar').hidden=false;$('#theme-open').hidden=false;
$('#theme-open').onclick=()=>{const p=$('#theme-panel');p.hidden=!p.hidden;$('#theme-open').setAttribute('aria-expanded',String(!p.hidden));};
$('#theme-prev').onclick=()=>preview(layoutIds[(layoutIds.indexOf(draft.design)+2)%3]);$('#theme-next').onclick=()=>preview(layoutIds[(layoutIds.indexOf(draft.design)+1)%3]);
for(const b of all('[data-concept]'))b.onclick=()=>preview(b.dataset.concept);
$('#theme-apply').onclick=()=>{applied={design:draft.design,settings:clone(draft.settings)};try{if(!portable)localStorage.setItem(legacy,draft.design);}catch{}changed();$('#theme-status').textContent='현재 색상·모양을 적용했습니다. 이름을 붙여 저장할 수도 있어요.';};
$('#theme-cancel').onclick=()=>{draft.design=applied.design;draft.settings=clone(applied.settings);renderDesign();changed();$('#theme-status').textContent='적용한 색상·모양으로 돌아왔습니다. 메모는 유지됩니다.';};
$('#studio-open').onclick=()=>openStudio();$('#patterns-open').onclick=()=>openStudio('patterns');$('#notes-open').onclick=()=>openStudio('notes');$('#files-open').onclick=()=>openStudio('files');$('#studio-close').onclick=closeStudio;
for(const b of all('[data-tab]')){b.onclick=()=>tab(b.dataset.tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const ids=['style','patterns','notes','files'];let i=ids.indexOf(b.dataset.tab);i=e.key==='Home'?0:e.key==='End'?ids.length-1:(i+(e.key==='ArrowRight'?1:ids.length-1))%ids.length;tab(ids[i]);$('#tab-'+ids[i]).focus();}};}
function selectPattern(i){patternIndex=(i+compositionPresets.length)%compositionPresets.length;const p=compositionPresets[patternIndex];draft.settings=normalizeSettings({...draft.settings,...p.settings});renderDesign();changed();tell(p.label+' 구성을 미리보고 있습니다. 색상과 메모는 유지됩니다.');}
 for(const [i,b] of all('[data-pattern]').entries())b.onclick=()=>selectPattern(i);
 $('#pattern-prev').onclick=()=>selectPattern(patternIndex<0?compositionPresets.length-1:patternIndex-1);$('#pattern-next').onclick=()=>selectPattern(patternIndex+1);
 const paletteRoot=$('#palette-options');
for(const [id,p] of [['auto',{label:'시안 기본',paper:'#eeeeee',accent:'#777777'}],...Object.entries(palettes)]){const b=document.createElement('button');b.dataset.palette=id;b.type='button';b.textContent=p.label;const sw=document.createElement('span');sw.className='palette-swatch';sw.style.background=`linear-gradient(90deg,${p.paper} 55%,${p.accent} 55%)`;b.prepend(sw);b.onclick=()=>{draft.settings.palette=id;draft.settings.colors={};renderDesign();changed();};paletteRoot.append(b);}
for(const [id,label] of [['paper','페이지 바탕'],['surface','카드 바탕'],['ink','본문 글자'],['accent','강조색'],['muted','보조 글자'],['line','테두리'],['tint','보조 면'],['art','그래픽 바탕']]){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.type='color';i.dataset.color=id;i.setAttribute('aria-label',label);i.oninput=()=>{draft.settings.colors[id]=i.value;renderDesign();changed();};l.append(i);$('#custom-colors').append(l);}
for(const k of ['font','fontScale','width','spacing','radius','cards','art','sidebar','intro','excerpt','surfaceStyle','media','mediaRatio','mediaFit','mediaFocus'])$('#setting-'+k).addEventListener('input',e=>{const x=e.target;draft.settings[k]=x.type==='checkbox'?x.checked:x.type==='range'?Number(x.value):x.value;if(k==='radius')draft.settings.customRadius=true;renderDesign();changed();});
$('#reset-settings').onclick=()=>{draft.settings=normalizeSettings();renderDesign();changed();tell('색상·모양을 기본값으로 돌렸습니다. 메모는 그대로입니다.');};
function bindSearch(){const input=$('#search-input');if(!input)return;$('#local-search').hidden=false;input.oninput=()=>{const q=input.value.normalize('NFKC').trim().toLocaleLowerCase();let count=0;for(const row of all('[data-resource]')){row.hidden=!row.querySelector('a').textContent.normalize('NFKC').toLocaleLowerCase().includes(q);if(!row.hidden)count++;}$('#result-count').textContent=`자료 ${count}개`;$('#no-results').hidden=count>0;};}
function markTargets(){
 const entries=[['.brandbar','header','머리글·메뉴'],['.hero','hero','첫 화면·그래픽'],['#home-title','headline','대표 제목'],['.resources','resources','자료 목록·간격'],['.rail','sidebar','옆 주제 안내'],['.conversation-banner','conversation','하단 이야기 배너'],['.article','article','본문 전체'],['.empty','empty','준비 안내'],['footer','footer','하단 안내']];
 for(const [selector,id,label] of entries){const el=$(selector);if(el){el.dataset.review=id;el.dataset.reviewLabel=label;}}
 for(const el of all('[data-resource]')){const url=new URL(el.querySelector('a').href);el.dataset.review='card-'+url.pathname.split('/').filter(Boolean).at(-1);el.dataset.reviewLabel=el.querySelector('h3').textContent;}
 for(const [i,el] of all('.article>section').entries()){el.dataset.review='article-section-'+i;el.dataset.reviewLabel=el.querySelector('h2')?.textContent||'본문 항목';}
 const select=$('#note-target');select.replaceChildren();const add=(id,label)=>{const o=document.createElement('option');o.value=id;o.textContent=label;select.append(o);};add('page','페이지 전체');for(const el of all('[data-review]'))add(el.dataset.review,el.dataset.reviewLabel);
}
function noteCard(n,index,compact=false){
 const card=document.createElement('article');card.className='sticky-note '+n.color+(n.done?' is-done':'');card.dataset.noteId=n.id;
 const head=document.createElement('div');head.className='sticky-head';const label=document.createElement('strong');label.textContent=`${index+1}. ${n.label}`;head.append(label);card.append(head);
 const text=document.createElement('p');text.textContent=n.text;card.append(text);
 const actions=document.createElement('div');actions.className='sticky-actions';
 const btn=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.type='button';b.onclick=fn;actions.append(b);};
 btn('편집',()=>{editingNote=n.id;openStudio('notes');if(n.route!==route){$('#note-target').value='page';}else $('#note-target').value=n.target;$('#note-text').value=n.text;$('#note-color').value=n.color;$('#save-note').textContent='메모 수정';$('#cancel-note').hidden=false;$('#note-text').focus();});
 btn(n.done?'다시 열기':'반영 완료',()=>{n.done=!n.done;changed();renderNotes();});
 if(!compact)btn('삭제',()=>{draft.notes=draft.notes.filter(x=>x.id!==n.id);changed();renderNotes();tell('메모를 삭제했습니다. 저장한 시안·파일의 이전 메모는 남아 있습니다.');});
 card.append(actions);return card;
}
function renderNotes(){
 for(const el of all('.review-notes'))el.remove();$('#page-notes').replaceChildren();$('#note-list').replaceChildren();
 if(!draft.notes.length){const p=document.createElement('p');p.className='studio-hint';p.textContent='아직 메모가 없습니다. 마음에 걸리는 부분부터 적어보세요.';$('#note-list').append(p);}
 draft.notes.forEach((n,i)=>{const entry=noteCard(n,i);if(n.route!==route){const p=document.createElement('p');p.className='note-route';p.textContent='다른 페이지: '+n.route;entry.prepend(p);}$('#note-list').append(entry);
 if(n.route!==route||!showNotes)return;const target=all('[data-review]').find(el=>el.dataset.review===n.target);const host=(target?.tagName==='H1'?target.parentElement:target)||$('#page-notes');let wrap=target?[...host.children].find(x=>x.classList.contains('review-notes')):host;if(!wrap){wrap=document.createElement('div');wrap.className='review-notes';host.append(wrap);}wrap.append(noteCard(n,i,true));});
 $('#notes-open').textContent='메모 '+draft.notes.length;$('#show-notes').checked=showNotes;
}
function resetNote(){editingNote='';$('#note-text').value='';$('#save-note').textContent='메모 붙이기';$('#cancel-note').hidden=true;}
$('#cancel-note').onclick=resetNote;
$('#save-note').onclick=()=>{const text=$('#note-text').value.trim();if(!text){tell('메모 내용을 적어주세요.');$('#note-text').focus();return;}if(!editingNote&&draft.notes.length>=100){tell('한 시안에는 메모를 100개까지 저장할 수 있습니다.');return;}const target=$('#note-target').value,label=$('#note-target').selectedOptions[0]?.textContent||'페이지 전체';const old=draft.notes.find(x=>x.id===editingNote);if(old){old.text=text;old.color=$('#note-color').value;if(old.route===route){old.target=target;old.label=label;}}else draft.notes.push({id:uid(),route,target,label,text,color:$('#note-color').value,done:false});resetNote();changed();renderNotes();tell('메모를 시안에 붙였습니다.');};
$('#show-notes').onchange=e=>{showNotes=e.target.checked;renderNotes();};
function stopPick(){picking=false;document.body.classList.remove('picking');$('#pick-message').hidden=true;}
$('#pick-area').onclick=()=>{resetNote();closeStudio();picking=true;document.body.classList.add('picking');$('#pick-message').hidden=false;$('#pick-cancel').focus();};$('#pick-cancel').onclick=stopPick;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&picking){stopPick();openStudio('notes');}});
document.addEventListener('click',e=>{if(!picking)return;const el=e.target.closest('[data-review]');if(!el||e.target.closest('.sticky-note'))return;e.preventDefault();e.stopImmediatePropagation();stopPick();openStudio('notes');$('#note-target').value=el.dataset.review;$('#note-text').focus();},true);
function renderSaved(){const select=$('#saved-drafts');select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent=library.saved.length?'시안 선택':'아직 저장한 시안이 없습니다';select.append(blank);for(const d of library.saved){const o=document.createElement('option');o.value=d.id;o.textContent=d.name;select.append(o);}if(library.saved.some(d=>d.id===draft.id))select.value=draft.id;}
function save(copy){let name=$('#draft-name').value.trim();if(!name){tell('저장할 시안 이름을 적어주세요.');$('#draft-name').focus();return;}if(copy||!draft.id){if(library.saved.length>=30){tell('브라우저에는 30개까지 보관합니다. 파일로 내보내 보관하세요.');return;}if(library.saved.some(d=>d.name===name)){let n=2;while(library.saved.some(d=>d.name===name+' ('+n+')'))n++;name+=' ('+n+')';}draft.id=uid();}draft.name=name;draft.updatedAt=new Date().toISOString();const snapshot=normalizeDraft(draft),i=library.saved.findIndex(d=>d.id===draft.id);if(i>=0)library.saved[i]=snapshot;else library.saved.push(snapshot);applied={design:draft.design,settings:clone(draft.settings)};dirty=false;persist();$('#draft-name').value=name;renderSaved();saveState();tell(portable?'이 파일을 열어둔 동안 시안을 보관했습니다. HTML/JSON으로 내려받아 영구 저장하세요.':storageOK?'“'+name+'”을 이 브라우저에 저장했습니다. 파일로도 보관할 수 있어요.':'브라우저 저장이 실패했습니다. 이름과 변경은 유지됩니다. 파일로 저장하세요.');}
$('#save-draft').onclick=()=>save(false);$('#save-as').onclick=()=>save(true);
$('#draft-name').oninput=e=>{draft.name=e.target.value;changed();};
$('#load-draft').onclick=()=>{const saved=library.saved.find(d=>d.id===$('#saved-drafts').value);if(!saved){tell('열 시안을 선택해 주세요.');return;}draft=clone(saved);applied={design:draft.design,settings:clone(draft.settings)};dirty=false;resetNote();persist();renderDesign();renderNotes();$('#draft-name').value=draft.name;saveState();tell('저장한 시안을 열었습니다.');};
function filename(extension){return (draft.name||'커뮤니티-시안').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').slice(0,70)+'.'+extension;}
function download(text,type,extension){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename(extension);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);tell('파일 다운로드를 시작했습니다. 다운로드한 파일을 에이전트에게 첨부해 주세요.');}
$('#export-json').onclick=()=>download(JSON.stringify(reviewPackage(draft,route),null,2),'application/json;charset=utf-8','json');
$('#export-md').onclick=()=>download(brief(draft),'text/markdown;charset=utf-8','md');
let mediaReady=null;
function exportMedia(){
 if(STUDIO_BUNDLE.mediaInline)return Promise.resolve(STUDIO_BUNDLE.mediaInline);
 if(!mediaReady)mediaReady=new Promise((ok,fail)=>{const script=document.createElement('script');script.src=STUDIO_BUNDLE.portableMediaURL;script.onload=()=>{script.remove();const data=globalThis.COMMUNITY_PORTABLE_MEDIA;if(data)ok(data);else{mediaReady=null;fail(Error('사진 묶음을 읽지 못했습니다.'));}};script.onerror=()=>{script.remove();mediaReady=null;fail(Error('사진 파일을 불러오지 못했습니다. 연결을 확인하고 다시 저장해 주세요.'));};document.head.append(script);});
 return mediaReady;
}
$('#export-html').onclick=async()=>{
 const button=$('#export-html');button.disabled=true;
 try{
 const mediaInline=await exportMedia();
 const portableBundle={...STUDIO_BUNDLE,mediaInline};
 const page=STUDIO_BUNDLE.pages[route]||Object.values(STUDIO_BUNDLE.pages)[0];
 const doc=new DOMParser().parseFromString(page,'text/html');for(const el of doc.querySelectorAll('script,link[rel=stylesheet],link[rel=canonical],meta[property]'))el.remove();
 const policy=doc.createElement('meta');policy.httpEquiv='Content-Security-Policy';policy.content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";doc.head.prepend(policy);
 const style=doc.createElement('style');style.textContent=STUDIO_BUNDLE.css;doc.head.append(style);doc.title=draft.name+' · 편집 가능한 시안';
 const notice=doc.createElement('details');notice.id='export-notices';const heading=doc.createElement('summary');heading.textContent='코드·사진 이용 조건';const pre=doc.createElement('pre');pre.textContent=STUDIO_BUNDLE.notices;notice.append(heading,pre);doc.querySelector('footer').append(notice);
 const state=doc.createElement('script');state.id='studio-seed';state.type='application/json';state.textContent=safeJSON(reviewPackage(draft,route));doc.body.append(state);
 const script=doc.createElement('script');script.textContent='const STUDIO_BUNDLE='+safeJSON(portableBundle)+';\n'+STUDIO_BUNDLE.runtime;doc.body.append(script);
 download('<!doctype html>\n'+doc.documentElement.outerHTML,'text/html;charset=utf-8','html');
 }catch(error){tell('HTML 저장 실패: '+error.message);}finally{button.disabled=false;}
};
$('#import-review').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('파일은 1MB 이하이어야 합니다.');const incoming=parseReview(await file.text());incoming.id='';draft=incoming;dirty=true;applied={design:draft.design,settings:clone(draft.settings)};resetNote();persist();renderDesign();renderNotes();$('#draft-name').value=draft.name;renderSaved();saveState();tell('파일을 불러왔습니다. 기존 저장 시안은 덮어쓰지 않았습니다.');}catch(error){tell('불러오기 실패: '+error.message);}e.target.value='';};
if(portable){document.body.classList.add('portable');$('.preview .container').textContent='저장한 시안 · 설정과 메모를 편집한 뒤 HTML/JSON으로 다시 저장하세요.';document.addEventListener('click',e=>{if(picking)return;const a=e.target.closest('a[href]');if(!a||a.getAttribute('href').startsWith('#')||a.protocol==='blob:')return;const u=new URL(a.href);const html=STUDIO_BUNDLE.pages[u.pathname];if(html){e.preventDefault();const doc=new DOMParser().parseFromString(html,'text/html');$('#main').innerHTML=doc.querySelector('#main').innerHTML;route=u.pathname;document.title=doc.title+' · 저장한 시안';resetNote();markTargets();bindSearch();renderDesign();renderNotes();window.scrollTo(0,0);}else if(u.pathname.endsWith('/THIRD_PARTY_NOTICES.txt')){e.preventDefault();const n=$('#export-notices');n.open=true;n.scrollIntoView();}else if(u.pathname.startsWith(Object.keys(STUDIO_BUNDLE.pages)[0])){e.preventDefault();tell('이 파일에는 자료 페이지와 메모가 포함되어 있습니다. 고지·RSS는 원래 사이트에서 확인하세요.');openStudio('files');}});}
markTargets();bindSearch();renderDesign();renderNotes();renderSaved();saveState();
})();
