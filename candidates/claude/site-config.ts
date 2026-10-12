import { designOptions, paletteTokens, type Design } from './design.ts';

// Mutable display choices; no final brand or office affiliation is asserted.
const themes = Object.fromEntries(designOptions.color.map(option => [
  option.id, { label: option.label, color: paletteTokens[option.id].accent },
])) as Record<Design['color'], { label: string; color: string }>;
export const siteConfig = {
 name: '커뮤니티', office: '커뮤니티 통합 실험',
 description: '전직·취업·창업·교육·생활·보훈의 이야기',
 notice: '이름과 운영 범위는 검토 중입니다.',
 announcement: '체험 화면 · 작성 내용은 새로고침하면 초기화됩니다',
 themes,
} as const;
export type Accent = keyof typeof siteConfig.themes;
