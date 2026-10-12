export const designOptions = {
  frame: [
    { id: 'editorial', label: '에디토리얼', detail: '이야기를 앞에 두는 편집형 첫 화면.' },
    { id: 'commons', label: '커먼스', detail: '대화 목록과 주제 탐색을 나란히.' },
    { id: 'atlas', label: '아틀라스', detail: '주제별 묶음을 넓게 펼치는 구성.' },
    { id: 'forum', label: '게시판', detail: '최근 글과 분야를 빠르게 훑는 구성.' },
    { id: 'journal', label: '저널', detail: '본문의 첫 문장을 여유 있게 읽는 구성.' },
    { id: 'directory', label: '디렉터리', detail: '주제와 자료로 바로 들어가는 구성.' },
  ],
  layout: [
    { id: 'rows', label: '제목과 한 줄', detail: '제목과 짧은 미리보기를 함께 읽어요.' },
    { id: 'forum', label: '간결한 게시판', detail: '제목을 먼저 보고 주제와 상태를 확인해요.' },
    { id: 'preview', label: '넓은 미리보기', detail: '본문을 더 읽고 글을 골라요.' },
  ],
  spacing: [
    { id: 'balanced', label: '기본 간격', detail: '목록과 조작 사이의 균형을 맞춰요.' },
    { id: 'compact', label: '촘촘하게', detail: '같은 화면에서 더 많은 글을 봐요.' },
    { id: 'roomy', label: '여유롭게', detail: '글 사이와 안쪽 여백을 넓혀요.' },
  ],
  type: [
    { id: 'system', label: '기본 글꼴', detail: '기기의 기본 고딕 글꼴로 읽어요.' },
    { id: 'large', label: '큰 글씨', detail: '제목과 본문을 한 단계 키워요.' },
    { id: 'serif', label: '명조 글꼴', detail: '제목과 본문을 명조 계열로 읽어요.' },
  ],
  color: [
    { id: 'navy', label: '블루', detail: '흰 바탕에 선명한 파란색.' },
    { id: 'teal', label: '잉크', detail: '차분한 회색과 짙은 잉크색.' },
    { id: 'forest', label: '숲', detail: '밝은 녹색 바탕과 깊은 초록.' },
    { id: 'paper', label: '종이', detail: '따뜻한 종이색과 짙은 갈색.' },
    { id: 'sea', label: '바다', detail: '밝은 청록 바탕과 푸른 잉크.' },
    { id: 'night', label: '밤', detail: '짙은 바탕과 연한 라임색.' },
    { id: 'clay', label: '흙', detail: '붉은 갈색과 부드러운 살구색.' },
    { id: 'plum', label: '자두', detail: '연한 자줏빛 바탕과 짙은 자주색.' },
    { id: 'mono', label: '흑백', detail: '흰색과 검은색의 또렷한 대비.' },
    { id: 'sand', label: '모래', detail: '담백한 모래색과 짙은 황갈색.' },
  ],
  corners: [
    { id: 'square', label: '반듯하게', detail: '직선으로 구획과 조작을 정리해요.' },
    { id: 'soft', label: '살짝 둥글게', detail: '모서리만 부드럽게 다듬어요.' },
    { id: 'round', label: '둥글게', detail: '카드와 조작의 모서리를 넉넉하게 둬요.' },
  ],
  symbols: [
    { id: 'none', label: '글자 중심', detail: '장식 아이콘을 줄이고 글자를 먼저 봐요.' },
    { id: 'minimal', label: '필요한 곳만', detail: '길 찾기와 핵심 조작에만 기호를 써요.' },
    { id: 'full', label: '기호 함께', detail: '분야와 조작을 기호로도 구분해요.' },
  ],
} as const;

export type DesignAxis = keyof typeof designOptions;
export type Design = { [K in DesignAxis]: (typeof designOptions)[K][number]['id'] };
export const designLabels: Record<DesignAxis, string> = {
  frame: '홈 구성', layout: '목록 형태', spacing: '여백', type: '글꼴',
  color: '색상', corners: '모서리', symbols: '기호',
};
export const defaultDesign: Design = {
  frame: 'editorial', layout: 'rows', spacing: 'balanced', type: 'serif',
  color: 'paper', corners: 'soft', symbols: 'minimal',
};

type Palette = { bg: string; paper: string; ink: string; muted: string; line: string; accent: string; soft: string; onAccent: string };
export const paletteTokens: Record<Design['color'], Palette> = {
  navy: { bg: '#f4f6fa', paper: '#ffffff', ink: '#202735', muted: '#536076', line: '#d9e0eb', accent: '#2648a1', soft: '#e9eefb', onAccent: '#ffffff' },
  teal: { bg: '#f3f4f3', paper: '#ffffff', ink: '#20252a', muted: '#596267', line: '#d8dcda', accent: '#252a36', soft: '#e7eae8', onAccent: '#ffffff' },
  forest: { bg: '#f1f5ef', paper: '#fbfdf9', ink: '#20352a', muted: '#526358', line: '#d3dfd1', accent: '#17634d', soft: '#e2eee3', onAccent: '#ffffff' },
  paper: { bg: '#f3efe6', paper: '#fffdf7', ink: '#29251f', muted: '#696052', line: '#dcd3c3', accent: '#7b482d', soft: '#eae0cf', onAccent: '#ffffff' },
  sea: { bg: '#edf6f4', paper: '#ffffff', ink: '#1d3838', muted: '#4d6968', line: '#cbdedb', accent: '#126b68', soft: '#dbefeb', onAccent: '#ffffff' },
  night: { bg: '#171c20', paper: '#22292f', ink: '#f1f3ed', muted: '#b7c1be', line: '#43504e', accent: '#d2eb8c', soft: '#354333', onAccent: '#202719' },
  clay: { bg: '#f7eee8', paper: '#fffbf7', ink: '#3a2822', muted: '#785d53', line: '#e4d1c5', accent: '#963f2e', soft: '#f0dbcf', onAccent: '#ffffff' },
  plum: { bg: '#f5eff4', paper: '#fffaff', ink: '#382a38', muted: '#715a6e', line: '#e0d0de', accent: '#7b3f6b', soft: '#efdfec', onAccent: '#ffffff' },
  mono: { bg: '#f3f3f3', paper: '#ffffff', ink: '#171717', muted: '#626262', line: '#d5d5d5', accent: '#202020', soft: '#e9e9e9', onAccent: '#ffffff' },
  sand: { bg: '#f4f0e3', paper: '#fffdf5', ink: '#343024', muted: '#696249', line: '#ddd4b9', accent: '#76541b', soft: '#ede3c8', onAccent: '#ffffff' },
};

/** Only named options enter styles or storage; unknown fields and inherited values are ignored. */
export function normalizeDesign(input: unknown): Design {
  const result = { ...defaultDesign };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
  try {
    for (const axis of Object.keys(designOptions) as DesignAxis[]) {
      const value: unknown = Object.getOwnPropertyDescriptor(input, axis)?.value;
      if (typeof value === 'string' && designOptions[axis].some(option => option.id === value)) {
        Object.assign(result, { [axis]: value });
      }
    }
  } catch { return { ...defaultDesign }; }
  return result;
}

export function designTokens(design: Design): Record<'--page' | '--paper' | '--ink' | '--muted' | '--line' | '--accent' | '--soft' | '--on-accent', string> {
  const palette = paletteTokens[normalizeDesign(design).color];
  return {
    '--page': palette.bg, '--paper': palette.paper, '--ink': palette.ink,
    '--muted': palette.muted, '--line': palette.line, '--accent': palette.accent,
    '--soft': palette.soft, '--on-accent': palette.onAccent,
  };
}

export type DesignPreset = { id: string; name: string; description: string; design: Design };
function preset(id: string, name: string, description: string, changes: Partial<Design>): DesignPreset {
  return { id, name: `${id} · ${name}`, description, design: { ...defaultDesign, ...changes } };
}
/** Starting combinations of shared design axes, not thirty-two independent sites. */
export const designPresets: DesignPreset[] = [
  preset('A', '에디토리얼', '종이색과 명조로 이야기를 앞에 둡니다.', {}),
  preset('B', '커먼스', '청록색의 간결한 목록과 주제 탐색.', { frame: 'commons', color: 'sea', type: 'system', layout: 'forum' }),
  preset('C', '아틀라스', '짙은 바탕에 주제별 미리보기를 펼칩니다.', { frame: 'atlas', color: 'night', type: 'system', layout: 'preview', corners: 'square', symbols: 'full' }),
  preset('D', '동네 게시판', '촘촘한 파란색 게시판으로 제목을 훑습니다.', { frame: 'forum', color: 'navy', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square' }),
  preset('E', '주말 저널', '갈색 명조와 넓은 간격으로 긴 글을 읽습니다.', { frame: 'journal', color: 'paper', layout: 'preview', spacing: 'roomy' }),
  preset('F', '자료 길잡이', '초록색으로 주제와 자료의 입구를 구분합니다.', { frame: 'directory', color: 'forest', type: 'system', corners: 'square', symbols: 'full' }),
  preset('G', '흑백 편집실', '반듯한 흑백 화면에 글자만 남깁니다.', { frame: 'editorial', color: 'mono', corners: 'square', symbols: 'none' }),
  preset('H', '해변 라운지', '청록색과 여유 있는 미리보기.', { frame: 'commons', color: 'sea', type: 'system', layout: 'preview', spacing: 'roomy', corners: 'round' }),
  preset('I', '밤의 게시판', '어두운 화면에서도 많은 제목을 훑습니다.', { frame: 'forum', color: 'night', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square', symbols: 'none' }),
  preset('J', '붉은 노트', '따뜻한 붉은색과 명조의 짧은 이야기.', { frame: 'journal', color: 'clay', spacing: 'roomy', symbols: 'none' }),
  preset('K', '숲의 서가', '주제별 글을 밝은 초록색 묶음으로.', { frame: 'atlas', color: 'forest', type: 'system', layout: 'preview', symbols: 'full' }),
  preset('L', '모래빛 자료실', '넓고 반듯한 자료 탐색 화면.', { frame: 'directory', color: 'sand', type: 'system', spacing: 'roomy', corners: 'square' }),
  preset('M', '큰 글씨 커먼스', '큰 글씨와 넓은 간격의 대화 목록.', { frame: 'commons', color: 'teal', type: 'large', spacing: 'roomy' }),
  preset('N', '자주빛 문답', '짧은 제목을 담은 자주색 게시판.', { frame: 'forum', color: 'plum', type: 'system', layout: 'forum', corners: 'round' }),
  preset('O', '잉크 저널', '고딕과 흑회색으로 담백하게 읽습니다.', { frame: 'journal', color: 'teal', type: 'system', layout: 'preview', symbols: 'none' }),
  preset('P', '청색 에디션', '파란색 포인트와 명조 제목의 편집형.', { frame: 'editorial', color: 'navy', layout: 'preview', corners: 'square' }),
  preset('Q', '간단한 목차', '촘촘한 흑백 자료 목록.', { frame: 'directory', color: 'mono', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square', symbols: 'none' }),
  preset('R', '종이 지도', '종이색 주제 묶음과 짧은 미리보기.', { frame: 'atlas', color: 'paper', type: 'system', layout: 'rows', corners: 'square', symbols: 'full' }),
  preset('S', '녹색 대화', '부드러운 초록색의 여유 있는 대화.', { frame: 'commons', color: 'forest', type: 'system', spacing: 'roomy', corners: 'round' }),
  preset('T', '생활 메모', '붉은 갈색의 촘촘한 생활 게시판.', { frame: 'forum', color: 'clay', type: 'system', layout: 'rows', spacing: 'compact' }),
  preset('U', '자두빛 저널', '명조와 넓은 자줏빛 읽기 화면.', { frame: 'journal', color: 'plum', layout: 'preview', spacing: 'roomy', corners: 'round' }),
  preset('V', '밤의 길잡이', '어두운 자료실에서 기호로 입구를 찾습니다.', { frame: 'directory', color: 'night', type: 'system', symbols: 'full' }),
  preset('W', '모래빛 큰 글씨', '큰 제목을 주제별로 펼칩니다.', { frame: 'atlas', color: 'sand', type: 'large', layout: 'preview', spacing: 'roomy', corners: 'soft' }),
  preset('X', '담백한 대화', '흑백 고딕과 반듯한 대화 목록.', { frame: 'commons', color: 'mono', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square', symbols: 'none' }),
  preset('Y', '바다 편집실', '밝은 청록색과 고딕의 가벼운 편집형.', { frame: 'editorial', color: 'sea', type: 'system', layout: 'rows', spacing: 'roomy' }),
  preset('Z', '명조 게시판', '모래색 바탕에서 제목을 명조로 읽습니다.', { frame: 'forum', color: 'sand', layout: 'forum', corners: 'square', symbols: 'none' }),
  preset('AA', '큰 글씨 자료실', '공식 자료를 큰 글씨와 넓은 간격으로.', { frame: 'directory', color: 'navy', type: 'large', spacing: 'roomy', symbols: 'full' }),
  preset('AB', '작은 편집실', '잉크색 고딕의 촘촘한 편집형 목록.', { frame: 'editorial', color: 'teal', type: 'system', layout: 'forum', spacing: 'compact', corners: 'square', symbols: 'none' }),
  preset('AC', '연한 흙빛 지도', '부드러운 카드로 주제별 글을 탐색합니다.', { frame: 'atlas', color: 'clay', type: 'system', layout: 'preview', corners: 'round', symbols: 'full' }),
  preset('AD', '밤의 읽기', '어두운 명조 화면에서 긴 글을 읽습니다.', { frame: 'journal', color: 'night', layout: 'preview', spacing: 'roomy', corners: 'square', symbols: 'none' }),
  preset('AE', '종이빛 커먼스', '종이색 고딕과 단순한 제목 목록.', { frame: 'commons', color: 'paper', type: 'system', layout: 'forum', corners: 'square' }),
  preset('AF', '자주빛 길잡이', '자료와 주제를 간결한 자주색 목록으로.', { frame: 'directory', color: 'plum', type: 'system', layout: 'forum', spacing: 'compact', corners: 'soft', symbols: 'full' }),
];

const key = 'artifacts-claude-display-v1';
const maxPreviewLength = 2048;
export function readDesign(): Design {
  try {
    if (typeof location !== 'undefined') {
      const params = new URLSearchParams(location.search);
      const preview = params.get('design');
      if (params.get('designPreview') === '1' && preview !== null) {
        if (preview.length > maxPreviewLength) return { ...defaultDesign };
        try { return normalizeDesign(JSON.parse(preview)); }
        catch { return { ...defaultDesign }; }
      }
    }
    return normalizeDesign(JSON.parse(localStorage.getItem(key) || 'null'));
  } catch { return { ...defaultDesign }; }
}
export function saveDesign(design: Design): boolean {
  try { localStorage.setItem(key, JSON.stringify(normalizeDesign(design))); return true; }
  catch { return false; }
}
