// preview_api.js

export async function fetchCategories() {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("카테고리 로드 실패");
    return await res.json();
}

export async function fetchSubcategories(categoryId) {
    const res = await fetch(`/api/categories/${categoryId}/subcategories`);
    if (!res.ok) throw new Error("서브카테고리 로드 실패");
    return await res.json();
}

export async function fetchImages({ offset, limit, categoryId, subcategoryId }) {
    let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;

    if (subcategoryId) {
        url += `&subcategory_id=${subcategoryId}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("이미지 로드 실패");

    return await res.json(); // { total, files }
}