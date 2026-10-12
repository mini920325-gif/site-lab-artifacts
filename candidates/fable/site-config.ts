// Mutable display choices; no final brand or office affiliation is asserted.
export const siteConfig = {
 name: '커뮤니티', office: '커뮤니티 통합 실험',
 description: '전직·취업·창업·교육·생활·보훈의 이야기',
 notice: '이름과 운영 범위는 검토 중입니다.',
 announcement: '체험 화면 · 작성 내용은 새로고침하면 초기화됩니다',
 themes: { navy: {label:'블루',color:'#2648a1'},teal:{label:'잉크',color:'#252a36'},forest:{label:'그린',color:'#17634d'} },
} as const;
export type Accent = keyof typeof siteConfig.themes;
