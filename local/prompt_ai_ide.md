# Prompt phát triển Energy-Task AI theo từng bản phát hành (dành cho AI IDE)

## Vai trò & mục tiêu

Bạn là kỹ sư full-stack kỷ luật. Nhiệm vụ là phát triển từ code hiện có của dự án Energy-Task AI theo từng bước nhỏ, mỗi bước tạo ra một “bản” sản phẩm chạy được (incremental releases), không làm vỡ tính năng cũ.

Mỗi bước phải:

- Có mục tiêu rõ ràng (1–3 tính năng).
- Có danh sách file sẽ thay đổi.
- Có tiêu chí nghiệm thu (acceptance criteria) kiểm tra được.
- Chạy được `npm run lint` và `npm run build` sau khi hoàn thành.
- Không thêm comment vào code trừ khi được yêu cầu.

## Ràng buộc dự án (bắt buộc tuân thủ)

- Nền tảng: Next.js (app router), React, TypeScript, Tailwind.
- State chính: `lib/store.tsx` (lưu localStorage + tuỳ chọn auto-sync Supabase).
- AI: `lib/ai.ts` dùng Gemini (parse task, chat, STT, TTS, live audio).
- Không “thiết kế lại từ đầu”. Ưu tiên bổ sung đúng mô hình dữ liệu và UI đang có.

Các điểm neo code quan trọng:

- Trang chính: `app/page.tsx`
- Lịch tuần: `app/schedule/page.tsx`
- Store: `lib/store.tsx`
- AI: `lib/ai.ts`
- Cài đặt: `components/SettingsModal.tsx`
- Đồng bộ: `components/SyncModal.tsx`
- Chatbot: `components/ChatBot.tsx`
- Brain dump: `components/BrainDumpInput.tsx`

## Định nghĩa “một bản sản phẩm”

Một bản sản phẩm hợp lệ khi:

- Build được: `npm run build`
- Lint pass: `npm run lint`
- Hành vi UI tối thiểu đúng theo acceptance criteria của bước đó
- Không phá vỡ flow hiện có: check-in năng lượng → Zen task → danh sách → lịch tuần → chỉnh sửa task

## Đầu ra bắt buộc của bạn ở mỗi bước

Sau khi hoàn thành 1 bước, bạn phải trả ra:

- Tên bản: `vX.Y` (ví dụ `v0.2`)
- Thay đổi chính (3–6 gạch đầu dòng)
- Danh sách file đã sửa (kèm đường dẫn)
- Cách kiểm tra thủ công (manual test checklist)
- Lệnh kiểm tra đã chạy và kết quả (lint/build)

## Chiến lược triển khai: từ “ổn định” → “cá nhân hoá” → “kỷ luật”

### Bản 0: Baseline (v0.1)

Mục tiêu: xác nhận app chạy ổn định, không lỗi, flow cơ bản rõ ràng.

- Không thêm tính năng mới.
- Chỉ sửa bug, cải thiện UX nhỏ nếu gây lỗi hoặc khó dùng.

Acceptance criteria:

- Trang chính hiển thị check-in năng lượng nếu chưa chọn.
- Sau khi chọn năng lượng, có Zen task hoặc trạng thái trống hợp lý.
- Lịch tuần mở được và sửa task được.

### Bản 1: Chuẩn hoá dữ liệu và trải nghiệm nhập việc (v0.2)

Mục tiêu: giảm sai sót dữ liệu khi tạo/sửa task, tăng độ tin cậy của parse AI.

Phạm vi đề xuất:

- Chuẩn hoá validate deadline/duration trong edit modal.
- “Duyệt nhanh” kết quả Brain Dump (nếu hiện tại auto-add, thêm màn hình xác nhận tối thiểu).

Acceptance criteria:

- Không lưu deadline sai định dạng gây crash ở lịch tuần.
- Khi AI parse ra 0 task, có thông báo rõ ràng.

### Bản 2: Chronotype profiling (v0.3)

Mục tiêu: thêm chronotype vào hồ sơ và dùng nó trong scoring gợi ý task.

Thêm dữ liệu:

- `chronotype: 'lion' | 'bear' | 'wolf' | 'dolphin' | null`
- `chronotypeUpdatedAt: string | null`

UI đề xuất:

- Modal khảo sát 4 câu (A/B/C/D) và trang kết quả ngắn gọn.
- Entry point: nút trong Settings hoặc Profile.

Logic:

- Mở rộng `getTopTask()` để cộng điểm cho task phù hợp “cửa sổ năng lượng”.
- Không xoá scoring cũ, chỉ cộng điểm bổ sung.

Acceptance criteria:

- Người dùng làm khảo sát, lưu kết quả và tồn tại qua reload.
- Scoring thay đổi có thể quan sát (ít nhất qua “nhãn debug” hoặc sắp xếp hợp lý).

### Bản 3: Check-in cảm xúc (v0.4)

Mục tiêu: thêm mood check-in theo ngày và ảnh hưởng scoring.

Thêm dữ liệu:

- `mood: 'excited' | 'neutral' | 'anxious' | 'sad' | 'angry' | null`
- `moodHistory: { date: string; mood: Mood }[]`

UI đề xuất:

- Widget nhỏ gần check-in năng lượng hoặc header: chọn 1 trạng thái.

Logic:

- Nếu mood = anxious/sad → cộng điểm cho nhóm task “phân tích/chính xác”.
- Nếu mood = excited → cộng điểm cho nhóm task “sáng tạo/kết nối”, giảm ưu tiên các task rủi ro (nếu có nhãn).

Acceptance criteria:

- Mood lưu theo ngày và reset hợp lý khi sang ngày mới.
- Zen task thay đổi theo mood theo rule tối thiểu.

### Bản 4: Morning protocol (v0.5)

Mục tiêu: checklist buổi sáng theo chronotype + tracking adherence.

Thêm dữ liệu:

- `morningProtocolPrefs` (tuỳ chọn)
- `morningAdherenceHistory: { date: string; completed: string[] }[]`

UI đề xuất:

- Card “Buổi sáng hôm nay” (3–5 checklist), tick được.

Acceptance criteria:

- Checklist hiển thị khác nhau theo chronotype (ít nhất 1 mục khác biệt).
- Tick lưu lại và hiển thị đúng sau reload.

### Bản 5: Ivy Lee (6 việc/ngày) (v0.6)

Mục tiêu: giới hạn 6 việc và áp dụng đơn nhiệm theo thứ tự.

Thêm dữ liệu:

- `dailyTopSix: { date: string; taskIds: string[] }[]`

UI đề xuất:

- Modal chọn 6 việc từ task todo.
- Hiển thị danh sách 1–6 và highlight #1.

Logic:

- Zen mode ưu tiên task #1 trong dailyTopSix (nếu tồn tại).

Acceptance criteria:

- Không thể chọn quá 6 việc.
- Task #1 được ưu tiên hiển thị khi còn todo.

### Bản 6: Chống trì hoãn “15 phút + chia nhỏ” (v0.7)

Mục tiêu: tạo luồng bắt đầu nhỏ và theo dõi bước.

Tận dụng dữ liệu có sẵn:

- `subtasks[]` đã có trên Task

UI đề xuất:

- Nút “Chia nhỏ” trong EditTaskModal: tạo subtasks (AI hoặc thủ công).
- Nút “Bắt đầu 15 phút” trên Zen task: đếm ngược tối thiểu.

Acceptance criteria:

- Người dùng có thể tạo subtasks và tick hoàn thành.
- Phiên 15 phút chạy, pause/stop tối thiểu, không crash khi reload.

### Bản 7: Focus session + nghỉ 415–460 giây (v0.8)

Mục tiêu: phiên tập trung 30 phút → nghỉ 7 phút theo nghiên cứu.

Tận dụng dữ liệu có sẵn:

- `timerStatus`, `timerStartedAt`, `timerRemaining` trong Task

UI đề xuất:

- Điều khiển timer ngay trong Zen task.
- Khi hết 30 phút: hiển thị màn hình nghỉ 7 phút (đếm ngược).

Acceptance criteria:

- Timer hoạt động ổn định, không drift nghiêm trọng trong tab background.
- Luồng làm việc: focus → nghỉ → quay lại task.

### Bản 8: Báo cáo tuần mở rộng (v0.9)

Mục tiêu: insights theo năng lượng/mood/chronotype và adherence.

UI đề xuất:

- Mở rộng `WeeklyReportModal` để hiển thị:
  - energyHistory theo ngày
  - moodHistory theo ngày
  - adherence checklist theo ngày

Acceptance criteria:

- Báo cáo hiển thị đúng dữ liệu hiện có, không cần AI.

### Bản 9: Làm giàu gamification + streak (v1.0)

Mục tiêu: tăng động lực, phản hồi tức thì, và streak đơn giản.

Thêm dữ liệu:

- `streak` theo ngày (định nghĩa rõ: hoàn thành ≥1 task quan trọng/ngày, hoặc hoàn thành task #1 Ivy Lee/ngày)

Acceptance criteria:

- Quy tắc streak rõ ràng, hiển thị được ở header/report.

## Checklist tự kiểm tra trước khi kết thúc mỗi bước

- Không có lỗi TypeScript.
- Không có crash khi reload.
- Không có dữ liệu “cũ” bị mất khi migrate state (nếu thêm field mới thì set default).
- Nếu thêm trường vào store: đảm bảo tương thích ngược với state đã lưu trong localStorage.

## Prompt chạy cho từng bước (copy/paste)

### Prompt khởi động chung (dán trước mọi bước)

Bạn đang làm việc trên dự án Next.js hiện có. Hãy:

1) Đọc code liên quan đến bước này.
2) Đề xuất thay đổi tối thiểu để đạt acceptance criteria.
3) Thực hiện thay đổi.
4) Chạy `npm run lint` và `npm run build`.
5) Tóm tắt: thay đổi chính, file sửa, checklist test thủ công.

Không thêm comment vào code. Luôn giữ app chạy được sau mỗi bước.

### Prompt theo bước (mẫu)

Mục tiêu bản: vX.Y

- Tính năng cần làm: (liệt kê 1–3)
- Acceptance criteria: (liệt kê 3–6)
- File dự kiến thay đổi: (liệt kê)
- Yêu cầu tương thích dữ liệu: (nêu rõ default/migrate)

Thực hiện xong, chạy lint/build và đưa checklist test thủ công.

