import express from "express";
import { Post } from "../models/index.js"; // 이제 Post가 정상적으로 export됨
import { Op } from "sequelize"; // 검색 조건(필터링)을 위해 필요

const router = express.Router();

// 게시물 조회 API (카테고리 필터링 추가)
router.get("/", async (req, res) => {
    try {
        const { category } = req.query; // 프론트에서 보낸 ?category=카테고리명 받기
        let filter = {};

        // 만약 카테고리 이름이 쿼리로 들어왔다면 검색 조건에 추가
        if (category) {
            filter.categoryId = category; // DB의 컬럼명에 맞춰 수정 (예: categoryName)
        }

        const posts = await Post.findAll({
            where: filter,
            order: [['createdAt', 'DESC']] // 최신순 정렬
        });
        
        res.json(posts);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "게시물을 불러오는 중 오류 발생" });
    }
});

// 게시물 생성 API
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
