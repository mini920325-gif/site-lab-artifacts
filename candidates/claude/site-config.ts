import { activeEdition } from './edition.ts';
import { designOptions, paletteTokens, type Design } from './design.ts';

// Mutable display choices; no final brand or office affiliation is asserted.
const themes = Object.fromEntries(designOptions.color.map(option => [
  option.id, { label: option.label, color: paletteTokens[option.id].accent },
])) as Record<Design['color'], { label: string; color: string }>;
export const siteConfig = {
 name: activeEdition.name, office: activeEdition.id === 'claude' ? '커뮤니티 통합 실험' : activeEdition.name + ' · 비교용 시안명',
 description: activeEdition.id === 'claude' ? '전직·취업·창업·교육·생활·보훈의 이야기' : '보훈·군경 전직에 집중한 전문 커뮤니티',
 notice: activeEdition.id === 'claude' ? '이름과 운영 범위는 검토 중입니다.' : '보훈·군경 전직 중심의 체험 시안입니다. 최종 이름은 미정입니다.',
 announcement: '체험 화면 · 작성 내용은 새로고침하면 초기화됩니다',
 themes,
} as const;
export type Accent = keyof typeof siteConfig.themes;
