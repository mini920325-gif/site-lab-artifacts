'use client';
import { useState } from 'react';
import { date, type LocationState } from './domain';
import { siteConfig, type Accent } from './site-config';
import { compositions, type Composition } from './design';
import { PageHead } from './PageHead';
type Settings = {
  name: string;
  composition: Composition;
  announcement: string;
  accent: Accent;
};
const moderationSteps = [
  {
    id: 'pii',
    title: '1. 개인정보·부대 특정 차단',
    detail: '이름·연락처·군번·부대·보직 등 식별 가능 정보는 숨김 처리합니다.',
  },
  {
    id: 'unsourced',
    title: '2. 출처 없는 단정 숨김',
    detail: '법령·자격 단정인데 검수된 출처가 없으면 공개 권위로 표시하지 않습니다.',
  },
  {
    id: 'board',
    title: '3. 잘못된 게시판 이동',
    detail: '주제 분류가 어긋난 글은 이동하고 삭제는 피합니다.',
  },
  {
    id: 'dup',
    title: '4. 중복 글 병합·연결',
    detail: '같은 질문은 연결하거나 병합합니다. 삭제보다 숨김·연결을 우선합니다.',
  },
] as const;

export function StudioView({
  settings,
  apply,
  reports,
  updateReport,
  go,
}: {
  settings: Settings;
  apply: (s: Settings) => void;
  reports: {
    id: string;
    target: string;
    reason: string;
    status: string;
    at: string;
    updated: string;
  }[];
  updateReport: (id: string, status: string) => void;
  go: (s: Partial<LocationState>) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [role, setRole] = useState('designer');
  const [tab, setTab] = useState('design');
  const [message, setMessage] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <>
      <PageHead
        title="운영실"
        sub="이름·공지·강조색·목록 구성만 조정합니다."
        action={<span className="status-tag">로컬 체험</span>}
      />
      <div className="notice compact">
        CMS 저장·승인·버전 복원은 다음 단계입니다. 이 화면 값은 현재 미리보기에만
        남습니다.
      </div>
      <div className="studio-toolbar">
        <label htmlFor="role">체험 역할</label>
        <select
          id="role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setMessage('');
          }}
        >
          <option value="designer">디자이너</option>
          <option value="moderator">운영자</option>
          <option value="owner">소유자</option>
        </select>
      </div>
      <div className="studio-tabs" aria-label="운영 메뉴">
        {[
          ['design', '표현'],
          ['moderation', '검수 우선순위'],
          ['queue', '처리함'],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'design' ? (
        <section className="form-panel">
          <h2>사이트 표현</h2>
          <p className="muted">
            이름·공지·목록 구성·강조색을 조정합니다. 상단의 ‘디자인 비교’에서도 목록 구성을 바꿀 수 있습니다.
          </p>
          <label htmlFor="brand-input">사이트 이름</label>
          <input
            id="brand-input"
            value={draft.name}
            maxLength={20}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <fieldset>
            <legend>목록 구성</legend>
            {(Object.keys(compositions) as Composition[]).map((id) => (
              <label className="radio-card" htmlFor={`comp-${id}`} key={id}>
                <input
                  id={`comp-${id}`}
                  type="radio"
                  name="composition"
                  checked={draft.composition === id}
                  onChange={() => setDraft({ ...draft, composition: id })}
                />
                <span>
                  <strong>{compositions[id].label}</strong>
                  <small>{compositions[id].detail}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label htmlFor="studio-notice">상단 공지</label>
          <input
            id="studio-notice"
            maxLength={120}
            value={draft.announcement}
            onChange={(e) =>
              setDraft({ ...draft, announcement: e.target.value })
            }
          />
          <label htmlFor="studio-accent">강조 색상</label>
          <select
            id="studio-accent"
            value={draft.accent}
            onChange={(e) =>
              setDraft({ ...draft, accent: e.target.value as Accent })
            }
          >
            {Object.entries(siteConfig.themes).map(([id, value]) => (
              <option key={id} value={id}>
                {value.label}
              </option>
            ))}
          </select>
          <div className="theme-swatch">
            <strong>{draft.name || '이름을 입력하세요'}</strong>
            <span>
              {compositions[draft.composition].label} ·{' '}
              {siteConfig.themes[draft.accent].label}
            </span>
            <p>{draft.announcement}</p>
          </div>
          <div className="actions">
            <button
              className="primary"
              disabled={role === 'moderator' || !draft.name.trim()}
              onClick={() => {
                apply({ ...draft, name: draft.name.trim() });
                setMessage('미리보기에만 반영했습니다. 새로고침하면 기본값으로 돌아갑니다.');
              }}
            >
              미리보기에 반영
            </button>
            <button
              onClick={() => {
                setDraft({
                  name: siteConfig.name,
                  composition: 'board',
                  announcement: siteConfig.announcement,
                  accent: 'navy',
                });
                setMessage('편집 값을 기본값으로 되돌렸습니다.');
              }}
            >
              편집 값 초기화
            </button>
          </div>
          <p className="fine">
            저장·승인·버전은 다음 CMS 단계에서 연결합니다. 역할 전환은 시연용이며
            서버 권한 검사가 아닙니다.
          </p>
        </section>
      ) : tab === 'moderation' ? (
        <section className="form-panel moderation-panel">
          <h2>검수 우선순위</h2>
          <p className="muted">
            데모 체크리스트입니다. 실제 숨김·이동·병합 API는 연결되지 않았습니다.
            원칙: 삭제보다 숨김.
          </p>
          <ol className="moderation-checklist">
            {moderationSteps.map((step) => (
              <li key={step.id}>
                <label aria-label={step.title}>
                  <input
                    type="checkbox"
                    checked={!!checked[step.id]}
                    disabled={role === 'designer'}
                    onChange={(e) =>
                      setChecked({ ...checked, [step.id]: e.target.checked })
                    }
                  />
                  <span>
                    <strong>{step.title}</strong>
                    <small>{step.detail}</small>
                  </span>
                </label>
              </li>
            ))}
          </ol>
          <p className="fine">
            디자이너는 열람만, 운영자·소유자가 체크 시연을 할 수 있습니다. 상태는
            현재 화면에만 남습니다.
          </p>
        </section>
      ) : (
        <section className="form-panel">
          <h2>운영 처리함</h2>
          <p>
            현재 화면에서 체험한 신고 <strong>{reports.length}</strong>건
          </p>
          <div className="empty small">
            <strong>실제 신고 접수는 연결 전입니다.</strong>
            <p>배정·회신·원문 조치는 인증된 서버에서 관리해야 합니다.</p>
          </div>
          {reports.map((r) => (
            <article className="queue-item" key={r.id}>
              <strong>{r.reason}</strong>
              <p>대상: {r.target}</p>
              <p className="fine">
                접수 {date(r.at)} KST
                <br />
                상태 변경 {date(r.updated)} KST
              </p>
              <label htmlFor={`report-${r.id}`}>처리 상태 · 체험</label>
              <select
                id={`report-${r.id}`}
                disabled={role === 'designer'}
                value={r.status}
                onChange={(e) => updateReport(r.id, e.target.value)}
              >
                <option>접수 체험</option>
                <option>검토 중</option>
                <option>숨김 체험</option>
                <option>기각 체험</option>
              </select>
            </article>
          ))}
          <button onClick={() => go({ view: 'list', post: '' })}>
            이용자 화면 확인
          </button>
        </section>
      )}
      <output className="feedback">{message}</output>
    </>
  );
}
