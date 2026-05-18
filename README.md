# 📁 프로젝트 구조

\`\`\`

image-upload-server/
├── public/                 # 정적 파일 (HTML, CSS)
│   ├── css/               # 스타일시트
│   ├── js/                # 프론트엔드 모듈
│   │   ├── preview.js     # 갤러리 미리보기
│   │   ├── sidebar.js     # 사이드바 관리
│   │   ├── pagination.js  # 페이지네이션
│   │   └── indicator.js   # 로딩 인디케이터
│   └── index.html         # 메인 페이지
├── server/                # 백엔드 코드
│   ├── routes/            # API 라우트
│   ├── models/            # Sequelize 모델
│   ├── config/            # DB, ImageKit 설정
│   └── app.js             # Express 앱 진입점
├── .env.example           # 환경 변수 템플릿
├── package.json
└── README.md

\`\`\`
