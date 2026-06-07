import express from "express";
import { Setting } from "../models/index.js"; // Sequelize Setting 모델 가져오기

const router = express.Router();

/**
 * Helper 함수: key로 설정 값 조회 (동기화 에러 방지 및 기본값 처리)
 */
async function getValue(key, defaultValue = null) {
    try {
        const row = await Setting.findOne({ where: { key } });
        return row ? row.value : defaultValue;
    } catch (error) {
        console.error(`[DB 조회 오류] key: ${key}`, error);
        return defaultValue;
    }
}

/**
 * 1. 표시기 및 현대화 상태 가져오기
 * GET /api/settings/indicator-status
 */
router.get("/indicator-status", async (req, res) => {
    try {
        // 기존 indicatorRoutes의 visible(기본값 true -> "1")과 modernized 조회 통합
        const visibleValue = await getValue("indicator_visible", "1");
        const modernizedValue = await getValue("indicator_modernized", "0");

        res.json({ 
            visible: visibleValue === "1", 
            modernized: modernizedValue === "1" 
        });
    } catch (error) {
        console.error("❌ indicator-status 조회 실패:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
});

/**
 * 2. 표시기 및 현대화 상태 업데이트
 * PATCH /api/settings/indicator-status
 */
router.patch("/indicator-status", async (req, res) => {
    try {
        const { visible, modernized } = req.body;
        const now = new Date();

        console.log("📥 상태 변경 요청 수신:", req.body);

        // visible 필드가 전달되었을 때 (boolean 형식 검사 포함)
        if (typeof visible !== "undefined") {
            if (typeof visible !== "boolean") {
                return res.status(400).json({ error: "visible 필드는 boolean 형식이어야 합니다." });
            }
            await Setting.upsert({
                key: "indicator_visible",
                value: visible ? "1" : "0",
                updated_at: now,
            });
            console.log(`✅ indicator_visible 업데이트 완료 -> ${visible}`);
        }

        // modernized 필드가 전달되었을 때
        if (typeof modernized !== "undefined") {
            if (typeof modernized !== "boolean") {
                return res.status(400).json({ error: "modernized 필드는 boolean 형식이어야 합니다." });
            }
            await Setting.upsert({
                key: "indicator_modernized",
                value: modernized ? "1" : "0",
                updated_at: now,
            });
            console.log(`✅ indicator_modernized 업데이트 완료 -> ${modernized}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("❌ indicator-status 업데이트 실패:", error);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
    }
});

export default router;