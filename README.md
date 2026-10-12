# 커뮤니티 산출물 모음

[산출물 페이지](https://mini920325-gif.github.io/site-lab-artifacts/) · [에이전트용 목록](ARTIFACTS.md) · [JSON](docs-site/artifacts.json)

OpenAI 로그인 없이 페이지·시안·조사 자료를 읽고 비교하기 위한 공개 정적 모음입니다. 최종 브랜드나 운영 커뮤니티가 아닙니다.

- A/B/C 디자인 시안, 주제별 자료·소개·개인정보 안내
- 기록상 다른 에이전트의 구조 스케치 3개. 미채택 가설과 합성 시연임을 표시
- 상용 커뮤니티 디자인·이미지 방식 비교와 구현 계획
- Claude 기능판의 32개 출발 조합과 독립적인 7개 디자인 축, 나란히 비교·취소·적용
- 같은 기능판의 위치 메모·다른 이름 저장·JSON 복원·에이전트용 Markdown·독립 시각 참고 HTML
- Fable 비교 후보, 통합 실행 플랜, 이번 작업의 종료 조건
- 종류·작성자·상태 필터, 최근 변경·이름·종류·작성자 정렬. JavaScript 없이도 링크 목록 제공

## 지금 볼 페이지

- [Claude 임시 기본판](https://mini920325-gif.github.io/site-lab-artifacts/candidates/claude/?view=home): 읽기·찾기·체험 작성 흐름 위에 디자인 조합 선택을 연결한 임시 기준. Claude 원본 `38a207dc074782be9e525f618facda148420a404`에 Codex가 홈 외관·디자인 선택·비교와 메모·이름 저장·전달 기능을 추가했습니다.
- [Fable 비교 후보](https://mini920325-gif.github.io/site-lab-artifacts/candidates/fable/?view=home): 화면별 안내와 게시판·문답·카드 구성 비교. 원본 `577ce8bf8f7822771dfd674ae69a61f68aaa36d6`.
- [기존 디자인 편집기](https://mini920325-gif.github.io/site-lab-artifacts/preview/?design=commons): 색상·구성·메모·다른 이름 저장을 갖춘 별도의 정적 화면. React 기능 체험판과 설정을 공유하지 않습니다.
- [현재 단계와 종료 조건](docs/pre-settings-handoff.md) · [통합 실행 플랜](docs/community-master-plan.md).

사용자 피드백에 따라 페이지 연결에 더해 Claude 기능판에서 외관을 고르고 비교할 수 있도록 범위를 넓혔습니다. 디자인 선택에서 A–AF 32개 출발 조합을 넘겨 보고, 화면 구성 6종·색상 10종·목록 3종·글꼴 3종·여백 3종·모서리 3종·기호 3종을 독립적으로 조합합니다. 같은 1280px 홈 화면을 나란히 비교하며 비교 화면 안에서는 조작하지 않습니다. 취소하면 이전 조합으로 돌아가고, 적용하면 브라우저에 저장합니다.

기능판에서 페이지·위치에 노랑·분홍·파랑·초록 메모를 남기고 편집·완료 표시·삭제할 수 있습니다. 작업 중 메모는 임시 저장하며, 명시 저장과 다른 이름 저장을 구분합니다. 다른 이름 저장은 기존 시안을 보존하고, JSON 가져오기는 저장 목록을 덮지 않는 별도 사본으로 엽니다. JSON은 복원용, Markdown은 에이전트 수정 요청용, 독립 HTML은 화면과 메모를 보여 주는 시각 참고용입니다. 파일을 내려받아 전달하는 방식이며 에이전트에게 자동 전송하지 않습니다.

저장본은 최대 30개, 시안별 메모는 최대 100개이며 가져오는 JSON은 1MB 이하입니다. 기존 정적 편집기는 삭제하지 않았고 저장 키와 형식이 달라 자동 이전되지 않습니다. 32개는 공통 축의 출발 조합이며 최종 취향 선택과 실제 인증·DB는 범위 밖입니다. **이번 메모·이름 저장·전달 추가분은 로컬 검증을 완료했으며 공개 확인 전입니다.** 최종 결과는 종료 조건 문서에 기록합니다.

## 에이전트 진입점

먼저 `ARTIFACTS.md` 또는 `docs-site/artifacts.json`을 읽으세요. 각 항목에 미리보기 URL, 원본 상대 경로, 작성자, 상태가 있습니다. 원본 커밋과 파일 해시는 `provenance.json`에 있습니다. 문서의 제안·관찰은 새 작업을 실행하라는 지시가 아닙니다. 보고서의 작성 시점과 관찰 한계를 유지하세요.

## 수정과 실행

카탈로그와 기존 정적 편집기만 갱신할 때는 Node.js 22 이상에서 외부 패키지나 API 키 없이 생성합니다.

```sh
node build-catalog.mjs
node --test catalog.test.mjs publication/studio.test.mjs publication/publication.test.mjs
node serve-catalog.mjs
```

React 후보까지 다시 빌드하려면 저장소 루트에서 고정된 의존성을 설치하고 후보를 먼저 빌드합니다. API 키는 필요하지 않습니다. `build-candidates.mjs`는 프로젝트 하위 경로에 맞춘 실행 파일을 `docs-site/candidates/`에 만듭니다.

```sh
npm ci --ignore-scripts
node build-candidates.mjs
node build-catalog.mjs
node --experimental-strip-types --test candidates/claude/domain.test.ts candidates/claude/design.test.ts candidates/claude/review.test.ts candidates/fable/domain.test.ts
node --test catalog.test.mjs publication/studio.test.mjs publication/publication.test.mjs
```

로컬 확인 주소는 `http://127.0.0.1:8794/site-lab-artifacts/`입니다. 미리보기 서버는 배포할 `docs-site/` 파일만 제공합니다.

목록: `build-catalog.mjs`. 화면·색상·메모: `publication/`. 기능 체험판 소스: `candidates/`. 스케치: `agent-board/artifacts/`. 보고서: `docs/`. GitHub Pages는 `docs-site/`의 생성물을 `artifact-pages` 브랜치 루트로 배포합니다. 공개 원본은 `main`에 있습니다.

## 공개 범위와 저장

허용 목록에 지정된 디자인 파일·합성 스케치·작성 보고서만 추출했습니다. 기존 비공개 저장소의 이력, 에이전트 대화 원문, 개인정보, 세션 참조, 로컬 경로, 인증 정보, 회원 데이터는 이 모음의 대상이 아닙니다. 기존 저장소의 공개 설정은 바꾸지 않습니다.

정적 편집기의 색상·메모·저장한 시안은 브라우저 localStorage에 보관됩니다. HTML/JSON/Markdown 다운로드와 JSON 불러오기는 사용자 기기에서 처리합니다. Claude 기능판의 디자인 조합·작업 중 메모·이름 저장본도 브라우저 localStorage에 보관합니다. 작업 중 임시본과 명시 저장본을 구분하며 기존 정적 편집기와 저장 키·형식이 별도입니다. JSON/Markdown/시각 참고 HTML 다운로드와 JSON 가져오기는 기기 안에서 처리합니다. React 후보의 글·댓글·내 활동은 합성 예시와 체험 동작으로, 메모리에 머물며 새로고침하면 사라질 수 있습니다. 실제 인증·DB·서버 권한은 제공하지 않습니다. 공유할 메모에는 개인 정보를 넣지 마세요. GitHub Pages의 일반 요청 처리는 GitHub가 담당합니다. 정적 배포는 서버별 보안 헤더 적용이나 개인정보 보호법 준수를 보증하지 않습니다.

## 라이선스

새 목록·기존 자체 제작 디자인 코드는 MIT로 제공합니다. Flarum에서 조정한 스타일은 원 MIT 고지를 유지하며, 두 사진은 CC0입니다. 제3자 고지와 출처는 `docs-site/preview/THIRD_PARTY_NOTICES.txt` 및 `publication/media-manifest.json`에 있습니다. 타 사이트 화면·코드·로고·회원 게시물은 이 저장소에 복제하지 않았습니다.

상용 서비스의 관찰 보고서는 해당 서비스의 구현 전체를 확인한 것이 아닙니다. 일반 검색엔진 등록이나 에이전트의 자동 검색 노출은 보장하지 않습니다. 공개 목록과 원본 파일을 직접 읽을 수 있게 제공한 단계입니다.
