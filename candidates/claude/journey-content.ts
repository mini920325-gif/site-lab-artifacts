// Navigation only; no eligibility decision or generated advice.
export const sourceLinks = [
 {label:'취업·훈련 정보 찾기',note:'채용, 직업·진로, 교육·훈련 원문',agency:'고용24',url:'https://www.work24.go.kr/cm/main.do'},
 {label:'청년 정책 찾아보기',note:'청년 정책과 프로그램 원문',agency:'온통청년',url:'https://www.youthcenter.go.kr/'},
 {label:'생활 민원 확인하기',note:'기관 원문으로 이동',agency:'정부24',url:'https://www.gov.kr/'},
 {label:'보훈 제도 안내 확인하기',note:'기관 원문으로 이동',agency:'국가보훈부',url:'https://www.mpva.go.kr/'},
];
// 실제 글이 하나도 없을 때 목록·홈 표 위에 한 번만 쓰는 안내(행 꼬리표 대신)
export const allSampleNotice = '아래 글은 모두 구성 예시입니다. 실제 회원 글은 아직 없습니다.';
// 가운뎃점으로 이어진 낱말(「교육·훈련」「직업·진로」)이 점 뒤에서 갈라지지 않게 점 양옆에 낱말 잇개(U+2060)를 넣는다.
// 화면에는 보이지 않고, 칸이 정말 모자라면 overflow-wrap 으로 비상 줄바꿈은 여전히 된다.
export const joinDots = (s: string) => s.replace(/·/g, '⁠·⁠');
