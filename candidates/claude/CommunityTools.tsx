'use client';
import { situations, boards, type LocationState } from './domain';

export function CommunityFilters({
  loc,
  go,
}: {
  loc: LocationState;
  go: (p: Partial<LocationState>) => void;
}) {
  return (
    <section className="community-filters" aria-label="이야기 찾기">
      <div className="board-filter" aria-label="질문 분야">
        {Object.entries({ all: '모든 분야', ...boards }).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={loc.board === id}
            onClick={() => go({ board: id, page: 1 })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="secondary-filters"><div className="feed-tabs" aria-label="댓글 여부">
        {Object.entries({
          all: '모든 글',
          unanswered: '댓글 없는 글',
        }).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={loc.feed === id}
            onClick={() => go({ feed: id, page: 1 })}
          >
            {label}
          </button>
        ))}
      </div>
      <details className="optional-filter" open={loc.situation !== 'all' || undefined}>
        <summary>상황으로 좁히기{loc.situation !== 'all' ? ' · 적용 중' : ''}</summary>
      <div className="situation-tools">
        <label htmlFor="situation-filter">상황</label>
        <select
          id="situation-filter"
          value={loc.situation}
          onChange={(e) => go({ situation: e.target.value, page: 1 })}
        >
          <option value="all">모든 상황</option>
          {Object.entries(situations).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div></details></div>
    </section>
  );
}
