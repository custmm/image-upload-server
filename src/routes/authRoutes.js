import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
console.log("🔍 .env에서 불러온 ADMIN_PASSWORD_HASH:", ADMIN_PASSWORD_HASH);

//  .env에서 해시가 제대로 불러와졌는지 확인
if (!ADMIN_PASSWORD_HASH) {
    console.error(" ERROR: .env 파일에서 ADMIN_PASSWORD_HASH가 설정되지 않았습니다!");
}

//  로그인 API
router.post("/login", async (req, res) => {
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
            return res.json({ success: true });
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
