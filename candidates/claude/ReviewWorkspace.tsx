import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { type Design } from './design';
import { readReviewBundle, reviewStorageKey, reviewStorageSnapshot, persistReviewState, saveReview, loadReview, exportReview, parseReview, reviewBrief, type ReviewNote, type SavedReview } from './review';
import './review-workspace.css';

const targets = [
  ['page', '페이지 전체'], ['header', '상단 메뉴'], ['home-intro', '홈 소개'],
  ['home-feed', '홈 이야기 목록'], ['home-resources', '홈 공식 자료'],
  ['list-filters', '목록 필터'], ['post-list', '게시글 목록'], ['detail', '글 상세'],
  ['compose', '글쓰기'], ['rail', '옆 안내'], ['footer', '하단 안내'], ['guide-directory', '자료실'],
] as const;
const routeNames: Record<string, string> = { home: '홈', list: '커뮤니티', detail: '글 상세', compose: '글쓰기', guides: '자료실', help: '이용 안내', office: '소개', privacy: '개인정보 안내', terms: '이용약관', 'delete-request': '삭제 요청', studio: '설정' };
const colors: { id: ReviewNote['color']; label: string }[] = [{ id: 'yellow', label: '노랑' }, { id: 'pink', label: '분홍' }, { id: 'blue', label: '파랑' }, { id: 'green', label: '초록' }];
type Panel = 'notes' | 'save' | 'export' | null;
type Pin = { target: string; top: number; left: number; notes: ReviewNote[] };
const labelFor = (target: string) => targets.find(([id]) => id === target)?.[1] ?? '페이지 전체';
const sameContent = (a: SavedReview, b: SavedReview) => JSON.stringify([a.name, a.design, a.notes]) === JSON.stringify([b.name, b.design, b.notes]);
const filename = (name: string) => (name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').trim().slice(0, 80) || '커뮤니티-시안');
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function findTarget(target: string): HTMLElement | null {
  // The identifier is matched against a closed list before it enters a selector.
  if (!targets.some(([id]) => id === target)) return null;
  return document.querySelector<HTMLElement>(`[data-review-target="${target}"]`);
}

export function ReviewWorkspace({ design, route, onDesign, sourcePreviewHTML, onNavigate, initialReview }: {
  design: Design;
  initialReview?: ReturnType<typeof readReviewBundle>;
  route: string;
  onDesign: (design: Design) => void;
  sourcePreviewHTML: (draft: SavedReview) => Promise<string>;
  onNavigate?: (route: string) => void;
}) {
  const [initial] = useState(() => initialReview ?? readReviewBundle(design));
  const [state, setState] = useState(initial.state);
  const storedSnapshot = useRef(initial.snapshot);
  const currentState = useRef(state);
  currentState.current = { ...state, working: { ...state.working, design } };
  const conflictRef = useRef(false);
  const [conflict, setConflict] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState('');
  const [storageOK, setStorageOK] = useState(true);
  const [target, setTarget] = useState<string>('page');
  const [text, setText] = useState('');
  const [color, setColor] = useState<ReviewNote['color']>('yellow');
  const [editing, setEditing] = useState<string | null>(null);
  const [scope, setScope] = useState('current');
  const [picking, setPicking] = useState(false);
  const [selectedSaved, setSelectedSaved] = useState('');
  const [pins, setPins] = useState<Pin[]>([]);
  const [expandedPin, setExpandedPin] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const workspace = useRef<HTMLElement>(null);
  const current = { ...state.working, design };
  const currentNotes = state.working.notes.filter(note => note.route === route);
  const visibleNotes = scope === 'all' ? state.working.notes : currentNotes;
  const active = state.saved.find(item => item.id === state.activeId);
  // A working copy without a named snapshot also needs protection when opening another file.
  const changed = !active || !sameContent(current, active);

  useEffect(() => {
    setState(previous => JSON.stringify(previous.working.design) === JSON.stringify(design) ? previous : {
      ...previous, working: { ...previous.working, design, updatedAt: new Date().toISOString() },
    });
  }, [design]);
  useEffect(() => {
    const markConflict = () => { conflictRef.current = true; setConflict(true); };
    const onStorage = (event: StorageEvent) => {
      if ((event.key === reviewStorageKey || event.key === null) && reviewStorageSnapshot() !== storedSnapshot.current) markConflict();
    };
    const flush = () => {
      if (!conflictRef.current && persistReviewState(currentState.current, { snapshot: storedSnapshot.current })) storedSnapshot.current = reviewStorageSnapshot();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('pagehide', flush); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const persist = () => {
      if (cancelled || conflictRef.current) return;
      const snapshot = reviewStorageSnapshot();
      if (snapshot !== undefined && snapshot !== storedSnapshot.current) { conflictRef.current = true; setConflict(true); return; }
      const success = persistReviewState(state, { snapshot: storedSnapshot.current });
      setStorageOK(success);
      if (success) storedSnapshot.current = reviewStorageSnapshot();
    };
    // Serialize same-origin cooperating tabs; expected-snapshot comparison also guards delayed events.
    if (navigator.locks) void navigator.locks.request('community-review-storage', persist).catch(persist);
    else persist();
    return () => { cancelled = true; };
  }, [state]);
  useEffect(() => { setPicking(false); setExpandedPin(null); }, [route]);
  useEffect(() => { if (panel !== 'notes') setPicking(false); }, [panel]);

  useEffect(() => {
    if (!picking) return;
    let highlighted: Element | null = null;
    const clear = () => { highlighted?.classList.remove('rw-pick-target'); highlighted = null; };
    const candidate = (event: Event) => {
      if (!(event.target instanceof Element) || workspace.current?.contains(event.target)) return null;
      const element = event.target.closest<HTMLElement>('[data-review-target]');
      return element && targets.some(([id]) => id === element.dataset.reviewTarget) ? element : null;
    };
    const hover = (event: PointerEvent) => {
      const element = candidate(event);
      if (element !== highlighted) { clear(); element?.classList.add('rw-pick-target'); highlighted = element; }
    };
    const choose = (event: MouseEvent) => {
      const element = candidate(event);
      if (!element) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      setTarget(element.dataset.reviewTarget!); setPicking(false); clear();
      setMessage(`${labelFor(element.dataset.reviewTarget!)}에 메모를 붙입니다.`);
      window.setTimeout(() => editor.current?.focus(), 0);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setPicking(false); clear(); } };
    document.addEventListener('pointermove', hover, true);
    document.addEventListener('click', choose, true);
    document.addEventListener('keydown', escape, true);
    return () => { clear(); document.removeEventListener('pointermove', hover, true); document.removeEventListener('click', choose, true); document.removeEventListener('keydown', escape, true); };
  }, [picking]);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const grouped = new Map<string, ReviewNote[]>();
        state.working.notes.filter(note => note.route === route && !note.done).forEach(note => grouped.set(note.target, [...(grouped.get(note.target) ?? []), note]));
        const next: Pin[] = [];
        for (const [id, notes] of grouped) {
          const element = findTarget(id);
          if (!element || !element.getClientRects().length) continue;
          const rect = element.getBoundingClientRect();
          // Pins sit at the edge of the section; the note itself opens only on request.
          next.push({ target: id, notes, top: Math.max(0, rect.top + window.scrollY - 22), left: Math.max(4, Math.min(document.documentElement.clientWidth - 38, rect.right - 28)) });
        }
        setPins(next);
      });
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    const page = document.querySelector('.draft');
    if (page) observer.observe(page);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [state.working.notes, route, design, panel]);

  function updateNotes(notes: ReviewNote[]) {
    setState(previous => ({ ...previous, working: { ...previous.working, design, notes, updatedAt: new Date().toISOString() } }));
  }
  function resetEditor() { setText(''); setEditing(null); setTarget('page'); setColor('yellow'); }
  function addNote() {
    if (!text.trim()) { setMessage('조정하고 싶은 내용을 적어주세요.'); editor.current?.focus(); return; }
    const existing = state.working.notes.find(note => note.id === editing);
    const note: ReviewNote = { id: existing?.id ?? crypto.randomUUID(), route: existing?.route ?? route, target, label: labelFor(target), text: text.trim(), color, done: existing?.done ?? false };
    if (!existing && state.working.notes.length >= 100) { setMessage('메모는 시안당 100개까지 붙일 수 있습니다.'); return; }
    updateNotes(existing ? state.working.notes.map(item => item.id === note.id ? note : item) : [...state.working.notes, note]);
    resetEditor(); setMessage(existing ? '메모를 수정했어요.' : '메모를 붙였어요. 현재 작업에 임시 저장됩니다.');
  }
  function editNote(note: ReviewNote) {
    setPanel('notes'); setEditing(note.id); setTarget(note.target); setText(note.text); setColor(note.color);
    window.setTimeout(() => editor.current?.focus(), 0);
  }
  function locateNote(note: ReviewNote) {
    if (note.route !== route) {
      if (onNavigate && note.route !== 'detail') { onNavigate(note.route); setMessage(`${routeNames[note.route] ?? note.route} 페이지의 메모입니다.`); }
      else setMessage(`${routeNames[note.route] ?? note.route} 페이지에서 위치를 확인할 수 있습니다.`);
      return;
    }
    const element = findTarget(note.target);
    if (!element || !element.getClientRects().length) { setMessage('이 화면에는 해당 영역이 보이지 않습니다. 메모는 보관되어 있어요. 페이지 구성 선택을 확인해 주세요.'); return; }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('rw-located');
    window.setTimeout(() => element.classList.remove('rw-located'), 1600);
  }
  function commit(asNew: boolean) {
    if (conflictRef.current) { setMessage('다른 탭에서 저장 내용이 바뀌었습니다. 현재 작업은 JSON으로 보관한 뒤 최신 저장 내용을 열어주세요.'); return; }
    const entered = state.working.name.trim();
    if (!entered) { setMessage('저장할 시안 이름을 적어주세요.'); return; }
    const name = asNew && active?.name === entered ? `${entered} 사본` : entered;
    try {
      const next = saveReview(state, design, { asNew, name });
      setState(next); setSelectedSaved(next.activeId ?? '');
      setMessage(asNew ? '새 이름의 사본을 저장했어요. 기존 저장본은 유지됩니다.' : '현재 시안을 저장했어요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : '시안을 저장하지 못했습니다.'); }
  }
  function openSaved() {
    if (!selectedSaved) { setMessage('열 시안을 먼저 골라주세요.'); return; }
    const saved = state.saved.find(item => item.id === selectedSaved);
    if (!saved) return;
    if (changed && !window.confirm('현재 작업의 저장하지 않은 변경을 저장본으로 바꿀까요? 보관하려면 취소한 뒤 다른 이름으로 저장해 주세요.')) return;
    const next = loadReview(state, selectedSaved);
    setState(next); onDesign(next.working.design); resetEditor();
    setMessage(`‘${next.working.name}’을 열었어요.`);
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget; const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { setMessage('1MB 이하의 시안 JSON 파일을 선택해 주세요.'); return; }
    try {
      const imported = parseReview(await file.text());
      if (changed && !window.confirm('현재 임시 작업을 가져온 시안으로 바꿀까요? 저장한 시안들은 그대로 유지됩니다.')) return;
      const now = new Date().toISOString();
      const working = { ...imported, id: crypto.randomUUID(), name: `${imported.name.slice(0, 69)} (가져온 사본)`, createdAt: now, updatedAt: now };
      setState(previous => ({ ...previous, working, activeId: null }));
      onDesign(working.design); resetEditor(); setPanel('save');
      setMessage('새 작업 사본으로 가져왔어요. 보관하려면 시안 저장을 눌러주세요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : '시안 JSON 파일을 읽지 못했습니다.'); }
  }
  async function exportHTML() {
    setExporting(true);
    try {
      const html = await sourcePreviewHTML(current);
      download(`${filename(current.name)}.html`, html, 'text/html;charset=utf-8');
      setMessage('설정과 메모를 포함한 HTML 파일을 내려받았어요.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'HTML 파일을 만들지 못했습니다.'); }
    finally { setExporting(false); }
  }
  const toolbarButton = (id: Exclude<Panel, null>, label: string) => <button type="button" aria-expanded={panel === id} aria-controls={`rw-${id}`} onClick={() => { setPanel(panel === id ? null : id); setMessage(''); }}>{label}</button>;

  return <>
    <section className="review-workspace" ref={workspace} aria-label="시안 메모와 저장">
      <div className="rw-toolbar"><div className="rw-tools">{toolbarButton('notes', `메모 ${state.working.notes.length}`)}{toolbarButton('save', '저장·다른 이름')}{toolbarButton('export', '에이전트 전달')}</div><span className="rw-working-name">{state.working.name || '이름 없는 시안'}{!active ? ' · 임시 작업' : changed ? ' · 임시 변경' : ''}</span></div>
      {panel === 'notes' && <div id="rw-notes" className="rw-panel">
        <div className="rw-panel-heading"><div><h2>조정할 곳에 메모 붙이기</h2><p>현재 페이지: {routeNames[route] ?? route}. 메모는 이 브라우저에만 저장됩니다.</p></div><button type="button" onClick={() => setPanel(null)}>접기</button></div>
        <div className="rw-note-editor">
          <div className="rw-note-target"><label htmlFor="rw-target">메모 위치<select id="rw-target" value={target} onChange={event => setTarget(event.target.value)}>{targets.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><button type="button" aria-pressed={picking} onClick={() => setPicking(!picking)}>{picking ? '위치 선택 취소' : '페이지에서 위치 선택'}</button></div>
          {picking && <p className="rw-picking-message" role="status">페이지의 영역을 누르세요. 이번 클릭은 메모 위치만 고릅니다. Esc로 취소할 수 있고, 위 목록으로도 선택할 수 있어요.</p>}
          <label htmlFor="rw-note-text">{editing ? '메모 수정' : '어떻게 바꾸면 좋을까요?'}<textarea id="rw-note-text" ref={editor} value={text} onChange={event => setText(event.target.value)} maxLength={2000} rows={3} placeholder="예: 이 목록은 여백을 줄이고 제목을 더 진하게 해주세요." /></label>
          <div className="rw-editor-actions"><fieldset className="rw-colors"><legend>메모지 색</legend>{colors.map(item => <label key={item.id} data-note-color={item.id}><input type="radio" name="rw-note-color" value={item.id} checked={color === item.id} onChange={() => setColor(item.id)} />{item.label}</label>)}</fieldset><div className="rw-actions">{editing && <button type="button" onClick={resetEditor}>수정 취소</button>}<button type="button" className="rw-primary" onClick={addNote}>{editing ? '메모 수정 저장' : '메모 붙이기'}</button></div></div>
        </div>
        <div className="rw-note-list-heading"><h3>붙인 메모</h3><label>표시 범위<select value={scope} onChange={event => setScope(event.target.value)}><option value="current">현재 페이지 ({currentNotes.length})</option><option value="all">모든 페이지 ({state.working.notes.length})</option></select></label></div>
        {!visibleNotes.length ? <p className="rw-empty">아직 붙인 메모가 없습니다.</p> : <div className="rw-note-grid">{visibleNotes.map(note => <article className="rw-sticky" data-note-color={note.color} data-done={note.done} key={note.id}><header><span>{routeNames[note.route] ?? note.route} / {note.label}</span><label><input type="checkbox" checked={note.done} onChange={() => updateNotes(state.working.notes.map(item => item.id === note.id ? { ...item, done: !item.done } : item))} />반영 완료</label></header><p>{note.text}</p><footer><button type="button" onClick={() => locateNote(note)}>위치 보기</button><button type="button" onClick={() => editNote(note)}>수정</button><button type="button" onClick={() => { if (window.confirm('이 메모를 지울까요?')) { updateNotes(state.working.notes.filter(item => item.id !== note.id)); if (editing === note.id) resetEditor(); } }}>삭제</button></footer></article>)}</div>}
      </div>}
      {panel === 'save' && <div id="rw-save" className="rw-panel">
        <div className="rw-panel-heading"><div><h2>이 조합과 메모 보관하기</h2><p>임시 작업은 자동으로 남습니다. 저장한 시안은 아래 저장 버튼을 누를 때만 바뀝니다.</p></div><button type="button" onClick={() => setPanel(null)}>접기</button></div>
        <div className="rw-save-grid"><div><label htmlFor="rw-name">시안 이름<input id="rw-name" value={state.working.name} maxLength={80} onChange={event => setState(previous => ({ ...previous, working: { ...previous.working, name: event.target.value, updatedAt: new Date().toISOString() } }))} /></label><div className="rw-actions"><button type="button" className="rw-primary" onClick={() => commit(false)}>시안 저장</button><button type="button" onClick={() => commit(true)}>다른 이름으로 저장</button></div>{active && <p className="rw-fine">현재 저장본: {active.name}. 이름을 바꾸고 다른 이름으로 저장하면 기존본도 남습니다.</p>}</div><div><label htmlFor="rw-library">저장한 시안 ({state.saved.length})<select id="rw-library" value={selectedSaved} onChange={event => setSelectedSaved(event.target.value)}><option value="">시안을 선택하세요</option>{state.saved.map(saved => <option value={saved.id} key={saved.id}>{saved.name}</option>)}</select></label><div className="rw-actions"><button type="button" disabled={!selectedSaved} onClick={openSaved}>선택한 시안 열기</button><button type="button" disabled={!selectedSaved} onClick={() => {
        const selected = state.saved.find(item => item.id === selectedSaved);
        if (!selected || !window.confirm(`‘${selected.name}’ 저장본을 삭제할까요? 현재 작업 사본은 유지됩니다.`)) return;
        setState(previous => ({ ...previous, activeId: previous.activeId === selectedSaved ? null : previous.activeId, saved: previous.saved.filter(item => item.id !== selectedSaved) }));
        setSelectedSaved(''); setMessage('선택한 저장본을 삭제했어요. 현재 작업 사본은 유지됩니다.');
      }}>선택한 저장본 삭제</button></div><p className="rw-fine">이 브라우저의 저장 공간을 지우면 사라집니다. 별도 보관은 JSON 다운로드를 사용하세요.</p></div></div>
      </div>}
      {panel === 'export' && <div id="rw-export" className="rw-panel">
        <div className="rw-panel-heading"><div><h2>파일로 저장해 에이전트에게 전달하기</h2><p>조합과 메모를 함께 내보냅니다. 파일은 직접 첨부해 주세요.</p></div><button type="button" onClick={() => setPanel(null)}>접기</button></div>
        <div className="rw-export-options"><div><strong>다시 편집할 원본</strong><p>JSON을 가져오면 조합과 메모를 이어서 수정할 수 있습니다.</p><button type="button" onClick={() => { download(`${filename(current.name)}.json`, JSON.stringify(exportReview(current), null, 2), 'application/json;charset=utf-8'); setMessage('편집 가능한 시안 JSON을 내려받았어요.'); }}>JSON 다운로드</button></div><div><strong>수정 요청 문서</strong><p>에이전트가 읽을 설정과 위치별 메모를 담습니다.</p><button type="button" onClick={() => { download(`${filename(current.name)}-수정요청.md`, reviewBrief(current), 'text/markdown;charset=utf-8'); setMessage('설정과 메모를 담은 수정 요청서를 내려받았어요.'); }}>수정 요청서 다운로드</button></div><div><strong>보여줄 화면</strong><p>독립적으로 열어 보는 HTML 참고 화면입니다. 다시 편집하려면 JSON도 함께 저장하세요.</p><button type="button" disabled={exporting} onClick={exportHTML}>{exporting ? 'HTML 만드는 중…' : 'HTML 다운로드'}</button></div></div>
        <label className="rw-import">시안 JSON 가져오기<input type="file" accept=".json,application/json" onChange={importFile} /><span>최대 1MB. 새 작업 사본으로 열며 기존 저장본은 유지합니다.</span></label><p className="rw-fine">이전에 남긴 A/B/C 메모는 <a href="/site-lab-artifacts/preview/?design=commons" target="_blank" rel="noopener noreferrer">기존 디자인 편집기</a>에 그대로 있습니다. 두 편집기의 JSON 형식은 서로 다릅니다.</p>
      </div>}
      {message && <p className="rw-status" role="status">{message}</p>}
      {conflict && <div className="rw-status rw-storage-warning" role="alert"><p>다른 탭에서 저장 내용이 바뀌어 이 탭의 자동 저장을 멈췄습니다. 현재 작업을 보관하려면 에이전트 전달에서 JSON을 내려받으세요.</p><button type="button" onClick={() => {
        if (!window.confirm('현재 작업을 다른 탭의 최신 저장 내용으로 바꿀까요? 보관하려면 취소한 뒤 JSON을 다운로드해 주세요.')) return;
        const bundle = readReviewBundle(design); const latest = bundle.state; storedSnapshot.current = bundle.snapshot; conflictRef.current = false; setConflict(false);
        setState(latest); onDesign(latest.working.design); resetEditor(); setSelectedSaved(''); setMessage('최신 저장 내용을 열었어요.');
      }}>최신 저장 내용 열기</button></div>}
      {!storageOK && <p className="rw-status rw-storage-warning" role="alert">브라우저 저장 공간을 사용할 수 없어 현재 작업을 저장하지 못했습니다. 닫기 전에 에이전트 전달에서 JSON을 다운로드해 주세요.</p>}
    </section>
    {typeof document !== 'undefined' && createPortal(<div className="rw-pins" aria-label="페이지에 붙인 메모">{pins.map(pin => <div className="rw-pin" key={pin.target} style={{ top: pin.top, left: pin.left }}><button type="button" className="rw-pin-toggle" data-note-color={pin.notes[0].color} aria-label={`${labelFor(pin.target)} 메모 ${pin.notes.length}개`} aria-expanded={expandedPin === pin.target} onClick={() => setExpandedPin(expandedPin === pin.target ? null : pin.target)}>{pin.notes.length}</button>{expandedPin === pin.target && <div className="rw-pin-notes"><div className="rw-pin-heading"><strong>{labelFor(pin.target)}</strong><button type="button" onClick={() => setExpandedPin(null)}>닫기</button></div>{pin.notes.map(note => <article data-note-color={note.color} key={note.id}><p>{note.text}</p><button type="button" onClick={() => { editNote(note); setExpandedPin(null); }}>메모 수정</button></article>)}</div>}</div>)}</div>, document.body)}
  </>;
}
