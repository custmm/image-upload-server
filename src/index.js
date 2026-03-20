import dotenv from "dotenv";
import express from "express"; // 추가: express 가져오기
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import app from "./app.js"; // `app.js` 불러오기

dotenv.config();

const PORT = process.env.PORT || 42057;

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .html 주소로 접근 시 → .html 없는 주소로 리디렉션
app.use((req, res, next) => {
  if (req.url.endsWith(".html")) {
    const newUrl = req.url.replace(/\.html$/, "");
    return res.redirect(301, newUrl);
  }
  next();
});

// 정적 파일 제공 (public 폴더가 src 밖에 있음)
app.use(express.static(join(__dirname, "..", "public"),{
    extensions: ['html']
})); 

// 기본 페이지 요청 시 `index.html` 제공
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "..", "public", "index.html"));
});


// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
