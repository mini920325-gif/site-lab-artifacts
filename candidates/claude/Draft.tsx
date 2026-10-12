'use client';
import {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type CSSProperties,
  Fragment,
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
  User,
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
  type LocationState,
  type InfoBack,
  infoViews,
  type Board,
  type PublicPost,
} from './domain';
import { StudioView } from './StudioView';
import { siteConfig, type Accent } from './site-config';
import { CommunityFilters } from './CommunityTools';
import { DesignExplorer } from './DesignExplorer';
import { ReviewWorkspace } from './ReviewWorkspace';
import { readReviewBundle } from './review';
import { exportReviewHTML } from './review-export';
import { readDesign, saveDesign, designTokens, type Design } from './design';
import { JourneyHome, GuideDirectory } from './JourneyHome';
import { allSampleNotice } from './journey-content';
import './draft.css';
import './journey.css';
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
export default function Draft({
  initialSearch = '',
  initialPath = '/',
}: {
  initialSearch?: string;
  initialPath?: string;
}) {
  const designPreview = new URLSearchParams(initialSearch).get('designPreview') === '1';
  const [reviewInitial] = useState(() => designPreview ? null : readReviewBundle(readDesign()));
  const [loc, setLoc] = useState(() =>
    readLocation(initialSearch, initialPath),
  );
  const ready = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const [posts, setPosts] = useState(initialPosts);
  const [query, setQuery] = useState(
    () => readLocation(initialSearch, initialPath).q,
  );
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
    {
      target: string;
      actor: string;
      reason: string;
      status: string;
      at: string;
      updated: string;
    }[]
  >([]);
  const reports = allReports
    .filter((r) => r.actor === actor)
    .map((r) => r.target);
  const [reason, setReason] = useState('개인정보 노출');
  const [savedByActor, setSavedByActor] = useState<Record<string, string[]>>(
    {},
  );
  const saved = actor ? savedByActor[actor] || [] : [];
  const setSaved = (ids: string[]) => {
    if (actor) setSavedByActor((previous) => ({ ...previous, [actor]: ids }));
  };
  const [name, setName] = useState<string>(siteConfig.name);
  const [announcement, setAnnouncement] = useState<string>(
    siteConfig.announcement,
  );
  const [design, setDesign] = useState<Design>(() => reviewInitial?.state.working.design ?? readDesign());
  const [appliedDesign, setAppliedDesign] = useState<Design>(readDesign);
  const [designOpen, setDesignOpen] = useState(false);
  const accent: Accent = design.color;
  const [scale, setScale] = useState('100');
  const opener = useRef<HTMLElement | null>(null);
  const main = useRef<HTMLElement | null>(null);
  const listScroll = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const searchToggle = useRef<HTMLButtonElement | null>(null);
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
    if (
      ['list', 'home'].includes(loc.view) &&
      ['detail', 'compose'].includes(next.view)
    ) {
      listScroll.current = window.scrollY;
      next.from = loc.view as 'home' | 'list';
    }
    // 안내 화면(이용 안내·약관 등)으로 들어갈 때 온 곳을 적는다 — 되돌아가기가 실제로 온 곳을 가리키게.
    // 안내 화면끼리 옮겨 다닐 때는 처음 온 곳을 그대로 둔다. 글에서 왔으면 그 글로 돌아가도록 글 번호를 남긴다.
    if (infoViews.includes(next.view) && !infoViews.includes(loc.view)) {
      next.back = (['home', 'list', 'guides', 'detail'] as const).includes(
        loc.view as InfoBack,
      )
        ? (loc.view as InfoBack)
        : 'home';
      next.post = next.back === 'detail' ? loc.post : '';
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
          next.view === returnView && loc.view === 'detail'
            ? listScroll.current
            : 0,
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
  function startQuestion(situation?: Situation, title = '') {
    if (draft.editId || (!draft.title.trim() && !draft.body.trim())) {
      setDraft({
        ...emptyDraft,
        situation,
        title,
        board: situation === 'learning' ? 'education' : situation === 'daily' ? 'life' : situation === 'starting' ? 'startup' : situation === 'preparing' ? 'benefits' : 'transition',
      });
    } else {
      setNotice('이전에 작성하던 질문을 이어서 열었습니다.');
    }
    if (!actor) needLogin('compose');
    else go({ view: 'compose', post: '' });
  }
  function update(fn: () => void) {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '처리하지 못했습니다. 내용을 확인하고 다시 시도해 주세요.',
      );
    }
  }
  const list = selectPosts(posts, loc, actor);
  // D-13: 실제 글이 하나도 없으면 「구성 예시」 는 목록 위 한 줄로만, 행 꼬리표는 실제 글과 섞일 때만
  const allSample = posts.length > 0 && posts.every((p) => p.sample);
  const internal = posts.find((p) => p.id === loc.post);
  const active = internal ? publicPost(internal, actor) : undefined;
  const isInfo = infoViews.includes(loc.view);
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
                  correction:
                    '글쓴이가 내용을 수정했습니다. 이전 원문은 이 체험에서 보관하지 않습니다.',
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
        const old = internal.replies.find(
          (r) => r.id === editReply && !r.deleted,
        );
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
        if (
          parent &&
          !internal.replies.some(
            (r) => r.id === parent && !r.deleted && !r.parent,
          )
        )
          throw new Error('답글을 달 수 없는 댓글입니다.');
        setPosts(
          posts.map((p) =>
            p.id === internal.id
              ? {
                  ...p,
                  replies: [
                    ...p.replies,
                    {
                      id: crypto.randomUUID(),
                      owner: actor,
                      body,
                      parent,
                      at: now,
                    },
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
        <p>
          {r.deleted
            ? '작성자가 삭제했습니다. 이어진 답글은 남겨두었습니다.'
            : r.body}
        </p>
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
                      <a
                        href={r.source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        출처 열기
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            ) : r.source ? (
              <p className="staff-source-pending">
                출처 슬롯(미검수) · 공개 권위로 표시하지 않습니다.
              </p>
            ) : null}
          </div>
        )}
        {!r.deleted && (
          <div className="comment-actions">
            {!r.parent && (
              <button
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
                  aria-label="내 댓글 삭제"
                  onClick={() =>
                    open({ type: 'delete', kind: 'reply', target: r.id })
                  }
                >
                  삭제
                </button>
              </>
            ) : (
              <button
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
  // D-21: 게시판 이름은 늘 「커뮤니티」(분야·상황 걸러보기와 무관), 글쓰기 화면은 「글쓰기」.
  // 빵부스러기 첫 칸은 「홈」 — 사이트 이름(지금 자리표시 「커뮤니티」)을 쓰면 「커뮤니티 / 커뮤니티」 가 된다.
  const viewTitle =
    loc.view === 'compose'
      ? draft.editId ? '글 수정' : '글쓰기'
      : loc.view === 'studio'
        ? '운영실'
        : loc.view === 'guides'
          ? '자료실'
          : isInfo
            ? '이용 안내'
            : '커뮤니티';
  const crumbs: string[] =
    loc.view === 'home'
      ? []
      : loc.view === 'compose' || loc.view === 'detail'
        ? ['커뮤니티', ...(loc.view === 'compose' ? [viewTitle] : [])]
        : [viewTitle];
  // 로그인 단추는 머리에 두 번 그린다: 540 이하는 로고·검색 바로 뒤(auth-compact), 541 이상은 맨 끝(auth-wide).
  // 한 폭에서는 한쪽만 보이고(display:none 쪽은 탭 순서에서도 빠진다) 키보드 순서가 화면 순서와 같아진다.
  const authButton = (variant: string) =>
    actor ? (
      <button
        className={variant}
        onClick={() => {
          setActor(null);
          setDraft(emptyDraft);
          setComment('');
          setEditReply(null);
          setParent(null);
          setNotice(
            '체험 로그아웃했습니다. 작성 중 입력은 지웠습니다. 등록한 체험 글은 화면에 남습니다.',
          );
        }}
      >
        체험 로그아웃
      </button>
    ) : (
      <button className={variant} onClick={() => needLogin()}>
        체험 로그인
      </button>
    );
  return (
    <div
      className="draft journey-design"
      data-variant={loc.variant}
      data-view={loc.view}
      data-layout={design.layout}
      data-spacing={design.spacing}
      data-type={design.type}
      data-frame-style={design.frame}
      data-corners={design.corners}
      data-symbols={design.symbols}
      data-preview={designPreview}
      style={designTokens(design) as CSSProperties}
      data-ready={ready}
      inert={!ready || designPreview}
    >
      <a href="#main" className="skip">
        본문으로 바로가기
      </a>
      <div className="office-notice demo-banner">
        <div className="container">
          <span className="banner-text" title={announcement || siteConfig.announcement}>
            <span className="banner-full">{announcement || siteConfig.announcement}</span>
            <span className="banner-short" aria-hidden="true">체험 화면</span>
          </span>
          <button aria-expanded={designOpen} aria-controls="design-explorer" onClick={() => {
            if (designOpen) setDesign(appliedDesign);
            setDesignOpen(!designOpen);
          }}>{designOpen ? '비교 닫기' : '디자인 비교'}</button>
        </div>
      </div>
      <header className="header container" data-review-target="header" data-review-label="상단 메뉴">
        <a
          className="brand"
          href={href({ ...defaultLocation, view: 'home', variant: loc.variant })}
          onClick={(e) => {
            e.preventDefault();
            go({ ...defaultLocation, view: 'home', variant: loc.variant });
          }}
        >
          <span className="brand-name">{name}</span>
        </a>
        <button
          type="button"
          ref={searchToggle}
          className="search-toggle"
          aria-label="검색 열기"
          aria-expanded={searchOpen}
          aria-controls="site-search"
          onClick={() => {
            const next = !searchOpen;
            setSearchOpen(next);
            if (next) requestAnimationFrame(() => searchInput.current?.focus());
          }}
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          className="activity-compact"
          aria-label="내 활동"
          title="내 활동"
          onClick={() =>
            actor ? open({ type: 'activity' }) : needLogin('activity')
          }
        >
          <User size={20} />
        </button>
        {authButton('auth-compact')}
        <nav className="board-nav" aria-label="주 메뉴">
            <button aria-current={loc.view === 'home' ? 'page' : undefined} className={loc.view === 'home' ? 'active' : ''} onClick={() => go({ view: 'home', post: '' })}>홈</button>
            <button
              aria-current={
                ['list', 'detail', 'compose'].includes(loc.view)
                  ? 'page'
                  : undefined
              }
              className={
                ['list', 'detail', 'compose'].includes(loc.view) ? 'active' : ''
              }
              onClick={() =>
                go({ view: 'list', post: '', page: 1, board: 'all', q: '' })
              }
            >
              커뮤니티
            </button>
            <button
              aria-current={loc.view === 'guides' ? 'page' : undefined}
              className={loc.view === 'guides' ? 'active' : ''}
              onClick={() => go({ view: 'guides', post: '' })}
            >
              자료실
            </button>
            <button
              className={loc.view === 'office' ? 'active' : ''}
              aria-current={loc.view === 'office' ? 'page' : undefined}
              onClick={() => go({ view: 'office', post: '' })}
            >
              소개
            </button>
            <button
              className="activity-link"
              onClick={() =>
                actor ? open({ type: 'activity' }) : needLogin('activity')
              }
            >
              내 활동
            </button>
        </nav>
        <form
          aria-label="게시글 찾기"
          id="site-search"
          className="search"
          data-open={searchOpen || undefined}
          onKeyDown={(e) => {
            // Esc: 값이 있으면 첫 Esc 는 값만 지우고(넓은 폭의 브라우저 기본 동작과 같다), 값이 없을 때 Esc 는 열린 검색 줄을 닫는다.
            if (e.key !== 'Escape') return;
            e.preventDefault();
            if (query) setQuery('');
            else if (searchOpen) {
              setSearchOpen(false);
              searchToggle.current?.focus();
            }
          }}
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
            ref={searchInput}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어 입력"
            maxLength={200}
          />
          <button aria-label="검색">
            <Search size={20} />
          </button>
        </form>
        {authButton('auth-wide')}
      </header>
      {designOpen && !designPreview && <DesignExplorer value={design} appliedValue={appliedDesign} change={setDesign}
        cancel={() => { setDesign(appliedDesign); setDesignOpen(false); }}
        apply={() => {
          const stored = saveDesign(design);
          setAppliedDesign(design); setDesignOpen(false);
          setNotice(stored ? '화면 조합을 적용했어요. 이 브라우저에서 다음에도 사용할 수 있어요.' : '화면 조합을 적용했어요. 브라우저 저장이 제한되어 현재 화면에만 적용됩니다.');
        }} />}
      {!designPreview && <ReviewWorkspace design={design} route={loc.view} initialReview={reviewInitial ?? undefined}
        onDesign={(next) => { setDesign(next); setAppliedDesign(next); saveDesign(next); setDesignOpen(false); }}
        onNavigate={(view) => go({ view: view as LocationState['view'], post: '' })}
        sourcePreviewHTML={(review) => exportReviewHTML(review, loc.view)} />}
      <div className="container frame">
      <div className="workspace">
        <main id="main" ref={main} tabIndex={-1} data-frame="main" data-review-target="page" data-review-label="페이지 전체">
          <div className="breadcrumb">
            홈
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {' '}<span>/</span> {c}
              </Fragment>
            ))}
          </div>
          <output
            className={`feedback global-feedback ${notice ? 'has-notice' : ''}`}
          >
            {notice}
          </output>
          {loc.view === 'home' ? (
            <JourneyHome
              loc={loc}
              posts={posts}
              go={go}
              compose={startQuestion}
            />
          ) : loc.view === 'guides' ? (
            <GuideDirectory />
          ) : loc.view === 'studio' ? (
            <StudioView
              settings={{ name, variant: loc.variant, announcement, accent }}
              apply={(s) => {
                setName(s.name);
                setAnnouncement(s.announcement);
                const nextDesign = { ...design, color: s.accent, layout: s.variant === 'A' ? 'rows' as const : 'forum' as const };
                setDesign(nextDesign);
                setAppliedDesign(nextDesign);
                go({ variant: s.variant });
              }}
              reports={allReports.map(
                ({ target, reason, status, at, updated }, index) => ({
                  id: String(index),
                  target,
                  reason,
                  status,
                  at,
                  updated,
                }),
              )}
              updateReport={(id, status) =>
                setAllReports(
                  allReports.map((r, index) =>
                    String(index) === id
                      ? { ...r, status, updated: new Date().toISOString() }
                      : r,
                  ),
                )
              }
              go={go}
            />
          ) : loc.view === 'compose' ? (
            <>
              <button
                className="back"
                onClick={() => go({ view: returnView, post: '' })}
              >
                <ArrowLeft size={17} />
                {returnView === 'home' ? '홈으로' : '목록으로'}
              </button>
              <div className="section-heading">
                <div>
                  <h1 data-role="page-title">{viewTitle}</h1>
                  <p>제목, 내용, 게시판만 있으면 됩니다.</p>
                </div>
              </div>
              {!actor ? (
                <div className="empty">
                  <h2>체험 로그인 후 글을 쓸 수 있어요.</h2>
                  <p>실제 계정은 만들지 않습니다.</p>
                  <button
                    className="primary"
                    onClick={() => needLogin('compose')}
                  >
                    체험 로그인
                  </button>
                </div>
              ) : (
                <form
                  className="form-panel compose-minimal" data-review-target="compose" data-review-label="글쓰기"
                  onSubmit={(e) => {
                    e.preventDefault();
                    savePost();
                  }}
                >
                  <p className="fine">
                    익명 공개 · 이름·연락처 등 개인정보는 적지 마세요.
                  </p>
                  <label htmlFor="compose-title">제목</label>
                  <input
                    id="compose-title"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    maxLength={100}
                    required
                    placeholder="질문이나 이야기를 한 줄로"
                  />
                  <label htmlFor="compose-body">내용</label>
                  <textarea
                    id="compose-body"
                    rows={8}
                    value={draft.body}
                    onChange={(e) =>
                      setDraft({ ...draft, body: e.target.value })
                    }
                    maxLength={5000}
                    required
                    placeholder="질문과 경험을 자유롭게 적어 주세요. 근거 첨부는 필수가 아닙니다."
                  />
                  <label htmlFor="compose-board">게시판</label>
                  <select
                    id="compose-board"
                    value={draft.board}
                    onChange={(e) =>
                      setDraft({ ...draft, board: e.target.value as Board })
                    }
                  >
                    {Object.entries(boards).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="compose-situation">
                    상황 태그{' '}
                    <span className="muted">선택 · 필수는 아님</span>
                  </label>
                  <select
                    id="compose-situation"
                    value={draft.situation || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        situation: (e.target.value || undefined) as
                          | Situation
                          | undefined,
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
                  <p className="fine">
                    작성 중 목록으로 나가도 초안은 남습니다. 새로고침하면
                    사라집니다.
                  </p>
                  <p className="error" role="alert">
                    {error}
                  </p>
                  <div className="actions">
                    <button className="primary" type="submit">
                      {draft.editId ? '수정 내용 반영' : '체험 글 등록'}
                    </button>
                    <button
                      type="button"
                      onClick={() => go({ view: returnView, post: '' })}
                    >
                      초안 남기고 나가기
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : loc.view === 'detail' ? (
            active ? (
              <>
                <button
                  className="back"
                  onClick={() => go({ view: returnView, post: '' })}
                >
                  <ArrowLeft size={17} />
                  {returnView === 'home' ? '홈으로' : '목록으로'}
                </button>
                <article className="detail-panel" data-review-target="detail" data-review-label="글 상세">
                  <span className="topic-chip">
                    {boards[active.board]}
                    {active.situation && (
                      <span className="topic-sub">{` · ${situations[active.situation]}`}</span>
                    )}
                  </span>
                  <h1 className="detail-title" data-role="page-title">{active.title}</h1>
                  <div className="detail-meta">
                    <span>
                      익명{' '}
                      {active.isMine && <span className="mine-tag">내 글</span>}
                    </span>
                    {!active.sample && (
                      <span>
                        작성{' '}
                        <time dateTime={active.at}>{date(active.at)} KST</time>
                      </span>
                    )}
                    {active.updated && (
                      <span>
                        수정{' '}
                        <time dateTime={active.updated}>
                          {date(active.updated)} KST
                        </time>
                      </span>
                    )}
                  </div>
                  {active.correction && (
                    <div className="correction">
                      <strong>정정·수정 안내</strong>
                      <p>{active.correction}</p>
                    </div>
                  )}
                  <p className="article-body">{active.body}</p>

                  <div className="source-note">
                    <p>
                      {active.sample
                        ? '구성 예시 · 실제 회원 글이 아닙니다.'
                        : '현재 화면에만 남는 체험 글입니다.'}
                    </p>
                  </div>
                  <div className="post-actions">
                    <button
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
                        setNotice(
                          '저장 목록을 현재 화면에서 변경했습니다. 새로고침하면 초기화됩니다.',
                        );
                      }}
                    >
                      <Bookmark size={17} />
                      {saved.includes(active.id) ? '저장됨' : '글 저장'}
                    </button>
                    <button
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
                          onClick={() =>
                            open({
                              type: 'delete',
                              kind: 'post',
                              target: active.id,
                            })
                          }
                        >
                          내 글 삭제
                        </button>
                      </>
                    )}
                  </div>
                </article>
                <section className="comments" aria-labelledby="comments-title">
                  <h2 id="comments-title">
                    댓글{' '}
                    <span>
                      {active.replies.filter((r) => !r.deleted).length}
                    </span>
                  </h2>
                  {active.replies.length ? (
                    active.replies
                      .filter((r) => !r.parent)
                      .map((r) => (
                        <div key={r.id}>
                          {replyItem(r)}
                          {active.replies
                            .filter((child) => child.parent === r.id)
                            .map(replyItem)}
                        </div>
                      ))
                  ) : (
                    <div className="empty small">
                      <p>아직 댓글이 없어요. 첫 이야기를 남겨주세요.</p>
                    </div>
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
                        {editReply
                          ? '내 댓글 수정'
                          : parent
                            ? '답글 남기기'
                            : '익명으로 댓글 남기기'}
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
                          placeholder="서로의 경험을 존중해 주세요. 개인정보는 적지 마세요."
                        />
                        <p className="fine">
                          댓글은 현재 화면에만 남습니다. 실제 서버로 전송되지
                          않습니다.
                        </p>
                        <p className="error" role="alert">
                          {error}
                        </p>
                        <button className="primary" type="submit">
                          {editReply
                            ? '댓글 수정 반영'
                            : parent
                              ? '체험 답글 등록'
                              : '체험 댓글 등록'}
                        </button>
                      </>
                    ) : (
                      <div className="login-invite">
                        <p>읽기는 누구나, 댓글은 로그인 후에.</p>
                        <button type="button" onClick={() => needLogin()}>
                          체험 로그인 <ChevronRight size={16} />
                        </button>
                        <span className="fine">
                          실인증·서버 저장은 연결 전입니다.
                        </span>
                      </div>
                    )}
                  </form>
                </section>
              </>
            ) : (
              <div className="empty">
                <h1 data-role="page-title">글을 찾을 수 없어요.</h1>
                <p>
                  체험 글은 새로고침하면 사라집니다. 주소가 맞는지도 확인해
                  주세요.
                </p>
                <button
                  className="primary"
                  onClick={() => go({ view: 'list', post: '' })}
                >
                  목록으로
                </button>
              </div>
            )
          ) : isInfo ? (
            <Info view={loc.view} back={loc.back} go={go} />
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <h1 data-role="page-title">
                    {loc.q
                      ? `‘${loc.q}’ 검색 결과`
                      : loc.mine
                        ? '내가 쓴 글'
                        : viewTitle}
                  </h1>
                  <p>전직·취업·창업·교육·생활·보훈</p>
                </div>
                <button className="write-action" onClick={compose}>
                  <PenLine size={18} />
                  글쓰기
                </button>
              </div>
              <CommunityFilters loc={loc} go={go} />
              <div className="list-tools">
                <span>
                  글 <strong>{list.total}</strong>개
                  {loc.q && (
                    <button
                      className="clear-search"
                      onClick={() => go({ q: '', page: 1 })}
                    >
                      검색 해제
                    </button>
                  )}
                </span>
                <label>
                  정렬{' '}
                  <select
                    value={loc.sort}
                    onChange={(e) => go({ sort: e.target.value, page: 1 })}
                  >
                    <option value="latest">최근 작성순</option>
                    <option value="replies">댓글 많은순</option>
                  </select>
                </label>
              </div>
              {allSample && list.total > 0 && (
                <p className="sample-context">{allSampleNotice}</p>
              )}
              <div className="post-list title-first-list" data-review-target="post-list" data-review-label="게시글 목록">
                {list.total > 0 && (
                  <div className="list-head" aria-hidden="true">
                    <span>분야</span>
                    <span>제목</span>
                    <span>댓글</span>
                  </div>
                )}
                {list.posts.map((p) => {
                  const replyCount = p.replies.filter((r) => !r.deleted).length;
                  return (
                  <article className="post-row title-row" key={p.id}>
                    <div className="row-content">
                      <div className="title-row-meta">
                        <span
                          className="topic-chip"
                          title={`${boards[p.board]}${p.situation ? ` · ${situations[p.situation]}` : ''}`}
                        >
                          {boards[p.board]}
                          {p.situation && (
                            <span className="topic-sub">{` · ${situations[p.situation]}`}</span>
                          )}
                        </span>
                        {/* 댓글 정보는 이 한 칸: 숫자 또는 「없음」. 머리글이 있는 표에서는 「댓글 」 글씨를 화면에서만 숨긴다. */}
                        <span className={replyCount > 0 ? 'reply-count' : 'reply-count is-none'}>
                          <span className="reply-label">댓글 </span>
                          {replyCount > 0 ? `${replyCount}` : '없음'}
                        </span>
                        {p.sample && !allSample && <span className="sample-chip sample-in-meta" aria-hidden="true">구성 예시</span>}
                      </div>
                      <a
                        className="post-title"
                        href={href({
                          ...loc,
                          view: 'detail',
                          post: p.id,
                          from: 'list',
                        })}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey) return;
                          e.preventDefault();
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        {p.title}
                        {p.sample && !allSample && <>{' '}<span className="sample-chip sample-in-title">구성 예시</span></>}
                      </a>
                      <p className="post-preview">{p.body.slice(0, 240)}{p.body.length > 240 ? '…' : ''}</p>
                    </div>
                  </article>
                );})}
                {list.total === 0 && (
                  <div className="empty honest-empty">
                    <h2>조건에 맞는 글이 없어요.</h2>
                    <p>검색어를 줄이거나, 실제 질문이 쌓일 때까지 자료실을 먼저 확인해 보세요.</p>
                    <button
                      onClick={() =>
                        go({
                          q: '',
                          board: 'all',
                          mine: false,
                          page: 1,
                          situation: 'all',
                          feed: 'all',
                        })
                      }
                    >
                      전체 글 보기
                    </button>
                  </div>
                )}
              </div>
              <nav className="pagination" aria-label="페이지">
                <button
                  aria-label="이전 페이지"
                  disabled={list.page === 1}
                  onClick={() => go({ page: list.page - 1 })}
                >
                  이전
                </button>
                {Array.from({ length: list.pages }, (_, i) => (
                  <button
                    key={i}
                    aria-current={list.page === i + 1 ? 'page' : undefined}
                    onClick={() => go({ page: i + 1 })}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  aria-label="다음 페이지"
                  disabled={list.page === list.pages}
                  onClick={() => go({ page: list.page + 1 })}
                >
                  다음
                </button>
              </nav>
              <p className="list-footnote">
                {allSample ? '' : '구성 예시는 실제 회원 글이 아닙니다. '}체험 글은 새로고침하면 초기화됩니다.
              </p>
            </>
          )}
        </main>
        <aside className="rail" data-frame="rail" data-review-target="rail" data-review-label="오른쪽 안내">
          <div className="rail-intro">
            <span className="eyebrow">읽기와 참여</span>
            <h2>
              글은 누구나 읽을 수 있어요.
            </h2>
            <p>
              글과 댓글은 로그인 후 작성합니다. 공개 화면에는 익명으로 표시됩니다.
            </p>
            {loc.view !== 'compose' && (
              <button onClick={compose}>
                글쓰기
              </button>
            )}
          </div>
          <section className="rail-section office-guide">
            <h2>공식 안내로 확인하기</h2>
            <a href="https://www.work24.go.kr/cm/main.do" target="_blank" rel="noopener noreferrer">고용24 취업·훈련 안내 <ArrowUpRight size={15} /></a>
            <a
              href="https://www.mpva.go.kr/mpva/contents.do?key=106"
              target="_blank"
              rel="noopener noreferrer"
            >
              국가보훈부 등록 안내 <ArrowUpRight size={15} />
            </a>
            <a
              href="https://www.youthcenter.go.kr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              온통청년 정책 찾기 <ArrowUpRight size={15} />
            </a>
            <button onClick={() => go({ view: 'office' })}>
              소개와 운영 범위 <ChevronRight size={15} />
            </button>
          </section>
          <section className="rail-section">
            <h2>이용 전에 읽어주세요</h2>
            <p>
              개인의 경험은 공식 기준과 다를 수 있어요. 중요한 내용은 원문에서
              다시 확인해 주세요.
            </p>
            <p>이름·연락처·군번 등 개인정보는 글과 댓글에 적지 마세요.</p>
            <button className="rail-link" onClick={() => go({ view: 'help' })}>
              이용 안내 <ChevronRight size={16} />
            </button>
          </section>
          <div className="rail-actions">
            <button
              onClick={() =>
                actor ? open({ type: 'activity' }) : needLogin('activity')
              }
            >
              내 글과 저장한 글
            </button>
            <button onClick={() => open({ type: 'reading' })}>읽기 설정</button>
          </div>
          <button
            className="operator-entry"
            onClick={() => go({ view: 'studio' })}
          >
            운영·디자인 체험 <ArrowUpRight size={14} />
          </button>
          <p className="sample-note">
            구성 예시로 목록·상세 구성을 확인하는 시안입니다.
          </p>
        </aside>
      </div>
      </div>
      <footer className="container footer" data-review-target="footer" data-review-label="하단">
        <div className="footer-tools"><a href="/site-lab-artifacts/">산출물 모음</a><a href="/site-lab-artifacts/reports/pre-settings-handoff.html">이번 준비와 종료 조건</a>
          <button onClick={() => open({ type: 'reading' })}>읽기 설정</button>
          <button onClick={() => go({ view: 'studio' })}>
            운영·디자인 체험
          </button>
        </div>
        <div className="footer-top">
          <strong>
            {name}
          </strong>
          <nav aria-label="이용 정책">
            <a
              href={href({ ...loc, view: 'help' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'help' });
              }}
            >
              도움말
            </a>
            <a
              href={href({ ...loc, view: 'terms' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'terms' });
              }}
            >
              이용약관 초안
            </a>
            <a
              href={href({ ...loc, view: 'privacy' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'privacy' });
              }}
            >
              개인정보 안내
            </a>
            <a
              href={href({ ...loc, view: 'delete-request' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'delete-request' });
              }}
            >
              삭제 요청 안내
            </a>
          </nav>
        </div>
        <p>
          {siteConfig.office} · {siteConfig.notice}
        </p>
        <p>
          체험 내용은 현재 화면의 메모리에만 남으며 새로고침하면 초기화됩니다.
        </p>
      </footer>
      {['list', 'guides'].includes(loc.view) && (
        <nav className="mobile-actions" aria-label="빠른 메뉴">
          <button onClick={() => go({ view: 'guides', post: '' })}>
            자료실
          </button>
          <button onClick={() => go({ view: 'list', post: '' })}>
            커뮤니티
          </button>
          <button className="write-action" onClick={compose}>
            <PenLine size={16} />
            글쓰기
          </button>
        </nav>
      )}
      <Dialog.Root
        open={!!modal}
        onOpenChange={(o) => {
          if (!o) setModal(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-backdrop" />
          <Dialog.Popup className="modal" finalFocus={opener}
            style={designTokens(design) as CSSProperties}>
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
                <X size={20} />
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
                <select
                  id="demo-account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option value="demo-1">체험 회원 1</option>
                  <option value="demo-2">체험 회원 2</option>
                </select>
                <p className="fine">
                  글과 댓글에는 모두 ‘익명’으로 표시됩니다. 네이버·카카오·PASS,
                  연령·보호자 확인은 연결 전입니다.
                </p>
                <button className="primary wide" onClick={login}>
                  선택한 계정으로 체험
                </button>
              </>
            ) : modal?.type === 'report' ? (
              <>
                <label htmlFor="report-reason">신고 사유</label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option>개인정보 노출</option>
                  <option>비방·혐오 표현</option>
                  <option>광고·도배</option>
                  <option>잘못된 정보</option>
                  <option>도움이 시급한 내용</option>
                </select>
                <button
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
                    setNotice(
                      `신고 체험 완료 · ${reason}. 운영자에게 전송되지는 않았습니다.`,
                    );
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
                  <button className="danger" onClick={confirmDelete}>
                    삭제 확인
                  </button>
                  <Dialog.Close>취소</Dialog.Close>
                </div>
              </>
            ) : modal?.type === 'reading' ? (
              <>
                <label htmlFor="reading-scale">글자 크기</label>
                <select
                  id="reading-scale"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                >
                  <option value="100">기본</option>
                  <option value="115">115% · 조금 크게</option>
                  <option value="125">125% · 크게</option>
                  <option value="200">200% · 아주 크게</option>
                </select>
                <p className="fine">이 설정은 현재 화면에만 적용됩니다.</p>
                <Dialog.Close className="primary wide">
                  적용하고 닫기
                </Dialog.Close>
              </>
            ) : modal?.type === 'activity' ? (
              <div className="activity">
                <h3>내가 쓴 글</h3>
                {posts.filter((p) => p.owner === actor).length ? (
                  posts
                    .filter((p) => p.owner === actor)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setModal(null);
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        {p.title}
                        <ChevronRight size={16} />
                      </button>
                    ))
                ) : (
                  <p>아직 쓴 글이 없어요.</p>
                )}
                <h3>내가 남긴 댓글</h3>
                {posts.flatMap((p) =>
                  p.replies
                    .filter((r) => r.owner === actor && !r.deleted)
                    .map((r) => (
                      <button
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
                        <ChevronRight size={16} />
                      </button>
                    )),
                ).length ? (
                  posts.flatMap((p) =>
                    p.replies
                      .filter((r) => r.owner === actor && !r.deleted)
                      .map((r) => (
                        <button
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
                          <ChevronRight size={16} />
                        </button>
                      )),
                  )
                ) : (
                  <p>아직 남긴 댓글이 없어요.</p>
                )}
                <h3>저장한 글</h3>
                {posts.some((p) => saved.includes(p.id)) ? (
                  posts
                    .filter((p) => saved.includes(p.id))
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setModal(null);
                          go({ view: 'detail', post: p.id });
                        }}
                      >
                        {p.title}
                        <Check size={16} />
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
function Info({
  view,
  back,
  go,
}: {
  view: string;
  back: InfoBack;
  go: (s: Partial<LocationState>) => void;
}) {
  // 되돌아가기는 실제로 온 곳으로. 주소로 바로 열었으면 빵부스러기(홈 / …)와 같게 홈.
  const backLabel = {
    home: '홈으로',
    list: '목록으로',
    guides: '자료실로',
    detail: '글로 돌아가기',
  }[back];
  return (
    <>
      <button
        className="back"
        onClick={() =>
          back === 'detail' ? go({ view: 'detail' }) : go({ view: back, post: '' })
        }
      >
        <ArrowLeft size={17} />
        {backLabel}
      </button>
      <section className="form-panel info">
        <span className="status-tag">운영 연결 전 · 초안</span>
        <h1 data-role="page-title">
          {view === 'office'
            ? '우리가 만들고 있는 커뮤니티'
            : view === 'help'
              ? '이용 안내'
              : view === 'terms'
                ? '이용약관 초안'
                : view === 'privacy'
                  ? '개인정보 안내'
                  : '삭제 요청 안내'}
        </h1>
        {view === 'office' ? (
          <>
            <p>
              전직·취업·창업·교육·생활·보훈을 묻고 나누는 커뮤니티를 준비합니다. 20~50대, 특히 2030이 읽고 필요할 때 참여하는 공간을 실험합니다. 이름과 첫 출시 범위는 아직 정하지 않았습니다.
            </p>
            <h2>질문과 경험이 쌓이는 곳</h2>
            <p>
              다음 일을 준비하며 궁금했던 점이나 일상에 관해 묻고 답할
              수 있는 공간입니다. 개인의 경험과 사무소의 답변을 구분하고, 제도
              안내는 공식 원문에서 확인할 수 있도록 합니다.
            </p>
            <h2>운영 연결 전</h2>
            <p>
              사무소의 목적을 담되 커뮤니티 자체의 읽기와 대화를 독립적으로 사용할 수 있게 합니다. 사무소와의 정확한 연결 범위, 담당자·업무 연락처·소재지는 확인 후 공개할 항목입니다.
            </p>
            <p>
              개별 사건 자료나 진단서는 공개 게시판에 올리지 마세요. 비공개
              상담·자료 전달 창구는 연결 전이며 이 화면에서는 접수하지 않습니다.
            </p>
          </>
        ) : view === 'help' ? (
          <>
            <h2>글을 읽고, 묻고, 돌아오기</h2>
            <p>
              커뮤니티에서 주제를 고르거나 제목과 내용으로 검색할 수 있습니다.
              상세에서 목록으로 돌아오면 검색어와 페이지가 유지됩니다.
            </p>
            <p>
              글과 댓글은 익명으로 표시합니다. 체험 로그인 후 내가 쓴 글·댓글을
              수정하거나 삭제할 수 있습니다.
            </p>
            <h2>공식 답변과 구분해 주세요</h2>
            <p>
              현재 모든 예시 내용은 합성 자료입니다. 운영 안내 예시도 실제
              운영진의 검토가 아닙니다. 법령·처분과 관련한 판단은 검증된 출처와
              전문가 확인이 필요합니다.
            </p>
          </>
        ) : view === 'terms' ? (
          <>
            <p>
              이 문서는 시안 이용 안내입니다. 실제 회원 서비스의 약관은 운영자
              정보·문의 창구·시행일을 확정한 뒤 검토해야 합니다.
            </p>
            <h2>참여 원칙</h2>
            <p>
              다른 사람의 개인정보, 비방·혐오, 도배·광고, 권리를 침해하는 내용을
              게시하지 않습니다. 작성자는 본인 글과 댓글을 수정·삭제할 수 있어야
              합니다.
            </p>
            <h2>가입·운영 절차</h2>
            <p>
              14세 미만 이용 방향은 유지하되 보호자 확인·동의와 연령별 안내는
              실제 인증 연결 전에 확정합니다. 신고 판단·이의 제기·이용 제한·탈퇴
              절차도 운영 약관에 명시해야 합니다.
            </p>
          </>
        ) : view === 'privacy' ? (
          <>
            <p>
              이 로컬 시안은 실제 가입·외부 AI 전송·서버 저장을 연결하지
              않았습니다. 질문이나 개인정보를 실제 서비스 자료로 입력하지
              마세요.
            </p>
            <h2>체험 자료</h2>
            <p>
              작성 내용, 체험 로그인, 저장한 글과 신고 상태는 현재 화면의
              메모리에만 유지하며 새로고침하면 초기화됩니다. 디자인의 배치·간격·글자·색상
              설정은 이 브라우저의 로컬스토리지에 저장합니다. 체험 원문은
              쿠키·로컬스토리지에 기록하지 않습니다.
            </p>
            <h2>운영 전에 확정할 항목</h2>
            <p>
              운영자·연락처, 수집 목적·항목, 보관 기간·삭제, 민감정보 동의,
              수탁사·외부 제공, 아동·보호자 절차를 확정하고 고지해야 합니다. 이
              화면은 확정된 개인정보처리방침이 아닙니다.
            </p>
          </>
        ) : (
          <>
            <p>
              내 체험 글과 댓글은 상세 화면의 수정·삭제 버튼으로 지울 수
              있습니다. 새로고침하면 모든 체험 입력이 초기화됩니다.
            </p>
            <h2>타인의 글에 내 정보가 있나요?</h2>
            <p>
              신고에서 ‘개인정보 노출’을 선택하는 흐름을 살펴볼 수 있습니다.
              실제 접수·회신은 연결 전이며 요청이 전송되지 않습니다.
            </p>
            <p className="notice">
              운영자명과 문의 이메일이 아직 정해지지 않아 실제 삭제 요청을
              받는다고 표시하지 않습니다. 서비스 공개 전에 접수 창구와 처리
              절차를 연결해야 합니다.
            </p>
          </>
        )}
      </section>
    </>
  );
}
