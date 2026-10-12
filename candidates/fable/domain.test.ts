import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPosts, boards, defaultLocation, href, readLocation, selectPosts, clean, authorize, publicPost, removeReply, type Post} from './domain.ts';
test('twelve topic fixtures are explicitly synthetic, with no invented replies',()=>{
 const posts=initialPosts(); assert.equal(posts.length,12);
 assert.deepEqual(new Set(posts.map(p=>p.board)),new Set(Object.keys(boards)));
 assert.ok(posts.every(p=>p.sample && p.replies.length===0));
});
test('all topics round trip through the community path and filter',()=>{
 for(const board of Object.keys(boards)){
  const url=new URL(href({...defaultLocation,board,page:2,q:'질문'}),'https://example.invalid');
  assert.equal(url.pathname,'/site-lab-artifacts/candidates/fable/');const loc=readLocation(url.search);
  assert.equal(loc.board,board);assert.equal(loc.q,'질문');assert.equal(loc.page,2);
  assert.equal(selectPosts(initialPosts(),{...defaultLocation,board},null).total,2);
 }
});
test('public projection removes owner IDs and distinguishes only the current account',()=>{
 const p={...initialPosts()[0],owner:'demo-1',sample:false};
 const own=publicPost(p,'demo-1'),other=publicPost(p,'demo-2');
 assert.ok(own.isMine);assert.equal(other.isMine,false);assert.equal('owner' in own,false);
 assert.throws(()=>authorize('demo-2',p.owner));assert.throws(()=>authorize(null,p.owner));
 assert.doesNotThrow(()=>authorize('demo-1',p.owner));
});
test('parent deletion preserves the other account reply and removes parent identity and content',()=>{
 const p:Post={...initialPosts()[0],replies:[
  {id:'parent',owner:'demo-1',body:'private parent',parent:null,at:'2026-01-01'},
  {id:'child',owner:'demo-2',body:'reply',parent:'parent',at:'2026-01-01'}]};
 assert.throws(()=>removeReply(p,'parent','demo-2'));
 const next=removeReply(p,'parent','demo-1');assert.equal(next.replies.length,2);
 assert.equal(next.replies[0].body,'');assert.equal(next.replies[0].owner,null);assert.ok(next.replies[0].deleted);
 assert.equal(next.replies[1].body,'reply');
 assert.equal(removeReply(next,'child','demo-2').replies.length,0);
});
test('empty results, missing topics and oversized pages are bounded',()=>{
 assert.equal(selectPosts(initialPosts(),{...defaultLocation,q:'존재하지않는검증문구'},null).total,0);
 assert.equal(readLocation('?board=unknown&page=-5').board,'all');
 assert.equal(readLocation('?page=-5').page,1);
 assert.equal(selectPosts(initialPosts(),{...defaultLocation,page:999},null).page,2);
 assert.equal(selectPosts(initialPosts(),{...defaultLocation,page:1},null).posts.length,10);
});
test('blank and oversized input is rejected; special text remains text',()=>{
 for(const [limit,label] of [[100,'제목'],[5000,'내용'],[1000,'댓글']] as const){
  assert.throws(()=>clean('  ',limit,label));assert.throws(()=>clean('a'.repeat(limit+1),limit,label));
  assert.equal(clean('a'.repeat(limit),limit,label).length,limit);
 }
 assert.equal(clean(' <script>"&</script> ',100,'제목'),'<script>"&</script>');
});
