<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Energy-Task AI

Trợ lý ảo sắp xếp công việc dựa trên Deadline, Mức độ ưu tiên (Ma trận Eisenhower) và Năng lượng cá nhân, giúp bạn làm việc “kỷ luật nhưng thấu hiểu”.

## Tính năng chính

- Brain Dump: nhập mô tả tự do, AI tự bóc tách danh sách task mới (deadline, thời lượng, Quan trọng/Gấp, việc thường nhật, link/tài nguyên đính kèm).
- Zen Mode: gợi ý 1 việc quan trọng nhất để tập trung làm ngay, dựa trên mức năng lượng hiện tại.
- Lịch tuần: xem lịch theo tuần và các task theo ngày/giờ, hỗ trợ task thường nhật hiển thị mỗi ngày.
- Trợ lý AI: chat dạng text, ghi âm để chuyển giọng nói thành văn bản, đọc phản hồi bằng giọng nói (TTS), và chế độ Live Audio để trò chuyện trực tiếp.
- Gamification & theo dõi: điểm thưởng, trạng thái hoàn thành/bỏ qua, và báo cáo tuần.
- Đồng bộ Supabase (tuỳ chọn): đăng nhập và đồng bộ dữ liệu người dùng.

## Công nghệ sử dụng

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- Google Gemini SDK (`@google/genai`)
- Supabase (`@supabase/supabase-js`) cho đăng nhập/đồng bộ (tuỳ chọn)

## Chạy local

**Yêu cầu:** Node.js (khuyến nghị Node 20+).

1. Cài dependencies:
   `npm install`
2. Cấu hình API Key Gemini (chọn 1 trong 2 cách):
   - Cách 1 (khuyến nghị): chạy app, mở **Cài đặt** và dán Gemini API Keys (mỗi key 1 dòng).
   - Cách 2: tạo file `.env.local` và đặt biến `NEXT_PUBLIC_GEMINI_API_KEY`.
3. Chạy dev:
   `npm run dev`

## Biến môi trường

- `NEXT_PUBLIC_GEMINI_API_KEY`: API key Gemini dùng làm fallback (nếu bạn không nhập key trong phần Cài đặt).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: bật đăng nhập/đồng bộ Supabase.

## Scripts

- `npm run dev`: chạy môi trường phát triển
- `npm run build`: build production
- `npm run start`: chạy production server sau khi build
- `npm run lint`: kiểm tra lint
- `npm run clean`: dọn cache build của Next.js
