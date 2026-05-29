# 📁 프로젝트 구조

image-upload-server/ 

│ ├── 📁 backups/ # 데이터베이스 및 설정 백업 파일 

│ ├── 📁 config/ # 설정 파일 

│ └── ⚙️ config.json # 앱 설정 정보 

│ ├── 📁 models/ # 기존 모델 (레거시) 

│ └── 📄 index.js 

│ ├── 📁 public/ # 정적 파일 (클라이언트) 

│ ├── 📁 css/ # 스타일시트 

│ │ ├── 🎨 global.css # 전역 스타일

│ │ ├── 🎨 style.css # 메인 스타일 

│ │ ├── 🎨 component.css # 컴포넌트 스타일 

│ │ ├── 🎨 theme.css # 다크/라이트 모드 

│ │ └── 🎨 mobile.css # 반응형 모바일 스타일

│ │ │ ├── 📁 js/ # 프론트엔드 모듈 (ES6+)

│ │ ├── 📄 main.js # 메인 진입점

│ │ ├── 📄 index.js # 홈페이지 로직

│ │ ├── 📄 preview.js # 갤러리 미리보기 (핵심) 

│ │ ├── 📄 gallery-module.js # 갤러리 기능

│ │ ├── 📄 admin-dashboard.js # 관리자 대시보드

│ │ ├── 📄 admin-login.js # 관리자 로그인

│ │ ├── 📄 search_integrated.js # 통합 검색

│ │ ├── 📄 theme-module.js # 테마 관리 (다크/라이트)

│ │ ├── 📄 popup-module.js # 팝업 관리

│ │ ├── 📄 contact.js # 연락처 페이지

│ │ ├── 📄 post.js # 블로그 포스트

│ │ ├── 📄 auth-module.js # 인증 모듈

│ │ ├── 📄 chart-module.js # 통계 차트

│ │ └── 📁 jQuery/

│ │ └── 📄 script2.js # 레거시 jQuery 코드

│ │ │ ├── 📁 images/ # 정적 이미지 자산

│ │ ├── 📁 icon/ # 아이콘 (SVG, PNG)

│ │ │ ├── 🖼️ API_icon.svg

│ │ │ ├── 🖼️ JS_icon.svg

│ │ │ ├── 🖼️ HTML_icon.svg

│ │ │ ├── 🖼️ DB_icon.svg

│ │ │ ├── 🖼️ mascot_.svg # 마스코트 옷/얼굴 

│ │ │ └── 🖼️ trash_icon.svg 

│ │ │ │ │ ├── 📁 indicator/ # 로딩 인디케이터 애니메이션

│ │ │ └── 🖼️ preview-gunff_.png (8프레임) 

│ │ │ │ │ ├── 📁 toggle/ # 테마 토글 아이콘

│ │ │ ├── 🖼️ toggle_light.svg

│ │ │ ├── 🖼️ toggle_dark.svg

│ │ │ └── 🖼️ toggle_set.svg

│ │ │ │ │ ├── 📁 game/ # 게임 관련 이미지

│ │ │ ├── 🖼️ game_check.png

│ │ │ └── 🖼️ game_hint.png

│ │ │ │ │ ├── 📁 alian/ # 이스터에그 이미지

│ │ │ └── 🖼️ ester_.png (5개)

│ │ │ │ │ └── 🖼️ favicon.ico # 사이트 아이콘

│ │ │ ├── 📁 sounds/ # 음향 효과

│ │ ├── 🎵 game_start.mp3

│ │ ├── 🎵 game_finish.mp3 

│ │ ├── 🎵 ester_egg.mp3

│ │ └── 🎵 firework.mp3

│ │ │ ├── 📁 hidden_game/ # 숨겨진 미니 게임

│ │ ├── 🌐 killing_game.html # 게임 페이지

│ │ └── 📁 js/

│ │ └── 📄 killing_game.js # 게임 로직

│ │ │ ├── 🌐 index.html # 홈페이지 

│ ├── 🌐 preview.html # 갤러리 미리보기

│ ├── 🌐 upload.html # 이미지 업로드

│ ├── 🌐 search.html # 검색 페이지

│ ├── 🌐 post.html # 블로그 포스트

│ ├── 🌐 admin-dashboard.html # 관리자 대시보드

│ ├── 🌐 admin-login.html # 관리자 로그인

│ ├── 🌐 online_contact.html # 연락처 페이지

│ ├── 🌐 not_found.html # 404 페이지

│ ├── 📄 robots.txt # SEO 로봇 설정

│ ├── 📄 sitemap.xml # SEO 사이트맵

│ ├── 📄 sw.js # Service Worker (PWA) 

│ └── 📄 security.txt # 보안 정책

│ ├── 📁 src/ # 백엔드 코드 (메인)

│ ├── 📁 config/ # 서버 설정

│ │ ├── 📄 databaseConfig.js # MySQL/Railway 설정

│ │ ├── 📄 serverConfig.js # 서버 포트, 환경 설정

│ │ └── 📄 sslConfig.js # SSL/HTTPS 설정

│ │ │ ├── 📁 models/ # Sequelize 데이터 모델

│ │ ├── 📄 category.js # 카테고리 모델

│ │ ├── 📄 subcategory.js # 서브카테고리 모델

│ │ ├── 📄 file.js # 파일/이미지 모델

│ │ ├── 📄 post.js # 블로그 포스트 모델

│ │ ├── 📄 setting.js # 앱 설정 모델

│ │ ├── 📄 description.js # 설명 모델

│ │ └── 📄 index.js # 모델 초기화

│ │ │ ├── 📁 routes/ # API 라우트 

│ │ ├── 📄 fileRoutes.js # 이미지 업로드/조회

│ │ ├── 📄 categoryRoutes.js # 카테고리 관리

│ │ ├── 📄 postRoutes.js # 블로그 포스트 API

│ │ ├── 📄 adminRoutes.js # 관리자 API

│ │ ├── 📄 authRoutes.js # 인증 API 

│ │ ├── 📄 settingRoutes.js # 설정 API 

│ │ ├── 📄 indicatorRoutes.js # 로딩 상태 API 

│ │ └── 📄 korean-initials.js # 한글 초성 검색 유틸

│ │ │ ├── 📁 services/ # 비즈니스 로직

│ │ ├── 📄 imageService.js # 이미지 처리 (ImageKit)

│ │ └── 📄 aiService.js # AI 기능 (분류 등)

│ │ │ ├── 📁 upload/ # 파일 업로드 설정 

│ │ └── 📄 multerConfig.js # Multer 설정 

│ │ │ ├── 📁 migrations/ # 데이터베이스 마이그레이션

│ │ ├── 📄 *-create-categories-table.cjs 

│ │ ├── 📄 *-create-files-table.cjs

│ │ ├── 📄 *-create-posts-table.cjs

│ │ └── ... (기타 스키마 변경)

│ │ │ ├── 📁 seeders/ # 초기 데이터 (선택)

│ │ │ ├── 📄 app.js # Express 애플리케이션 설정 

│ ├── 📄 index.js # 서버 진입점 (시작)

│ └── 📄 ImagePage.js # 이미지 페이지 유틸

│ ├── 📁 seeders/ # 데이터베이스 시드 데이터 (선택)

│ ├── ⚙️ package.json # 프로젝트 의존성 및 스크립트

├── ⚙️ package-lock.json # 의존성 락파일

├── ⚙️ ecosystem.config.cjs # PM2 배포 설정

├── ⚙️ render.yaml # Render 배포 설정

├── ⚙️ .gitignore # Git 제외 파일

├── ⚙️ indicator-status.json # 로딩 인디케이터 상태 

└── 📄 README.md # 프로젝트 문서

## 📂 폴더별 역할

### **public/** - 클라이언트 정적 자산
- **css/**: 스타일 (전역, 컴포넌트, 반응형, 테마)
- **js/**: 프론트엔드 모듈 (갤러리, 검색, 관리자, 테마)
- **images/**: 아이콘, 로딩 애니메이션, 게임 이미지
- **sounds/**: 게임 음향 효과
- **hidden_game/**: 숨겨진 미니 게임 (이스터에그)
- **.html**: 각 페이지 (홈, 갤러리, 업로드, 검색, 관리자)
- **sw.js**: Service Worker (PWA 오프라인 지원)

### **src/** - 백엔드 코어
- **config/**: 데이터베이스, 서버, SSL 설정
- **models/**: 데이터 스키마 (카테고리, 파일, 포스트)
- **routes/**: RESTful API 엔드포인트
- **services/**: ImageKit 이미지 처리, AI 분류 로직
- **upload/**: Multer 파일 업로드 처리
- **migrations/**: 데이터베이스 스키마 버전 관리

### **backups/** - 백업 파일
- 데이터베이스 백업, 설정 백업

### **seeders/** - 초기 데이터
- 카테고리, 포스트 등 샘플 데이터

## 🏗️ 아키텍처 요약

**프론트엔드** (`public/`)
- 모듈화된 JavaScript (ES6+ Modules)
- 다크/라이트 모드, 반응형 레이아웃
- GSAP 기반 인터랙션 애니메이션

**백엔드** (`src/`)
- Express.js RESTful API
- Sequelize ORM으로 MySQL 관리
- ImageKit으로 이미지 최적화

**저장소**
- 파일 업로드: Multer 처리
- 이미지 저장: ImageKit CDN
- 데이터베이스: Railway MySQL

**주요 기능**
[Client]
 ↓
Frontend (HTML/CSS/JS)
 ↓ API 요청
Backend (Node.js / Express)
 ├── Routes
 │ ├── /upload
    ├── /files
    └── /category
 ├── Controllers
 ├── Models (Sequelize)
 │ ├── File
    └── Category
 ↓
Database (MySQL)
 ↓
File Storage (/uploads)

