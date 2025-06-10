// src/upload/multerConfig.js (ImageKit 전용으로 정리)
import multer from "multer";
import path from "path";
import fs from "fs";
import { Category, Subcategory } from "../models/index.js";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const category_id = req.body.category_id || req.query.category_id;
      const subcategory_id = req.body.subcategory_id || req.query.subcategory_id;

      if (!category_id) return cb(new Error("카테고리 ID가 누락되었습니다."));

      const category = await Category.findByPk(category_id);
      if (!category) return cb(new Error("❌ 존재하지 않는 카테고리입니다."));

      let folder = category.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");

      if (subcategory_id) {
        const subcategory = await Subcategory.findByPk(subcategory_id);
        if (!subcategory) return cb(new Error("❌ 존재하지 않는 서브카테고리입니다."));
        folder += `/${subcategory.name.replace(/[^a-zA-Z0-9가-힣]/g, "_")}`;
      }

      const destPath = path.join("uploads", folder);
      fs.mkdirSync(destPath, { recursive: true });
      cb(null, destPath);
    } catch (err) {
      console.error("🚨 디렉토리 생성 중 오류:", err.message);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export { upload, imagekit };
