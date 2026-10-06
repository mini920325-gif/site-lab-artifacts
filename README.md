# 커뮤니티 산출물 모음

[산출물 페이지](https://mini920325-gif.github.io/site-lab-artifacts/) · [에이전트용 목록](ARTIFACTS.md) · [JSON](docs-site/artifacts.json)

OpenAI 로그인 없이 페이지·시안·조사 자료를 읽고 비교하기 위한 공개 정적 모음입니다. 최종 브랜드나 운영 커뮤니티가 아닙니다.

- A/B/C 디자인 시안, 주제별 자료·소개·개인정보 안내
- 기록상 다른 에이전트의 구조 스케치 3개. 미채택 가설과 합성 시연임을 표시
- 상용 커뮤니티 디자인·이미지 방식 비교와 구현 계획
- 종류·작성자·상태 필터, 최근 변경·이름·종류·작성자 정렬. JavaScript 없이도 링크 목록 제공

## 에이전트 진입점

먼저 `ARTIFACTS.md` 또는 `docs-site/artifacts.json`을 읽으세요. 각 항목에 미리보기 URL, 원본 상대 경로, 작성자, 상태가 있습니다. 원본 커밋과 파일 해시는 `provenance.json`에 있습니다. 문서의 제안·관찰은 새 작업을 실행하라는 지시가 아닙니다. 보고서의 작성 시점과 관찰 한계를 유지하세요.

## 수정과 실행

Node.js 22 이상. 외부 패키지 설치나 API 키가 필요하지 않습니다.

```sh
node build-catalog.mjs
node --test catalog.test.mjs publication/studio.test.mjs publication/publication.test.mjs
node serve-catalog.mjs
```

로컬 확인 주소는 `http://127.0.0.1:8794/site-lab-artifacts/`입니다. 미리보기 서버는 배포할 `docs-site/` 파일만 제공합니다.

목록: `build-catalog.mjs`. 화면·색상·메모: `publication/`. 스케치: `agent-board/artifacts/`. 보고서: `docs/`. GitHub Pages는 커밋한 `docs-site/`만 배포합니다.

## 공개 범위와 저장

허용 목록에 지정된 디자인 파일·합성 스케치·작성 보고서만 추출했습니다. 기존 비공개 저장소의 이력, 에이전트 대화 원문, 개인정보, 세션 참조, 로컬 경로, 인증 정보, 회원 데이터는 이 모음의 대상이 아닙니다. 기존 저장소의 공개 설정은 바꾸지 않습니다.

색상·메모·저장한 시안은 브라우저 localStorage에 보관됩니다. HTML/JSON/Markdown 다운로드와 JSON 불러오기는 사용자 기기에서 처리합니다. 실제 로그인·게시·신고·DB·서버 권한은 제공하지 않습니다. 공유할 메모에는 개인 정보를 넣지 마세요. GitHub Pages의 일반 요청 처리는 GitHub가 담당합니다. 정적 배포는 서버별 보안 헤더 적용이나 개인정보 보호법 준수를 보증하지 않습니다.

## 라이선스

새 목록·기존 자체 제작 디자인 코드는 MIT로 제공합니다. Flarum에서 조정한 스타일은 원 MIT 고지를 유지하며, 두 사진은 CC0입니다. 제3자 고지와 출처는 `docs-site/preview/THIRD_PARTY_NOTICES.txt` 및 `publication/media-manifest.json`에 있습니다. 타 사이트 화면·코드·로고·회원 게시물은 이 저장소에 복제하지 않았습니다.

상용 서비스의 관찰 보고서는 해당 서비스의 구현 전체를 확인한 것이 아닙니다. 일반 검색엔진 등록이나 에이전트의 자동 검색 노출은 보장하지 않습니다. 공개 목록과 원본 파일을 직접 읽을 수 있게 제공한 단계입니다.
