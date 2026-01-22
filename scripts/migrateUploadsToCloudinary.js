// scripts/migrateUploadsToCloudinary.js
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const baseDir = path.join("uploads");

// 하위 디렉토리 포함 모든 파일 수집
const walkDir = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
};

// Cloudinary 업로드
const uploadToCloudinary = async (filePath) => {
  const relativePath = path.relative(baseDir, filePath);
  const folder = path.dirname(relativePath).replace(/\\/g, "/"); // 윈도우 호환

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      use_filename: true,
      unique_filename: false,
    });
    console.log(`✅ [${folder}] ${path.basename(filePath)} → ${result.secure_url}`);
} catch (error) {
    console.error(`❌ Failed: ${filePath}`);
    console.error("Error detail:", error); // 🔥 전체 에러 출력 추가
  }
};

const migrate = async () => {
  if (!fs.existsSync(baseDir)) {
    console.log("❌ 'uploads' 폴더가 없습니다. 마이그레이션을 건너뜁니다.");
    return;
  }

  const files = walkDir(baseDir);
  console.log(`🔍 총 ${files.length}개의 파일을 Cloudinary로 이전합니다...\n`);
  for (const file of files) {
    await uploadToCloudinary(file);
  }

  console.log("🎉 마이그레이션 완료!");
};

migrate();
