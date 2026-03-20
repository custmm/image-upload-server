// preview_gallery.js

import { currentView } from "./preview_state.js";

export function clearGallery(imageGallery) {
    while (imageGallery.firstChild) {
        imageGallery.removeChild(imageGallery.firstChild);
    }
}

export function renderImages(imageGallery, images, isExplanMode) {

    images.forEach(image => {

        if (currentView === "image") {

            const container = document.createElement("div");
            container.classList.add("image-container");

            const img = document.createElement("img");
            img.src = image.file_path;

            img.onclick = () => {
                if (isExplanMode) return;
                window.location.href = `post?id=${image.id}`;
            };

            container.appendChild(img);
            imageGallery.appendChild(container);

        } else {

            const row = document.createElement("div");
            row.classList.add("text-row");

            const title = document.createElement("div");
            title.classList.add("text-preview");
            title.textContent = image.title || "제목 없음";

            row.appendChild(title);

            row.onclick = () => {
                if (isExplanMode) return;
                window.location.href = `post?id=${image.id}`;
            };

            container.appendChild(row);
        }
    });
}