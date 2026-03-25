const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.82;

export class FileTooLargeError extends Error {
  constructor() {
    super("文件大小超过 5MB 限制");
  }
}

/** 压缩图片：限制最长边 1200px，JPEG 0.82 质量。超过 5MB 原始文件抛出 FileTooLargeError。 */
export function compressImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.reject(new FileTooLargeError());
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let tw = width;
      let th = height;
      if (Math.max(width, height) > MAX_DIMENSION) {
        if (width >= height) {
          tw = MAX_DIMENSION;
          th = Math.round(height * (MAX_DIMENSION / width));
        } else {
          th = MAX_DIMENSION;
          tw = Math.round(width * (MAX_DIMENSION / height));
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, tw, th);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** 旧接口保留兼容，内部直接读取文件不压缩（仅用于裁剪预览，不写入最终数据） */
export function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
