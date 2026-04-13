import express from "express";
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas'; // 서버에서 이미지 처리를 돕는 도구

const router = express.Router();
let model = null;

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

        // ... 이후 중복 비교 로직(유사도 계산)은 동일 ...
        // (이전 답변의 duplicates 루프 코드 그대로 사용)

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 관리자 전용 API (예제)
router.get("/dashboard", async (req, res) => {
    res.json({ message: "관리자 대시보드 API" });
});

export default router;
