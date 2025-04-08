import multer from "multer";
import path from "path";
import fs from "fs";
import { Category, Subcategory } from "../models/index.js";

// ✅ 업로드 경로를 동적으로 생성하는 함수
const getUploadPath = async (categoryId, subcategoryId) => {
  const basePath = "uploads";

  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("❌ 존재하지 않는 카테고리입니다.");

  const categoryName = category.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
  let uploadPath = path.join(basePath, categoryName);

  if (subcategoryId) {
    const subcategory = await Subcategory.findByPk(subcategoryId);
    if (!subcategory) throw new Error("❌ 존재하지 않는 서브카테고리입니다.");

    const subcategoryName = subcategory.name.replace(/[^a-zA-Z0-9가-힣]/g, "_");
    uploadPath = path.join(uploadPath, subcategoryName);
  }

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
};

// ✅ Multer 설정 (메모리 저장 방식)
const storage = multer.memoryStorage(); // 파일을 임시 메모리에 저장

// ✅ Multer 미들웨어 (파일 업로드)
const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // ✅ 15MB 제한
});


export { upload, getUploadPath };
