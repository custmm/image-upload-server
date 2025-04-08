import dotenv from "dotenv";
import express from "express"; // ✅ 추가: express 가져오기
import fs from "fs";
import https from "https";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import app from "./app.js"; // ✅ `app.js` 불러오기

dotenv.config();

const PORT = process.env.PORT || 42057;

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ 정적 파일 제공 (public 폴더가 src 밖에 있음)
app.use(express.static(join(__dirname, "..", "public"))); 

// ✅ 기본 페이지 요청 시 `index.html` 제공
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "..", "public", "index.html"));
});

// ✅ SSL 인증서 로드
const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

// ✅ 서버 실행
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`🚀 서버 실행 중: https://localhost:${PORT}`);
});
