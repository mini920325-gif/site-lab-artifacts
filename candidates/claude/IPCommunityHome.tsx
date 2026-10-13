import { boards, href, selectPosts, type LocationState, type Post, type Situation } from './domain';
import { sourceLinks } from './journey-content';
import { ipFeatures } from './ip-content';
import './ip-community.css';

export function IPCommunityHome({ loc, posts, go, compose, showSamples = true }: {
  loc: LocationState;
  posts: Post[];
  go: (patch: Partial<LocationState>) => void;
  compose: (situation?: Situation, title?: string) => void;
  showSamples?: boolean;
}) {
  const board = Object.hasOwn(boards, loc.board) ? loc.board : 'all';
  const discussionPosts = posts.filter(post => !ipFeatures.some(feature => feature.id === post.id));
  const listing = selectPosts(discussionPosts, {
    ...loc, board, situation: 'all', mine: false, q: '', feed: 'all', sort: 'latest', page: 1,
  }, null);
  const realPosts = listing.posts.filter(post => !post.sample);
  const rows = realPosts.length ? realPosts : showSamples ? listing.posts : [];
  const samplesOnly = rows.length > 0 && !realPosts.length;
  const openPost = (post: string) => go({ view: 'detail', post, from: 'home' });

  return <div className="ip3-home">
    <section className="ip3-intro" data-review-target="home-intro" data-review-label="홈 도입부" aria-labelledby="ip3-heading">
      <div className="ip3-intro-copy">
        <span className="ip3-eyebrow">일상동료 · 함께 묻고 나누는 곳</span>
        <h1 id="ip3-heading" data-role="page-title">일을 바꾸는 이야기부터,<br />오늘 사는 이야기까지.</h1>
        <p>경험은 서로에게 묻고, 제도는 출처에서 확인합니다.<br className="ip3-wide-break" /> 전직·취업·창업·교육·생활·보훈을 함께 이야기해요.</p>
      </div>
      <div className="ip3-intro-action">
        <p>지금 떠오르는 질문이 있나요?</p>
        <button onClick={() => compose()}>이야기 남기기</button>
        <span>읽기는 자유롭게, 쓰기는 체험 로그인 후</span>
      </div>
    </section>

    <div className="ip3-columns">
      <section className="ip3-conversations" data-review-target="home-feed" data-review-label="홈 글 목록" aria-labelledby="ip3-talk-heading">
        <div className="ip3-section-heading">
          <h2 id="ip3-talk-heading">함께 나누는 이야기</h2>
          <button onClick={() => go({ view: 'list', board, post: '', q: '', page: 1, situation: 'all', mine: false, feed: 'all' })}>게시판 전체</button>
        </div>
        <nav className="ip3-topics" aria-label="이야기 분야">
          {Object.entries({ all: '전체', ...boards }).map(([id, label]) => <button key={id} aria-pressed={board === id} onClick={() => go({ view: 'home', board: id, page: 1, post: '', q: '', situation: 'all' })}>{label}</button>)}
        </nav>
        <div className="ip3-list-note">
          <span>질문과 경험</span>
          <p>{samplesOnly ? '구성 예시 글입니다. 실제 회원의 경험담이 아닙니다.' : '체험 글은 새로고침하면 초기화됩니다.'}</p>
        </div>
        {rows.length ? <div className="ip3-posts">
          {rows.map(post => <article className="ip3-post" key={post.id}>
            <span className="ip3-board">{boards[post.board]}</span>
            <div className="ip3-post-body">
              <a href={href({ ...loc, view: 'detail', post: post.id, from: 'home' })} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault(); openPost(post.id);
              }}>{post.title}{post.replies.filter(reply => !reply.deleted).length > 0 && <span className="ip3-reply-count">댓글 {post.replies.filter(reply => !reply.deleted).length}</span>}</a>
              <p className="ip3-post-excerpt">{post.body}</p>
            </div>
            {!post.sample && <span className="ip3-post-kind">체험 글</span>}
          </article>)}
        </div> : <div className="ip3-empty"><h3>이 분야의 첫 이야기를 기다려요.</h3><p>궁금한 점이나 직접 겪은 일을 남겨보세요.</p><button onClick={() => compose()}>글쓰기</button></div>}
        <div className="ip3-list-end"><p>서로의 경험은 참고로, 신청과 판단은 공식 안내로.</p><button onClick={() => go({ view: 'help', post: '' })}>이용 안내</button></div>
        <section className="ip3-reading">
          <div className="ip3-reading-heading"><h2>질문하기 전, 한 편</h2><p>공고 읽기부터 내 질문의 시작점까지</p></div>
          <ol className="ip3-feature-list">
            {ipFeatures.map((feature, index) => <li key={feature.id}>
              <span className="ip3-feature-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <a href={href({ ...loc, view: 'detail', post: feature.id, from: 'home' })} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault(); openPost(feature.id);
              }}><span>{feature.kicker}</span><strong>{feature.title}</strong></a>
            </li>)}
          </ol>
          <small>이 시안을 위해 직접 작성한 읽을거리</small>
        </section>
      </section>

      <aside className="ip3-sidebar" data-review-target="home-resources" data-review-label="공식 자료·이용 안내" aria-label="공식 자료와 이용 안내">
        <section className="ip3-official">
          <div className="ip3-side-heading"><h2>공식 자료 바로가기</h2></div>
          <p className="ip3-side-intro">신청 대상과 일정은 기관 원문에서 확인하세요.</p>
          <div className="ip3-sources">{sourceLinks.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.agency}</strong><span>{source.label}</span><span className="ip3-new-window">새 창 <span className="ip3-source-symbol" aria-hidden="true">↗</span></span></a>)}</div>
          <button className="ip3-directory-link" onClick={() => go({ view: 'guides', post: '' })}>자료실에서 더 찾아보기 <span className="ip3-action-symbol" aria-hidden="true">→</span></button>
        </section>
        <section className="ip3-about"><h2>경험과 제도 사이</h2><p>서로의 이야기를 모으고, 필요한 제도와 행정 절차를 찾아가는 커뮤니티를 준비합니다.</p><button onClick={() => go({ view: 'office', post: '' })}>우리가 만들고 있는 곳</button></section>
      </aside>
    </div>
  </div>;
}
