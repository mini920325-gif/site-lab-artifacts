'use client';
import { situations, boards, type LocationState } from './domain';

// Row 1: board (분야) — the strong line. Row 2: reply filter, situation, sort — lighter.
export function CommunityFilters({
  loc,
  go,
  total,
}: {
  loc: LocationState;
  go: (p: Partial<LocationState>) => void;
  total: number;
}) {
  return (
    <section className="filters" aria-label="글 거르기">
      <div className="filter-boards" role="group" aria-label="분야">
        {Object.entries({ all: '전체', ...boards }).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={loc.board === id}
            onClick={() => go({ board: id, page: 1 })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-secondary">
        <div className="filter-feed" role="group" aria-label="댓글 여부">
          {Object.entries({ all: '모든 글', unanswered: '댓글 없는 글' }).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={loc.feed === id}
                onClick={() => go({ feed: id, page: 1 })}
              >
                {label}
              </button>
            ),
          )}
        </div>
        <div className="filter-selects">
          <label>
            <span>상황</span>
            <select
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
          </label>
          <label>
            <span>정렬</span>
            <select
              value={loc.sort}
              onChange={(e) => go({ sort: e.target.value, page: 1 })}
            >
              <option value="latest">최근 작성순</option>
              <option value="replies">댓글 많은순</option>
            </select>
          </label>
        </div>
        <span className="filter-count">
          글 <strong>{total}</strong>개
        </span>
      </div>
    </section>
  );
}
