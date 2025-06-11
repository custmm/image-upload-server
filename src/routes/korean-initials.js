import express from "express";
import { File } from "../models/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const files = await File.findAll({ attributes: ["file_description"], raw: true });

    const tagSet = new Set();

    files.forEach(file => {
      const tags = file.file_description?.match(/#([가-힣a-zA-Z0-9_]+)/g);
      if (tags) {
        tags.forEach(tag => tagSet.add(tag.replace("#", "")));
      }
    });

    const sortedTags = [...tagSet].sort((a, b) => a.localeCompare(b, "ko"));
    res.json({ tags: sortedTags });
  } catch (error) {
    console.error("🚨 태그 추출 실패:", error);
    res.status(500).json({ error: "서버 오류로 태그를 가져올 수 없습니다." });
  }
});

export default router;
