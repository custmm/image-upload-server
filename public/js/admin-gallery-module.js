let loadedImages = 0;
const batchSize = 24;

export async function fetchTextList(append = false) {
    const container = document.getElementById("textGallery");
    const url = `/api/files?offset=${loadedImages}&limit=${batchSize}`;
    
    try {
        const res = await fetch(url).then(r => r.json());
        const images = Array.isArray(res) ? res : res.files;
        
        renderTextItems(images, container);
        loadedImages += images.length;
    } catch (err) { console.error(err); }
}

function renderTextItems(images, container) {
    images.forEach(image => {
        // post-item 생성 및 수정/삭제 버튼 바인딩
        // openEditSelectPopup 호출 연결
    });
}

export async function deletePost(id) {
    // 삭제 fetch 로직
}

export async function updatePost(id, data) {
    // 수정 patch 로직
}