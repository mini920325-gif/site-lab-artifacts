// Navigation only; no eligibility decision or generated advice.
import { activeEdition } from './edition.ts';
export const sourceLinks = activeEdition.id === 'claude' ? [
 {label:'취업·훈련 정보 찾기',note:'채용, 직업·진로, 교육·훈련 원문',agency:'고용24',url:'https://www.work24.go.kr/cm/main.do'},
 {label:'청년 정책 찾아보기',note:'청년 정책과 프로그램 원문',agency:'온통청년',url:'https://www.youthcenter.go.kr/'},
 {label:'생활 민원 확인하기',note:'기관 원문으로 이동',agency:'정부24',url:'https://www.gov.kr/'},
 {label:'보훈 제도 안내 확인하기',note:'기관 원문으로 이동',agency:'국가보훈부',url:'https://www.mpva.go.kr/'},
] : [
 {label:'보훈 제도·지원 안내',note:'보훈 대상별 공식 안내. 군·경 경력만으로 지원대상을 판단하지 않습니다.',agency:'국가보훈부',url:'https://www.mpva.go.kr/mpva/index.do'},
 {label:'제대군인 취업·교육 지원',note:'제대군인 대상 안내. 사업별 대상과 절차를 원문에서 확인하세요.',agency:'제대군인지원센터',url:'https://www.vnet.go.kr/'},
 {label:'군 전역 준비·전직교육',note:'군 전직교육·취업지원의 공식 안내입니다.',agency:'국방전직교육원',url:'https://www.moti.or.kr/'},
 {label:'퇴직경찰 지원 담당 부서',note:'경찰청 복지정책담당관 복지지원계의 퇴직자 취업지원 업무 안내입니다. 신청 페이지가 아닙니다.',agency:'경찰청',url:'https://www.police.go.kr/www/agency/orginfo/orginfo0201.jsp'},
];
// 실제 글이 하나도 없을 때 목록·홈 표 위에 한 번만 쓰는 안내(행 꼬리표 대신)
export const allSampleNotice = '아래 글은 모두 구성 예시입니다. 실제 회원 글은 아직 없습니다.';
// 가운뎃점으로 이어진 낱말(「교육·훈련」「직업·진로」)이 점 뒤에서 갈라지지 않게 점 양옆에 낱말 잇개(U+2060)를 넣는다.
// 화면에는 보이지 않고, 칸이 정말 모자라면 overflow-wrap 으로 비상 줄바꿈은 여전히 된다.
export const joinDots = (s: string) => s.replace(/·/g, '⁠·⁠');
