const CACHE_NAME = 'karisdify-cache-v1';
// 오프라인일 때 보여줄 파일 목록
const ASSETS_TO_CACHE = [
    '/not_found.html',
    '/css/style.css', // 404 페이지에 필요한 CSS도 같이 저장해야 디자인이 안 깨져요!
    '/images/favicon.ico'
];

// 1. 서비스 워커 설치 시 파일을 캐시에 저장
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('오프라인 페이지 캐싱 완료');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. 네트워크 요청을 가로채서 처리
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // 인터넷 연결이 실패(오프라인)하면 캐시된 not_found.html을 반환
            return caches.match('/not_found.html');
        })
    );
});