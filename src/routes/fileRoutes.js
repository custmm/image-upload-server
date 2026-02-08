import express from "express";
import { File, Category, Subcategory, sequelize } from "../models/index.js";
import { upload, imagekit } from "../upload/multerConfig.js";  // ✅ `multerConfig.js` 가져오기
import path, { join } from "path";
import fs from "fs/promises";
import * as fsSync from "fs";  // ← 추가
import sanitizeHtml from "sanitize-html"; // 🔥 sanitize-html 라이브러리 추가
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// ✅ 특정 카테고리 & 서브카테고리의 파일 조회 API (offset, limit 지원)
router.get("/", async (req, res) => {
    try {
        // offset과 limit 파라미터 (없으면 기본값 사용)
        let {
            category_id,
            subcategory_id,
            offset = 0,
            limit = 24
        } = req.query;
        offset = parseInt(offset, 10);
        limit = parseInt(limit, 10);

        if (isNaN(offset) || offset < 0) {
            return res.status(400).json({ error: "❌ offset 값은 0 이상이어야 합니다." });
        }

        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: "❌ limit 값은 1 이상이어야 합니다." });
        }

        // category_id가 없으면 전체, 있으면 숫자로 변환하여 조건에 추가
        const whereClause = {};
        if (category_id) {
            category_id = parseInt(category_id, 10);
            if (isNaN(category_id)) {
                return res.status(400).json({ error: "❌ category_id는 숫자여야 합니다." });
            }
            whereClause.category_id = category_id;
        }
        if (subcategory_id) {
            subcategory_id = parseInt(subcategory_id, 10);
            if (!isNaN(subcategory_id)) {
                whereClause.subcategory_id = subcategory_id;
            }
        }

        console.log(`📌 서버: whereClause=${JSON.stringify(whereClause)}, offset=${offset}, limit=${limit}`);
        // 1) 전체 개수
        const total = await File.count({ where: whereClause });

        // 2) 페이징된 파일 조회
        const files = await File.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["name"]
                },
                {
                    model: Subcategory,
                    as: "subcategory",
                    attributes: ["name"]
                }
            ],
            offset,
            limit,
            order: [["created_at", "DESC"]],
        });

        // 빈 배열이더라도 total은 0이 될 테니 그대로 반환
        return res.json({ total, files });
    } catch (error) {
        console.error("🚨 파일 조회 중 오류 발생:", error);
        res.status(500).json({ error: "파일을 불러오는 중 서버 오류 발생" });
    }
});


// ✅ 특정 파일을 카테고리 + 서브카테고리 + 파일명으로 조회하는 API
router.get("/file", async (req, res) => {
    try {
        let { category, subcategory, file } = req.query;

        console.log(
            `📌 요청받은 파일: category=${category}, subcategory=${subcategory}, file=${file}`
        );


        if (!category || !file) {
            return res.status(400).json({
                error: "❌ 잘못된 요청: category와 file 값이 필요합니다."
            });
        }

        // ✅ 1. category name → id
        const categoryData = await Category.findOne({
            where: { name: category }
        });
        if (!categoryData) {
            return res.status(404).json({ error: "❌ 해당 카테고리를 찾을 수 없습니다." });
        }

        // ✅ 2. subcategory name → id (선택)
        let subcategoryData = null;
        if (subcategory && subcategory !== "general") {
            subcategoryData = await Subcategory.findOne({
                where: {
                    name: subcategory,
                    category_id: categoryData.id
                }
            });

            if (!subcategoryData) {
                return res.status(404).json({
                    error: "❌ 해당 서브카테고리를 찾을 수 없습니다."
                });
            }
        }

        // ✅ 3. File 조회 (id 기준)
        const whereClause = {
            file_name: file,
            category_id: categoryData.id
        };

        if (subcategoryData?.id) {
            whereClause.subcategory_id = subcategoryData.id;
        }

        // ✅ 4. include는 그대로 사용
        const foundFile = await File.findOne({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["name"]
                },
                {
                    model: Subcategory,
                    as: "subcategory",
                    attributes: ["name"]
                }
            ]
        });

        if (!foundFile) {
            return res.status(404).json({
                error: "❌ 해당 파일을 찾을 수 없습니다."
            });
        }

        // ✅ 프론트에서 쓰기 좋게 가공
        res.json({
            ...foundFile.toJSON(),
            category_name: foundFile.category?.name || null,
            subcategory_name: foundFile.subcategory?.name || null
        });

        console.log("✅ 파일 조회 성공:", foundFile?.file_name);

    } catch (error) {
        console.error("🚨 파일 조회 중 서버 오류 발생:", error);
        res.status(500).json({
            error: "🚨 파일 조회 중 서버 오류 발생"
        });
    }
});

// 카테고리별 게시물 개수 조회 API
router.get("/category-counts", async (req, res) => {
    try {
        const categoryCounts = await File.findAll({
            attributes: [
                [sequelize.col("category.name"), "category_name"],
                [sequelize.fn("COUNT", sequelize.col("File.id")), "count"]
            ],
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: []
                }
            ],
            group: ["category.id"],
            raw: true
        });

        res.json(categoryCounts);
    } catch (error) {
        console.error("🚨 카테고리별 게시물 개수 조회 오류:", error);
        res.status(500).json({ error: "서버 오류" });
    }
});

// ✅ 특정 카테고리의 서브카테고리별 게시물 수 조회 API (NEW!)
router.get("/subcategory-counts", async (req, res) => {
    try {
        const { category_name } = req.query;

        if (!category_name) {
            return res.status(400).json({ error: "❌ category_name 파라미터가 필요합니다." });
        }

        // 1. category_name으로 category_id 찾기
        const category = await Category.findOne({
            where: { name: category_name }
        });
        if (!category) {
            return res.status(404).json({ error: "❌ 해당 카테고리를 찾을 수 없습니다." });
        }

        // 2. 해당 category_id로 서브카테고리별 게시물 수 집계
        const subcategoryCounts = await File.findAll({
            where: { category_id: category.id },
            attributes: [
                [sequelize.col("subcategory.name"), "subcategory_name"],
                [sequelize.fn("COUNT", sequelize.col("File.id")), "count"]
            ],
            include: [
                {
                    model: Subcategory,
                    as: "subcategory",
                    attributes: []
                }
            ],
            group: ["subcategory.id"], // ✅ group에 추가
            order: [[sequelize.col("subcategory.id"), "ASC"]], // ✅ 추가: subcategory_id 오름차순 정렬
            raw: true
        });

        res.json(subcategoryCounts);
    } catch (error) {
        console.error("🚨 서브카테고리 게시물 수 조회 오류:", error);
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

// ✅ 파일 업로드 API (POST /api/files/upload)
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        console.info("📌 요청 바디:", req.body);
        console.info("📌 요청 파일:", req.file);

        let {
            category_id,
            subcategory_id,
            category_name,
            subcategory_name,
            title,
            description
        } = req.body;

        if (!category_id || isNaN(category_id)) {
            return res.status(400).json({ error: "❌ 유효한 category_id가 필요합니다." });
        }
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "❌ 파일이 업로드되지 않았습니다." });
        }

        category_id = parseInt(category_id, 10);

        // ✅ DB에서 `category_id` 확인하여 정확한 카테고리명 가져오기
        const category = await Category.findByPk(category_id);
        if (!category) {
            return res.status(400).json({ error: "❌ 존재하지 않는 카테고리입니다." });
        }
        category_name = category.name.trim(); // ✅ 정확한 카테고리명 저장

        // ✅ 서브카테고리 확인 및 가져오기
        let dbSubcategoryName = "general"; // 기본값
        if (subcategory_id && !isNaN(subcategory_id)) {
            subcategory_id = parseInt(subcategory_id, 10);
            const subcategory = await Subcategory.findOne({
                where: {
                    id: subcategory_id,
                    category_id: category.id
                }
            });

            if (!subcategory) {
                return res.status(400).json({ error: "❌ 존재하지 않는 서브카테고리입니다." });
            }
            dbSubcategoryName = subcategory.name.trim(); // ✅ 정확한 서브카테고리명
        } else {
            subcategory_id = null;
        }

        const sanitizedTitle = title
            ? sanitizeHtml(title, { allowedTags: [], allowedAttributes: {} }).trim()
            : null;

        // ✅ 허용된 태그만 유지하고 저장
        const sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ["b", "strong", "i", "em", "s", "strike", "u", "br"],
            allowedAttributes: {
                "span": ["style"],
                "div": ["style"],
                "p": ["style"]
            },
            selfClosing: ["br"],
            textFilter: (text) => text.replace(/&nbsp;/g, " ")
        }).replace(/\n/g, "<br>").replace(/&amp;/g, "&");  // ✅ `<br>` 제거 X

        // 🔥 ImageKit 업로드
        const fileName = Date.now() + path.extname(req.file.originalname);
        const folder = `${category_name}/${dbSubcategoryName}`;

        const uploadResult = await imagekit.upload({
            file: req.file.buffer,
            fileName,
            folder,
        });

        // ✅ DB에 정확한 카테고리명과 서브카테고리명을 저장
        const fileData = await File.create({
            file_name: fileName,
            file_path: uploadResult.url, // ✅ ImageKit URL 저장
            title: sanitizedTitle || "제목 없음",
            imagekit_file_id: uploadResult.fileId, // ✅ 추가
            category_id: category.id,
            subcategory_id,
            category_name,
            subcategory_name: dbSubcategoryName,
            file_description: sanitizedDescription || null,
        });

        console.info("✅ 파일 업로드 성공!");
        res.json({ message: "✅ 파일 업로드 성공!", file: fileData });

    } catch (error) {
        console.error("🚨 파일 업로드 중 서버 오류 발생:", error);
        res.status(500).json({ error: "파일 업로드 중 서버 오류 발생" });
    }
});

// ✅ 특정 파일(ID) 가져오기 API
router.get("/id/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📌 요청받은 파일 ID: ${id}`); // 🔥 ID 확인용 로그

        const file = await File.findByPk(id);

        if (!file) {
            console.error(`❌ 파일을 찾을 수 없음 (ID: ${id})`);
            return res.status(404).json({ error: `❌ 파일을 찾을 수 없음 (ID: ${id})` });
        }

        console.log("✅ 파일 데이터 응답:", file);
        res.json(file);
    } catch (error) {
        console.error("🚨 파일 가져오기 오류:", error);
        res.status(500).json({ error: "🚨 서버 오류 발생" });
    }
});

// ✅ 게시물 설명 업데이트 API (POST /update-post/:id)
router.patch("/update-post/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ error: "❌ 유효한 ID가 필요합니다." });
        }

        // 🔒 sanitize-html 적용
        const sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ["b", "strong", "i", "em", "s", "strike", "u", "br"],
            allowedAttributes: {
                "span": ["style"],
                "div": ["style"],
                "p": ["style"]
            },
            selfClosing: ["br"],
            textFilter: (text) => text.replace(/&nbsp;/g, " ")
        }).replace(/\n/g, "<br>").replace(/&amp;/g, "&");

        const file = await File.findByPk(id);
        if (!file) {
            return res.status(404).json({ error: "❌ 파일을 찾을 수 없습니다." });
        }

        file.file_description = sanitizedDescription;
        await file.save();

        res.json({ success: true, message: "✅ 설명이 성공적으로 수정되었습니다." });
    } catch (error) {
        console.error("🚨 설명 업데이트 오류:", error);
        res.status(500).json({ success: false, error: "🚨 서버 오류 발생" });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const fileRecord = await File.findByPk(id);
        if (!fileRecord) {
            return res.status(404).json({ success: false, error: "파일을 찾을 수 없습니다." });
        }

        // ✅ imagekit_file_id가 있을 때만 삭제
        if (fileRecord.imagekit_file_id) {
            try {
                await imagekit.deleteFile(fileRecord.imagekit_file_id);
                console.log("✅ ImageKit 삭제:", fileRecord.imagekit_file_id);
            } catch (err) {
                console.error("❌ ImageKit 삭제 실패:", err);
            }
        } else {
            console.warn("⚠ imagekit_file_id 없음 → ImageKit 삭제 스킵");
        }

        // 4) DB 레코드 삭제
        await fileRecord.destroy();

        res.json({ success: true, message: "파일이 성공적으로 삭제되었습니다." });

    } catch (error) {
        console.error("파일 삭제 오류:", error);
        res.status(500).json({ success: false, error: "서버 오류로 삭제에 실패했습니다." });
    }
});

export default router;
