import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config(); // .env 파일에서 환경 변수 로드


// ✅ PlanetScale URL 기반 Sequelize 인스턴스 생성
const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      rejectUnauthorized: true // PlanetScale은 SSL 필수
    }
  },
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
    console.log("✅ PlanetScale 연결 성공!");

    await sequelize.sync({ alter: false });
    console.log("✅ 모델 동기화 완료");
  } catch (error) {
    console.error("❌ PlanetScale 연결 실패:", error);
  }
}

// ✅ DB 연결 테스트 실행
testDBConnection();

export { sequelize };
