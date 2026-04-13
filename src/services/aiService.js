import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { createCanvas, loadImage } from 'canvas';

let model = null;

// 모델 로드 (싱글톤 패턴: 한 번만 로드)
export const getModel = async () => {
    if (!model) {
        model = await mobilenet.load();
        console.log("✅ AI 서비스: 모델 로드 완료");
    }
    return model;
};

// 이미지 한 장을 벡터로 변환하는 함수
export const analyzeImage = async (url) => {
    try {
        // ImageKit 썸네일 최적화 주소 사용 (속도 향상 핵심!)
        const thumbUrl = url + "?tr=w-224,h-224,cm-pad_resize";
        const img = await loadImage(thumbUrl);
        const canvas = createCanvas(224, 224);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 224, 224);

        const aiModel = await getModel();
        const input = tf.browser.fromPixels(canvas);
        const activation = aiModel.infer(input, true);
        const vector = activation.dataSync();

        input.dispose(); // 메모리 해제
        return vector;
    } catch (err) {
        throw new Error(`이미지 분석 실패: ${err.message}`);
    }
};

// 코사인 유사도 계산
export const compareVectors = (v1, v2) => {
    let dot = 0, nA = 0, nB = 0;
    for (let i = 0; i < v1.length; i++) {
        dot += v1[i] * v2[i];
        nA += v1[i] * v1[i];
        nB += v2[i] * v2[i];
    }
    return dot / (Math.sqrt(nA) * Math.sqrt(nB));
};