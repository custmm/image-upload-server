// src/upload/multerConfig.js (ImageKit + memoryStorage로 완전 변경)
import multer from "multer";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// 메모리 기반 multer 설정 (파일을 서버에 저장하지 않음)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 최대 15MB
});

export { upload, imagekit };
