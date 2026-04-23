import express from "express";
import { Post, Category } from "../models/index.js"; // Category 모델 추가 호출
import { Op } from "sequelize";

const router = express.Router();

// 1. 카테고리 한글 → DB 영어 이름 매핑 (Category 테이블의 name 컬럼 기준)
const categoryToDbName = {
    "퍼즐": "puzzle",
    "보석비즈": "bizz",
    "3D퍼즐": "solidbodypuzzle",
    "디폼블럭": "deforme",
    "브릭피규어": "brickfigure"
};

// 게시물 조회 API
router.get("/", async (req, res) => {
    try {
        const { category } = req.query; // 프론트에서 보낸 '퍼즐' 등 한글 이름
        let filter = {};

        if (category) {
            // 2. 한글명을 DB용 영어명으로 변환
            const dbName = categoryToDbName[category];

            // 3. Category 테이블에서 해당 영어명을 가진 실제 ID를 찾음
            const categoryRow = await Category.findOne({ 
                where: { name: dbName || category } 
            });

            if (categoryRow) {
                // 4. 찾은 카테고리 ID를 게시글 필터 조건에 넣음
                filter.categoryId = categoryRow.id; 
            } else {
                // 해당하는 카테고리가 없으면 빈 배열 반환
                return res.json([]);
            }
        }

        // 5. 게시글 조회 (필요 시 Category 정보를 포함(include)해서 가져올 수 있음)
        const posts = await Post.findAll({
            where: filter,
            order: [['createdAt', 'DESC']] // 최신순
        });
        
        res.json(posts);
    } catch (error) {
        console.error("게시물 조회 API 에러:", error);
        res.status(500).json({ error: "게시물을 불러오는 중 오류 발생" });
    }
});

// 게시물 생성 API
router.post("/", async (req, res) => {
    try {
        const { title, content, categoryId, subcategoryId, file_path } = req.body;
        const newPost = await Post.create({ 
            title, 
            content, 
            categoryId, 
            subcategoryId,
            file_path // 이미지 경로 누락 방지
        });
        res.status(201).json(newPost);
    } catch (error) {
        console.error("게시물 생성 에러:", error);
        res.status(500).json({ error: "게시물 생성 중 오류 발생" });
    }
});

export default router;