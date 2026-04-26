if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('서비스 워커 등록 성공:', reg.scope))
                    .catch(err => console.log('서비스 워커 등록 실패:', err));
            });
        }