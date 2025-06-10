// src/upload/multerConfig.js
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

// CloudinaryStorage에 카테고리 기반 경로 지정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // ✅ req.query 에서 값 읽기
    const category_id = req.query.category_id;
    const subcategory_id = req.query.subcategory_id;
    
    if (!category_id) throw new Error("카테고리 ID가 누락되었습니다.");

    const category = await Category.findByPk(category_id);
    if (!category) throw new Error("❌ 존재하지 않는 카테고리입니다.");

    let folder = category.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");


    if (subcategory_id) {
      const subcategory = await Subcategory.findByPk(subcategory_id);
      if (!subcategory) return cb(new Error("❌ 존재하지 않는 서브카테고리입니다."));
      folder += `/${subcategory.name.replace(/[^a-zA-Z0-9가-힣]/g, "_")}`;
    }

    const destPath = path.join("uploads", folder);
    fs.mkdirSync(destPath, { recursive: true });
    cb(null, destPath);
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
