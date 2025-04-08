import express from "express";
import { Category, Subcategory } from "../models/index.js";

const router = express.Router();

// ✅ 카테고리 영어 → 한글 변환 매핑
const categoryTranslations = {
    "puzzle": "퍼즐",
    "bizz": "보석비즈",
    "solidbodypuzzle": "입체퍼즐",
    "deforme": "디폼블럭",
    "legoCompatibleblock": "레고호환블럭"
};

// ✅ 모든 카테고리 조회 API
router.get("/", async (req, res) => {
    try {
        const categories = await Category.findAll();
        if (!categories || categories.length === 0) {
            return res.status(404).json({ error: "카테고리가 존재하지 않습니다." });
        }

        // 🔥 한글 변환하여 클라이언트로 전달
        const translatedCategories = categories.map(category => ({
            id: category.id,
            name: categoryTranslations[category.name] || category.name, // 한글로 변환 (없으면 원래 값)
            created_at: category.created_at,
            updated_at: category.updated_at,
            description: category.description
        }));

        res.json(translatedCategories);
    } catch (error) {
        console.error("❌ 카테고리를 불러오는 중 오류 발생:", error);
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

// ✅ 특정 카테고리의 서브카테고리 조회 API
router.get("/:categoryId/subcategories", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subcategories = await Subcategory.findAll({ where: { category_id: categoryId } });

        if (!subcategories.length) {
            return res.status(404).json({ error: "해당 카테고리의 서브카테고리가 없습니다." });
        }
        res.json(subcategories);
    } catch (error) {
        console.error("❌ 서브카테고리를 불러오는 중 오류 발생:", error);
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

export default router;
