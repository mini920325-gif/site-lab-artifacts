import fixture from './fixture.json' with { type: 'json' };
export const situations = {
  in_service: '복무·전역',
  preparing: '보훈 신청',
  review: '심사·결과',
  support: '등록 후 지원',
  career: '교육·취업',
  family: '가족·유족',
  learning: '배움·자격',
  daily: '일상·주거',
  starting: '창업 준비',
} as const;
export type Situation = keyof typeof situations;
export type Followup = { body: string; nextAction: string; at: string };
export type Board = 'benefits' | 'transition' | 'employment' | 'education' | 'life' | 'startup';
export const boards: Record<Board, string> = {
  transition: '전직',
  employment: '취업',
  startup: '창업',
  education: '교육',
  life: '생활',
  benefits: '보훈',
};
export type SourceCitation = {
  lawName: string;
  article: string;
  effectiveDate: string;
  sourceUrl: string;
  reviewed: boolean;
};
export type Reply = {
  id: string;
  owner: string | null;
  body: string;
  parent: string | null;
  at: string;
  updated?: string;
  deleted?: boolean;
  operator?: boolean;
  roleLabel?: string;
  source?: SourceCitation;
};
export type Post = {
  id: string;
  owner: string;
  board: Board;
  title: string;
  body: string;
  at: string;
  updated?: string;
  correction?: string;
  replies: Reply[];
  situation?: Situation;
  followup?: Followup;
  sample?: boolean;
};
export const initialPosts = (): Post[] => fixture.posts.map(p => ({
 id:p.id,owner:'sample',board:p.board_id as Board,situation:p.situation as Situation,
 sample:true,title:p.title,body:p.body,at:p.published_at,replies:[],
}));
export function clean(value: string, max: number, label: string) {
  const s = value.trim();
  if (!s || s.length > max)
    throw new Error(`${label}은 1~${max}자로 입력해 주세요.`);
  return s;
}
export function authorize(actor: string | null, owner: string | null) {
  if (!actor) throw new Error('체험 로그인이 필요합니다.');
  if (actor !== owner)
    throw new Error('내가 작성한 내용만 변경할 수 있습니다.');
}
export const countReplies = (p: Post) =>
  p.replies.filter((r) => !r.deleted).length;
export function publicPost(p: Post, actor: string | null) {
  return {
    id: p.id,
    board: p.board,
    title: p.title,
    body: p.body,
    at: p.at,
    updated: p.updated,
    correction: p.correction,
    situation: p.situation,
    followup: p.followup
      ? {
          body: p.followup.body,
          nextAction: p.followup.nextAction,
          at: p.followup.at,
        }
      : undefined,
    sample: !!p.sample,
    authorDisplay: '익명',
    isMine: !!actor && p.owner === actor,
    replies: p.replies.map(
      ({
        id,
        body,
        parent,
        at,
        updated,
        deleted,
        operator,
        owner,
        roleLabel,
        source,
      }) => ({
        id,
        body,
        parent,
        at,
        updated,
        deleted,
        operator,
        roleLabel: operator ? roleLabel || '사무소 답변' : undefined,
        source: operator && source
          ? {
              lawName: source.lawName || '',
              article: source.article || '',
              effectiveDate: source.effectiveDate || '',
              sourceUrl: source.sourceUrl || '',
              reviewed: !!source.reviewed,
            }
          : undefined,
        authorDisplay: deleted
          ? '삭제된 댓글'
          : operator
            ? roleLabel || '사무소 답변'
            : '익명',
        isMine: !!actor && owner === actor,
      }),
    ),
  };
}
export type PublicPost = ReturnType<typeof publicPost>;
export function removeReply(p: Post, id: string, actor: string | null) {
  const r = p.replies.find((r) => r.id === id && !r.deleted);
  if (!r) throw new Error('이미 삭제된 댓글입니다.');
  authorize(actor, r.owner);
  let replies = p.replies.some((r) => r.parent === id)
    ? p.replies.map((r) =>
        r.id === id
          ? { ...r, body: '', owner: null, updated: undefined, deleted: true }
          : r,
      )
    : p.replies.filter((r) => r.id !== id);
  replies = replies.filter(
    (r) => !r.deleted || replies.some((child) => child.parent === r.id),
  );
  return { ...p, replies };
}
export type LocationState = {
  variant: 'A' | 'B';
  view: string;
  post: string;
  board: string;
  q: string;
  page: number;
  sort: string;
  mine: boolean;
  situation: string;
  feed: string;
  from: 'home' | 'list';
};
export const defaultLocation: LocationState = {
  variant: 'A',
  view: 'list',
  post: '',
  board: 'all',
  q: '',
  page: 1,
  sort: 'latest',
  mine: false,
  situation: 'all',
  feed: 'all',
  from: 'list',
};
export function readLocation(search: string, path = '/') {
  const p = new URLSearchParams(search);
  return {
    ...defaultLocation,
    variant: p.get('variant') === 'B' ? 'B' : 'A',
    view: [
      'home',
      'guides',
      'list',
      'detail',
      'compose',
      'studio',
      'help',
      'terms',
      'privacy',
      'delete-request',
      'office',
    ].includes(p.get('view') || '')
      ? p.get('view')!
      : path === '/studio'
        ? 'studio'
        : path === '/help'
          ? 'help'
          : path === '/delete-request'
            ? 'delete-request'
            : path === '/policies'
              ? 'terms'
              : [
                    'q',
                    'board',
                    'feed',
                    'situation',
                    'page',
                    'mine',
                    'sort',
                  ].some((key) => p.has(key))
                ? 'list'
                : 'list',
    post: p.get('post') || '',
    from: p.get('from') === 'home' ? 'home' : 'list',
    board: Object.hasOwn(boards, p.get('board') || '')
      ? p.get('board')!
      : 'all',
    q: (p.get('q') || '').slice(0, 200),
    page: Math.max(
      1,
      Math.min(1000, Number.parseInt(p.get('page') || '1') || 1),
    ),
    sort: p.get('sort') === 'replies' ? 'replies' : 'latest',
    mine: p.get('mine') === '1',
    situation: Object.hasOwn(situations, p.get('situation') || '')
      ? p.get('situation')!
      : 'all',
    feed: ['unanswered'].includes(p.get('feed') || '') ? p.get('feed')! : 'all',
  } as LocationState;
}
export function href(loc: LocationState) {
  const p = new URLSearchParams({ variant: loc.variant });
  p.set('view', loc.view);
  if (['detail', 'compose'].includes(loc.view) && loc.from === 'home')
    p.set('from', 'home');
  if (loc.post) p.set('post', loc.post);
  if (loc.board !== 'all') p.set('board', loc.board);
  if (loc.q) p.set('q', loc.q);
  if (loc.page > 1) p.set('page', String(loc.page));
  if (loc.sort !== 'latest') p.set('sort', loc.sort);
  if (loc.mine) p.set('mine', '1');
  if (loc.situation !== 'all') p.set('situation', loc.situation);
  if (loc.feed !== 'all') p.set('feed', loc.feed);
  return '/site-lab-artifacts/candidates/fable/?' + p;
}
export function selectPosts(
  posts: Post[],
  loc: LocationState,
  actor: string | null,
) {
  const all = posts
    .filter(
      (p) =>
        (loc.board === 'all' || p.board === loc.board) &&
        (!loc.mine || p.owner === actor) &&
        (!loc.situation ||
          loc.situation === 'all' ||
          p.situation === loc.situation) &&
        (!loc.feed ||
          loc.feed === 'all' ||
          (loc.feed === 'unanswered' ? countReplies(p) === 0 : !!p.followup)) &&
        (
          p.title +
          ' ' +
          p.body +
          ' ' +
          (p.followup?.body || '') +
          ' ' +
          (p.followup?.nextAction || '')
        )
          .toLocaleLowerCase('ko')
          .includes(loc.q.trim().toLocaleLowerCase('ko')),
    )
    .sort((a, b) =>
      loc.sort === 'replies'
        ? countReplies(b) - countReplies(a) || b.at.localeCompare(a.at)
        : b.at.localeCompare(a.at),
    );
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(loc.page, pages);
  return {
    total: all.length,
    pages,
    page,
    posts: all
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((p) => publicPost(p, actor)),
  };
}
export const PAGE_SIZE = 10;
// Office answers are replies flagged operator; anonymous replies do not count.
export const hasOfficeAnswer = (p: Post) =>
  p.replies.some((r) => !r.deleted && r.operator);
export function relatedPosts(posts: Post[], current: Post, limit = 5) {
  return posts
    .filter((p) => p.id !== current.id && p.board === current.board)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}
export function boardCounts(posts: Post[]) {
  const counts = Object.fromEntries(
    Object.keys(boards).map((id) => [id, 0]),
  ) as Record<Board, number>;
  for (const p of posts) counts[p.board] += 1;
  return counts;
}
export function date(iso: string, short = false) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(!short ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    timeZone: 'Asia/Seoul',
  }).format(new Date(iso));
}

export function setFollowup(
  post: Post,
  actor: string | null,
  body: string,
  nextAction: string,
  at: string,
): Post {
  authorize(actor, post.owner);
  return {
    ...post,
    followup: {
      body: clean(body, 1000, '후속 경험'),
      nextAction: nextAction.trim().slice(0, 200),
      at,
    },
  };
}
export function deleteFollowup(post: Post, actor: string | null): Post {
  authorize(actor, post.owner);
  return { ...post, followup: undefined };
}
