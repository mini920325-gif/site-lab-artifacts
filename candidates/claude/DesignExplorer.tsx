import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Columns2, RotateCcw, Search } from 'lucide-react';
import { designOptions, designLabels, designPresets, paletteTokens, defaultDesign, type Design, type DesignAxis } from './design';
import './design-explorer.css';

const axes = Object.keys(designOptions) as DesignAxis[];
const pageSize = 8;
const sameDesign = (a: Design, b: Design) => axes.every((axis) => a[axis] === b[axis]);
const previewURL = (design: Design) => '/site-lab-artifacts/candidates/claude/?view=home&designPreview=1&design=' + encodeURIComponent(JSON.stringify(design));

function Miniature({ design }: { design: Design }) {
  const palette = paletteTokens[design.color];
  const style = {
    '--mini-bg': palette.bg, '--mini-paper': palette.paper, '--mini-ink': palette.ink,
    '--mini-line': palette.line, '--mini-accent': palette.accent, '--mini-soft': palette.soft,
  } as CSSProperties;
  return <span className="dx-mini" data-frame={design.frame} data-layout={design.layout} data-corners={design.corners} style={style} aria-hidden="true">
    <span className="dx-mini-nav"><i /><i /><i /></span>
    <span className="dx-mini-intro"><b /><i /><i /></span>
    <span className="dx-mini-body"><span className="dx-mini-posts">{[0, 1, 2].map((n) => <span key={n}><b /><i /><i /></span>)}</span><span className="dx-mini-rail"><b /><i /><i /></span></span>
  </span>;
}

function PagePreview({ design, label }: { design: Design; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <figure className="dx-comparison-page">
    <figcaption>{label}</figcaption>
    <div className="dx-page-viewport" ref={box} inert>
      <iframe title={label + ' · 실제 홈 화면 비교'} src={previewURL(design)} loading="lazy" tabIndex={-1} aria-hidden="true"
        style={{ transform: `scale(${width / 1280})` }} />
    </div>
  </figure>;
}

export function DesignExplorer({ value, appliedValue, change, apply, cancel }: {
  value: Design; appliedValue: Design; change: (value: Design) => void; apply: () => void; cancel: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [compare, setCompare] = useState(false);
  const selectedPreset = designPresets.find((preset) => sameDesign(preset.design, value));
  const filtered = designPresets.filter((preset) => (filter === 'all' || preset.design.frame === filter)
    && `${preset.id} ${preset.name} ${preset.description}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const selectedIndex = filtered.findIndex((preset) => sameDesign(preset.design, value));
  const movePreset = (step: number) => {
    if (!filtered.length) return;
    const next = selectedIndex < 0 ? (step > 0 ? 0 : filtered.length - 1) : (selectedIndex + step + filtered.length) % filtered.length;
    change({ ...filtered[next].design });
    setPage(Math.floor(next / pageSize));
  };
  const changed = !sameDesign(value, appliedValue);

  return <section id="design-explorer" className="dx-panel" aria-labelledby="design-heading">
    <header className="dx-heading">
      <div><span className="dx-kicker">디자인 조합 · {designPresets.length}개 출발안</span><h2 id="design-heading">내게 맞는 화면 만들기</h2><p>출발 조합을 고른 뒤 구조·색·여백을 따로 바꿔보세요. 아래 페이지에 바로 보여요.</p></div>
      <div className="dx-heading-actions"><button type="button" aria-expanded={expanded} aria-controls="design-explorer-body" onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}{expanded ? '패널 접기' : '패널 펼치기'}</button><button type="button" onClick={cancel}>취소</button></div>
    </header>
    <div id="design-explorer-body" hidden={!expanded}>
      <section className="dx-library" aria-labelledby="dx-library-title">
        <div className="dx-section-heading"><div><h3 id="dx-library-title">01 · 출발 조합</h3><p>정해진 정답이 아니라, 마음에 드는 요소를 찾는 시작점이에요.</p></div><div className="dx-preset-cycle"><button type="button" aria-label="이전 출발 조합" disabled={!filtered.length} onClick={() => movePreset(-1)}><ArrowLeft size={18} aria-hidden="true" /></button><output aria-live="polite">{selectedPreset ? selectedPreset.name : '직접 조합 중'}</output><button type="button" aria-label="다음 출발 조합" disabled={!filtered.length} onClick={() => movePreset(1)}><ArrowRight size={18} aria-hidden="true" /></button></div></div>
        <div className="dx-filterbar">
          <label className="dx-search"><span>조합 찾기</span><span className="dx-search-field"><Search size={17} aria-hidden="true" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="이름 또는 A–AF" /></span></label>
          <label><span>화면 구조</span><select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }}><option value="all">모든 구조</option>{designOptions.frame.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <p className="dx-result-count" aria-live="polite">{filtered.length}개 조합</p>
        </div>
        <div className="dx-preset-grid">
          {visible.map((preset) => <button type="button" className="dx-preset" key={preset.id} aria-label={preset.name + ' 미리보기'} aria-pressed={sameDesign(preset.design, value)} onClick={() => change({ ...preset.design })}>
            <Miniature design={preset.design} />
            <span className="dx-preset-title"><span className="dx-preset-id">{preset.id}</span><strong>{preset.name.replace(/^[A-Z]{1,2}\s*·\s*/, '')}</strong>{sameDesign(preset.design, value) && <Check size={17} aria-hidden="true" />}</span>
            <span className="dx-preset-description">{preset.description}</span>
            <span className="dx-swatches" aria-hidden="true">{(['bg', 'paper', 'ink', 'accent'] as const).map((token) => <i key={token} style={{ background: paletteTokens[preset.design.color][token] }} />)}</span>
          </button>)}
        </div>
        {!filtered.length && <p className="dx-empty">맞는 조합이 없어요. <button type="button" onClick={() => { setFilter('all'); setQuery(''); setPage(0); }}>전체 조합 보기</button></p>}
        <nav className="dx-pagination" aria-label="출발 조합 페이지"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>이전 페이지</button><output aria-live="polite">{currentPage + 1} / {pageCount}</output><button type="button" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>다음 페이지</button></nav>
      </section>
      <section className="dx-adjust" aria-labelledby="dx-adjust-title">
        <div className="dx-section-heading"><div><h3 id="dx-adjust-title">02 · 요소별로 조합</h3><p>출발 조합의 다른 요소는 그대로 두고, 하나씩 바꿔볼 수 있어요.</p></div></div>
        <div className="dx-axis-grid">{axes.map((axis) => {
          const options = designOptions[axis];
          const index = Math.max(0, options.findIndex((option) => option.id === value[axis]));
          const selected = options[index];
          const move = (step: number) => change({ ...value, [axis]: options[(index + step + options.length) % options.length].id } as Design);
          return <div className="dx-axis" key={axis}><label htmlFor={`dx-axis-${axis}`}>{designLabels[axis]}<span>{index + 1} / {options.length}</span></label><div className="dx-axis-switch"><button type="button" aria-label={`${designLabels[axis]} 이전 옵션`} onClick={() => move(-1)}><ArrowLeft size={16} aria-hidden="true" /></button><select id={`dx-axis-${axis}`} value={value[axis]} onChange={(event) => change({ ...value, [axis]: event.target.value } as Design)}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><button type="button" aria-label={`${designLabels[axis]} 다음 옵션`} onClick={() => move(1)}><ArrowRight size={16} aria-hidden="true" /></button></div><p>{selected.detail}</p></div>;
        })}</div>
      </section>
      <section className="dx-compare" aria-labelledby="dx-compare-title">
        <div className="dx-section-heading"><div><h3 id="dx-compare-title">03 · 적용 전 비교</h3><p>적용 중인 화면과 지금 고르는 화면을 같은 조건에서 확인해요.</p></div><button type="button" className="dx-compare-toggle" aria-expanded={compare} aria-controls="dx-comparison" onClick={() => setCompare(!compare)}><Columns2 size={17} aria-hidden="true" />{compare ? '비교 닫기' : '두 화면 나란히 보기'}</button></div>
        {compare && <div id="dx-comparison"><p className="dx-comparison-note">같은 1280px 홈 화면을 축소해 보여줍니다. 비교 화면 안의 버튼은 동작하지 않아요. 실제 읽기·이동은 아래 페이지에서 확인하세요.</p><div className="dx-comparison-grid"><PagePreview design={appliedValue} label="현재 적용한 화면" /><PagePreview design={value} label="지금 미리보는 화면" /></div></div>}
      </section>
    </div>
    <footer className="dx-bottom"><p role="status">{changed ? '변경한 조합을 미리보고 있어요. 취소하면 적용 중인 화면으로 돌아갑니다.' : '적용 중인 조합입니다. 바꾼 뒤 적용하면 이 브라우저에 저장돼요.'}</p><div className="dx-bottom-actions"><button type="button" onClick={() => change({ ...defaultDesign })}><RotateCcw size={16} aria-hidden="true" />기본 조합 미리보기</button><button type="button" className="dx-apply" onClick={apply}><Check size={17} aria-hidden="true" />이 조합 적용</button></div></footer>
  </section>;
}
