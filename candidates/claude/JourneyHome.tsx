import { ArrowUpRight, PenLine, ChevronRight } from 'lucide-react';
import { sourceLinks, joinDots } from './journey-content';
import { href, boards, selectPosts, type LocationState, type Post, type Situation } from './domain';

export function JourneyHome({ loc, posts, go, compose, showSamples = true }: {
  loc: LocationState;
  posts: Post[];
  go: (patch: Partial<LocationState>) => void;
  compose: (situation?: Situation, title?: string) => void;
  showSamples?: boolean;
}) {
  const listing = selectPosts(posts, {
    ...loc, board: 'all', situation: 'all', mine: false, q: '', feed: 'all', page: 1,
  }, null);
  const realPosts = listing.posts.filter(p => !p.sample);
  const rows = realPosts.length ? realPosts : showSamples ? listing.posts.filter(p => p.sample).slice(0, 10) : [];
  const samplesOnly = rows.length > 0 && !realPosts.length;

  return (
    <div className="frontpage">
      <div className="frontpage-masthead" data-review-target="home-intro" data-review-label="홈 도입부">
        <div className="frontpage-opening"><span>일 · 배움 · 생활</span><p>각자의 다음을,<br /><em>함께</em> 찾아가는 곳.</p><div>서로 다른 경험이 모여 다음 이야기가 됩니다.</div></div>
        <div className="frontpage-art" aria-hidden="true"><span className="frontpage-art-label">OUR NEXT CHAPTER</span><div className="frontpage-art-sheet"><span>다음</span><span>이야기</span></div><div className="frontpage-art-caption">여섯 가지 주제, 다양한 목소리.</div></div>
      </div>
      <div className="frontpage-grid">
        <section className="frontpage-feed" data-review-target="home-feed" data-review-label="홈 글 목록" aria-labelledby="home-community-title">
          <div className="frontpage-heading">
            <div>
              <h1 id="home-community-title" data-role="page-title">최근 이야기</h1>
              <p>일하는 이야기부터 사는 이야기까지.</p>
            </div>
            <button className="write-action" onClick={() => compose()}>
              <PenLine size={18} aria-hidden="true" /> 글쓰기
            </button>
          </div>
          <nav className="frontpage-topics" aria-label="질문 분야">
            {Object.entries({ all: '전체', ...boards }).map(([id, label]) => (
              <button key={id} aria-pressed={id === 'all'} onClick={() => go({ board: id, page: 1, view: 'list', post: '', q: '', situation: 'all' })}>{label}</button>
            ))}
          </nav>
          {samplesOnly && <p className="frontpage-sample">미리보기 <span>아래는 화면 구성을 위한 예시 글입니다.</span></p>}
          {rows.length === 0 ? (
            <div className="empty honest-empty"><h2>아직 올라온 글이 없어요.</h2><p>첫 이야기를 남겨보세요. 체험 글은 새로고침하면 초기화됩니다.</p></div>
          ) : (
            <div className="frontpage-posts">
              {rows.map(p => (
                <article className="frontpage-row" key={p.id}>
                  <span className="frontpage-topic">{boards[p.board]}</span>
                  <a className="frontpage-title" href={href({ ...loc, view: 'detail', post: p.id, from: 'home' })} onClick={e => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault(); go({ view: 'detail', post: p.id });
                  }}>{p.title}{p.replies.filter(reply => !reply.deleted).length > 0 && <span className="frontpage-replies" aria-label={`댓글 ${p.replies.filter(reply => !reply.deleted).length}개`}>[{p.replies.filter(reply => !reply.deleted).length}]</span>}</a>
                  <p className="frontpage-excerpt">{p.body}</p>
                  {!p.sample && <span className="frontpage-author">체험 글</span>}
                </article>
              ))}
            </div>
          )}
          <button className="frontpage-more" onClick={() => go({ view: 'list', post: '', page: 1, board: 'all', q: '', situation: 'all' })}>전체 글 보기 <ChevronRight size={16} aria-hidden="true" /></button>
        </section>

        <aside className="frontpage-side" data-review-target="home-resources" data-review-label="자료·이용 안내" aria-label="자료와 이용 안내">
          <section className="frontpage-directory">
            <span className="frontpage-kicker">필요할 때 찾아보기</span>
            <h2>공식 자료</h2>
            <div className="frontpage-sources">
              {sourceLinks.map(s => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
                <span><strong>{s.agency}</strong><small>{joinDots(s.label)}</small></span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>)}
            </div>
            <button className="text-action" onClick={() => go({ view: 'guides', post: '' })}>자료실 둘러보기 <ChevronRight size={16} aria-hidden="true" /></button>
          </section>
          <section className="frontpage-help">
            <h2>처음 오셨나요?</h2>
            <p>글은 누구나 읽을 수 있습니다.<br />질문과 댓글은 익명으로 남겨요.</p>
            <button className="text-action" onClick={() => go({ view: 'office', post: '' })}>커뮤니티 소개 <ChevronRight size={16} aria-hidden="true" /></button>
            <button className="text-action" onClick={() => go({ view: 'help', post: '' })}>이용 안내 <ChevronRight size={16} aria-hidden="true" /></button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function GuideDirectory() {
  return (
    <section className="guide-page" data-review-target="guide-directory" data-review-label="자료실">
      <div className="section-heading">
        <div>
          <h1 data-role="page-title">자료실</h1>
          <p>취업·교육·생활·보훈의 공식 안내를 모았습니다.</p>
        </div>
      </div>
      <div className="guide-directory">
        {sourceLinks.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            <div>
              <span className="section-eyebrow">{s.agency}</span>
              <h2>{joinDots(s.label)}</h2>
              <p>{joinDots(s.note)}</p>
            </div>
            <ArrowUpRight size={22} aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="guide-checked">
        각 기관 원문으로 이동합니다. 자료를 신청하거나 입력하는 기능은 이 화면에 연결되지 않았습니다.
      </p>
    </section>
  );
}
