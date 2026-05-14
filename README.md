#Still Daily Archive: 인터랙션 기반 개인 창작물 아카이브
==
"단순한 결과물이 아닌, 구조 설계와 사용자 경험을 기록하는 실험실"

본 프로젝트는 개인 창작물을 체계적으로 관리하고, 현대적인 UI 인터랙션 및 반응형 설계를 실험하기 위해 제작된 웹 애플리케이션입니다.

#프로젝트 철학 및 목표
==
아카이브의 구조화: 방대한 콘텐츠를 카테고리 기반으로 시각화하여 정보의 위계를 설계합니다.

실험적 인터랙션: 정적인 웹을 넘어 사용자 경험(UX)을 극대화하는 동적인 UI 요소들을 구현합니다.

AI 협업 프로세스: LLM을 단순 코드 생성기가 아닌, 아키텍처 설계 및 트러블슈팅의 파트너로 활용하여 개발 프로세스를 혁신합니다.

#LLM 활용 및 트러블슈팅 (AI-Assisted Development)
==
이 프로젝트는 '문제 정의 → 구조 설계 → 디버깅 → 개선'의 전 과정에서 LLM과 협업하여 완성되었습니다.

1)프론트엔드 아키텍처 리팩토링

문제: preview.js에 과도한 로직이 집중되어 스파게티 코드화 발생.

해결: 기능 단위(Sidebar, Pagination, Indicator 등)로 모듈을 분리하여 관심사 분리(SoC) 실현.

결과: 유지보수성 향상 및 디버깅 효율성 증대.


2)계층형 사이드바 및 상태 관리

문제: 확장 가능한 메뉴 구조와 현재 상태의 시각적 피드백 필요.

해결: 토글 기반 UI와 상태 관리 로직을 설계하여 동적인 메뉴 시스템 구축.

3)인프라 및 보안 트러블슈팅

Git Flow: non-fast-forward 충돌 발생 시 rebase 흐름을 정리하여 버전 관리 역량 강화.

CSP 보안 설정: 인라인 스크립트 제거 및 Content Security Policy 오류 수정을 통한 웹 보안 강화.

#기술 스택
==
##Frontend
Core: HTML5, Vanilla JavaScript (ES6+ Modules)

Styling: CSS3 (Flexbox/Grid, Dark/Light Mode, Animation)

Library: GSAP (인터랙션 애니메이션), Mind-elixir (마인드맵 구조화)

##Backend
Runtime: Node.js (Express.js)

Database: MySQL / PostgreSQL (Sequelize ORM)

Storage: ImageKit, Multer (이미지 최적화 및 업로드 관리)

Deployment: Render (Blueprint IaC 활용)

#주요 기능
==
1. 지능형 갤러리 시스템
자동 분류: 업로드 시 카테고리/서브카테고리 기반 자동 아카이빙.

최적화된 UX: 페이지네이션, 가로 스크롤 카드 UI, 실시간 검색 기능.

2. 고도화된 UI/UX
다이나믹 테마: 다크 모드 및 반응형 레이아웃 지원.

시각적 피드백: 로딩 인디케이터, 버튼 호버 애니메이션, 문 열림 효과 등 감각적인 인터랙션.

3. 인터랙션 요소 (Easter Eggs)
체험형 콘텐츠: 숨겨진 기능 페이지, 웹 기반 미니 게임 및 RC카 제어 로직 시각화.

메모리 최적화: 웹사이트 성능 유지를 위한 메모리 정리 기능 구현.

#시스템 구조 (Architecture)
==
Client: Vanilla JS 모듈이 UI 상태와 API 요청을 관리.

Server: Express 라우터를 통해 RESTful API 제공.

Storage: 이미지 및 영상 데이터는 ImageKit을 통해 최적화되어 송출.
