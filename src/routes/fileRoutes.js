import express from "express";
import { File, Category, Subcategory, sequelize } from "../models/index.js";
import { upload } from "../upload/multerConfig.js";  // ✅ `multerConfig.js` 가져오기
import path, {join} from "path";
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
        let { category_id, subcategory_id, offset = 0, limit = 24 } = req.query;
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
                { model: Category, as:"category", attributes: ["name"] },
                { model: Subcategory, as:"subcategory", attributes: ["name"] }
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


// ✅ 파일 업로드 API (POST /api/files/upload)
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        console.info("📌 요청 바디:", req.body);
        console.info("📌 요청 파일:", req.file);

        let { category_id, subcategory_id, category_name, subcategory_name, description } = req.body;

        if (!category_id || isNaN(category_id)) {
            return res.status(400).json({ error: "❌ 유효한 category_id가 필요합니다." });
        }
        if (!req.file) {
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
                where: { id: subcategory_id, category_id: category.id }
            });

            if (!subcategory) {
                return res.status(400).json({ error: "❌ 존재하지 않는 서브카테고리입니다." });
            }
            dbSubcategoryName = subcategory.name.trim(); // ✅ 정확한 서브카테고리명
        } else {
            subcategory_id = null;
        }

        // ✅ 허용된 태그만 유지하고 저장
        const sanitizedDescription = sanitizeDescription(description);
        function sanitizeDescription(html) {
            return sanitizeHtml(html, {
                allowedTags: ["b", "strong", "i", "em", "s", "strike", "u", "br"],
                allowedAttributes: {
                    "span": ["style"],
                    "div": ["style"],
                    "p": ["style"]
                },
                selfClosing: ["br"],  
                textFilter: (text) => text.replace(/&nbsp;/g, " ")  
            })
            .replace(/\n/g, "<br>")  
            .replace(/&amp;/g, "&");  // ✅ `<br>` 제거 X
        }

        // ✅ DB에 정확한 카테고리명과 서브카테고리명을 저장
        const fileData = await File.create({
            file_name: req.file.filename || req.file.originalname,
            file_path: req.file.path, // ← Cloudinary의 URL
            category_id: category.id,
            subcategory_id,
            category_name, // ✅ 올바른 카테고리명 저장
            subcategory_name: dbSubcategoryName, // ✅ 올바른 서브카테고리명 저장
            file_description: sanitizedDescription || null, // ✅ 필터링된 HTML 저장
        });

        console.info("✅ 파일 업로드 성공!");
        res.json({ message: "✅ 파일 업로드 성공!", file: fileData });

    } catch (error) {
        console.error("🚨 파일 업로드 중 서버 오류 발생:", error);
        res.status(500).json({ error: "파일 업로드 중 서버 오류 발생" });
    }
});

// ✅ 특정 파일을 카테고리 + 서브카테고리 + 파일명으로 조회하는 API
router.get("/file", async (req, res) => {
    try {
        let { category, subcategory, file } = req.query;
        console.log(`📌 요청받은 파일: category=${category}, subcategory=${subcategory}, file=${file}`);

        if (!category || !file) {
            return res.status(400).json({ error: "❌ 잘못된 요청: category와 file 값이 필요합니다." });
        }

        // ✅ category_name을 DB에서 조회
        const categoryData = await Category.findOne({
            where: { name: category }
        });

        if (!categoryData) {
            console.warn(`⚠ 카테고리를 찾을 수 없습니다: ${category}`);
            return res.status(404).json({ error: "❌ 해당 카테고리를 찾을 수 없습니다." });
        }

        // ✅ 서브카테고리 찾기 (없으면 null)
        let subcategoryData = null;
        if (subcategory && subcategory !== "general") {
            subcategoryData = await Subcategory.findOne({
                where: { name: subcategory, category_id: categoryData.id }
            });

            if (!subcategoryData) {
                console.warn(`⚠ 서브카테고리를 찾을 수 없습니다: ${subcategory}`);
                return res.status(404).json({ error: "❌ 해당 서브카테고리를 찾을 수 없습니다." });
            }
        }

        // ✅ 파일 찾기
        const whereClause = {
            file_name: file,
            category_id: categoryData.id
        };
        if (subcategoryData) whereClause.subcategory_id = subcategoryData.id;

        const foundFile = await File.findOne({
            where: whereClause,
            include: [
                { model: Category, as: "category", attributes: ["name"] },
                { model: Subcategory, as: "subcategory", attributes: ["name"] }
            ]
        });

        if (!foundFile) {
            console.error("❌ 해당 파일을 찾을 수 없습니다.");
            return res.status(404).json({ error: "❌ 해당 파일을 찾을 수 없습니다." });
        }

        res.json(foundFile);
        console.log("✅ 파일 조회 성공:", foundFile);

    } catch (error) {
        console.error("🚨 파일 조회 중 서버 오류 발생:", error);
        res.status(500).json({ error: "🚨 파일 조회 중 서버 오류 발생" });
    }
});

// 카테고리별 게시물 개수 조회 API
router.get("/category-counts", async (req, res) => {
    try {
        const categoryCounts = await File.findAll({
            attributes: [
                "category_name", 
                [sequelize.fn("COUNT", sequelize.col("category_name")), "count"]
            ],
            group: ["category_name"],
            raw: true
        });

        res.json(categoryCounts);
    } catch (error) {
        console.error("🚨 카테고리별 게시물 개수 조회 오류:", error);
        res.status(500).json({ error: "서버 오류" });
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
    
  
        // 2) 실제 파일 경로에서 파일명만 분리
        const relativePath = fileRecord.file_path.replace(/^\/+/, ""); 
        const absolutePath = join(__dirname, "..", "..", relativePath);

        console.log("삭제 시도 파일 경로:", absolutePath);
  
        // ▶ 파일이 실제로 존재하면 삭제, 아니면 무시
        if (fsSync.existsSync(absolutePath)) {
            try{
                await fs.unlink(absolutePath);
                console.log("파일 삭제 성공:", absolutePath);
            } catch (err) {
                console.warn("파일 삭제 중 오류:", err);
              }
        } else {
            console.warn("삭제 대상 파일이 없습니다:", absolutePath);
        }
  
  
        // 4) DB 레코드 삭제
        await fileRecord.destroy();
    
        // 5) 성공 응답
        res.json({ success: true, message: "파일이 성공적으로 삭제되었습니다." });
        } catch (error) {
        console.error("파일 삭제 오류:", error);
        res.status(500).json({ success: false, error: "서버 오류로 삭제에 실패했습니다." });
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
        const category = await Category.findOne({ where: { name: category_name } });
        if (!category) {
            return res.status(404).json({ error: "❌ 해당 카테고리를 찾을 수 없습니다." });
        }

        // 2. 해당 category_id로 서브카테고리별 게시물 수 집계
        const subcategoryCounts = await File.findAll({
            where: { category_id: category.id },
            attributes: [
                "subcategory_name",
                "subcategory_id",
                [sequelize.fn("COUNT", sequelize.col("subcategory_name")), "count"]
            ],
            group: ["subcategory_name", "subcategory_id"], // ✅ group에 추가
            order: [["subcategory_id", "ASC"]], // ✅ 추가: subcategory_id 오름차순 정렬
            raw: true
        });

        res.json(subcategoryCounts);
    } catch (error) {
        console.error("🚨 서브카테고리 게시물 수 조회 오류:", error);
        res.status(500).json({ error: "서버 오류 발생" });
    }
});

export default router;
