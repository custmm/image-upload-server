import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();
const INDICATOR_FILE = path.resolve("./indicator-status.json"); // 상태 저장 파일

// ✅ 서버 시작할 때 파일이 없으면 생성
async function ensureIndicatorFileExists() {
    try {
        await fs.access(INDICATOR_FILE);
        console.log("✅ indicator-status.json 파일 존재 확인 완료");
    } catch (error) {
        // 파일이 없으면 기본 visible:true 생성
        console.log("⚡ indicator-status.json 파일 없음. 기본 생성 중...");
        await fs.writeFile(INDICATOR_FILE, JSON.stringify({ visible: true }), "utf8");
    }
}

// 서버 초기화 시 호출
ensureIndicatorFileExists();

// ✅ 표시기 상태 가져오기
router.get("/indicator-status", async (req, res) => {
    try {
        const data = await fs.readFile(INDICATOR_FILE, "utf8");
        const status = JSON.parse(data);
        res.json(status);
    } catch (error) {
        console.error("🚨 표시기 상태 읽기 오류:", error);
        res.json({ visible: true }); // 기본값 true로 복구
    }
});

// ✅ 표시기 상태 업데이트
router.patch("/indicator-status", async (req, res) => {
    try {
        const { visible } = req.body;
        if (typeof visible !== "boolean") {
            return res.status(400).json({ error: "visible 필드는 boolean이어야 합니다." });
        }
        await fs.writeFile(INDICATOR_FILE, JSON.stringify({ visible }), "utf8");
        res.json({ success: true, visible });
    } catch (error) {
        console.error("🚨 표시기 상태 저장 오류:", error);
        res.status(500).json({ error: "서버 오류" });
    }
});

export default router;