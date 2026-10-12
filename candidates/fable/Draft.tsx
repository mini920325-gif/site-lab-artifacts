'use client';
import {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { Dialog } from '@base-ui/react/dialog';
import {
  Search,
  ArrowUpRight,
  PenLine,
  ArrowLeft,
  Bookmark,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  boards,
  situations,
  type Situation,
  initialPosts,
  defaultLocation,
  readLocation,
  href,
  selectPosts,
  date,
  publicPost,
  clean,
  authorize,
  removeReply,
  relatedPosts,
  type LocationState,
  type Board,
  type PublicPost,
} from './domain';
import { StudioView } from './StudioView';
import { siteConfig, type Accent } from './site-config';
import { CommunityFilters } from './CommunityTools';
import { DesignExplorer } from './DesignExplorer';
import { readComposition, saveComposition, type Composition } from './design';
import { Home, GuideDirectory } from './JourneyHome';
import { PostRows } from './PostRows';
import { PageHead } from './PageHead';
import { sourceLinks } from './journey-content';
import './draft.css';
import './community.css';

type Modal = {
  type: 'login' | 'report' | 'delete' | 'reading' | 'activity';
  target?: string;
  kind?: 'post' | 'reply';
  intent?: 'compose' | 'activity';
};
type DraftInput = {
  title: string;
  body: string;
  board: Board;
  editId?: string;
  situation?: Situation;
};
const subscribeHydration = () => () => {};
const emptyDraft: DraftInput = { title: '', body: '', board: 'transition' };
const infoViews = ['help', 'terms', 'privacy', 'delete-request', 'office'];
const infoTitles: Record<string, string> = {
  help: '이용 안내',
  office: '이 커뮤니티는',
  terms: '이용약관 초안',
  privacy: '개인정보 안내',
  'delete-request': '삭제 요청 안내',
};

export default function Draft({
  initialSearch = '',
  initialPath = '/',
}: {
  initialSearch?: string;
  initialPath?: string;
}) {
  const [loc, setLoc] = useState(() => readLocation(initialSearch, initialPath));
  const ready = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState(() => readLocation(initialSearch, initialPath).q);
  const [actor, setActor] = useState<string | null>(null);
  const [account, setAccount] = useState('demo-1');
  const [modal, setModal] = useState<Modal | null>(null);
  const [draft, setDraft] = useState<DraftInput>(emptyDraft);
  const [comment, setComment] = useState('');
  const [parent, setParent] = useState<string | null>(null);
  const [editReply, setEditReply] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [allReports, setAllReports] = useState<
    { target: string; actor: string; reason: string; status: string; at: string; updated: string }[]
  >([]);
  const reports = allReports.filter((r) => r.actor === actor).map((r) => r.target);
  const [reason, setReason] = useState('개인정보 노출');
  const [savedByActor, setSavedByActor] = useState<Record<string, string[]>>({});
  const saved = actor ? savedByActor[actor] || [] : [];
  const setSaved = (ids: string[]) => {
    if (actor) setSavedByActor((previous) => ({ ...previous, [actor]: ids }));
  };
  const [name, setName] = useState<string>(siteConfig.name);
  const [announcement, setAnnouncement] = useState<string>(siteConfig.announcement);
  const [accent, setAccent] = useState<Accent>('navy');
  const [composition, setComposition] = useState<Composition>(readComposition);
  const [applied, setApplied] = useState<Composition>(composition);
  const [designOpen, setDesignOpen] = useState(false);
  const [scale, setScale] = useState('100');
  const opener = useRef<HTMLElement | null>(null);
  const main = useRef<HTMLElement | null>(null);
  const listScroll = useRef(0);
  const returnView = loc.from;

  useEffect(() => {
    const sync = () => {
      const l = readLocation(location.search, location.pathname);
      const previousScroll = history.state?.returnScroll;
      listScroll.current =
        typeof previousScroll === 'number' && Number.isFinite(previousScroll)
          ? Math.max(0, previousScroll)
          : 0;
      setLoc(l);
      setQuery(l.q);
      setComment('');
      setParent(null);
      setEditReply(null);
      setError('');
    };
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}%`;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [scale]);

  function go(patch: Partial<LocationState>) {
    const next = { ...loc, ...patch };
    if (['list', 'home'].includes(loc.view) && ['detail', 'compose'].includes(next.view)) {
      listScroll.current = window.scrollY;
      next.from = loc.view as 'home' | 'list';
    }
    history.pushState({ returnScroll: listScroll.current }, '', href(next));
    setLoc(next);
    setQuery(next.q);
    setError('');
    if (next.post !== loc.post) {
      setComment('');
      setParent(null);
      setEditReply(null);
    }
    if (next.view !== loc.view || next.post !== loc.post) {
      setTimeout(() => {
        main.current?.focus({ preventScroll: true });
        window.scrollTo(
          0,
          next.view === returnView && loc.view === 'detail' ? listScroll.current : 0,
        );
      }, 0);
    }
  }
  function open(value: Modal) {
    opener.current = document.activeElement as HTMLElement;
    setError('');
    setModal(value);
  }
  function needLogin(intent?: 'compose' | 'activity') {
    open({ type: 'login', intent });
  }
  function compose() {
    if (!actor) {
      needLogin('compose');
      return;
    }
    if (draft.editId) setDraft(emptyDraft);
    go({ view: 'compose', post: '' });
  }
  function update(fn: () => void) {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '처리하지 못했습니다. 내용을 확인하고 다시 시도해 주세요.',
      );
    }
  }
  const list = selectPosts(posts, loc, actor);
  const realCount = posts.filter((p) => !p.sample).length;
  const internal = posts.find((p) => p.id === loc.post);
  const active = internal ? publicPost(internal, actor) : undefined;
  const isInfo = infoViews.includes(loc.view);
  const fullWidth = loc.view === 'home' || loc.view === 'guides';

  function login() {
    setActor(account);
    const intent = modal?.intent;
    setModal(null);
    setNotice('체험 로그인했습니다. 실인증·서버 저장은 연결되지 않았습니다.');
    if (intent === 'compose') go({ view: 'compose', post: '' });
    if (intent === 'activity') setTimeout(() => open({ type: 'activity' }), 0);
  }
  function savePost() {
    update(() => {
      if (!actor) throw new Error('체험 로그인 후 작성해 주세요.');
      const title = clean(draft.title, 100, '제목');
      const body = clean(draft.body, 5000, '내용');
      const now = new Date().toISOString();
      let id = draft.editId;
      if (id) {
        const old = posts.find((p) => p.id === id);
        if (!old) throw new Error('이미 삭제된 글입니다.');
        authorize(actor, old.owner);
        setPosts(
          posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  title,
                  body,
                  board: draft.board,
                  situation: draft.situation,
                  updated: now,
                  correction: '글쓴이가 내용을 수정했습니다. 이전 원문은 이 체험에서 보관하지 않습니다.',
                }
              : p,
          ),
        );
      } else {
        id = crypto.randomUUID();
        setPosts([
          {
            id,
            owner: actor,
            board: draft.board,
            situation: draft.situation,
            sample: false,
            title,
            body,
            at: now,
            replies: [],
          },
          ...posts,
        ]);
      }
      setDraft(emptyDraft);
      setNotice('현재 화면에 반영했습니다. 새로고침하면 사라집니다.');
      go({ view: 'detail', post: id });
    });
  }
  function submitReply() {
    update(() => {
      if (!actor) throw new Error('체험 로그인 후 댓글을 남겨 주세요.');
      if (!internal) throw new Error('글을 찾지 못했습니다.');
      const body = clean(comment, 1000, '댓글');
      const now = new Date().toISOString();
      if (editReply) {
        const old = internal.replies.find((r) => r.id === editReply && !r.deleted);
        if (!old) throw new Error('이미 삭제된 댓글입니다.');
        authorize(actor, old.owner);
        setPosts(
          posts.map((p) =>
            p.id === internal.id
              ? {
                  ...p,
                  replies: p.replies.map((r) =>
                    r.id === editReply ? { ...r, body, updated: now } : r,
                  ),
                }
              : p,
          ),
        );
      } else {
        if (parent && !internal.replies.some((r) => r.id === parent && !r.deleted && !r.parent))
          throw new Error('답글을 달 수 없는 댓글입니다.');
        setPosts(
          posts.map((p) =>
            p.id === internal.id
              ? {
                  ...p,
                  replies: [
                    ...p.replies,
                    { id: crypto.randomUUID(), owner: actor, body, parent, at: now },
                  ],
                }
              : p,
          ),
        );
      }
      setComment('');
      setParent(null);
      setEditReply(null);
      setNotice('댓글을 현재 화면에 반영했습니다. 서버로 전송되지 않았습니다.');
    });
  }
  function confirmDelete() {
    update(() => {
      if (!internal || !modal) throw new Error('대상을 찾지 못했습니다.');
      if (modal.kind === 'post') {
        authorize(actor, internal.owner);
        setPosts(posts.filter((p) => p.id !== internal.id));
        setSavedByActor((previous) =>
          Object.fromEntries(
            Object.entries(previous).map(([owner, ids]) => [
              owner,
              ids.filter((id) => id !== internal.id),
            ]),
          ),
        );
        go({ view: 'list', post: '' });
      } else {
        const next = removeReply(internal, modal.target!, actor);
        setPosts(posts.map((p) => (p.id === next.id ? next : p)));
      }
      setModal(null);
      setComment('');
      setEditReply(null);
      setParent(null);
      setNotice('현재 화면에서 삭제했습니다.');
    });
  }

  function replyItem(r: PublicPost['replies'][number]): ReactNode {
    return (
      <article
        className={`comment ${r.parent ? 'nested' : ''} ${r.operator ? 'operator' : ''}`}
        key={r.id}
      >
        <div className="comment-heading">
          <strong>
            {r.deleted ? '삭제된 댓글' : r.authorDisplay}
            {r.isMine && <span className="mine-tag">내 댓글</span>}
          </strong>
          <time dateTime={r.updated || r.at}>
            {r.updated ? '수정 ' : ''}
            {date(r.updated || r.at)} KST
          </time>
        </div>
        <p>{r.deleted ? '작성자가 삭제했습니다. 이어진 답글은 남겨두었습니다.' : r.body}</p>
        {r.operator && !r.deleted && (
          <div className="staff-answer-card">
            <div className="staff-role">{r.roleLabel || r.authorDisplay}</div>
            {r.source && r.source.reviewed ? (
              <dl className="staff-source">
                {r.source.lawName && (
                  <>
                    <dt>법령</dt>
                    <dd>{r.source.lawName}</dd>
                  </>
                )}
                {r.source.article && (
                  <>
                    <dt>조문</dt>
                    <dd>{r.source.article}</dd>
                  </>
                )}
                {r.source.effectiveDate && (
                  <>
                    <dt>기준일</dt>
                    <dd>{r.source.effectiveDate}</dd>
                  </>
                )}
                {r.source.sourceUrl && (
                  <>
                    <dt>원문</dt>
                    <dd>
                      <a href={r.source.sourceUrl} target="_blank" rel="noopener noreferrer">
                        출처 열기
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            ) : r.source ? (
              <p className="staff-source-pending">출처 슬롯(미검수) · 공개 권위로 표시하지 않습니다.</p>
            ) : null}
          </div>
        )}
        {!r.deleted && (
          <div className="comment-actions">
            {!r.parent && (
              <button
                type="button"
                onClick={() => {
                  if (!actor) {
                    needLogin();
                    return;
                  }
                  setParent(r.id);
                  setEditReply(null);
                  setComment('');
                  document.getElementById('comment-body')?.focus();
                }}
              >
                답글
              </button>
            )}
            {r.isMine ? (
              <>
                <button
                  type="button"
                  aria-label="내 댓글 수정"
                  onClick={() => {
                    setEditReply(r.id);
                    setParent(null);
                    setComment(r.body);
                    document.getElementById('comment-body')?.focus();
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  aria-label="내 댓글 삭제"
                  onClick={() => open({ type: 'delete', kind: 'reply', target: r.id })}
                >
                  삭제
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={reports.includes(r.id)}
                onClick={() => {
                  if (!actor) {
                    needLogin();
                    return;
                  }
                  open({ type: 'report', target: r.id });
                }}
              >
                {reports.includes(r.id) ? '신고 체험 완료' : '신고'}
              </button>
            )}
          </div>
        )}
      </article>
    );
  }

  const backButton = (
    <button type="button" className="back" onClick={() => go({ view: returnView, post: '' })}>
      <ArrowLeft size={17} aria-hidden="true" />
      {returnView === 'home' ? '홈으로' : '목록으로'}
    </button>
  );

  // Rail: what sits beside the main column on wide frames; stacks below it elsewhere.
  function railContent(): ReactNode {
    const guideBlock = (
      <section className="rail-block" aria-labelledby="rail-guide">
        <h2 id="rail-guide">이용 전에 읽어주세요</h2>
        <p>개인의 경험은 공식 기준과 다를 수 있어요. 중요한 내용은 원문에서 다시 확인해 주세요.</p>
        <p>이름·연락처·군번 등 개인정보는 글과 댓글에 적지 마세요.</p>
        <button type="button" className="rail-link" onClick={() => go({ view: 'help', post: '' })}>
          이용 안내 <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>
    );
    const sourcesBlock = (
      <section className="rail-block" aria-labelledby="rail-sources">
        <h2 id="rail-sources">공식 안내로 확인하기</h2>
        <ul className="rail-links">
          {sourceLinks.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.agency} · {s.label} <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    );
    const writeBlock = (
      <section className="rail-block rail-write" aria-labelledby="rail-write">
        <h2 id="rail-write">글은 누구나 읽을 수 있어요</h2>
        <p>글과 댓글은 로그인 후 작성합니다. 공개 화면에는 익명으로 표시됩니다.</p>
        <button type="button" className="primary" onClick={compose}>
          <PenLine size={17} aria-hidden="true" />
          글쓰기
        </button>
      </section>
    );
    const activityBlock = (
      <section className="rail-block rail-tools" aria-label="내 활동과 설정">
        <button type="button" onClick={() => (actor ? open({ type: 'activity' }) : needLogin('activity'))}>
          내 글과 저장한 글 <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => open({ type: 'reading' })}>
          읽기 설정 <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go({ view: 'studio', post: '' })}>
          운영실 체험 <ChevronRight size={16} aria-hidden="true" />
        </button>
      </section>
    );
    if (loc.view === 'detail' && internal) {
      const related = relatedPosts(posts, internal);
      return (
        <>
          <section className="rail-block" aria-labelledby="rail-related">
            <h2 id="rail-related">{boards[internal.board]} 분야의 다른 글</h2>
            {related.length ? (
              <ul className="rail-titles">
                {related.map((p) => (
                  <li key={p.id}>
                    <a
                      href={href({ ...loc, view: 'detail', post: p.id })}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) return;
                        e.preventDefault();
                        go({ view: 'detail', post: p.id });
                      }}
                    >
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">같은 분야의 다른 글이 아직 없습니다.</p>
            )}
            <button
              type="button"
              className="rail-link"
              onClick={() => go({ view: 'list', post: '', board: internal.board, page: 1, q: '' })}
            >
              {boards[internal.board]} 게시판 <ChevronRight size={16} aria-hidden="true" />
            </button>
          </section>
          {writeBlock}
          {guideBlock}
        </>
      );
    }
    if (loc.view === 'compose') {
      return (
        <>
          <section className="rail-block" aria-labelledby="rail-before">
            <h2 id="rail-before">쓰기 전에</h2>
            <p>익명으로 공개됩니다. 이름·연락처·군번·부대 등 개인정보는 적지 마세요.</p>
            <p>분야는 글이 놓일 게시판, 상황은 넓은 화면의 목록에 함께 보이는 꼬리표입니다. 상황은 비워 둬도 됩니다.</p>
            <p>작성 중 다른 화면으로 나가도 초안은 남습니다. 새로고침하면 사라집니다.</p>
          </section>
          {sourcesBlock}
        </>
      );
    }
    if (isInfo) {
      return (
        <>
          <nav className="rail-block rail-nav" aria-label="안내 문서">
            <h2>안내 문서</h2>
            {infoViews.map((v) => (
              <button
                key={v}
                type="button"
                aria-current={loc.view === v ? 'page' : undefined}
                onClick={() => go({ view: v, post: '' })}
              >
                {infoTitles[v]}
              </button>
            ))}
          </nav>
          {sourcesBlock}
        </>
      );
    }
    return (
      <>
        {writeBlock}
        {sourcesBlock}
        {guideBlock}
        {activityBlock}
      </>
    );
  }

  const navItems: [string, string, string[]][] = [
    ['home', '홈', ['home']],
    ['list', '커뮤니티', ['list', 'detail', 'compose']],
    ['guides', '자료실', ['guides']],
    ['help', '이용 안내', infoViews],
  ];

  return (
    <div
      className="app"
      data-view={loc.view}
      data-comp={applied === composition ? applied : composition}
      data-full={fullWidth ? 'true' : undefined}
      style={{ '--accent': siteConfig.themes[accent].color } as CSSProperties}
      data-ready={ready}
      inert={!ready}
    >
      <a href="#main" className="skip">
        본문으로 바로가기
      </a>
      <div className="demo-bar">
        <div className="container">
          <span>{announcement || siteConfig.announcement}</span>
          <button
            type="button"
            aria-expanded={designOpen}
            aria-controls="design-explorer"
            onClick={() => {
              if (designOpen) setComposition(applied);
              setDesignOpen(!designOpen);
            }}
          >
            {designOpen ? '비교 닫기' : '디자인 비교'}
          </button>
        </div>
      </div>
      <header className="top container">
        <a
          className="brand"
          href={href({ ...defaultLocation, view: 'home' })}
          onClick={(e) => {
            e.preventDefault();
            go({ ...defaultLocation, view: 'home' });
          }}
        >
          <span className="brand-name">{name}</span>
          <span className="brand-state">이름 검토 중</span>
        </a>
        <form
          aria-label="게시글 찾기"
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: query, page: 1, view: 'list', post: '' });
          }}
        >
          <label className="sr-only" htmlFor="search">
            게시글 검색
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·내용 검색"
            maxLength={200}
          />
          <button aria-label="검색">
            <Search size={20} aria-hidden="true" />
          </button>
        </form>
        {actor ? (
          <button
            type="button"
            className="session"
            onClick={() => {
              setActor(null);
              setDraft(emptyDraft);
              setComment('');
              setEditReply(null);
              setParent(null);
              setNotice('체험 로그아웃했습니다. 작성 중 입력은 지웠습니다. 등록한 체험 글은 화면에 남습니다.');
            }}
          >
            체험 로그아웃
          </button>
        ) : (
          <button type="button" className="session" onClick={() => needLogin()}>
            체험 로그인
          </button>
        )}
      </header>
      <nav className="tabs" aria-label="주 메뉴">
        <div className="container">
          {navItems.map(([view, label, group]) => (
            <button
              key={view}
              type="button"
              aria-current={group.includes(loc.view) ? 'page' : undefined}
              onClick={() =>
                view === 'list'
                  ? go({ view: 'list', post: '', page: 1, board: 'all', q: '', feed: 'all', situation: 'all', mine: false })
                  : go({ ...defaultLocation, view })
              }
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="tab-activity"
            onClick={() => (actor ? open({ type: 'activity' }) : needLogin('activity'))}
          >
            내 활동
          </button>
        </div>
      </nav>
      {designOpen && (
        <DesignExplorer
          value={composition}
          change={setComposition}
          cancel={() => {
            setComposition(applied);
            setDesignOpen(false);
          }}
          apply={() => {
            const stored = saveComposition(composition);
            setApplied(composition);
            setDesignOpen(false);
            setNotice(
              stored
                ? '목록 구성을 적용했어요. 이 브라우저에서 다음에도 사용할 수 있어요.'
                : '목록 구성을 적용했어요. 브라우저 저장이 제한되어 현재 화면에만 적용됩니다.',
            );
          }}
        />
      )}
      <div className="container frame" data-rail={fullWidth ? 'none' : 'right'}>
        <main id="main" ref={main} tabIndex={-1} data-frame="main">
          <output className={`feedback global-feedback ${notice ? 'has-notice' : ''}`}>{notice}</output>
          {loc.view === 'home' ? (
            <Home loc={loc} posts={posts} actor={actor} go={go} compose={compose} />
          ) : loc.view === 'guides' ? (
            <GuideDirectory />
          ) : loc.view === 'studio' ? (
            <StudioView
              settings={{ name, composition: applied, announcement, accent }}
              apply={(s) => {
                setName(s.name);
                setAnnouncement(s.announcement);
                setAccent(s.accent);
                setComposition(s.composition);
                setApplied(s.composition);
              }}
              reports={allReports.map(({ target, reason, status, at, updated }, index) => ({
                id: String(index),
                target,
                reason,
                status,
                at,
                updated,
              }))}
              updateReport={(id, status) =>
                setAllReports(
                  allReports.map((r, index) =>
                    String(index) === id ? { ...r, status, updated: new Date().toISOString() } : r,
                  ),
                )
              }
              go={go}
            />
          ) : loc.view === 'compose' ? (
            <>
              {backButton}
              <PageHead
                title={draft.editId ? '글 수정' : '글쓰기'}
                sub="제목, 내용, 분야만 있으면 됩니다. 익명으로 공개됩니다."
              />
              {!actor ? (
                <div className="empty">
                  <h2>체험 로그인 후 글을 쓸 수 있어요.</h2>
                  <p>실제 계정은 만들지 않습니다.</p>
                  <button type="button" className="primary" onClick={() => needLogin('compose')}>
                    체험 로그인
                  </button>
                </div>
              ) : (
                <form
                  className="compose"
                  onSubmit={(e) => {
                    e.preventDefault();
                    savePost();
                  }}
                >
                  <div className="compose-fields">
                    <label htmlFor="compose-title">제목</label>
                    <input
                      id="compose-title"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      maxLength={100}
                      required
                      placeholder="질문이나 이야기를 한 줄로"
                    />
                    <label htmlFor="compose-body">내용</label>
                    <textarea
                      id="compose-body"
                      rows={10}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      maxLength={5000}
                      required
                      placeholder="질문과 경험을 자유롭게 적어 주세요."
                    />
                  </div>
                  <div className="compose-meta">
                    <label htmlFor="compose-board">분야</label>
                    <select
                      id="compose-board"
                      value={draft.board}
                      onChange={(e) => setDraft({ ...draft, board: e.target.value as Board })}
                    >
                      {Object.entries(boards).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="compose-situation">
                      상황 <span className="muted">선택</span>
                    </label>
                    <select
                      id="compose-situation"
                      value={draft.situation || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          situation: (e.target.value || undefined) as Situation | undefined,
                        })
                      }
                    >
                      <option value="">선택 안 함</option>
                      {Object.entries(situations).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="error" role="alert">
                    {error}
                  </p>
                  <div className="actions">
                    <button className="primary" type="submit">
                      {draft.editId ? '수정 내용 반영' : '체험 글 등록'}
                    </button>
                    <button type="button" onClick={() => go({ view: returnView, post: '' })}>
                      초안 남기고 나가기
                    </button>
                  </div>
                  <p className="fine">
                    작성 중 목록으로 나가도 초안은 남습니다. 새로고침하면 사라집니다.
                  </p>
                </form>
              )}
            </>
          ) : loc.view === 'detail' ? (
            active ? (
              <>
                {backButton}
                <article className="detail">
                  <div className="detail-tags">
                    <button
                      type="button"
                      className="chip-link"
                      onClick={() => go({ view: 'list', post: '', board: active.board, page: 1, q: '' })}
                    >
                      {boards[active.board]}
                    </button>
                    {active.situation && <span className="chip">{situations[active.situation]}</span>}
                    {active.sample && <span className="row-sample">구성 예시</span>}
                  </div>
                  <h1 className="detail-title" data-role="page-title">
                    {active.title}
                  </h1>
                  <div className="detail-meta">
                    <span>
                      익명 {active.isMine && <span className="mine-tag">내 글</span>}
                    </span>
                    {!active.sample && (
                      <span>
                        작성 <time dateTime={active.at}>{date(active.at)} KST</time>
                      </span>
                    )}
                    {active.updated && (
                      <span>
                        수정 <time dateTime={active.updated}>{date(active.updated)} KST</time>
                      </span>
                    )}
                    <span>댓글 {active.replies.filter((r) => !r.deleted).length}</span>
                  </div>
                  {active.correction && (
                    <div className="correction">
                      <strong>정정·수정 안내</strong>
                      <p>{active.correction}</p>
                    </div>
                  )}
                  <p className="article-body">{active.body}</p>
                  <p className="source-line">
                    {active.sample ? '구성 예시 · 실제 회원 글이 아닙니다.' : '현재 화면에만 남는 체험 글입니다.'}
                  </p>
                  <div className="post-actions">
                    <button
                      type="button"
                      aria-pressed={saved.includes(active.id)}
                      onClick={() => {
                        if (!actor) {
                          needLogin();
                          return;
                        }
                        setSaved(
                          saved.includes(active.id)
                            ? saved.filter((id) => id !== active.id)
                            : [...saved, active.id],
                        );
                        setNotice('저장 목록을 현재 화면에서 변경했습니다. 새로고침하면 초기화됩니다.');
                      }}
                    >
                      <Bookmark size={17} aria-hidden="true" />
                      {saved.includes(active.id) ? '저장됨' : '글 저장'}
                    </button>
                    <button
                      type="button"
                      disabled={reports.includes(active.id)}
                      onClick={() => {
                        if (!actor) {
                          needLogin();
                          return;
                        }
                        open({ type: 'report', target: active.id });
                      }}
                    >
                      {reports.includes(active.id) ? '신고 체험 완료' : '신고'}
                    </button>
                    {active.isMine && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDraft({
                              title: active.title,
                              body: active.body,
                              situation: active.situation,
                              board: active.board,
                              editId: active.id,
                            });
                            go({ view: 'compose' });
                          }}
                        >
                          내 글 수정
                        </button>
                        <button
                          type="button"
                          onClick={() => open({ type: 'delete', kind: 'post', target: active.id })}
                        >
                          내 글 삭제
                        </button>
                      </>
                    )}
                  </div>
                </article>
                <section className="comments" aria-labelledby="comments-title">
                  <h2 id="comments-title">
                    댓글 <span>{active.replies.filter((r) => !r.deleted).length}</span>
                  </h2>
                  {active.replies.length ? (
                    active.replies
                      .filter((r) => !r.parent)
                      .map((r) => (
                        <div key={r.id}>
                          {replyItem(r)}
                          {active.replies.filter((child) => child.parent === r.id).map(replyItem)}
                        </div>
                      ))
                  ) : (
                    <p className="quiet">아직 댓글이 없어요. 첫 이야기를 남겨주세요.</p>
                  )}
                  <form
                    className="comment-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitReply();
                    }}
                  >
                    <div className="comment-form-heading">
                      <label htmlFor="comment-body">
                        {editReply ? '내 댓글 수정' : parent ? '답글 남기기' : '익명으로 댓글 남기기'}
                      </label>
                      {(parent || editReply) && (
                        <button
                          type="button"
                          onClick={() => {
                            setParent(null);
                            setEditReply(null);
                            setComment('');
                          }}
                        >
                          취소
                        </button>
                      )}
                    </div>
                    {actor ? (
                      <>
                        <textarea
                          id="comment-body"
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          required
                          maxLength={1000}
                          placeholder="서로의 경험을 존중해 주세요."
                        />
                        <p className="fine">댓글은 현재 화면에만 남습니다. 실제 서버로 전송되지 않습니다.</p>
                        <p className="error" role="alert">
                          {error}
                        </p>
                        <button className="primary" type="submit">
                          {editReply ? '댓글 수정 반영' : parent ? '체험 답글 등록' : '체험 댓글 등록'}
                        </button>
                      </>
                    ) : (
                      <div className="login-invite">
                        <p>읽기는 누구나, 댓글은 로그인 후에.</p>
                        <button type="button" onClick={() => needLogin()}>
                          체험 로그인 <ChevronRight size={16} aria-hidden="true" />
                        </button>
                        <span className="fine">실인증·서버 저장은 연결 전입니다.</span>
                      </div>
                    )}
                  </form>
                </section>
              </>
            ) : (
              <div className="empty">
                <h1 data-role="page-title">글을 찾을 수 없어요.</h1>
                <p>체험 글은 새로고침하면 사라집니다. 주소가 맞는지도 확인해 주세요.</p>
                <button type="button" className="primary" onClick={() => go({ view: 'list', post: '' })}>
                  목록으로
                </button>
              </div>
            )
          ) : isInfo ? (
            <Info view={loc.view} go={go} />
          ) : (
            <>
              <PageHead
                title={loc.q ? '검색 결과' : loc.mine ? '내가 쓴 글' : '커뮤니티'}
                sub={
                  loc.q ? (
                    <>
                      ‘{loc.q}’ 검색 결과{' '}
                      <button type="button" className="clear-search" onClick={() => go({ q: '', page: 1 })}>
                        검색 해제
                      </button>
                    </>
                  ) : loc.board === 'all' ? (
                    '전직·취업·창업·교육·생활·보훈의 이야기'
                  ) : (
                    `${boards[loc.board as Board]} 분야의 글`
                  )
                }
                action={
                  <button type="button" className="primary" onClick={compose}>
                    <PenLine size={17} aria-hidden="true" />
                    글쓰기
                  </button>
                }
              />
              <CommunityFilters loc={loc} go={go} total={list.total} />
              {realCount === 0 && list.total > 0 && (
                <p className="sample-line">
                  실제 회원 글은 아직 없습니다. 아래는 화면 확인용 구성 예시입니다.
                </p>
              )}
              {list.total > 0 ? (
                <PostRows posts={list.posts} loc={loc} from="list" go={go} tagSamples={realCount > 0} />
              ) : (
                <div className="empty">
                  <h2>조건에 맞는 글이 없어요.</h2>
                  <p>검색어를 줄이거나 분야·상황 조건을 풀어 보세요.</p>
                  <button
                    type="button"
                    onClick={() => go({ q: '', board: 'all', mine: false, page: 1, situation: 'all', feed: 'all' })}
                  >
                    전체 글 보기
                  </button>
                </div>
              )}
              {list.pages > 1 && (
                <nav className="pagination" aria-label="페이지">
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={list.page === 1}
                    onClick={() => go({ page: list.page - 1 })}
                  >
                    이전
                  </button>
                  {Array.from({ length: list.pages }, (_, i) => (
                    <button
                      type="button"
                      key={i}
                      aria-current={list.page === i + 1 ? 'page' : undefined}
                      onClick={() => go({ page: i + 1 })}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={list.page === list.pages}
                    onClick={() => go({ page: list.page + 1 })}
                  >
                    다음
                  </button>
                </nav>
              )}
              <p className="fine">체험 글은 새로고침하면 초기화됩니다.</p>
            </>
          )}
        </main>
        {!fullWidth && (
          <aside className="rail" data-frame="rail" aria-label="보조 정보">
            {railContent()}
          </aside>
        )}
      </div>
      {['home', 'list', 'guides'].includes(loc.view) && (
        <nav className="quick-bar" aria-label="빠른 메뉴">
          <button type="button" aria-current={loc.view === 'home' ? 'page' : undefined} onClick={() => go({ ...defaultLocation, view: 'home' })}>
            홈
          </button>
          <button type="button" aria-current={loc.view === 'list' ? 'page' : undefined} onClick={() => go({ view: 'list', post: '' })}>
            커뮤니티
          </button>
          <button type="button" className="quick-write" onClick={compose}>
            <PenLine size={16} aria-hidden="true" />
            글쓰기
          </button>
        </nav>
      )}
      <footer className="container footer">
        <div className="footer-top">
          <strong>{name}</strong>
          <nav aria-label="이용 정책">
            {infoViews.map((v) => (
              <a
                key={v}
                href={href({ ...loc, view: v })}
                onClick={(e) => {
                  e.preventDefault();
                  go({ view: v, post: '' });
                }}
              >
                {infoTitles[v]}
              </a>
            ))}
          </nav>
        </div>
        <div className="footer-tools">
          <button type="button" onClick={() => open({ type: 'reading' })}>
            읽기 설정
          </button>
          <button type="button" onClick={() => go({ view: 'studio', post: '' })}>
            운영실 체험
          </button>
          <a href="/site-lab-artifacts/">산출물 모음</a>
          <a href="/site-lab-artifacts/reports/pre-settings-handoff.html">이번 준비와 종료 조건</a>
        </div>
        <p>
          {siteConfig.office} · {siteConfig.notice}
        </p>
        <p>체험 내용은 현재 화면의 메모리에만 남으며 새로고침하면 초기화됩니다.</p>
      </footer>
      <Dialog.Root
        open={!!modal}
        onOpenChange={(o) => {
          if (!o) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-backdrop" />
          <Dialog.Popup
            className="modal"
            finalFocus={opener}
            style={{ '--accent': siteConfig.themes[accent].color } as CSSProperties}
          >
            <div className="modal-heading">
              <Dialog.Title>
                {modal?.type === 'login'
                  ? '체험 로그인'
                  : modal?.type === 'report'
                    ? '신고 흐름 체험'
                    : modal?.type === 'delete'
                      ? '삭제할까요?'
                      : modal?.type === 'activity'
                        ? '내 활동'
                        : '읽기 설정'}
              </Dialog.Title>
              <Dialog.Close aria-label="닫기">
                <X size={20} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="modal-description">
              {modal?.type === 'login'
                ? '계정을 만들지 않고 작성 흐름을 시험합니다. 실제 개인정보를 입력하지 마세요.'
                : modal?.type === 'report'
                  ? '운영자에게 전달되는 기능은 연결 전입니다. 선택한 상태만 현재 화면에 남습니다.'
                  : modal?.type === 'delete'
                    ? '이 체험 화면에서 삭제하며 되돌릴 수 없습니다.'
                    : modal?.type === 'activity'
                      ? '현재 체험 계정의 글과 저장한 글입니다. 새로고침하면 초기화됩니다.'
                      : '기기와 브라우저의 확대 설정도 사용할 수 있습니다.'}
            </Dialog.Description>
            {modal?.type === 'login' ? (
              <>
                <label htmlFor="demo-account">합성 체험 계정</label>
                <select id="demo-account" value={account} onChange={(e) => setAccount(e.target.value)}>
                  <option value="demo-1">체험 회원 1</option>
                  <option value="demo-2">체험 회원 2</option>
                </select>
                <p className="fine">
                  글과 댓글에는 모두 ‘익명’으로 표시됩니다. 네이버·카카오·PASS, 연령·보호자 확인은 연결 전입니다.
                </p>
                <button type="button" className="primary wide" onClick={login}>
                  선택한 계정으로 체험
                </button>
              </>
            ) : modal?.type === 'report' ? (
              <>
                <label htmlFor="report-reason">신고 사유</label>
                <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option>개인정보 노출</option>
                  <option>비방·혐오 표현</option>
                  <option>광고·도배</option>
                  <option>잘못된 정보</option>
                  <option>도움이 시급한 내용</option>
                </select>
                <button
                  type="button"
                  className="primary wide"
                  onClick={() => {
                    setAllReports([
                      ...allReports,
                      {
                        target: modal.target!,
                        actor: actor!,
                        reason,
                        status: '접수 체험',
                        at: new Date().toISOString(),
                        updated: new Date().toISOString(),
                      },
                    ]);
                    setModal(null);
                    setNotice(`신고 체험 완료 · ${reason}. 운영자에게 전송되지는 않았습니다.`);
                  }}
                >
                  신고 상태 체험
                </button>
              </>
            ) : modal?.type === 'delete' ? (
              <>
                <p>
                  {modal.kind === 'post'
                    ? '이 글과 그 아래의 체험 댓글이 함께 삭제됩니다.'
                    : '이어진 답글이 있으면 삭제된 자리만 남깁니다.'}
                </p>
                <p className="error" role="alert">
                  {error}
                </p>
                <div className="actions">
                  <button type="button" className="danger" onClick={confirmDelete}>
                    삭제 확인
                  </button>
                  <Dialog.Close>취소</Dialog.Close>
                </div>
              </>
            ) : modal?.type === 'reading' ? (
              <>
                <label htmlFor="reading-scale">글자 크기</label>
                <select id="reading-scale" value={scale} onChange={(e) => setScale(e.target.value)}>
                  <option value="100">기본</option>
                  <option value="115">115% · 조금 크게</option>
                  <option value="125">125% · 크게</option>
                  <option value="150">150% · 더 크게</option>
                  <option value="200">200% · 아주 크게</option>
                </select>
                <p className="fine">이 설정은 현재 화면에만 적용됩니다.</p>
                <Dialog.Close className="primary wide">적용하고 닫기</Dialog.Close>
              </>
            ) : modal?.type === 'activity' ? (
              <div className="activity">
                <h3>내가 쓴 글</h3>
                {posts.filter((p) => p.owner === actor).length ? (
                  posts
                    .filter((p) => p.owner === actor)
                    .map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setModal(null);
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        {p.title}
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    ))
                ) : (
                  <p>아직 쓴 글이 없어요.</p>
                )}
                <h3>내가 남긴 댓글</h3>
                {(() => {
                  const mine = posts.flatMap((p) =>
                    p.replies.filter((r) => r.owner === actor && !r.deleted).map((r) => ({ p, r })),
                  );
                  return mine.length ? (
                    mine.map(({ p, r }) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => {
                          setModal(null);
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        <span>
                          {r.body}
                          <small>{p.title}</small>
                        </span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    ))
                  ) : (
                    <p>아직 남긴 댓글이 없어요.</p>
                  );
                })()}
                <h3>저장한 글</h3>
                {posts.some((p) => saved.includes(p.id)) ? (
                  posts
                    .filter((p) => saved.includes(p.id))
                    .map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setModal(null);
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        {p.title}
                        <Check size={16} aria-hidden="true" />
                      </button>
                    ))
                ) : (
                  <p>아직 저장한 글이 없어요.</p>
                )}
              </div>
            ) : null}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Info({ view, go }: { view: string; go: (s: Partial<LocationState>) => void }) {
  return (
    <>
      <PageHead title={infoTitles[view]} sub="운영 연결 전 · 초안" />
      <section className="info">
        {view === 'office' ? (
          <>
            <p>
              전직·취업·창업·교육·생활·보훈을 묻고 나누는 커뮤니티를 준비합니다. 20~50대, 특히 2030이 읽고 필요할 때 참여하는 공간을 실험합니다. 이름과 첫 출시 범위는 아직 정하지 않았습니다.
            </p>
            <h2>질문과 경험이 쌓이는 곳</h2>
            <p>
              다음 일을 준비하며 궁금했던 점이나 일상에 관해 묻고 답할 수 있는 공간입니다. 개인의 경험과 사무소의 답변을 구분하고, 제도 안내는 공식 원문에서 확인할 수 있도록 합니다.
            </p>
            <h2>운영 연결 전</h2>
            <p>
              사무소의 목적을 담되 커뮤니티 자체의 읽기와 대화를 독립적으로 사용할 수 있게 합니다. 사무소와의 정확한 연결 범위, 담당자·업무 연락처·소재지는 확인 후 공개할 항목입니다.
            </p>
            <p>
              개별 사건 자료나 진단서는 공개 게시판에 올리지 마세요. 비공개 상담·자료 전달 창구는 연결 전이며 이 화면에서는 접수하지 않습니다.
            </p>
          </>
        ) : view === 'help' ? (
          <>
            <h2>글을 읽고, 묻고, 돌아오기</h2>
            <p>
              커뮤니티에서 분야를 고르거나 제목과 내용으로 검색할 수 있습니다. 상세에서 목록으로 돌아오면 검색어와 페이지가 유지됩니다.
            </p>
            <p>글과 댓글은 익명으로 표시합니다. 체험 로그인 후 내가 쓴 글·댓글을 수정하거나 삭제할 수 있습니다.</p>
            <h2>공식 답변과 구분해 주세요</h2>
            <p>
              현재 모든 예시 내용은 합성 자료입니다. 운영 안내 예시도 실제 운영진의 검토가 아닙니다. 법령·처분과 관련한 판단은 검증된 출처와 전문가 확인이 필요합니다.
            </p>
          </>
        ) : view === 'terms' ? (
          <>
            <p>
              이 문서는 시안 이용 안내입니다. 실제 회원 서비스의 약관은 운영자 정보·문의 창구·시행일을 확정한 뒤 검토해야 합니다.
            </p>
            <h2>참여 원칙</h2>
            <p>
              다른 사람의 개인정보, 비방·혐오, 도배·광고, 권리를 침해하는 내용을 게시하지 않습니다. 작성자는 본인 글과 댓글을 수정·삭제할 수 있어야 합니다.
            </p>
            <h2>가입·운영 절차</h2>
            <p>
              14세 미만 이용 방향은 유지하되 보호자 확인·동의와 연령별 안내는 실제 인증 연결 전에 확정합니다. 신고 판단·이의 제기·이용 제한·탈퇴 절차도 운영 약관에 명시해야 합니다.
            </p>
          </>
        ) : view === 'privacy' ? (
          <>
            <p>
              이 로컬 시안은 실제 가입·외부 AI 전송·서버 저장을 연결하지 않았습니다. 질문이나 개인정보를 실제 서비스 자료로 입력하지 마세요.
            </p>
            <h2>체험 자료</h2>
            <p>
              작성 내용, 체험 로그인, 저장한 글과 신고 상태는 현재 화면의 메모리에만 유지하며 새로고침하면 초기화됩니다. 목록 구성 선택은 이 브라우저의 로컬스토리지에 저장합니다. 체험 원문은 쿠키·로컬스토리지에 기록하지 않습니다.
            </p>
            <h2>운영 전에 확정할 항목</h2>
            <p>
              운영자·연락처, 수집 목적·항목, 보관 기간·삭제, 민감정보 동의, 수탁사·외부 제공, 아동·보호자 절차를 확정하고 고지해야 합니다. 이 화면은 확정된 개인정보처리방침이 아닙니다.
            </p>
          </>
        ) : (
          <>
            <p>
              내 체험 글과 댓글은 상세 화면의 수정·삭제 버튼으로 지울 수 있습니다. 새로고침하면 모든 체험 입력이 초기화됩니다.
            </p>
            <h2>타인의 글에 내 정보가 있나요?</h2>
            <p>
              신고에서 ‘개인정보 노출’을 선택하는 흐름을 살펴볼 수 있습니다. 실제 접수·회신은 연결 전이며 요청이 전송되지 않습니다.
            </p>
            <p className="notice">
              운영자명과 문의 이메일이 아직 정해지지 않아 실제 삭제 요청을 받는다고 표시하지 않습니다. 서비스 공개 전에 접수 창구와 처리 절차를 연결해야 합니다.
            </p>
          </>
        )}
        <button type="button" className="back" onClick={() => go({ view: 'list', post: '' })}>
          <ArrowLeft size={17} aria-hidden="true" />
          커뮤니티로
        </button>
      </section>
    </>
  );
}
