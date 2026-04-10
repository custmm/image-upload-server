import path from "path";

/**
 * ImageKit 업로드 로직만 분리
 * @param {Object} imagekit - 설정된 imagekit 인스턴스
 * @param {Object} file - req.file 객체
 * @param {String} folder - 저장될 폴더 경로
 */
export const uploadImageToIK = async (imagekit, file, folder) => {
    // 1. 파일명 변환 (타임스탬프 + 원본 확장자)
    const fileName = `${Date.now()}${path.extname(file.originalname)}`;

    // 2. ImageKit 업로드 실행
    const result = await imagekit.upload({
        file: file.buffer,
        fileName: fileName,
        folder: folder,
    });

    return result; // url, fileId, name 등이 포함됨
};