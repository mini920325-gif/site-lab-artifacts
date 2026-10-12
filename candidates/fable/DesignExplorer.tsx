import { Check } from 'lucide-react';
import { compositions, type Composition } from './design';

// Design comparison: three list compositions on the same posts.
export function DesignExplorer({
  value,
  change,
  apply,
  cancel,
}: {
  value: Composition;
  change: (value: Composition) => void;
  apply: () => void;
  cancel: () => void;
}) {
  return (
    <section
      id="design-explorer"
      className="design-explorer container"
      aria-labelledby="design-heading"
    >
      <div className="design-heading">
        <div>
          <h2 id="design-heading">디자인 비교 · 목록 세 구성</h2>
          <p>고르면 아래 목록에 바로 반영됩니다. 글 내용과 순서는 같습니다.</p>
        </div>
        <button type="button" onClick={cancel}>
          취소
        </button>
      </div>
      <div className="design-options" role="radiogroup" aria-label="목록 구성">
        {(Object.keys(compositions) as Composition[]).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            className="design-option"
            onClick={() => change(id)}
          >
            <strong>{compositions[id].label}</strong>
            <span>{compositions[id].detail}</span>
          </button>
        ))}
      </div>
      <div className="design-bottom">
        <p>적용한 구성은 이 브라우저에만 저장됩니다.</p>
        <button type="button" className="primary" onClick={apply}>
          <Check size={17} aria-hidden="true" /> 이 구성 적용
        </button>
      </div>
    </section>
  );
}
