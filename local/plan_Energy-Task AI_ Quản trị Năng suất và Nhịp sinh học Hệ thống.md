# Kế hoạch đề án: Energy-Task AI — Quản trị Năng suất & Nhịp sinh học

## 1) Tóm tắt đề án

Energy-Task AI là trợ lý quản lý công việc “kỷ luật nhưng thấu hiểu”, tối ưu năng suất dựa trên 3 trụ cột:

- Nhiệm vụ: Deadline, thời lượng, và mức độ Quan trọng/Gấp (Ma trận Eisenhower).
- Con người: mức năng lượng và trạng thái cảm xúc hiện tại.
- Nhịp sinh học: kiểu hình chronotype (Sư tử / Gấu / Sói / Cá heo) và “cửa sổ năng lượng” theo ngày.

Đề án được thiết kế theo hai hệ thống cốt lõi:

- “Thấu hiểu”: cá nhân hoá theo chronotype + năng lượng + cảm xúc, giúp chọn việc phù hợp và giảm ma sát khởi động.
- “Kỷ luật”: kiến trúc ưu tiên + cơ chế chống trì hoãn + chu kỳ tập trung/phục hồi để duy trì hiệu suất bền vững.

## 2) Tài liệu tham khảo (đầu vào)

- Tài liệu thiết kế tổng quan: [Energy-Task AI_ Quản trị Năng suất và Nhịp sinh học Hệ thống.md](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/local/Energy-Task%20AI_%20Qu%E1%BA%A3n%20tr%E1%BB%8B%20N%C4%83ng%20su%E1%BA%A5t%20v%C3%A0%20Nh%E1%BB%8Bp%20sinh%20h%E1%BB%8Dc%20H%E1%BB%87%20th%E1%BB%91ng.md)
- Bài khảo sát phân loại chronotype: [Khảo sát phân loại kiểu hình nhịp sinh học.md](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/local/Kh%E1%BA%A3o%20s%C3%A1t%20ph%C3%A2n%20lo%E1%BA%A1i%20ki%E1%BB%83u%20h%C3%ACnh%20nh%E1%BB%8Bp%20sinh%20h%E1%BB%8Dc.md)
- Báo cáo nền về năng lượng/cảm xúc/chronobiology/morning protocol: [Năng Lượng Nội Tại Và Khởi Đầu Ngày Mới.md](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/local/N%C4%83ng%20L%C6%B0%E1%BB%A3ng%20N%E1%BB%99i%20T%E1%BA%A1i%20V%C3%A0%20Kh%E1%BB%9Fi%20%C4%90%E1%BA%A7u%20Ng%C3%A0y%20M%E1%BB%9Bi.md)

## 2.1) Hiện trạng dự án hiện tại (để bổ sung đúng chỗ)

Mục tiêu của kế hoạch này là bổ sung theo đúng cấu trúc đang có của dự án (Next.js + state lưu localStorage + tuỳ chọn đồng bộ Supabase), tránh “thiết kế lại từ đầu”.

### Thành phần chính đang có

- Trang chính (Zen mode + danh sách): [page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/page.tsx)
- Lịch tuần: [schedule/page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/schedule/page.tsx)
- State & lưu trữ (localStorage + auto-sync Supabase): [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
- AI (Gemini): parse task, chat, STT, TTS, live audio: [ai.ts](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/ai.ts)
- Settings (API keys, prompt, nền, xoá dữ liệu): [SettingsModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/SettingsModal.tsx)
- Đồng bộ Supabase (auth + sync): [SyncModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/SyncModal.tsx)
- Chatbot (text + voice + live audio) và thanh “sức khoẻ tinh thần”: [ChatBot.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/ChatBot.tsx)
- Brain dump input: [BrainDumpInput.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/BrainDumpInput.tsx)

### Dữ liệu hiện có trong store (cần tận dụng)

- Task đã có đầy đủ: deadline, duration, important/urgent, routine, resources, subtasks, status.
- Energy đã có: `energyLevel`, `energyHistory`, và reset theo ngày.
- Gamification đã có: `points`.
- Tuỳ biến đã có: `apiKeys`, `customPrompt`, `backgroundType/backgroundValue`, `mentalHealth`.
- Đồng bộ đã có: lưu local + auto-sync Supabase + sync thủ công.

## 3) Mục tiêu & tiêu chí thành công

### Mục tiêu sản phẩm

- Giúp người dùng khởi động nhanh, giảm trì hoãn, và làm đúng việc vào đúng thời điểm năng lượng tốt nhất.
- Biến “dữ liệu nội tại” (năng lượng/cảm xúc/chronotype) thành tín hiệu điều phối lịch và lựa chọn nhiệm vụ.
- Tạo trải nghiệm tập trung (focus) và phục hồi (recovery) có cấu trúc, tránh làm liên tục đến kiệt sức.

### Tiêu chí thành công (đề xuất)

- Giảm thời gian “từ mở app → bắt đầu làm việc” (time-to-start).
- Tăng tỷ lệ hoàn thành task quan trọng, giảm số task bị bỏ qua/lặp lại.
- Tăng mức hài lòng tự báo cáo về “đúng việc – đúng lúc – đúng sức”.
- Tăng tính bền vững: người dùng duy trì sử dụng theo tuần (retention theo 7/14 ngày).

## 4) Phạm vi

### In-scope (cốt lõi)

- Onboarding chronotype (khảo sát nhanh 4 câu) và lưu hồ sơ nhịp sinh học.
- Check-in năng lượng + check-in cảm xúc (emotional routing) để định tuyến nhiệm vụ.
- Tự động gợi ý “việc tiếp theo” theo điểm ưu tiên + cửa sổ năng lượng.
- Kỷ luật ưu tiên (giới hạn 6 việc/ngày), “ăn con ếch”, chia nhỏ nhiệm vụ khi quá ngợp.
- Chu kỳ làm việc/phục hồi: nhắc nghỉ sau 30 phút và cửa sổ phục hồi 415–460 giây.
- Morning protocol gợi ý theo chronotype (ánh sáng, cách ly công nghệ, nước, ăn sáng giàu protein…).
- AI dùng để bóc tách task từ ngôn ngữ tự do (deadline/thời lượng/priority/urgent/routine/resources).

### Out-of-scope (giai đoạn đầu)

- Chẩn đoán y khoa/điều trị/khuyến cáo sức khoẻ có tính lâm sàng.
- Thiết bị đeo (wearables) và đồng bộ cảm biến sinh học thời gian thực.
- Tối ưu lịch theo nhóm/doanh nghiệp và phân quyền phức tạp.

## 5) Người dùng mục tiêu & Persona

- Sinh viên/nhân viên tri thức có nhiều đầu việc, dễ trì hoãn, lịch sinh hoạt không ổn định.
- Người có “năng lượng biến thiên” theo ngày, khó giữ kỷ luật bằng to-do list dài.
- Người có chronotype lệch (Sói/Cá heo) bị “đánh giá sai” nếu làm theo lịch cứng 8–17h.

Persona mẫu:

- P1 — “Sói”: tập trung mạnh sau 14h, buổi sáng mệt; cần app không ép làm việc khó lúc 8h.
- P2 — “Cá heo”: lo âu, ngủ nông, cầu toàn; cần chia nhỏ bước và nhịp nghỉ nghiêm ngặt.
- P3 — “Gấu”: nhịp cân bằng; cần cấu trúc ưu tiên và tránh thức khuya/đốt năng lượng.
- P4 — “Sư tử”: kỷ luật cao; cần tối ưu “con ếch” buổi sáng và tránh quá tải chiều tối.

## 6) Danh sách tính năng theo mức độ ưu tiên

Quy ước mức ưu tiên:

- P0: phải có để chứng minh đề án hoạt động đúng “đúng việc – đúng lúc – đúng sức”.
- P1: nâng chất lượng cá nhân hoá và “kỷ luật” (tăng hiệu quả/giảm trì hoãn/giảm kiệt sức).
- P2: nâng trải nghiệm, mở rộng dữ liệu/đồng bộ, và các tính năng “nice-to-have”.

### P0 — MVP (bắt buộc)

#### 6.1) Quản lý task có cấu trúc (CRUD + trạng thái)

- Mục tiêu: người dùng có thể tạo/sửa/xoá task nhanh, không bị rườm rà.
- Hiện trạng trong dự án:
  - Task model đã có trong store: [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
  - UI danh sách + filter + modal sửa task: [page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/page.tsx), [EditTaskModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/EditTaskModal.tsx)
- Nội dung:
  - Thuộc tính task: `title`, `deadline` (có/không), `durationMinutes`, `isImportant`, `isUrgent`, `isRoutine`, `resources[]`, `status` (todo/done/skipped).
  - Trạng thái: hoàn thành, bỏ qua, khôi phục task bị bỏ qua.
  - Sửa nhanh: đổi nhãn quan trọng/gấp, đổi deadline/thời lượng.
- UI/UX:
  - Danh sách task có filter theo trạng thái (tất cả/cần làm/đã xong/bỏ qua) và filter Quan trọng/Gấp.
  - Modal chỉnh sửa task với validate cơ bản (deadline hợp lệ, thời lượng > 0).
- Edge cases:
  - Deadline không có giờ (YYYY-MM-DD) → hiểu là “cả ngày”.
  - Task routine → hiển thị lặp theo ngày (không phụ thuộc deadline).

#### 6.2) Check-in năng lượng (Energy check-in)

- Mục tiêu: lấy tín hiệu “sức” trước khi đề xuất việc; giảm ép người dùng làm việc khó khi năng lượng thấp.
- Hiện trạng trong dự án:
  - Energy level + energy history đã có trong store: [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
  - UI check-in đã có: [EnergyCheckIn.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/EnergyCheckIn.tsx)
- Nội dung:
  - Người dùng chọn mức năng lượng trong ngày (thấp/vừa/cao hoặc thang điểm).
  - Lưu theo ngày để dùng cho báo cáo xu hướng (ở mức tối thiểu: lưu lần check-in cuối).
- UI/UX:
  - Màn hình check-in xuất hiện trước khi vào “Zen task” (nếu chưa chọn).

#### 6.3) Gợi ý “việc tiếp theo” (Zen Mode) + điểm ưu tiên cơ bản

- Mục tiêu: chọn 1 việc “đáng làm nhất” tại thời điểm hiện tại, tránh list dài làm tê liệt quyết định.
- Hiện trạng trong dự án:
  - Hàm chấm điểm và chọn top task đã có: `getTopTask()` trong [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
  - UI hiển thị task đề xuất: [ZenTask.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/ZenTask.tsx), flow trong [page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/page.tsx)
- Nội dung:
  - Tính điểm ưu tiên dựa trên:
    - Ma trận Eisenhower (Quan trọng/Gấp).
    - Gần deadline (deadline càng gần càng tăng điểm).
    - Phù hợp năng lượng hiện tại (năng lượng thấp → ưu tiên task ngắn/nhẹ).
  - Hành động: hoàn thành / bỏ qua.
- UI/UX:
  - Chỉ hiển thị 1 task được đề xuất kèm thông tin tối thiểu: tiêu đề, nhãn, deadline, thời lượng.
  - Khi hết task phù hợp: hiển thị trạng thái “đã xong hết việc quan trọng”.

#### 6.4) Brain Dump: nhập tự do → AI bóc tách task

- Mục tiêu: giảm ma sát nhập việc; biến suy nghĩ lộn xộn thành task có cấu trúc.
- Hiện trạng trong dự án:
  - UI input đã có: [BrainDumpInput.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/BrainDumpInput.tsx)
  - AI parse task đã có: `parseTaskWithAI()` trong [ai.ts](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/ai.ts)
- Nội dung:
  - Người dùng nhập 1 đoạn mô tả → AI trả ra mảng task:
    - `title`: ngắn gọn, rõ ràng.
    - `deadline`: ISO hoặc null.
    - `durationMinutes`: mặc định 30 nếu không rõ.
    - `isImportant`, `isUrgent`: theo Eisenhower.
    - `isRoutine` (nếu nhận diện được).
    - `resources[]`: trích URL/tài liệu đính kèm.
  - Người dùng duyệt nhanh và chấp nhận thêm vào danh sách (tối thiểu: auto-add với khả năng sửa sau).
- Edge cases:
  - AI không trích được task → báo “không tìm thấy task”.
  - Deadline mơ hồ → để null, tránh tự bịa ngày.

#### 6.5) Lịch tuần (Weekly schedule view)

- Mục tiêu: trực quan hoá task theo ngày/giờ để giảm xung đột thời gian và nhìn được tải công việc.
- Hiện trạng trong dự án:
  - Trang lịch tuần đã có: [schedule/page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/schedule/page.tsx)
- Nội dung:
  - Hiển thị 7 ngày theo tuần, có điều hướng tuần trước/hôm nay/tuần sau.
  - Task routine hiển thị mỗi ngày; task có deadline hiển thị đúng ngày.
  - Sắp xếp task trong ngày: theo giờ (nếu có) rồi theo độ quan trọng.
- UI/UX:
  - Click task để mở modal chỉnh sửa.

#### 6.5.1) Cài đặt hệ thống (API key, prompt, tuỳ biến)

- Mục tiêu: để AI hoạt động ổn định, người dùng tự cấu hình khoá và “phong cách trợ lý”.
- Hiện trạng trong dự án:
  - Modal cài đặt đã có: [SettingsModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/SettingsModal.tsx)
  - Trạng thái apiKeys/customPrompt/background đã có trong store: [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
- Nội dung:
  - Nhập nhiều Gemini API Keys (mỗi key 1 dòng) và cơ chế fallback/round-robin khi lỗi.
  - Prompt tuỳ chỉnh (system instruction) cho trợ lý: nghiêm khắc/nhẹ nhàng/coach…
  - Tuỳ biến nền (màu/hình/video) ở mức trải nghiệm (không ảnh hưởng core logic).
- UI/UX:
  - Modal cài đặt có nút lưu, và khu vực “xoá dữ liệu cá nhân”.
- Edge cases:
  - Không có key: hiển thị hướng dẫn thêm key; hạn chế gọi AI và báo lỗi thân thiện.

#### 6.5.2) Lưu trữ cục bộ & quản trị dữ liệu cá nhân

- Mục tiêu: dùng được offline và không phụ thuộc đăng nhập ngay từ đầu.
- Hiện trạng trong dự án:
  - Lưu localStorage đã có: [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
  - Xoá dữ liệu cá nhân đã có: `clearAllData()` và UI trong [SettingsModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/SettingsModal.tsx)
- Nội dung:
  - Lưu task, profile, daily state vào local storage (hoặc storage tương đương).
  - Xoá toàn bộ dữ liệu cá nhân (reset) và tự đồng bộ UI về trạng thái ban đầu.
- Lưu ý riêng tư:
  - Không ghi log nội dung nhạy cảm (mood, audio, API key).

### P1 — Tăng cá nhân hoá & tăng “kỷ luật”

#### 6.6) Chronotype profiling (Sư tử/Gấu/Sói/Cá heo) + cửa sổ năng lượng

- Mục tiêu: cá nhân hoá thời điểm làm việc phù hợp nhịp sinh học, đặc biệt cho Sói/Cá heo.
- Hiện trạng trong dự án: chưa có chronotype trong store và chưa có UI khảo sát.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm trường `chronotype` và `chronotypeUpdatedAt` vào store.
  - Tạo UI khảo sát (modal hoặc flow onboarding) và liên kết vào Settings/Profile.
  - Mở rộng `getTopTask()` để cộng điểm theo cửa sổ năng lượng chronotype.
- Nội dung:
  - Khảo sát nhanh 4 câu (A/B/C/D) và phân loại theo “đa số”.
  - Hiển thị giải thích kết quả + khuyến nghị “cửa sổ năng lượng”:
    - Sư tử: sáng sớm → trước 12h.
    - Gấu: giữa sáng → đầu chiều.
    - Sói: 12h → 21h, nhấn mạnh các đỉnh 14:00–16:15 và 16:15–18:15.
    - Cá heo: năng lượng phân mảnh 10:00–12:00 và 14:00–16:00.
  - Lưu chronotype vào hồ sơ để dùng cho thuật toán đề xuất task.
- Tác động đến đề xuất task:
  - Task “nặng” (Quan trọng) nên ưu tiên rơi vào cửa sổ năng lượng tốt.
  - Ngoài cửa sổ: gợi ý việc nhẹ/routine/chuẩn bị thay vì ép “deep work”.

#### 6.7) Check-in cảm xúc (Emotional routing)

- Mục tiêu: dùng cảm xúc như “tín hiệu điều phối”, không coi cảm xúc là “rào cản”.
- Hiện trạng trong dự án:
  - Đã có thanh “sức khoẻ tinh thần” (mentalHealth) trong chatbot: [ChatBot.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/ChatBot.tsx)
  - Chưa có “mood check-in” theo ngày và chưa có routing task theo mood.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm `mood` + `moodHistory[]` (theo ngày) vào store.
  - UI check-in mood đặt sau check-in năng lượng hoặc trong header.
  - Mở rộng scoring `getTopTask()` dựa trên mood (nếu có).
- Nội dung:
  - Chọn nhanh trạng thái: vui/hưng phấn, bình thường, lo âu/sợ hãi, buồn/bi quan, tức giận.
  - Luật đề xuất:
    - Lo âu/bi quan: ưu tiên việc cần thận trọng, chi tiết, chính xác.
    - Hưng phấn: ưu tiên việc sáng tạo/kết nối; cảnh báo tránh quyết định rủi ro cao.
  - (Tuỳ chọn) Gắn nhãn “phù hợp cảm xúc” cho task: sáng tạo / phân tích / hành chính / giao tiếp.

#### 6.8) Morning protocol (giao thức khởi động ngày mới)

- Mục tiêu: tối ưu 60 phút đầu ngày để “lập trình” năng lượng cả ngày, theo tài liệu tham khảo.
- Hiện trạng trong dự án: chưa có module morning protocol và chưa có dữ liệu adherence.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm `morningProtocol` (danh sách checklist) + `morningAdherenceHistory[]` theo ngày vào store.
  - UI widget trong trang chính hoặc trang riêng (ví dụ “Buổi sáng hôm nay”) với checklist.
- Nội dung:
  - Checklist 3–5 hành động theo chronotype và thói quen:
    - Ra nắng 5–10 phút (không nhìn qua kính), ưu tiên đi bộ nhẹ.
    - Cách ly công nghệ ít nhất 30 phút.
    - Uống nước, bữa sáng giàu protein.
    - Cá heo: gợi ý vận động mạnh để phá uể oải.
  - Lưu trạng thái hoàn thành checklist theo ngày (để báo cáo adherence).

#### 6.9) Ivy Lee: giới hạn 6 việc/ngày + đơn nhiệm theo thứ tự

- Mục tiêu: chống mệt mỏi quyết định, tránh to-do list dài.
- Hiện trạng trong dự án: chưa có cơ chế “chọn 6 việc/ngày” và khoá thứ tự.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm `dailyTopSix` theo ngày vào store (mảng taskId hoặc snapshot).
  - UI chọn 6 việc (modal) và hiển thị “task #1” ưu tiên trong Zen mode.
- Nội dung:
  - Mỗi ngày chỉ chọn tối đa 6 task “Today”.
  - Hiển thị task #1 nổi bật; giảm nhiễu task #2–#6 cho đến khi xong #1.
  - Cho phép sắp xếp lại thứ tự 1–6 (nhưng vẫn giữ nguyên nguyên tắc đơn nhiệm).

#### 6.10) “Ăn con ếch” + chia nhỏ + phiên 15 phút

- Mục tiêu: phá trì hoãn bằng “bắt đầu đủ nhỏ” và tạo đà dopamine.
- Hiện trạng trong dự án:
  - Task đã có `subtasks`, và UI breakdown bằng AI có thể mở rộng từ `breakDownTaskWithAI()` trong [ai.ts](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/ai.ts)
  - Chưa có flow “chọn con ếch” và “phiên 15 phút” trong UI.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm trường `frogTaskId` theo ngày trong store.
  - Nút “Chia nhỏ” trên task modal, tạo subtasks (AI hoặc thủ công).
  - Nút “Bắt đầu 15 phút” và tracking đơn giản (đếm ngược hoặc timerRemaining).
- Nội dung:
  - Gợi ý chọn “con ếch” là task Quan trọng nhất trong ngày.
  - Khi người dùng báo “quá ngợp”: đề xuất chia task thành bước nhỏ và khởi động phiên 15 phút.
  - Ghi nhận tiến trình theo bước (micro-goals) để tạo phản hồi tức thì.

#### 6.11) Focus session + nghỉ phục hồi 415–460 giây

- Mục tiêu: duy trì hiệu suất bền vững, tránh làm liên tục đến kiệt sức.
- Hiện trạng trong dự án:
  - Task model đã có trường timer (`timerStatus`, `timerStartedAt`, `timerRemaining`) trong [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx) nhưng chưa thấy UI điều khiển timer.
- Bổ sung vào dự án hiện tại (đề xuất):
  - Thêm UI focus session ngay trên Zen task: bắt đầu/pause/stop.
  - Khi hoàn tất 30 phút: hiển thị màn hình nghỉ 7 phút (đếm ngược 415–460 giây), sau đó quay lại Zen task.
- Nội dung:
  - Bắt đầu phiên tập trung theo task (30 phút).
  - Sau 30 phút: nhắc nghỉ 415–460 giây (~7 phút), hiển thị đồng hồ đếm ngược.
  - Sau nghỉ: gợi ý quay lại task hoặc đánh giá lại năng lượng.

### P2 — Nâng trải nghiệm & mở rộng dữ liệu

#### 6.12) Trợ lý AI (chat) + giọng nói (STT/TTS/Live audio)

- Mục tiêu: tăng “độ tiện” cho người dùng thích nói thay vì gõ; hỗ trợ lập kế hoạch nhanh.
- Hiện trạng trong dự án: đã có chatbot + STT/TTS/live audio: [ChatBot.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/ChatBot.tsx)
- Nội dung:
  - Chat text: hỏi đáp, gợi ý cách chia nhỏ việc, nhắc nguyên tắc kỷ luật.
  - STT: ghi âm → tự điền nội dung input.
  - TTS: đọc phản hồi.
  - Live audio: trò chuyện trực tiếp (bật/tắt rõ ràng), có thể gọi tool “addTask”.
- Lưu ý an toàn:
  - Không lưu audio nếu không cần; nếu lưu phải có tuỳ chọn xoá.

#### 6.13) Báo cáo tuần mở rộng (insights)

- Mục tiêu: phản hồi vòng lặp (feedback loop) để người dùng tự điều chỉnh lịch/nhịp.
- Hiện trạng trong dự án: đã có UI báo cáo tuần (cần xác nhận nội dung/metrics trong code): [WeeklyReportModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/WeeklyReportModal.tsx)
- Nội dung:
  - Xu hướng năng lượng theo ngày/giờ.
  - Tỷ lệ hoàn thành theo khung giờ (đối chiếu chronotype).
  - Adherence morning protocol và nhắc cải thiện.

#### 6.14) Đồng bộ Supabase (tuỳ chọn)

- Mục tiêu: đăng nhập và đồng bộ đa thiết bị.
- Hiện trạng trong dự án: đã có sync và auth: [SyncModal.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/components/SyncModal.tsx), [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx)
- Nội dung:
  - Đăng ký/đăng nhập, đồng bộ task + profile + daily state.
  - Xử lý xung đột đơn giản: “last write wins” hoặc merge theo timestamp.

#### 6.15) Gamification & phản hồi tức thì (phần thưởng)

- Mục tiêu: tăng động lực duy trì, tạo “vòng lặp thành tựu” để chống trì hoãn.
- Hiện trạng trong dự án:
  - Điểm thưởng đã có trong `completeTask()` và UI header: [store.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/lib/store.tsx), [page.tsx](file:///d:/desktop/tlcn/medical%20consulting%20system/external/ENERGY-TASK-AI/app/page.tsx)
- Bổ sung vào dự án hiện tại (đề xuất):
  - Chuẩn hoá quy tắc thưởng theo loại task + theo micro-goals (subtasks).
  - Streak theo ngày (dựa vào completion) nếu cần.
- Nội dung:
  - Điểm thưởng khi hoàn thành task (ưu tiên thưởng cao hơn cho Quan trọng/Gấp).
  - Hiệu ứng phản hồi tức thì (ví dụ: thông báo ngắn, tiến trình) khi hoàn thành bước nhỏ.
  - Báo cáo “chuỗi ngày duy trì” (streak) ở mức đơn giản (tuỳ chọn).

## 7) AI & dữ liệu

### 7.1) Use-cases AI

- Task parsing: từ câu mô tả tự do → danh sách task có cấu trúc: title, deadline (ISO), durationMinutes, isImportant/isUrgent, isRoutine, resources.
- Chat trợ lý: trả lời ngắn gọn; có thể tham chiếu danh sách task hiện tại.
- Speech:
  - STT: chuyển audio → văn bản.
  - TTS: đọc phản hồi.
  - Live audio: trò chuyện trực tiếp (nếu bật).

### 7.2) Prompt/Policy (đề xuất)

- System instruction nhất quán: “quản lý kỷ luật nhưng thấu hiểu”, tránh phán xét.
- Không đưa lời khuyên y khoa/chẩn đoán; chỉ gợi ý hành vi phổ quát (ánh sáng, nghỉ ngơi, uống nước).
- Khi không chắc: hỏi lại hoặc đưa lựa chọn nhẹ, không khẳng định quá mức.

### 7.3) Mô hình dữ liệu (tối thiểu)

- UserProfile:
  - chronotype: lion | bear | wolf | dolphin
  - wakeTime/sleepTime (tuỳ chọn), timezone
  - morningProtocolPrefs (tuỳ chọn)
- DailyState:
  - energyLevel (mức năng lượng)
  - mood (trạng thái cảm xúc)
  - timestamps
- Task:
  - title, status (todo/done/skipped), deadline, durationMinutes
  - isImportant, isUrgent, isRoutine
  - resources[]
  - createdAt/updatedAt

## 8) Logic gợi ý “việc tiếp theo” (scoring)

### 8.1) Điểm ưu tiên (gợi ý)

- Base: Ma trận Eisenhower (Quan trọng/Gấp).
- Time pressure: gần deadline tăng điểm.
- Fit score:
  - Nằm trong cửa sổ năng lượng của chronotype: +điểm.
  - Năng lượng hiện tại thấp: ưu tiên việc ngắn/nhẹ, hoặc đề xuất phiên 15 phút.
  - Mood routing:
    - Lo âu/bi quan: ưu tiên việc phân tích/chính xác.
    - Hưng phấn: ưu tiên việc sáng tạo/kết nối; tránh “quyết định rủi ro”.

### 8.2) Quy tắc an toàn

- Không ép “task nặng” khi năng lượng thấp liên tục; thay bằng phiên 15 phút hoặc chia nhỏ.
- Nếu không có task phù hợp: đề xuất nghỉ 7 phút hoặc brain dump bổ sung.

## 9) Trải nghiệm người dùng (ưu tiên theo luồng)

### Flow 1 — Hằng ngày (P0)

- Check-in năng lượng.
- Gợi ý 1 việc tiếp theo (Zen task).
- Hoàn thành/bỏ qua và tiếp tục vòng lặp.

### Flow 2 — Nhập việc nhanh (P0)

- Brain dump → AI bóc tách → thêm task → quay lại Zen task.

### Flow 3 — Lịch tuần (P0)

- Xem theo tuần → click sửa task → cập nhật deadline/thời lượng/nhãn.

### Flow 4 — Cá nhân hoá (P1)

- Làm khảo sát chronotype → lưu profile → ảnh hưởng đề xuất task.
- Check-in cảm xúc → điều hướng task.
- Morning protocol → checklist theo ngày.

### Flow 5 — Kỷ luật & phục hồi (P1)

- Chọn 6 việc/ngày (Ivy Lee) → làm theo thứ tự.
- Focus 30 phút → nghỉ 7 phút (415–460 giây) → quay lại.
- Khi quá ngợp → chia nhỏ + phiên 15 phút.

## 10) Kế hoạch triển khai theo mức ưu tiên

- Milestone P0 (đã có phần lớn): rà soát/ổn định 6.1–6.5.2, chuẩn hoá dữ liệu và xác nhận UX Flow 1–3.
- Milestone P1 (bổ sung cốt lõi): thêm chronotype + mood + morning protocol + Ivy Lee + focus/recovery + 15 phút; mở rộng scoring và Flow 4–5.
- Milestone P2 (mở rộng): làm giàu insights, chuẩn hoá gamification/streak, hoàn thiện sync và chất lượng chatbot/voice theo nhu cầu.

## 11) Tiêu chí đánh giá & đo lường

- Task completion rate (đặc biệt nhóm Quan trọng/Gấp).
- Tỷ lệ “bắt đầu làm trong 5 phút” sau khi app gợi ý task.
- Số lần “bỏ qua” / “khôi phục” / “đổi thứ tự ưu tiên”.
- Adherence: morning protocol (tự báo cáo), phiên nghỉ 7 phút (thực hiện hay bỏ qua).
- Retention: 7 ngày / 14 ngày.

## 12) Rủi ro & phương án giảm thiểu

- Rủi ro hiểu sai/ảo giác AI khi parse nhiệm vụ: cho phép người dùng duyệt và sửa trước khi lưu (hoặc luôn có nút chỉnh sửa ngay sau khi thêm).
- Rủi ro “lời khuyên sức khoẻ” bị hiểu là y khoa: giới hạn nội dung ở mức gợi ý hành vi phổ quát; tránh chẩn đoán.
- Rủi ro quá nhiều bước làm người dùng mệt: progressive disclosure (chỉ hiện khi cần), ưu tiên P0 thật gọn.
- Rủi ro riêng tư (audio, mood): lưu tối thiểu, có nút xoá dữ liệu; không log nhạy cảm.

## 13) Deliverables

- Tài liệu đặc tả (file này).
- Bộ câu hỏi chronotype + thuật toán phân loại + mapping cửa sổ năng lượng.
- Mapping luật điều hướng task theo chronotype/năng lượng/cảm xúc.
- Luồng UI/UX theo mức ưu tiên (P0/P1/P2).
- Plan kiểm thử: test parse task, test luật gợi ý, test lưu/đồng bộ dữ liệu.
