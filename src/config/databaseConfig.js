import { Sequelize } from "sequelize";
import dotenv from "dotenv";


dotenv.config(); // .env 파일에서 환경 변수 로드

// ✅ Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  process.env.DB_NAME || "image_upload", // 데이터베이스 이름
  process.env.DB_USER || "root",         // 사용자명
  process.env.DB_PASSWORD ? process.env.DB_PASSWORD.replace(/^"(.*)"$/, "$1") : "", // 비밀번호 처리
  {
    host: process.env.DB_HOST || "127.0.0.1",  // 호스트 주소
    dialect: "mysql",           // MySQL 사용
    logging: process.env.DB_LOGGING === "true" ? console.log : false, // SQL 쿼리 로그 활성화 여부
    define: {
      freezeTableName: true,     // 테이블 이름을 모델명 그대로 사용
      underscored: true,         // snake_case 사용 (created_at 등)
    },
    pool: {
      max: 10,  // 최대 연결 수
      min: 0,   // 최소 연결 수
      acquire: 30000, // 연결을 시도하는 최대 시간 (ms)
      idle: 10000,    // 유휴 상태에서 연결을 유지하는 시간 (ms)
    },
  }
);

// ✅ 데이터베이스 연결 테스트
async function testDBConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL 연결 성공!");
    
    // ✅ 테이블 자동 동기화
    await sequelize.sync({ alter: false });
    console.log("✅ 모든 모델이 데이터베이스와 동기화되었습니다.");
  } catch (error) {
    console.error("❌ MySQL 연결 실패:", error);
  }
}

// ✅ DB 연결 테스트 실행
testDBConnection();

export { sequelize };
