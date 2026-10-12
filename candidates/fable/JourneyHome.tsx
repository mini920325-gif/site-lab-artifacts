'use client';
import { ArrowUpRight, ChevronRight, PenLine } from 'lucide-react';
import { sourceLinks } from './journey-content';
import {
  boards,
  boardCounts,
  hasOfficeAnswer,
  publicPost,
  type LocationState,
  type Post,
  type Board,
} from './domain';
import { siteConfig } from './site-config';
import { PostRows } from './PostRows';
import { PageHead } from './PageHead';

// Home is the community's first screen: recent posts and boards above,
// office answers and the resource shortcuts below. Full width, no rail.
export function Home({
  loc,
  posts,
  actor,
  go,
  compose,
}: {
  loc: LocationState;
  posts: Post[];
  actor: string | null;
  go: (patch: Partial<LocationState>) => void;
  compose: () => void;
}) {
  const sorted = [...posts].sort((a, b) => b.at.localeCompare(a.at));
  const realCount = posts.filter((p) => !p.sample).length;
  const recent = sorted.slice(0, 6).map((p) => publicPost(p, actor));
  const counts = boardCounts(posts);
  const answered = sorted.filter(hasOfficeAnswer);
  const unanswered = sorted.filter((p) => !hasOfficeAnswer(p));
  const openList = (board: Board | 'all') =>
    go({ view: 'list', post: '', board, page: 1, q: '', feed: 'all', situation: 'all', mine: false });
  return (
    <div className="home">
      <PageHead
        title="홈"
        sub={siteConfig.description}
        action={
          <button type="button" className="primary" onClick={compose}>
            <PenLine size={17} aria-hidden="true" />
            글쓰기
          </button>
        }
      />

      <section className="home-section" aria-labelledby="home-recent">
        <div className="section-head">
          <h2 id="home-recent">최근 글</h2>
          <button type="button" className="more" onClick={() => openList('all')}>
            커뮤니티 전체 <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        {realCount === 0 && (
          <p className="sample-line">
            실제 회원 글은 아직 없습니다. 아래는 화면 확인용 구성 예시입니다.
          </p>
        )}
        <PostRows
          posts={recent}
          loc={loc}
          from="home"
          go={go}
          tagSamples={realCount > 0}
        />
      </section>

      <section className="home-section" aria-labelledby="home-boards">
        <div className="section-head">
          <h2 id="home-boards">게시판</h2>
        </div>
        <ul className="board-grid">
          {(Object.keys(boards) as Board[]).map((id) => (
            <li key={id}>
              <button type="button" onClick={() => openList(id)}>
                <strong>{boards[id]}</strong>
                <span>글 {counts[id]}개</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-section" aria-labelledby="home-office">
        <div className="section-head">
          <h2 id="home-office">사무소 답변</h2>
          <p>사무소가 답한 글과 아직 답하지 않은 글을 함께 보여줍니다.</p>
        </div>
        <div className="office-columns">
          <div className="office-column">
            <h3>
              답변 있음 <span>{answered.length}</span>
            </h3>
            {answered.length ? (
              <ul className="title-links">
                {answered.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => go({ view: 'detail', post: p.id, from: 'home' })}>
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">아직 사무소가 답한 글이 없습니다. 운영 연결 전입니다.</p>
            )}
          </div>
          <div className="office-column">
            <h3>
              미답변 <span>{unanswered.length}</span>
            </h3>
            {unanswered.length ? (
              <ul className="title-links">
                {unanswered.slice(0, 5).map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => go({ view: 'detail', post: p.id, from: 'home' })}>
                      {p.title}
                      {p.sample && realCount > 0 && <small>구성 예시</small>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">미답변 글이 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-guides">
        <div className="section-head">
          <h2 id="home-guides">자료실 바로가기</h2>
          <button type="button" className="more" onClick={() => go({ view: 'guides', post: '' })}>
            자료실 <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <ul className="link-rows">
          {sourceLinks.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <span className="link-agency">{s.agency}</span>
                <span className="link-label">{s.label}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// 자료실: the list comes first; one screen only.
export function GuideDirectory() {
  return (
    <div className="guides">
      <PageHead
        title="자료실"
        sub="취업·교육·생활·보훈의 공식 안내 원문으로 이동합니다."
      />
      <ul className="link-rows guide-rows">
        {sourceLinks.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="link-agency">{s.agency}</span>
              <span className="link-label">{s.label}</span>
              <span className="link-note">{s.note}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="quiet">
        각 기관 원문으로 이동합니다. 자료를 신청하거나 입력하는 기능은 이 화면에 연결되지 않았습니다.
      </p>
    </div>
  );
}
