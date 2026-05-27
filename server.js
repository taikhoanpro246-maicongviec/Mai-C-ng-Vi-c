import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, 'dist', 'server.cjs');

if (!fs.existsSync(targetFile)) {
  console.error("=================================================");
  console.error("❌ LỖI KHỞI ĐỘNG: Không tìm thấy tệp 'dist/server.cjs'!");
  console.error("Lý do: Tiến trình xây dựng ('npm run build') chưa được thực thi thành công.");
  console.error("Giải pháp: Hãy đảm bảo lệnh 'npm run build' đã chạy trên Hostinger thành công.");
  console.error("=================================================");
  process.exit(1);
} else {
  console.log("🚀 Đang khởi động máy chủ quản lý nợ trực tuyến từ 'dist/server.cjs'...");
  await import('./dist/server.cjs');
}
