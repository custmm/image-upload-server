import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // .env 파일에서 환경 변수 로드


// ✅ PlanetScale URL 기반 Sequelize 인스턴스 생성
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  dialect: "mysql",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  define: {
    freezeTableName: true,
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// ✅ 연결 테스트 및 모델 동기화
async function testDBConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ IONOS MySQL 연결 성공!");

    await sequelize.sync({ alter: false });
    console.log("✅ 모델 동기화 완료");
  } catch (error) {
    console.error("❌ IONOS MySQL 연결 실패:", error);
  }
}

// ✅ DB 연결 테스트 실행
testDBConnection();

export { sequelize };
