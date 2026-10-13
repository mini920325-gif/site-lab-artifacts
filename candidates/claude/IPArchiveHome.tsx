import type { MouseEvent } from 'react';
import { boards, href, selectPosts, type LocationState, type Post, type Situation } from './domain';
import { sourceLinks, joinDots } from './journey-content';
import { ipFeatures } from './ip-content';
import './ip-archive.css';

type ArchiveHomeProps = {
  loc: LocationState;
  posts: Post[];
  go: (patch: Partial<LocationState>) => void;
  compose: (situation?: Situation, title?: string) => void;
};

export function IPArchiveHome({ loc, posts, go, compose }: ArchiveHomeProps) {
  const editorialIds = new Set(ipFeatures.map(item => item.id));
  const listing = selectPosts(posts.filter(post => !editorialIds.has(post.id)), {
    ...loc, board: 'all', situation: 'all', mine: false, q: '', feed: 'all', page: 1,
    sort: 'latest',
  }, null);
  const realPosts = listing.posts.filter(post => !post.sample);
  const rows = (realPosts.length ? realPosts : listing.posts).slice(0, 6);
  const samplesOnly = rows.length > 0 && rows.every(post => post.sample);
  const toList = (board = 'all') => go({
    view: 'list', post: '', board, page: 1, q: '', situation: 'all',
    feed: 'all', mine: false, sort: 'latest',
  });
  const openPost = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go({ view: 'detail', post: id, from: 'home' });
  };

  return (
    <div className="ip2-home">
      <section className="ip2-opening" data-review-target="home-intro" data-review-label="제도와 일상 · 도입부" aria-labelledby="ip2-title">
        <div className="ip2-lead">
          <p className="ip2-overline">제도와 일상 <span>보훈·군경 전직을 위한 읽기</span></p>
          <h1 id="ip2-title" data-role="page-title">보훈은 확인하고,<br />다음 일을 준비합니다.</h1>
          <p className="ip2-deck">군 전역과 경찰 퇴직, 그 이후를 위한 커뮤니티.<br />보훈 안내·경력 전환·교육 자료를 읽고 질문을 나눕니다.</p>
        </div>
        <nav className="ip2-index" aria-label="주제별 이야기">
          <p>분야별로 찾아보기</p>
          <ol>
            {Object.entries(boards).map(([id, label], index) => (
              <li key={id}><button onClick={() => toList(id)}><span className="ip2-index-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{label}</span><span className="ip2-arrow" aria-hidden="true">↗</span></button></li>
            ))}
          </ol>
        </nav>
      </section>

      <section className="ip2-reading" aria-labelledby="ip2-reading-title">
        <div className="ip2-section-title">
          <div><p className="ip2-overline">함께 읽을거리</p><h2 id="ip2-reading-title">보훈과 전직, 차근차근.</h2></div>
          <p className="ip2-caption">직접 정리한 편집 예시 3편<br />실제 상담 사례나 회원 경험담이 아닙니다.</p>
        </div>
        <div className="ip2-features">
          {ipFeatures.map((item, index) => (
            <article className="ip2-feature" key={item.id}>
              <div className="ip2-feature-meta"><span>{item.kicker}</span><span aria-hidden="true">0{index + 1}</span></div>
              <h3><a href={href({ ...loc, view: 'detail', post: item.id, from: 'home' })} onClick={event => openPost(event, item.id)}>{item.title}</a></h3>
              <p>{item.summary}</p>
              <a className="ip2-read-link" href={href({ ...loc, view: 'detail', post: item.id, from: 'home' })} onClick={event => openPost(event, item.id)} aria-label={`${item.title} 읽기`}>읽기 <span className="ip2-arrow" aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
      </section>

      <section className="ip2-resources" data-review-target="home-resources" data-review-label="제도와 일상 · 공식 자료" aria-labelledby="ip2-resources-title">
        <div className="ip2-section-title">
          <div><p className="ip2-overline">확인할 때는 원문으로</p><h2 id="ip2-resources-title">보훈·전직 공식 안내</h2></div>
          <button className="ip2-inline-button" onClick={() => go({ view: 'guides', post: '' })}>자료실 보기 <span className="ip2-arrow" aria-hidden="true">→</span></button>
        </div>
        <div className="ip2-source-grid">
          {sourceLinks.map(source => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
              <span className="ip2-source-agency">{source.agency}<span className="ip2-arrow" aria-hidden="true">↗</span></span>
              <span className="ip2-source-label">{joinDots(source.label)}</span>
              <span className="ip2-source-kind">기관 원문 · 새 창</span>
            </a>
          ))}
        </div>
        <p className="ip2-resource-note">기관마다 안내 대상이 다릅니다. 군 전역자 지원을 경찰 퇴직자에게 그대로 적용하지 않으며, 조건과 일정은 해당 원문에서 확인합니다.</p>
      </section>

      <section className="ip2-conversation" data-review-target="home-feed" data-review-label="제도와 일상 · 질문과 경험" aria-labelledby="ip2-conversation-title">
        <div className="ip2-section-title">
          <div><p className="ip2-overline">군·경과 가족의 질문</p><h2 id="ip2-conversation-title">전역·퇴직 이후를 묻다</h2></div>
          <button className="ip2-compose" onClick={() => compose()}>글쓰기 <span className="ip2-arrow" aria-hidden="true">↗</span></button>
        </div>
        <div className="ip2-discussion-layout">
          <div className="ip2-posts">
            {samplesOnly && <p className="ip2-sample-notice">아래는 구성을 살펴보는 예시 글입니다. 실제 회원 글은 아직 없습니다.</p>}
            {rows.length ? rows.map(post => (
              <article className="ip2-post" key={post.id}>
                <span className="ip2-post-topic">{boards[post.board]}</span>
                <a href={href({ ...loc, view: 'detail', post: post.id, from: 'home' })} onClick={event => openPost(event, post.id)}>{post.title}</a>
                <p className="ip2-post-excerpt">{post.body}</p>
                {!post.sample && <span className="ip2-post-kind">체험 글</span>}
              </article>
            )) : <p className="ip2-empty">아직 올라온 글이 없습니다. 궁금했던 점이나 해본 일을 남겨보세요.</p>}
            <button className="ip2-all-posts" onClick={() => toList()}>전체 이야기 보기 <span className="ip2-arrow" aria-hidden="true">→</span></button>
          </div>
          <aside className="ip2-margin-note" aria-label="이 공간의 이용 방식">
            <span className="ip2-overline">경험을 읽는 방법</span>
            <h3>같은 질문에도{' '}<br />상황은 다르니까.</h3>
            <p>군 전역과 경찰 퇴직의 경험을 함께 읽되, 지원 제도와 신청 경로는 구분합니다. 보훈 대상 여부를 경력만으로 판단하지 않습니다.</p>
            <button className="ip2-inline-button" onClick={() => go({ view: 'office', post: '' })}>이 공간에 대해 <span className="ip2-arrow" aria-hidden="true">→</span></button>
          </aside>
        </div>
      </section>
    </div>
  );
}
