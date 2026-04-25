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
        const { category } = req.query;
        let filter = {};

        if (category) {
            const dbName = categoryToDbName[category];
            console.log(`[조회 시도] 프론트 입력: ${category} -> 변환된 이름: ${dbName}`);

            // 1. Category 테이블에서 실제 데이터가 있는지 확인
            const categoryRow = await Category.findOne({
                where: { name: dbName || category }
            });

            if (categoryRow) {
                // DB 컬럼명이 category_id라면 filter 객체에 categoryId(모델명)를 넣어줍니다.
                filter.categoryId = categoryRow.id;
            } else {
                console.log("해당 이름의 카테고리를 찾지 못함:", category);
                return res.json([]);
            }
        }

        // 3. 게시글 조회
        const posts = await Post.findAll({
            where: filter,
            order: [['createdAt', 'DESC']]
        });

        console.log(`[최종 결과] 찾은 게시물 개수: ${posts.length}개`);
        res.json(posts);
    } catch (error) {
        console.error("게시물 조회 API 에러:", error);
        res.status(500).json({ error: error.message });
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