'use client';
import { MessageSquare } from 'lucide-react';
import {
  boards,
  situations,
  href,
  type LocationState,
  type PublicPost,
} from './domain';

// One row renderer for home and list. The composition (board/qa/card) and the
// frame width change the structure through CSS; the content is identical.
export function PostRows({
  posts,
  loc,
  from,
  go,
  tagSamples,
  officeStatus = false,
}: {
  posts: PublicPost[];
  loc: LocationState;
  from: 'home' | 'list';
  go: (patch: Partial<LocationState>) => void;
  tagSamples: boolean;
  officeStatus?: boolean;
}) {
  return (
    <ol className="rows" aria-label="글 목록">
      {posts.map((p) => {
        const replies = p.replies.filter((r) => !r.deleted).length;
        const answered = p.replies.some((r) => !r.deleted && r.operator);
        return (
          <li className="row" key={p.id}>
            <span className="row-board">{boards[p.board]}</span>
            <div className="row-main">
              <a
                className="row-title"
                href={href({ ...loc, view: 'detail', post: p.id, from })}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) return;
                  e.preventDefault();
                  go({ view: 'detail', post: p.id, from });
                }}
              >
                {p.title}
              </a>
              <p className="row-preview">{p.body}</p>
              <div className="row-tags">
                <span className="row-board-inline">{boards[p.board]}</span>
                {p.situation && (
                  <span className="row-situation-inline">
                    {situations[p.situation]}
                  </span>
                )}
                {officeStatus && (
                  <span className={answered ? 'status-answered' : 'status-open'}>
                    {answered ? '사무소 답변 있음' : '미답변'}
                  </span>
                )}
                {tagSamples && p.sample && (
                  <span className="row-sample">구성 예시</span>
                )}
                {p.isMine && <span className="mine-tag">내 글</span>}
              </div>
            </div>
            <span className="row-situation">
              {p.situation ? situations[p.situation] : '—'}
            </span>
            <span className="row-replies" aria-label={`댓글 ${replies}개`}>
              <MessageSquare size={15} aria-hidden="true" />
              {replies}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
