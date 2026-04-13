import express from "express";
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas'; // 서버에서 이미지 처리를 돕는 도구
import { sequelize } from "../models/index.js"; // 🔥 반드시 본인의 경로에 맞게 임포트
import { QueryTypes } from "sequelize"; // 🔥 추가

const router = express.Router();
let model = null;

// 유사도 계산 함수 (코사인 유사도)
function calculateSimilarity(v1, v2) {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
        nA += v1[i] * v1[i];
        nB += v2[i] * v2[i];
    }
    return dot / (Math.sqrt(nA) * Math.sqrt(nB));
}

const loadModel = async () => {
    if (!model) {
        model = await mobilenet.load();
        console.log("✅ 서버 AI 모델 로드 완료 (JS 버전)");
    }
};
loadModel();


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

        for (const file of allFiles) {
            try {
                // 1. ImageKit URL에서 이미지 가져오기
                const img = await loadImage(file.file_path);

                // 2. 서버용 캔버스에 그리기
                const canvas = createCanvas(224, 224);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 224, 224);

                // 3. 텐서로 변환하여 분석
                const input = tf.browser.fromPixels(canvas);
                const activation = model.infer(input, true);

                embeddings.push({
                    id: file.id,
                    title: file.title,
                    vector: activation.dataSync()
                });

                input.dispose(); // 메모리 정리
            } catch (err) {
                console.error(`❌ [${file.title}] 분석 실패:`, err.message);
            }
        }
        // 🔥 [추가] 중복 비교 로직
        const duplicates = [];
        for (let i = 0; i < embeddings.length; i++) {
            for (let j = i + 1; j < embeddings.length; j++) {
                const sim = calculateSimilarity(embeddings[i].vector, embeddings[j].vector);
                if (sim > 0.96) { // 96% 이상 유사 시 중복 의심
                    duplicates.push({
                        pair: [embeddings[i].title, embeddings[j].title],
                        similarity: (sim * 100).toFixed(2)
                    });
                }
            }
        }

        // 🔥 [추가] 결과 응답 (이게 없어서 500이나 무한 로딩이 걸렸을 것임)
        res.json({
            success: true,
            duplicateCount: duplicates.length,
            details: duplicates
        });

    } catch (error) {
        console.error("🔥 전체 분석 중 치명적 오류:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 관리자 전용 API (예제)
router.get("/dashboard", async (req, res) => {
    res.json({ message: "관리자 대시보드 API" });
});

export default router;
