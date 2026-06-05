
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
 
    ├── /upload
 
    ├── /files
    
    └── /category
    
 ├── Controllers
 
 ├── Models (Sequelize)
 
    ├── File
 
    └── Category
    
 ↓
 
Database (MySQL)

 ↓
 
File Storage (/uploads)


