import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const router = express.Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

//  .env에서 해시가 제대로 불러와졌는지 확인
if (!ADMIN_PASSWORD_HASH) {
    console.error(" ERROR: .env 파일에서 ADMIN_PASSWORD_HASH가 설정되지 않았습니다!");
}

//  로그인 API
router.post("/login", async (req, res) => {
    // --- [추가 시작] 빛의 속도를 이용한 지연 시간 방어막 ---
    const clientTime = req.headers['x-latency-check']; 
    const serverTime = Date.now();

    // 1. 헤더가 아예 없으면 차단
    if (!clientTime) {
        console.log("🚨 보안 헤더 누락으로 차단됨");
        return res.status(403).json({ error: "비정상적인 접근입니다." });
    }

    const diff = serverTime - parseInt(clientTime);

    // 2. 지연 시간이 너무 짧거나(기계), 너무 길면(재전송 공격) 차단
    // 로그인은 민감하므로 10ms(0.01초)로 조금 더 넉넉하게 잡았습니다.
    if (diff < 10 || diff > 15000) { 
        console.log(`🚨 [공격 의심] 지연 시간: ${diff}ms - IP: ${req.ip}`);
        return res.status(403).json({ error: "물리적 보안 정책에 의해 차단되었습니다." });
    }
    // --- [추가 끝] ---
    const { password } = req.body;

    //  비밀번호 입력 여부 확인
    if (!password) {
        return res.status(400).json({ error: "비밀번호를 입력하세요." });
    }

    //  콘솔에서 입력된 값과 해시 값을 출력 (디버깅용)
    console.log("입력된 비밀번호:", password);
    console.log("저장된 해시:", ADMIN_PASSWORD_HASH);

    //  비밀번호 해시 비교 (예외 처리 추가)
    try {
        const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

        if (isMatch) {
            console.log(" 비밀번호 일치");
            const token = jwt.sign(
                { role: "admin" },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.json({
                success: true,
                token: token
            });
        } else {
            console.log(" 비밀번호 불일치");
            return res.status(401).json({ error: "비밀번호가 틀렸습니다." });
        }
    } catch (error) {
        console.error(" bcrypt 비교 중 오류 발생:", error);
        return res.status(500).json({ error: "서버 오류 발생" });
    }
});

export default router;
