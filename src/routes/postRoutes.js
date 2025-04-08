import express from "express";
import { Post } from "../models/index.js"; // ✅ 이제 Post가 정상적으로 export됨

const router = express.Router();

// ✅ 모든 게시물 조회 API
router.get("/", async (req, res) => {
    try {
        const posts = await Post.findAll();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: "게시물을 불러오는 중 오류 발생" });
    }
});

// ✅ 게시물 생성 API
router.post("/", async (req, res) => {
    try {
        const { title, content, categoryId, subcategoryId } = req.body;
        const newPost = await Post.create({ title, content, categoryId, subcategoryId });
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: "게시물 생성 중 오류 발생" });
    }
});

export default router;
