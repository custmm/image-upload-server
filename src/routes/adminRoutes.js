import express from "express";
import { sequelize } from "../models/index.js";
import { QueryTypes } from "sequelize";
import * as aiService from "../services/aiService.js"; // 🔥 AI 서비스 임포트

const router = express.Router();

router.get("/check-all-duplicates", async (req, res) => {
    try {
        const allFiles = await sequelize.query(
            "SELECT id, file_path, title FROM files WHERE is_deleted = 0",
            { type: QueryTypes.SELECT }
        );

        if (!allFiles || allFiles.length === 0) {
            return res.json({ success: true, duplicateCount: 0, details: [] });
        }

        const embeddings = [];
        const BATCH_SIZE = 5; // 🔥 5개씩 끊어서 분석 (Railway/Render 메모리 방어)

        for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
            const batch = allFiles.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (file) => {
                try {
                    const vector = await aiService.analyzeImage(file.file_path);
                    embeddings.push({ id: file.id, title: file.title, vector });
                } catch (err) {
                    console.error(`❌ [${file.title}] 분석 스킵:`, err.message);
                }
            }));
            
            // 한 배치 끝나면 서버 숨통 틔워주기
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 중복 비교
        const duplicates = [];
        for (let i = 0; i < embeddings.length; i++) {
            for (let j = i + 1; j < embeddings.length; j++) {
                const sim = aiService.getSimilarity(embeddings[i].vector, embeddings[j].vector);
                if (sim > 0.96) {
                    duplicates.push({
                        pair: [embeddings[i].title, embeddings[j].title],
                        similarity: (sim * 100).toFixed(2)
                    });
                }
            }
        }

        res.json({
            success: true,
            duplicateCount: duplicates.length,
            details: duplicates
        });

    } catch (error) {
        console.error("🔥 관리자 API 오류:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get("/dashboard", async (req, res) => {
    res.json({ message: "관리자 대시보드 API" });
});

export default router;