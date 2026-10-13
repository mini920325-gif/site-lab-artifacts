import type { Design } from './design.ts';

export type EditionId = 'claude' | 'ip-2' | 'ip-3';
export type Edition = { id: EditionId; number: number; name: string; label: string; description: string; path: string; design: Design };
const base: Design = { frame: 'editorial', layout: 'rows', spacing: 'balanced', type: 'serif', color: 'paper', corners: 'soft', symbols: 'minimal' };
export const editions: Edition[] = [
  { id: 'claude', number: 1, name: '커뮤니티', label: '기존 기본안', description: '지금까지 만든 기능과 자유로운 디자인 조합.', path: '/site-lab-artifacts/candidates/claude/', design: base },
  { id: 'ip-2', number: 2, name: '제도와 일상', label: '읽을거리와 자료', description: '공식 자료와 경험을 구분해 읽는 편집형 커뮤니티.', path: '/site-lab-artifacts/candidates/ip-2/', design: { ...base, color: 'navy', corners: 'square', symbols: 'none' } },
  { id: 'ip-3', number: 3, name: '일상동료', label: '질문과 경험', description: '여섯 주제의 대화가 먼저 보이는 생활 게시판.', path: '/site-lab-artifacts/candidates/ip-3/', design: { ...base, frame: 'forum', color: 'clay', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square' } },
];
export function editionForPath(path: string): Edition { return editions.find(item => path === item.path.slice(0, -1) || path.startsWith(item.path)) ?? editions[0]; }
export const activeEdition = editionForPath(typeof location === 'undefined' ? '' : location.pathname);
export function editionStorageKey(kind: 'display' | 'review', id: EditionId = activeEdition.id) { return `artifacts-${id}-${kind}-v1`; }
export function editionPreviewURL(edition: Edition, design: Design = edition.design) { return edition.path + '?view=home&designPreview=1&design=' + encodeURIComponent(JSON.stringify(design)); }
