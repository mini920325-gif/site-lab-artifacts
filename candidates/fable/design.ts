// Three list compositions compared on the same data. Only presentation changes.
export const compositions = {
  board: {
    label: '게시판형',
    detail: '제목 한 줄에 분야·상황·댓글을 열로 나눕니다. 많은 글을 빠르게 훑을 때.',
  },
  qa: {
    label: '문답형',
    detail: '제목 아래 분야와 상황 꼬리표, 오른쪽에 댓글 수. 질문과 답을 찾을 때.',
  },
  card: {
    label: '카드형',
    detail: '제목과 두 줄 미리보기를 카드로 보여줍니다. 앱처럼 내려 읽을 때.',
  },
} as const;
export type Composition = keyof typeof compositions;
export const defaultComposition: Composition = 'board';
const key = 'artifacts-fable-composition-v2';
export function readComposition(): Composition {
  try {
    const value = localStorage.getItem(key) || '';
    return Object.hasOwn(compositions, value)
      ? (value as Composition)
      : defaultComposition;
  } catch {
    return defaultComposition;
  }
}
export function saveComposition(value: Composition): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
