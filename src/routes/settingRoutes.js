import express from "express";
import { Setting } from "../models/index.js"; // ✅ index.js에서 export한 Setting 모델 가져오기

const router = express.Router();

// ✅ helper: key로 값 조회
async function getValue(key, defaultValue = null) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : defaultValue;
}

// ✅ GET /api/settings/indicator-status
router.get("/indicator-status", async (req, res) => {
  try {
    const visible = (await getValue("indicator_visible", "1")) === "1";
    const modernized = (await getValue("indicator_modernized", "0")) === "1";

    res.json({ visible, modernized });
  } catch (error) {
    console.error("🚨 indicator-status 조회 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

// ✅ PATCH /api/settings/indicator-status
// body 예시: { "visible": true, "modernized": false }
router.patch("/indicator-status", async (req, res) => {
  try {
    const { visible, modernized } = req.body;

    if (typeof visible !== "undefined") {
      await Setting.upsert({
        key: "indicator_visible",
        value: visible ? "1" : "0",
      });
    }

    if (typeof modernized !== "undefined") {
      await Setting.upsert({
        key: "indicator_modernized",
        value: modernized ? "1" : "0",
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("🚨 indicator-status 업데이트 오류:", error);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;
