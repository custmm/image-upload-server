// preview_api.js

export async function fetchImages({ offset, limit, categoryId, subcategoryId }) {

    let url = `/api/files?offset=${offset}&limit=${limit}&category_id=${categoryId}`;

    if (subcategoryId) {
        url += `&subcategory_id=${subcategoryId}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("이미지 로드 실패");
    }

    return await response.json();
}