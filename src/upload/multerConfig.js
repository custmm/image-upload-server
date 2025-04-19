// src/upload/multerConfig.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Category, Subcategory } from "../models/index.js";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CloudinaryStorage에 카테고리 기반 경로 지정
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try{
    // ✅ req.query 에서 값 읽기
    const category_id = req.query.category_id;
    const subcategory_id = req.query.subcategory_id;
    
    if (!category_id) throw new Error("카테고리 ID가 누락되었습니다.");

    const category = await Category.findByPk(category_id);
    if (!category) throw new Error("❌ 존재하지 않는 카테고리입니다.");

    const categoryName = category.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    let folder = categoryName;

    if (subcategory_id) {
      const subcategory = await Subcategory.findByPk(subcategory_id);
      if (!subcategory) throw new Error("❌ 존재하지 않는 서브카테고리입니다.");
      const subcategoryName = subcategory.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
      folder += `/${subcategoryName}`;
    }

      return {
        folder,
        use_filename: true,
        unique_filename: true,
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
      };
    } catch (err) {
      console.error("🚨 CloudinaryStorage 설정 중 오류:", err.message);
      throw err;
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export { upload };
