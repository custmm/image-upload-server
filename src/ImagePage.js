import React, { useEffect, useState } from 'react';
import { ImageKitProvider, IKImage } from '@imagekit/react';

// 1. ImageKit 설정값 (환경변수나 별도 config 파일로 관리하는 것이 좋습니다)
const urlEndpoint = 'https://ik.imagekit.io/3ipkgkjsh'; 
const publicKey = 'your_public_key_here'; // ImageKit 대시보드에서 확인

export default function ImagePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. 백엔드(Node.js) API에서 이미지 데이터 불러오기
  useEffect(() => {
    fetch('https://www.karisdify.site/api/search') // 실제 API 주소에 맞게 수정
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts);
        setLoading(false);
      })
      .catch((err) => console.error("데이터 로딩 실패:", err));
  }, []);

  if (loading) return <p>이미지를 불러오는 중...</p>;

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint} publicKey={publicKey}>
      <div style={galleryStyle}>
        {posts.map((post) => (
          <div key={post.id} style={cardStyle}>
            {/* 3. ImageKit 전용 이미지 컴포넌트 사용 */}
            <IKImage
              path={post.file_path} // DB의 f.file_path (예: /image.jpg)
              transformation={[{
                width: "400",   // 갤러리 목록용 크기 조절
                height: "300",
                quality: "80"   // 압축률 설정
              }]}
              loading="lazy"    // 브라우저 레이지 로딩 활성화
              lqip={{ active: true }} // 저화질 미리보기(부드러운 로딩)
              alt={post.title}
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
            <h4>{post.title}</h4>
            <p>{post.text?.substring(0, 30)}...</p>
          </div>
        ))}
      </div>
    </ImageKitProvider>
  );
}

// 간단한 그리드 레이아웃 스타일
const galleryStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '20px',
  padding: '20px'
};

const cardStyle = {
  border: '1px solid #ddd',
  padding: '10px',
  borderRadius: '10px',
  textAlign: 'center'
};