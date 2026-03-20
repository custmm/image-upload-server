// preview_state.js

export let page = 0;
export let limit = 20;

export let selectedCategory = null;
export let selectedSubcategory = null;

export let currentView = "image";
export let noMoreImages = false;

// setter 함수 (중요)
export function setPage(value) {
    page = value;
}

export function setCategory(catId) {
    selectedCategory = catId;
}

export function setSubcategory(subId) {
    selectedSubcategory = subId;
}

export function setView(view) {
    currentView = view;
}

export function setNoMoreImages(value) {
    noMoreImages = value;
}