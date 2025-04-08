import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { sequelize } from "./models/index.js"; // ✅ Sequelize 인스턴스 가져오기
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // .env 파일 로드

const app = express();
app.use(cors());
app.use(express.json()); // ✅ JSON 데이터 파싱 미들웨어
app.use(express.urlencoded({ extended: true })); // ✅ FormData 파싱 미들웨어

// ✅ 정적 파일 제공
app.use(express.static(join(__dirname, "..", "public")));
app.use("/uploads", express.static("uploads"));

// ✅ Favicon 직접 서빙 (필요 시)
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// ✅ 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);

// ✅ HTTP 요청을 HTTPS로 리디렉션 (프록시가 없는 경우)
app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

// ✅ MySQL 연결
sequelize.sync({ alter: true })
    .then(() => console.log("✅ MySQL 연결 성공 및 모델 동기화 완료!"))
    .catch((error) => console.error("❌ MySQL 연결 실패:", error));

export default app; // 🔹 Express 인스턴스 내보내기
