import type { MouseEvent } from 'react';
import { boards, href, selectPosts, type LocationState, type Post, type Situation } from './domain';
import { sourceLinks } from './journey-content';
import { ipFeatures } from './ip-content';
import './ip-archive.css';

type ArchiveHomeProps = {
  loc: LocationState;
  posts: Post[];
  go: (patch: Partial<LocationState>) => void;
  compose: (situation?: Situation, title?: string) => void;
};

export function IPArchiveHome({ loc, posts, go, compose }: ArchiveHomeProps) {
  const board = Object.hasOwn(boards, loc.board) ? loc.board : 'all';
  const listing = selectPosts(posts.filter(post => !ipFeatures.some(item => item.id === post.id)), {
    ...loc, board, situation: 'all', mine: false, q: '', feed: 'all', page: 1, sort: 'latest',
  }, null);
  const realPosts = listing.posts.filter(post => !post.sample);
  const rows = realPosts.length ? realPosts : listing.posts;
  const samplesOnly = rows.length > 0 && rows.every(post => post.sample);
  const selectBoard = (value: string) => go({ view: 'home', board: value, page: 1, q: '', post: '', situation: 'all', feed: 'all', mine: false });
  const openList = () => go({ view: 'list', post: '', board, page: 1, q: '', situation: 'all', feed: 'all', mine: false, sort: 'latest' });
  const openPost = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); go({ view: 'detail', post: id, from: 'home' });
  };

  return <div className="ip2-home">
    <header className="ip2-opening" data-review-target="home-intro" data-review-label="게시판 제목" aria-labelledby="ip2-title">
      <div><h1 id="ip2-title" data-role="page-title">보훈·군경 전직</h1><p>군 전역 · 경찰 퇴직 · 다음 진로</p></div>
      <button className="ip2-compose" onClick={() => compose()}>글쓰기</button>
    </header>
    <div className="ip2-workspace">
      <nav className="ip2-index" aria-label="주제별 이야기">
        <h2>게시판</h2>
        <div className="ip2-board-links">{Object.entries({ all: '전체 글', ...boards }).map(([id, label]) => <button key={id} aria-pressed={board === id} onClick={() => selectBoard(id)}>{label}</button>)}</div>
        <div className="ip2-nav-secondary"><button onClick={() => go({ view: 'guides', post: '' })}>자료실</button><button onClick={() => go({ view: 'help', post: '' })}>이용 안내</button></div>
      </nav>
      <section className="ip2-feed" data-review-target="home-feed" data-review-label="게시글 목록" aria-labelledby="ip2-feed-title">
        <div className="ip2-list-heading"><h2 id="ip2-feed-title">{board === 'all' ? '전체 글' : boards[board as keyof typeof boards]}</h2><span>최근 작성 순</span></div>
        {samplesOnly && <p className="ip2-sample-notice">화면 확인용 예시 글입니다.</p>}
        <div className="ip2-column-labels" aria-hidden="true"><span>분야</span><span>제목</span></div>
        <div className="ip2-posts">
          {rows.length ? rows.map(post => <article className="ip2-post" key={post.id}>
            <span className="ip2-post-topic">{boards[post.board]}</span>
            <div className="ip2-post-body"><a href={href({ ...loc, view: 'detail', post: post.id, from: 'home' })} onClick={event => openPost(event, post.id)}>{post.title}</a>
              {post.replies.some(reply => !reply.deleted) && <span className="ip2-reply-count">댓글 {post.replies.filter(reply => !reply.deleted).length}</span>}
              <p className="ip2-post-excerpt">{post.body}</p>
            </div>
          </article>) : <div className="ip2-empty"><p>이 게시판에는 아직 글이 없습니다.</p><button onClick={() => compose()}>첫 글 쓰기</button></div>}
        </div>
        <div className="ip2-list-bottom"><button onClick={openList}>게시판에서 더 보기 <span className="ip2-action-symbol" aria-hidden="true">→</span></button></div>
      </section>
      <aside className="ip2-resources" data-review-target="home-resources" data-review-label="공식 자료와 읽을거리" aria-label="자료와 읽을거리">
        <section className="ip2-official"><div className="ip2-side-heading"><h2>공식 자료</h2><button onClick={() => go({ view: 'guides', post: '' })}>전체</button></div>
          <div className="ip2-source-list">{sourceLinks.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.agency} · ${source.label} · 새 창`}><strong>{source.agency} <span className="ip2-source-symbol" aria-hidden="true">↗</span></strong><span>{source.label}</span></a>)}</div>
          <p className="ip2-resource-note">기관별 대상과 절차는 원문에서 확인하세요.</p>
        </section>
        <section className="ip2-reading"><h2>읽을거리</h2><ul>{ipFeatures.map(feature => <li key={feature.id}><a href={href({ ...loc, view: 'detail', post: feature.id, from: 'home' })} onClick={event => openPost(event, feature.id)}>{feature.kicker}</a><p>{feature.summary}</p></li>)}</ul><span className="ip2-editorial-note">직접 작성한 편집 예시</span></section>
      </aside>
    </div>
  </div>;
}
