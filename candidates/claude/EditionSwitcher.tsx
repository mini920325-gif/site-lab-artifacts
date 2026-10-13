import { useEffect, useRef, useState } from 'react';
import { activeEdition, editions, editionPreviewURL } from './edition';
import './editions.css';
function EditionPreview({ index }: { index: number }) {
  const edition = editions[index]; const box = useRef<HTMLDivElement>(null); const [width, setWidth] = useState(0);
  useEffect(() => { if (!box.current) return; const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width)); observer.observe(box.current); return () => observer.disconnect(); }, []);
  return <figure><figcaption><strong>{edition.number}안 · {edition.number === 1 ? edition.label : edition.name}</strong><span>{edition.description}</span></figcaption><div className="ed-preview" ref={box} inert><iframe src={editionPreviewURL(edition)} title={`${edition.number}안 기본 홈 비교`} tabIndex={-1} aria-hidden="true" loading="lazy" style={{ transform: `scale(${width / 1280})` }} /></div><a href={edition.path + '?view=home'} target="_blank" rel="noopener noreferrer">{edition.number}안 새 탭에서 열기</a></figure>;
}
export function EditionSwitcher({ hasDraft }: { hasDraft: boolean }) {
  const [compare, setCompare] = useState(false);
  return <section className="edition-switcher" aria-label="1·2·3안 선택">
    <div className="ed-toolbar"><nav aria-label="시안 선택">{editions.map(item => <a key={item.id} href={item.path + '?view=home'} aria-current={item.id === activeEdition.id ? 'page' : undefined} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (item.id === activeEdition.id) { event.preventDefault(); return; }
      if (hasDraft && !window.confirm('작성 중인 체험 글이나 댓글은 다른 안으로 이동하면 사라집니다. 이동할까요? 메모와 저장한 시안은 유지됩니다.')) event.preventDefault();
    }}><b>{item.number}안</b><span>{item.number === 1 ? item.label : item.name}</span></a>)}</nav><button type="button" aria-expanded={compare} aria-controls="edition-compare" onClick={() => setCompare(!compare)}>{compare ? '비교 접기' : '세 안 나란히 비교'}</button></div>
    {compare && <div id="edition-compare"><p className="ed-description">각 안의 기본 디자인을 같은 1280px 화면으로 비교합니다. 메모·이름 저장은 안별로 구분됩니다. 2·3안의 이름은 비교용 제안입니다.</p><div className="ed-comparison-grid">{editions.map((item, index) => <EditionPreview key={item.id} index={index} />)}</div></div>}
  </section>;
}
