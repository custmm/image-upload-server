import express from "express";

const router = express.Router();

// ✅ 관리자 전용 API (예제)
router.get("/dashboard", async (req, res) => {
    res.json({ message: "관리자 대시보드 API" });
});

export default router;
