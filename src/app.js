// 1. 환경 설정 및 핵심 라이브러리 (가장 먼저!)
import dotenv from "dotenv";
dotenv.config(); // 다른 모듈들이 process.env를 쓰기 전에 실행되어야 함

// 2. 외부 패키지 (가장 대중적인 것부터)
import express from "express";
import cors from "cors";
import helmet from "helmet"; // 보안
import compression from "compression"; // 압축
import jwt from "jsonwebtoken";
import ImageKit from "imagekit";
import chalk from "chalk"; // <--- [추가] 로그를 꾸미기 위한 chalk 임포트

// 3. Node.js 내장 모듈
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";

// 4. 내 프로젝트 내부 설정/모델 (Sequelize 등)
import { sequelize } from "./models/index.js";
import { QueryTypes } from "sequelize";

// 5. 라우트 파일들 (가장 아래)
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import indicatorRoutes from "./routes/indicatorRoutes.js";
import koreanTagRoutes from "./routes/korean-initials.js";
import settingRoutes from "./routes/settingRoutes.js";

const app = express();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. 보안 관련 설정 수정
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // 1. 외부 서버와 통신 허용 (TensorFlow 모델 다운로드 주소 추가)
            connectSrc: [
                "'self'", 
                "https://unpkg.com", 
                "https://cdn.jsdelivr.net", 
                "https://ik.imagekit.io",
                "https://storage.googleapis.com", // AI 모델 파일을 받아오기 위해 필수!
                "https://tfhub.dev",
                "https://www.kaggle.com" // AI 모델 설정 파일을 읽어오기 위해 필수!
            ],
            // 2. 자바스크립트 허용 ('unsafe-eval' 추가!)
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'", // TensorFlow.js의 동적 코드 실행을 위해 필수!
                "https://unpkg.com", 
                "https://cdn.jsdelivr.net", 
                "https://code.jquery.com"
            ],
            // 3. 스타일시트 허용
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            // 4. 이미지 허용 (데이터 URL 및 외부 이미지 서버)
            imgSrc: ["'self'", "data:", "https://ik.imagekit.io", "https://cdn.jsdelivr.net"],
            // 5. 폰트 허용
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        },
    },
}));

// [추가] 커스텀 로깅 미들웨어 (기존 코드)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? chalk.red : chalk.green;
        console.log(`${chalk.bgBlue(' INFO ')} ${chalk.bold.cyan(req.method)} ${chalk.gray(req.url)} - ${statusColor(res.statusCode)} ${chalk.yellow(`(${duration}ms)`)}`);
    });
    next();
});

// --- [여기에 방어막 추가] 빛의 속도 지연 시간 필터링 ---
app.use((req, res, next) => {
    // 1. 제외할 경로 설정 (정적 파일이나 특정 API는 제외하고 싶을 때)
    if (req.url.startsWith('/favicon.ico') || req.url.startsWith('/uploads')) {
        return next();
    }

    // 2. 클라이언트가 보낸 발신 시간 확인
    const clientTime = req.headers['x-latency-check']; 
    const serverTime = Date.now();

    if (!clientTime) {
        // 보안을 강화하려면 여기서 차단(403)하고, 테스트 중이라면 그냥 통과(next) 시키세요.
        return next(); 
    }

    const diff = serverTime - parseInt(clientTime);

    // 3. 지연 시간 검증 (5ms 미만은 물리적으로 불가능한 속도로 간주)
    // 네트워크 상황에 따라 5~15ms 사이로 조정해 보세요.
    if (diff < 5) {
        console.log(chalk.bgRed.white(' [SECURITY ALERT] ') + chalk.red(` 비정상적 지연 시간 감지: ${diff}ms - IP: ${req.ip}`));
        return res.status(403).json({
            error: "Security Check Failed",
            message: "Access speed is abnormally fast (Physical limit exceeded)."
        });
    }

    // 너무 오래된 요청 (예: 10초 이상)도 차단하여 재전송 공격 방지
    if (diff > 10000) {
        return res.status(403).json({ error: "Request Timeout", message: "The request is too old." });
    }

    next();
});

// 2. 응답 압축 (CORS 전에 적용하여 데이터 전송 효율 극대화)
app.use(compression()); // 모든 응답 데이터를 압축해서 전송

// 3. CORS 설정 (브라우저의 사전 요청을 처리해야 함)
app.use(cors({
    origin: [
        'https://www.karisdify.site',    // 내 실제 사이트 도메인
        'https://karisdify.site',        // www가 없는 버전도 추가
        'http://localhost:42057',         // 로컬 개발 환경 (Vite/CRA 등)
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // 허용할 HTTP 메서드
    credentials: true // 쿠키나 인증 헤더를 허용하려면 true
}));

// 4. 데이터 파싱 (라우트에 도달하기 전 데이터를 읽을 수 있게 함)
app.use(express.json()); //  JSON 데이터 파싱 미들웨어
app.use(express.urlencoded({ extended: true })); //  FormData 파싱 미들웨어

// 5. URL 리디렉션 처리 (.html 제거 등)
app.use((req, res, next) => {
    if (req.url.endsWith(".html")) {
        const newUrl = req.url.replace(/\.html$/, "");
        return res.redirect(301, newUrl);
    }
    next();
});

// 6. 정적 파일 서빙 (public 폴더 및 업로드 폴더)
app.use(express.static(join(__dirname, "..", "public"), {
    extensions: ['html']
}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- 개별 라우트 (API 엔드포인트) ---
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public","images", "favicon.ico"));
});
app.get("/api/health", (req, res) => {
    res.status(200).send("Server is alive");
});

// 검색 및 태그 통합 API
app.get("/api/search", async (req, res) => {
    const { tag, keyword } = req.query;

    try {
        // 1. 기본 쿼리 작성 (프론트엔드 UI에 필요한 필드들을 모두 SELECT)
        let query = `
            SELECT 
                f.id,
                f.file_name,
                f.file_path,
                f.title,
                d.text,
                c.name AS category_name,
                sc.name AS subcategory_name
            FROM files f
            LEFT JOIN descriptions d ON f.id = d.file_id
            LEFT JOIN categories c ON f.category_id = c.id
            LEFT JOIN subcategories sc ON f.subcategory_id = sc.id
            WHERE f.is_deleted = 0
        `;

        const replacements = {};

        // 2. 조건별 필터링
        if (tag) {
            // 태그 검색: # 기호가 포함된 태그를 검색
            query += " AND d.text LIKE :tagSearch";
            replacements.tagSearch = `%#${tag}%`;
        } else if (keyword) {
            // 일반 키워드 검색: 제목 또는 본문에서 검색
            query += " AND (f.title LIKE :keywordSearch OR d.text LIKE :keywordSearch)";
            replacements.keywordSearch = `%${keyword}%`;
        }

        // 최신순 정렬 추가 (선택 사항)
        query += " ORDER BY f.created_at DESC";

        const posts = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT
        });

        // 3. 결과 반환
        res.json({ posts });

    } catch (err) {
        console.error(chalk.red(" [API ERROR] 검색 실패:"), err);
        res.status(500).json({
            error: "검색 중 서버 오류가 발생했습니다.",
            detail: err.message
        });
    }
});

app.get("/api/imagekit-auth", (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
});

app.post("/api/admin-token", (req, res) => {
    const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    return res.json({
        success: true,
        token: token
    });
});

// --- [STEP 4] 외부 라우터 등록 ---
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", indicatorRoutes);
app.use("/api/korean-initials", koreanTagRoutes);
app.use("/api/settings", settingRoutes);


export default app; // Express 인스턴스 내보내기
