import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sequelize } from "./models/index.js"; // ✅ Sequelize 인스턴스 가져오기
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import koreanTagRoutes from "./routes/korean-initials.js";
import settingRoutes from "./routes/settingRoutes.js";
import { QueryTypes } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // .env 파일 로드

const app = express();


app.use(cors());
app.use(express.json()); // ✅ JSON 데이터 파싱 미들웨어
app.use(express.urlencoded({ extended: true })); // ✅ FormData 파싱 미들웨어

// ✅ ① .html → 없는 버전으로 리디렉션 처리
app.use((req, res, next) => {
    if (req.url.endsWith(".html")) {
        const newUrl = req.url.replace(/\.html$/, "");
        return res.redirect(301, newUrl);
    }
    next();
});

// ✅ 정적 파일 제공
app.use(express.static(join(__dirname, "..", "public"), {
    extensions: ['html']
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// ✅ Favicon 직접 서빙 (필요 시)
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "favicon.ico"));
});

app.get("/api/health", (req, res) => {
    res.status(200).send("Server is alive");
});


// ✅ 검색 라우트: /search?tag=<검색어>
app.get("/api/search", async (req, res) => {
    const { tag, keyword } = req.query;

    try {
        let query = `
        SELECT 
            f.id,
            f.file_name,
            f.file_path,
            f.title,
            d.text
        FROM files f
        LEFT JOIN descriptions d 
        ON f.id = d.file_id
        WHERE f.is_deleted = 0
        `;


        const replacements = {};

        if (tag) {
            query += " AND text LIKE :tagSearch";
            replacements.tagSearch = `%#${tag}%`;
        }

        if (keyword) {
            query += " AND text LIKE :keywordSearch";
            replacements.keywordSearch = `%${keyword}%`;
        }

        const posts = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        res.json({ posts });

    } catch (err) {
        console.error("❌ 검색 실패:", err);
        res.status(500).json({ 
            error: "검색 오류", 
            detail: err.message 
        });
    }
});


// ✅ 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", indicatorRoutes);
app.use("/api/korean-initials", koreanTagRoutes);
app.use("/api/settings", settingRoutes);


export default app; // 🔹 Express 인스턴스 내보내기
