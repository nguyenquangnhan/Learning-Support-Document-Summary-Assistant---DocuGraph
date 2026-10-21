# 📘 Product Requirements Document (PRD)
# DocuGraph AI – Nền tảng Trợ lý Tri thức Đa tầng (Multi-layer Knowledge Assistant)

> **Phiên bản:** 2.0 (Cập nhật Tech Stack & Vision)  
> **Ngày tạo:** 2026-10-21  
> **Cập nhật lần cuối:** 2026-10-21  
> **Tác giả:** Team DocuGraph  
> **Trạng thái:** Draft – Chờ phê duyệt

---

## Mục lục

1. [Executive Summary](#1-executive-summary)
2. [User Experience & Functionality](#2-user-experience--functionality)
3. [AI System Requirements](#3-ai-system-requirements)
4. [Technical Specifications](#4-technical-specifications)
5. [Risks & Roadmap](#5-risks--roadmap)

---

## 1. Executive Summary

### 🎯 Problem Statement

Sinh viên, chuyên gia và tổ chức hiện nay đang chìm ngập trong kho tài liệu số hóa khổng lồ – giáo trình, slide bài giảng, văn bản pháp lý, báo cáo y tế – nhưng không có công cụ để **trích xuất tri thức cấu trúc** từ chúng. Các AI tóm tắt truyền thống thiếu khả năng truy vấn suy luận đa bước (multi-hop reasoning), dễ bịa đặt thông tin (hallucination) và không trích dẫn chính xác vị trí tài liệu gốc, gây mất niềm tin và tốn thời gian kiểm chứng thủ công.

### 💡 Proposed Solution

**DocuGraph AI** là nền tảng **Trợ lý Tri thức Đa tầng (Multi-layer Knowledge Assistant)** toàn diện, chuyển đổi dữ liệu thô (PDF scan, ảnh chụp tài liệu, giáo trình, văn bản pháp lý, y tế...) thành một **Đồ thị Tri thức (Knowledge Graph) sống động**. Hệ thống kết hợp **tìm kiếm ngữ nghĩa Vector (pgvector)** và **đồ thị mối quan hệ (GraphRAG / Neo4j)** để:
- Trả lời câu hỏi tự nhiên bằng tiếng Việt với suy luận đa bước
- Trích dẫn chính xác số trang / đoạn văn trong tài liệu gốc
- **Loại bỏ hoàn toàn hiện tượng ảo giác (hallucination)** bằng cơ chế grounding vào Knowledge Graph
- Hỗ trợ cộng tác nhóm, gamification quiz và học ngoại tuyến

### ✅ Success Criteria (KPIs)

| # | Chỉ số | Mục tiêu |
|---|--------|----------|
| 1 | Thời gian xử lý pipeline OCR → Graph cho tài liệu 10 trang | < 15 giây |
| 2 | Độ trễ truy vấn GraphRAG (Vector + Graph hybrid search) | < 3 giây (P95) |
| 3 | Tỷ lệ giữ chân người dùng (D7 Retention) | ≥ 40% |
| 4 | Hallucination rate (câu trả lời có thông tin không có trong tài liệu) | ≤ 2% (đánh giá 100 câu/sprint) |
| 5 | Thời gian đồng bộ Quiz Battle đến tất cả người chơi | < 200ms (P95) |
| 6 | Tỷ lệ crash-free sessions | ≥ 99.5% |
| 7 | Lighthouse Performance Score (Web Dashboard) | ≥ 90 |
| 8 | Độ chính xác OCR tiếng Việt (PaddleOCR) trên bản scan mờ | ≥ 92% character accuracy |

---

## 2. User Experience & Functionality

### 👤 User Personas

#### Persona 1 – Minh (Sinh viên chủ động)
- **Tuổi**: 20, Năm 3 Đại học Bách Khoa  
- **Mục tiêu**: Ôn thi hiệu quả, tóm gọn giáo trình 200 trang trước kỳ thi  
- **Nỗi đau**: Không có thời gian đọc hết tài liệu; ghi chép thủ công mất nhiều giờ  
- **Kỳ vọng**: Có bản tóm tắt sẵn ngay sau khi upload file; câu hỏi ôn tập tự sinh  

#### Persona 2 – Linh (Trưởng nhóm học tập)
- **Tuổi**: 21, Trưởng nhóm môn Cơ sở dữ liệu  
- **Mục tiêu**: Tổ chức tài nguyên học tập dùng chung, tránh mỗi người phải tóm tắt riêng  
- **Nỗi đau**: Phải gửi file qua Zalo/Drive, không ai tổng hợp kiến thức thống nhất  
- **Kỳ vọng**: Tạo nhóm, upload một lần, cả nhóm dùng chung tài nguyên AI đã xử lý  

#### Persona 3 – Tuấn (Người học gamification)
- **Tuổi**: 19, Sinh viên Năm 1  
- **Mục tiêu**: Học qua thi đấu để không bị nhàm chán  
- **Nỗi đau**: Học một mình dễ mất tập trung; không biết mình đang ở đâu so với bạn bè  
- **Kỳ vọng**: Tham gia thi đấu quiz realtime, xem bảng xếp hạng trực tiếp  

---

### 📖 User Stories & Acceptance Criteria

---

#### Module 1: Xác thực người dùng (Authentication)

**US-01** – Đăng nhập đa phương thức  
> *As a sinh viên, I want to đăng nhập bằng Google hoặc Email/Mật khẩu so that tôi có thể truy cập hồ sơ học tập cá nhân an toàn.*

**Acceptance Criteria:**
- [ ] Nút "Đăng nhập với Google" mở OAuth2 flow trong vòng 1 giây
- [ ] Đăng nhập Email/Password validate format email trước khi gửi request
- [ ] Thành công: JWT Token được lưu mã hóa (SecureStore/MMKV), chuyển sang HomeScreen < 2 giây
- [ ] Thất bại: Hiển thị thông báo lỗi cụ thể (sai mật khẩu / tài khoản chưa xác minh / lỗi mạng)
- [ ] Rate limit: Khóa tài khoản tạm thời sau 5 lần nhập sai liên tiếp, thông báo rõ thời gian mở khóa

**US-02** – Khôi phục mật khẩu  
> *As a sinh viên, I want to nhận link/mã OTP đặt lại mật khẩu qua email so that tôi không bị mất tài khoản.*

**Acceptance Criteria:**
- [ ] Email đặt lại mật khẩu được gửi trong < 30 giây sau khi nhấn yêu cầu
- [ ] Link/OTP có hiệu lực trong 15 phút
- [ ] Mật khẩu mới phải đáp ứng chính sách: ≥ 8 ký tự, có chữ hoa và số

**US-03** – Duy trì phiên làm việc  
> *As a sinh viên, I want to mở lại app mà không cần đăng nhập lại so that tôi tiết kiệm thời gian mỗi lần dùng.*

**Acceptance Criteria:**
- [ ] Token được lưu mã hóa AES-256 tại SecureStore/MMKV
- [ ] Refresh token tự động khi JWT hết hạn mà không làm gián đoạn trải nghiệm
- [ ] Sau 30 ngày không hoạt động, yêu cầu đăng nhập lại

---

#### Module 2: Tóm tắt tài liệu AI (AI Document Summarization)

**US-04** – Upload & Chọn chế độ tóm tắt  
> *As a sinh viên, I want to upload file PDF/DOCX hoặc chụp ảnh trang sách so that AI tóm tắt cho tôi.*

**Acceptance Criteria:**
- [ ] Hỗ trợ định dạng: PDF, DOCX, JPG/PNG (OCR)
- [ ] Giới hạn file: ≤ 50MB / file, ≤ 500 trang
- [ ] Thanh tiến trình upload và xử lý hiển thị phần trăm (0–100%)
- [ ] Hai chế độ tóm tắt hiển thị rõ ràng với mô tả: "TL;DR" và "Bullet Points & Key Takeaways"
- [ ] Camera capture hỗ trợ chụp nhiều trang liên tiếp, tự ghép thành document

**US-05** – Hiển thị kết quả tóm tắt  
> *As a sinh viên, I want to xem bản tóm tắt định dạng Markdown so that tôi đọc nhanh nội dung cốt lõi.*

**Acceptance Criteria:**
- [ ] Tóm tắt render đúng Markdown: tiêu đề, **in đậm**, danh sách, công thức LaTeX
- [ ] Thời gian hiển thị kết quả sau khi AI xử lý xong < 1 giây (render local)
- [ ] Thanh cuộn hiển thị tiến trình đọc (reading progress bar)
- [ ] Nút copy toàn bộ bản tóm tắt vào clipboard

**US-06** – Chuyển tiếp tác vụ từ tóm tắt  
> *As a sinh viên, I want to nhanh chóng tạo Mindmap hoặc Quiz từ bản tóm tắt so that tôi tận dụng ngay kết quả AI.*

**Acceptance Criteria:**
- [ ] 3 nút tắt hiển thị phía dưới bản tóm tắt: "Vẽ Mindmap", "Sinh Quiz", "Lưu vào Nhóm"
- [ ] Chuyển màn hình Mindmap/Quiz trong < 500ms (không gọi lại AI nếu đã có cache)
- [ ] Nút "Lưu vào Nhóm" hiển thị picker chọn nhóm nếu người dùng thuộc nhiều nhóm

**US-07** – Lưu trữ offline  
> *As a sinh viên, I want to đọc lại bản tóm tắt khi không có mạng so that tôi học mọi lúc mọi nơi.*

**Acceptance Criteria:**
- [ ] Tóm tắt được lưu tự động vào SQLite/local DB sau khi xử lý xong
- [ ] Mục "Tủ sách" hiển thị danh sách tài liệu đã lưu, có thể mở offline hoàn toàn
- [ ] Kích thước tối đa lưu trữ local: 2GB, có cảnh báo khi đạt 90%

---

#### Module 3: Trợ lý Chat AI (Learning Assistant)

**US-08** – Chat tự do và ghim tài liệu  
> *As a sinh viên, I want to hỏi AI về bất kỳ chủ đề nào hoặc ghim tài liệu để AI trả lời bám sát nội dung so that tôi có gia sư riêng.*

**Acceptance Criteria:**
- [ ] Giao diện chat kiểu bubble (user/AI) với avatar phân biệt
- [ ] Picker "Ghim tài liệu" cho phép chọn tối đa 3 tài liệu làm context
- [ ] AI nhận biết ngữ cảnh ghim và ưu tiên trích dẫn từ tài liệu đó
- [ ] Nút xóa ghim tài liệu, AI tự động reset về chế độ tự do

**US-09** – Đầu vào đa phương thức  
> *As a sinh viên, I want to chụp ảnh bài tập và gửi cho AI so that tôi không cần gõ lại từng công thức.*

**Acceptance Criteria:**
- [ ] Nút camera trong thanh nhập liệu, mở camera native
- [ ] Ảnh được encode base64 và đính kèm request multimodal API
- [ ] Preview thumbnail ảnh trong bubble tin nhắn trước khi gửi

**US-10** – Streaming response & định dạng nội dung  
> *As a sinh viên, I want to thấy AI gõ phản hồi dần dần (typing effect) so that tôi không bị cảm giác chờ đợi.*

**Acceptance Criteria:**
- [ ] Phản hồi streaming qua SSE/WebSocket, hiển thị từng token ngay khi nhận
- [ ] Render đúng: công thức LaTeX (KaTeX/MathJax), code blocks có syntax highlight, Markdown đầy đủ
- [ ] Nút "Dừng phản hồi" (stop generation) hoạt động trong < 300ms
- [ ] Lịch sử hội thoại lưu local, tải lại khi mở lại phiên

---

#### Module 4: Sơ đồ tư duy & Concept Graph (Mindmap)

**US-11** – Sinh sơ đồ từ tài liệu  
> *As a sinh viên, I want to AI tự động tạo Mindmap từ bản tóm tắt so that tôi thấy cấu trúc kiến thức một cách trực quan.*

**Acceptance Criteria:**
- [ ] AI trả về JSON chuẩn hóa trong < 5 giây cho tài liệu ≤ 50 trang
- [ ] JSON schema hợp lệ theo định nghĩa: `{ nodes: [{id, label, level, definition}], edges: [{from, to, label}] }`
- [ ] Render sơ đồ thành công trong < 2 giây sau khi nhận JSON
- [ ] Chuyển đổi được giữa chế độ Tree (Mindmap) và Graph (Concept Graph) bằng toggle

**US-12** – Tương tác cảm ứng với sơ đồ  
> *As a sinh viên, I want to zoom, pan và tap vào từng nút so that tôi khám phá kiến thức theo cách của mình.*

**Acceptance Criteria:**
- [ ] Pinch-to-zoom: 0.5x – 3x, animation 60fps
- [ ] Drag-to-pan không bị giật lag (< 16ms mỗi frame trên mid-range device)
- [ ] Tap vào nút: BottomSheet trượt lên trong < 300ms, hiển thị định nghĩa + ví dụ
- [ ] Nút "Reset view" đưa canvas về trạng thái ban đầu

**US-13** – Lưu trữ offline sơ đồ  
> *As a sinh viên, I want to xem lại sơ đồ khi offline so that tôi ôn bài bất kỳ lúc nào.*

**Acceptance Criteria:**
- [ ] JSON sơ đồ lưu vào SQLite ngay sau khi sinh thành công
- [ ] Mở sơ đồ offline: render < 1 giây từ JSON đã lưu
- [ ] Danh sách sơ đồ đã lưu trong "Tủ sách" với thumbnail preview

---

#### Module 5: Nhóm học tập (Study Group)

**US-14** – Tạo và gia nhập nhóm  
> *As a trưởng nhóm, I want to tạo nhóm học tập và chia sẻ mã nhóm 6 ký tự so that các bạn cùng lớp có thể tham gia.*

**Acceptance Criteria:**
- [ ] Mã nhóm 6 ký tự (chữ hoa + số) được sinh ngẫu nhiên, không trùng lặp trong hệ thống
- [ ] Mã nhóm hiển thị to, có nút "Copy" và "Chia sẻ" (Share Sheet native)
- [ ] Gia nhập nhóm qua mã: phản hồi thành công/thất bại trong < 2 giây
- [ ] Giới hạn: tối đa 100 thành viên/nhóm, 10 nhóm/tài khoản

**US-15** – Đóng góp tài nguyên nhóm (One-time AI Processing)  
> *As a thành viên, I want to upload tài liệu và xử lý AI một lần cho cả nhóm dùng so that không ai phải lặp lại chi phí AI.*

**Acceptance Criteria:**
- [ ] Thành viên upload tài liệu vào nhóm, có quyền bấm "Xử lý AI"
- [ ] Hệ thống lock tài liệu trong khi đang xử lý, hiển thị spinner với % tiến trình
- [ ] Sau khi xử lý xong: Tóm tắt + Mindmap JSON + Flashcards + Quiz bank được lưu vào `group_documents` trên cloud
- [ ] Các thành viên khác thấy badge "Mới" trên tài liệu vừa được xử lý
- [ ] Không cho phép xử lý lại AI trên cùng một tài liệu (button disabled + tooltip giải thích)

**US-16** – Khai thác tài nguyên nhóm dùng chung  
> *As a thành viên, I want to mở tài nguyên nhóm ngay lập tức mà không chờ AI so that tôi tiết kiệm thời gian và token.*

**Acceptance Criteria:**
- [ ] Tải bản tóm tắt/sơ đồ nhóm: hiển thị trong < 500ms (từ cloud cache)
- [ ] Nút "Lưu về máy" cho phép download toàn bộ tài nguyên để dùng offline
- [ ] Tài nguyên offline hoạt động hoàn toàn khi không có mạng
- [ ] Chỉ Trưởng nhóm có quyền xóa tài liệu khỏi nhóm

---

#### Module 6: Quiz cá nhân (Personal Quiz)

**US-17** – Thiết lập và sinh đề quiz  
> *As a sinh viên, I want to chọn tài liệu, số câu và độ khó để AI sinh quiz so that tôi ôn tập theo nhu cầu.*

**Acceptance Criteria:**
- [ ] Picker chọn tài liệu từ tủ sách cá nhân hoặc tài nguyên nhóm
- [ ] Chọn số câu: 5 / 10 / 20 câu (radio button)
- [ ] Chọn cấp độ nhận thức: Nhớ / Hiểu / Vận dụng (dựa theo Bloom's Taxonomy)
- [ ] AI trả về JSON quiz trong < 10 giây cho 20 câu
- [ ] Mỗi câu JSON gồm: `{ question, options: [4 items], correctIndex, explanation }`
- [ ] Validation: Không có 2 câu trùng nội dung trong cùng bộ quiz

**US-18** – Làm bài quiz  
> *As a sinh viên, I want to làm quiz theo chế độ thi hoặc luyện tập so that tôi kiểm tra kiến thức linh hoạt.*

**Acceptance Criteria:**
- [ ] Exam Mode: Countdown timer hiển thị (tổng thời gian = số câu × 60s), nộp bài tổng kết điểm
- [ ] Practice Mode: Sau mỗi câu hiển thị ngay đúng/sai (màu xanh/đỏ) và lời giải chi tiết
- [ ] Nút "Báo lỗi câu hỏi" cho phép user flag câu hỏi sai
- [ ] Không cho phép quay lại câu trước trong Exam Mode

**US-19** – Sổ tay câu sai  
> *As a sinh viên, I want to xem lại các câu làm sai và luyện lại so that tôi lấp đầy lỗ hổng kiến thức.*

**Acceptance Criteria:**
- [ ] Câu sai tự động lưu vào "Sổ tay câu sai" với timestamp và tên tài liệu nguồn
- [ ] Có thể sinh quiz chỉ từ câu sai (Quick Retry)
- [ ] Hiển thị biểu đồ tiến trình: % câu đúng theo thời gian (line chart 30 ngày)

---

#### Module 7: Đấu trí thời gian thực (Real-time Quiz Battle)

**US-20** – Tạo phòng thi đấu  
> *As a chủ phòng, I want to tạo phòng thi với mã PIN và chọn bộ quiz so that bạn bè có thể vào thi cùng.*

**Acceptance Criteria:**
- [ ] Picker chọn bộ quiz từ kho tài nguyên nhóm
- [ ] Sinh mã PIN 4–6 chữ số ngẫu nhiên, không trùng với phòng đang hoạt động
- [ ] Cài đặt phòng: thời gian mỗi câu (10 / 15 / 20 / 30 giây), số câu thi
- [ ] Trạng thái phòng: `WAITING` → `PLAYING` → `FINISHED`

**US-21** – Vào phòng & Chờ thi  
> *As a người chơi, I want to nhập mã PIN để vào phòng chờ và xem danh sách người tham gia cập nhật realtime so that tôi biết ai đang tham gia.*

**Acceptance Criteria:**
- [ ] Nhập PIN: validate format, phản hồi lỗi trong < 500ms
- [ ] Danh sách người chơi cập nhật ≤ 200ms sau khi thành viên mới join
- [ ] Nút "Xem nhanh tóm tắt & Mindmap" mở bottom sheet ôn bài, không rời khỏi phòng chờ
- [ ] Hiển thị số người đang trong phòng (ví dụ: "3/20 người")

**US-22** – Thi đấu đồng bộ  
> *As a người chơi, I want to cùng thấy câu hỏi và đếm ngược đồng thời với tất cả mọi người so that cuộc thi công bằng.*

**Acceptance Criteria:**
- [ ] Countdown 3-2-1 xuất hiện đồng bộ trên tất cả thiết bị (sai lệch < 500ms)
- [ ] Mỗi câu hỏi phát sóng đồng thời, timestamp server làm chuẩn
- [ ] Thanh đếm ngược hình bán nguyệt, đổi màu từ xanh → vàng → đỏ khi gần hết giờ
- [ ] Sau khi hết giờ hoặc đủ người trả lời: tự động chuyển câu tiếp theo

**US-23** – Tính điểm và Live Leaderboard  
> *As a người chơi, I want to xem điểm số và bảng xếp hạng cập nhật sau mỗi câu so that tôi biết thứ hạng của mình ngay lập tức.*

**Acceptance Criteria:**
- [ ] Điểm tính = Base Points (đúng: 100, sai: 0) × Speed Multiplier (1.0 – 2.0 tỷ lệ nghịch với thời gian phản hồi)
- [ ] Leaderboard cập nhật trong < 500ms sau khi câu kết thúc
- [ ] Top 3 hiển thị huy hiệu Gold/Silver/Bronze
- [ ] Delta điểm hiển thị animation (+120 pts) ngay khi submit đáp án đúng

**US-24** – Kết thúc trận đấu & Vinh danh  
> *As a người chơi, I want to xem kết quả cuối cùng, vinh danh Top 3 và lưu bộ quiz về tủ sách so that tôi có thể ôn lại sau.*

**Acceptance Criteria:**
- [ ] Màn hình kết quả: hiệu ứng confetti cho Top 1, podium animation cho Top 3
- [ ] Hiển thị thống kê cá nhân: tổng điểm, số câu đúng, thứ hạng, câu sai cần ôn
- [ ] Nút "Lưu bộ quiz về tủ sách cá nhân" hoạt động ngay cả khi không phải chủ nhóm
- [ ] Nút "Chơi lại" tạo phòng mới với cùng bộ quiz

---

### 🚫 Non-Goals (Những gì KHÔNG xây dựng trong v1.0)

- **Không** hỗ trợ video lecture summarization (chỉ PDF/DOCX/Image trong v1.0)
- **Không** xây dựng hệ thống thanh toán hay premium subscription
- **Không** hỗ trợ đa ngôn ngữ UI (chỉ Tiếng Việt trong v1.0)
- **Không** có tính năng live streaming video giảng bài
- **Không** xây dựng LMS (Learning Management System) đầy đủ với grading chính thức
- **Không** tích hợp API bên ngoài của trường (SIS, LMS portal)
- **Không** xây dựng Graph database custom từ đầu – dùng Neo4j managed cloud
- **Không** huấn luyện/fine-tune LLM riêng – sử dụng Gemini API với prompt engineering

---

## 3. AI System Requirements

### 🤖 Tool & API Requirements

#### 🖥️ Frontend & Mobile

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Next.js** | 15 (React 19) | Web Dashboard – SSR/SSG, SEO tối ưu, API Routes cho Auth & proxy |
| **Capacitor** | Latest | Đóng gói Next.js thành Android APK / iOS native app |
| **Google ML Kit** | On-device SDK | OCR & Vision trực tiếp trên thiết bị – hoàn toàn offline, nhận dạng chữ từ Camera, đọc mã QR |
| **Cytoscape.js / Vis.js / D3.js** | Latest | Render và tương tác với Knowledge Graph 2D/3D – hỗ trợ zoom, pan, tap node |

#### ⚙️ Backend & API Engine

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **FastAPI** | Python 3.11+ | Core backend – xử lý async pipeline: OCR → Chunking → Embedding → Graph Extraction → Storage |
| **Next.js API Routes** | 15 | Auth middleware, phân quyền người dùng, proxy request nhẹ đến FastAPI |
| **Celery + Redis** | Latest | Task queue cho các pipeline xử lý tài liệu nặng (async background jobs) |

#### 🤖 AI & Machine Learning

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **PaddleOCR** | v4/v5 | OCR Cloud chuyên sâu: nhận dạng tiếng Việt có dấu, bản scan mờ/nghiêng, bảng biểu phức tạp; xử lý đa tiến trình |
| **Google Gemini 2.5 Flash** | Latest | LLM cốt lõi: Trích xuất Entities & Relationships (Node/Edge JSON), sinh câu trả lời Streaming từ GraphRAG context, tóm tắt, quiz generation |
| **Gemini Embedding** | text-embedding-004 | Chuyển đổi text chunks → Vector 768 chiều cho Semantic Search (pgvector) |

#### 🗄️ Databases & Storage

| Công nghệ | Mục đích |
|-----------|----------|
| **Neo4j** (Graph DB) | Lưu trữ Knowledge Graph: Nodes (Concepts, Entities) + Edges (Relationships có nhãn); Multi-hop reasoning queries bằng Cypher |
| **PostgreSQL + pgvector** | Lưu trữ Document chunks + Vector Embeddings 768D; Hybrid search: semantic similarity + structured filters |
| **IndexedDB** (Browser/Mobile) | Local NoSQL cache: tài liệu offline, hàng đợi đồng bộ khi mất mạng, lưu graph đã render |
| **Supabase Storage** | Lưu file gốc (PDF, ảnh); Supabase Auth cho session management; Supabase Realtime cho Quiz Battle |

---

### 🔄 GraphRAG Pipeline Architecture

```
[Upload File]
     │
     ▼
[1. Document Ingestion]
  PDF Parser (pdfjs) → Text Extraction
  PaddleOCR (cloud) → OCR cho ảnh/scan
     │
     ▼
[2. Chunking & Preprocessing]
  Semantic chunking (512 tokens, 10% overlap)
  Metadata tagging: {page_num, doc_id, section_title}
     │
     ┌──────────────┴──────────────┐
     ▼                             ▼
[3a. Vector Embedding]       [3b. Entity & Relation Extraction]
  Gemini text-embedding-004    Gemini 2.5 Flash (Structured JSON Output)
  768-dim vectors              → { entities: [{id, label, type, definition}],
  → Store: pgvector               relations: [{from, to, type, context_chunk_id}] }
     │                             │
     ▼                             ▼
[PostgreSQL/pgvector]         [Neo4j Graph DB]
  chunks + embeddings           Knowledge Graph nodes & edges
     │                             │
     └──────────────┬──────────────┘
                    ▼
            [4. Query Engine – GraphRAG]
         User Question → Embed query → pgvector ANN search
                      → Retrieve top-K chunks
                      → Neo4j: expand related nodes (multi-hop)
                      → Merge context + citations
                      → Gemini 2.5 Flash Streaming → Answer
                      → Grounded citations: {doc_id, page, chunk_id}
```

### 📐 AI Prompt Strategy

#### Entity & Relationship Extraction (Graph Builder)
```
SYSTEM: Bạn là chuyên gia xây dựng Knowledge Graph từ tài liệu học thuật tiếng Việt.
        Phân tích đoạn văn và trả về JSON chuẩn. KHÔNG thêm text ngoài JSON.
        Schema: {
          "entities": [{"id": str, "label": str, "type": "concept|person|formula|term", "definition": str}],
          "relations": [{"from": str, "to": str, "type": "depends_on|inherits|contrasts|defines|uses", "context": str}]
        }
USER:   [Chunk văn bản #{chunk_id}, trang {page_num}]
        {chunk_text}
```

#### GraphRAG Answer Generation (Streaming)
```
SYSTEM: Bạn là trợ lý tri thức. Trả lời CHÍNH XÁC dựa trên context được cung cấp.
        Nếu context không đủ, nói rõ "Tôi không tìm thấy thông tin này trong tài liệu".
        Mỗi luận điểm PHẢI kèm trích dẫn: [Trang X, Tài liệu Y].
CONTEXT (từ Knowledge Graph + Vector Search):
  {retrieved_chunks_with_citations}
  {graph_reasoning_path}
USER:   {user_question}
```

#### Tóm tắt tài liệu
```
SYSTEM: Bạn là trợ lý học thuật chuyên tóm tắt tài liệu đại học tiếng Việt. 
        Luôn giữ nguyên thuật ngữ chuyên ngành. Định dạng output là Markdown chuẩn.
USER:   [Chế độ tóm tắt: TL;DR / Bullet Points]
        [Nội dung tài liệu đã trích xuất]
```

#### Sinh Mindmap JSON
```
SYSTEM: Phân tích cấu trúc kiến thức và trả về JSON theo schema sau. 
        KHÔNG thêm bất kỳ text nào ngoài JSON.
        Schema: { nodes: [{id, label, level, definition, example}], edges: [{from, to, label}] }
USER:   [Bản tóm tắt đã được xử lý]
```

#### Sinh Quiz JSON
```
SYSTEM: Sinh [N] câu hỏi trắc nghiệm cấp độ [Bloom Level] từ nội dung sau.
        Trả về JSON array. Không thêm text ngoài JSON.
        Schema: [{ question, options: [4 strings], correctIndex: 0-3, explanation, source_chunk_id }]
USER:   [Nội dung tài liệu / tóm tắt]
```

### 📊 Evaluation Strategy

| Chỉ số | Phương pháp đánh giá | Ngưỡng chấp nhận |
|--------|---------------------|-----------------|
| **Hallucination rate** | 2 reviewers check 100 câu trả lời/sprint so với tài liệu gốc | ≤ 2% |
| **Citation accuracy** | Verify trích dẫn trang/chunk với ground truth | ≥ 95% chính xác |
| **Quiz accuracy** | 2 reviewers độc lập đánh giá 200 câu/sprint | ≥ 85% câu đúng về mặt học thuật |
| **Summarization relevance** | ROUGE-L score so với reference summaries | ≥ 0.45 |
| **Graph schema validity** | Unit test validate JSON schema Entity/Relation tự động | 100% parse thành công |
| **OCR accuracy (PaddleOCR)** | Character Error Rate trên 50 trang scan tiếng Việt | ≤ 8% CER (≥ 92% acc) |
| **Embedding retrieval quality** | Recall@10 trên benchmark 200 câu hỏi | ≥ 80% |
| **Pipeline latency (P95)** | Monitoring production | OCR+Graph < 15s; Query < 3s |

---

## 4. Technical Specifications

### 🏗️ Architecture Overview

```
╔══════════════════════════════════════════════════════════════════╗
║          CLIENT LAYER (Web + Mobile)                             ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │  Next.js 15 (React 19) – Web Dashboard (SSR/SSG)        │   ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │   ║
║  │  │Auth/Login│ │KnowledgeG│ │StudyGroup│ │Quiz Battle│  │   ║
║  │  │          │ │raph View │ │          │ │(Realtime) │  │   ║
║  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │   ║
║  │  Cytoscape.js / Vis.js / D3.js (Graph Visualization)    │   ║
║  │  IndexedDB (Offline Cache & Sync Queue)                  │   ║
║  └───────────────────────┬─────────────────────────────────┘   ║
║                           │ Capacitor Bridge                     ║
║  ┌────────────────────────▼────────────────────────────────┐   ║
║  │  Android APK / iOS App (via Capacitor)                  │   ║
║  │  Google ML Kit (On-Device OCR – Camera, offline)        │   ║
║  └─────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
                           │ HTTPS / WebSocket
╔══════════════════════════▼═══════════════════════════════════════╗
║          API GATEWAY LAYER                                       ║
║  Next.js 15 API Routes (Auth middleware, Proxy, Rate Limit)     ║
╚══════════════════════════╦═══════════════════════════════════════╝
                           │
        ┌──────────────────▼──────────────────────┐
        │         FastAPI Backend (Python)          │
        │  ┌─────────────┐  ┌───────────────────┐  │
        │  │ Doc Pipeline│  │ Query Engine       │  │
        │  │ (Async)     │  │ (GraphRAG)         │  │
        │  │ ┌─────────┐ │  │ ┌───────────────┐ │  │
        │  │ │PaddleOCR│ │  │ │Vector Search  │ │  │
        │  │ │Chunking │ │  │ │(pgvector ANN) │ │  │
        │  │ │Embedding│ │  │ │Graph Expand   │ │  │
        │  │ │GraphBuild│ │  │ │(Neo4j Cypher) │ │  │
        │  │ └─────────┘ │  │ │Gemini Stream  │ │  │
        │  └──────┬──────┘  │ └───────────────┘ │  │
        │         │ Celery  └────────────────────┘  │
        │         │ + Redis (Task Queue)              │
        └─────────┬─────────────────────┬────────────┘
                  │                     │
     ┌────────────▼──────┐  ┌───────────▼──────────────┐
     │  AI Services       │  │  Data Layer               │
     │  Gemini 2.5 Flash  │  │  ┌─────────────────────┐ │
     │  (LLM + Struct.    │  │  │ PostgreSQL + pgvector│ │
     │   JSON Output)     │  │  │ (chunks + embeddings)│ │
     │  Gemini Embedding  │  │  └─────────────────────┘ │
     │  (text-emb-004)    │  │  ┌─────────────────────┐ │
     │  PaddleOCR v4/v5   │  │  │ Neo4j Graph DB       │ │
     └────────────────────┘  │  │ (Knowledge Graph)    │ │
                             │  └─────────────────────┘ │
                             │  ┌─────────────────────┐ │
                             │  │ Supabase             │ │
                             │  │ Auth + Storage +     │ │
                             │  │ Realtime (WS)        │ │
                             │  └─────────────────────┘ │
                             └───────────────────────────┘
```

### 📦 Data Models

> **Ghi chú phân tách DB:**
> - Bảng có `-- [PG]` → PostgreSQL + pgvector
> - Bảng có `-- [NEO4J]` → Neo4j Graph Database (Cypher schema)
> - Bảng có `-- [SUPA]` → Supabase PostgreSQL (Auth, Groups, Quiz)

#### `users` -- [SUPA]
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
email        VARCHAR(255) UNIQUE NOT NULL
display_name VARCHAR(100) NOT NULL
avatar_url   TEXT
provider     ENUM('google', 'email') NOT NULL
created_at   TIMESTAMPTZ DEFAULT NOW()
last_active  TIMESTAMPTZ
```

#### `documents` -- [PG]
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_id     UUID NOT NULL                     -- FK → users.id
title        VARCHAR(500) NOT NULL
file_url     TEXT                              -- Supabase Storage path
page_count   INT
status       TEXT CHECK (status IN ('uploading','ocr_processing','graph_building','ready','failed'))
summary_md   TEXT                              -- Markdown tóm tắt
mindmap_json JSONB                             -- Tree hierarchy JSON
created_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `document_chunks` -- [PG + pgvector]
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
document_id  UUID REFERENCES documents(id) ON DELETE CASCADE
chunk_index  INT NOT NULL                      -- Thứ tự chunk trong document
page_number  INT NOT NULL                      -- Số trang trong file gốc
section_title TEXT                             -- Tên mục/heading cha
content      TEXT NOT NULL                     -- Nội dung chunk (≈512 tokens)
embedding    vector(768)                       -- Gemini text-embedding-004
created_at   TIMESTAMPTZ DEFAULT NOW()

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### Knowledge Graph Nodes -- [NEO4J]
```cypher
// Node Schema
(:KnowledgeNode {
  id:          String,       // UUID
  label:       String,       // Tên thực thể / khái niệm
  type:        String,       // concept | formula | person | term | event
  definition:  String,       // Định nghĩa ngắn
  example:     String,       // Ví dụ minh họa
  doc_id:      String,       // UUID tài liệu nguồn
  chunk_id:    String,       // UUID chunk nguồn
  page_number: Integer,      // Số trang tài liệu gốc
  created_at:  DateTime
})
```

#### Knowledge Graph Edges -- [NEO4J]
```cypher
// Relationship Schema
(a:KnowledgeNode)-[:RELATION {
  type:    String,  // depends_on | inherits | contrasts | defines | uses | causes
  context: String,  // Đoạn văn nguồn làm bằng chứng
  weight:  Float    // Confidence score từ Gemini
}]->(b:KnowledgeNode)

// Indexes
CREATE INDEX FOR (n:KnowledgeNode) ON (n.doc_id);
CREATE INDEX FOR (n:KnowledgeNode) ON (n.label);
```

#### `study_groups` -- [SUPA]
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
name         VARCHAR(200) NOT NULL
group_code   CHAR(6) UNIQUE NOT NULL
host_id      UUID REFERENCES users(id)
member_count INT DEFAULT 1
created_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `group_documents` -- [SUPA]
```sql
id           UUID PRIMARY KEY
group_id     UUID REFERENCES study_groups(id)
document_id  UUID REFERENCES documents(id)
uploaded_by  UUID REFERENCES users(id)
ai_processed BOOLEAN DEFAULT FALSE
processed_at TIMESTAMPTZ
```

#### `quiz_questions` -- [SUPA]
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
document_id     UUID REFERENCES documents(id)
chunk_id        UUID                              -- FK → document_chunks.id
question        TEXT NOT NULL
options         JSONB NOT NULL                    -- ["A","B","C","D"]
correct_idx     SMALLINT NOT NULL                 -- 0-3
explanation     TEXT NOT NULL
bloom_level     TEXT CHECK (bloom_level IN ('remember','understand','apply'))
source_page     INT                               -- Trang tài liệu gốc
created_at      TIMESTAMPTZ DEFAULT NOW()
```

#### `battle_rooms` -- [SUPA]
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
group_id     UUID REFERENCES study_groups(id)
host_id      UUID REFERENCES users(id)
pin_code     VARCHAR(6) NOT NULL
quiz_ids     UUID[] NOT NULL
status       TEXT CHECK (status IN ('waiting','playing','finished'))
time_per_q   SMALLINT DEFAULT 15
current_q    SMALLINT DEFAULT 0
created_at   TIMESTAMPTZ DEFAULT NOW()
```

#### `battle_scores` -- [SUPA]
```sql
room_id      UUID REFERENCES battle_rooms(id)
user_id      UUID REFERENCES users(id)
question_idx SMALLINT NOT NULL
answer_idx   SMALLINT
is_correct   BOOLEAN
response_ms  INT
points       INT DEFAULT 0
PRIMARY KEY (room_id, user_id, question_idx)
```

### 🔌 Integration Points

| Service | Layer | Mục đích | Auth Method | Giới hạn / Notes |
|---------|-------|----------|-------------|-------------------|
| **Google Gemini 2.5 Flash** | Backend (FastAPI) | Entity extraction (JSON), GraphRAG answer streaming, summarization, quiz generation | API Key (server-side only) | 15 RPM (free), 1000 RPM (paid); Token budget ≤ 128K/request |
| **Gemini text-embedding-004** | Backend (FastAPI) | Chuyển chunks → Vector 768D | API Key (server-side) | 1500 RPM; batch embed để tối ưu |
| **PaddleOCR v4/v5** | Backend (FastAPI) | OCR đa tiến trình tiếng Việt: PDF scan, ảnh nghiêng, bảng biểu | Self-hosted Docker / API | Không giới hạn (self-hosted); fallback Cloud nếu cần |
| **Neo4j Aura** | Backend (FastAPI) | Knowledge Graph storage & Cypher query (multi-hop reasoning) | Username + Password (encrypted) | Free tier: 200K nodes; Pro: unlimited |
| **PostgreSQL + pgvector** | Backend (FastAPI) | Document chunks + Vector ANN search | Connection string (env) | Supabase managed: 500MB free |
| **Google ML Kit** | Client (Capacitor) | On-device OCR từ Camera – hoàn toàn offline | SDK (bundle vào app) | Unlimited, on-device |
| **Cytoscape.js / Vis.js** | Frontend (Next.js) | Render và tương tác Knowledge Graph 2D/3D | NPM package | Client-side only |
| **Supabase Auth** | Next.js API Routes | OAuth2 Google + Email/Password, session JWT | Anon Key + Service Key | N/A |
| **Supabase Storage** | Backend / Client | Lưu file PDF/ảnh gốc, signed URL | Service Role Key | 1GB free; auto-delete sau 24h |
| **Supabase Realtime** | Client (Next.js/Capacitor) | Quiz Battle: player list, câu hỏi, leaderboard sync | Anon Key + RLS | 200 concurrent connections free |
| **Celery + Redis** | Backend (FastAPI) | Async task queue: OCR + Graph pipeline background jobs | Internal | Redis 25MB free (Upstash) |
| **IndexedDB** | Client (Browser/Capacitor) | Offline cache: graph JSON, chunks, sync queue | Browser API | ~50MB per origin |

### 🔐 Security & Privacy

#### Xác thực & Phân quyền
- JWT access token: TTL 1 giờ; Refresh token: TTL 30 ngày (Supabase Auth)
- Supabase Row Level Security (RLS) bắt buộc trên tất cả bảng Supabase
- Neo4j: Mỗi query đều kèm `doc_id` filter – user chỉ đọc được graph của document mình sở hữu hoặc nhóm mình thuộc
- pgvector: WHERE clause filter theo `owner_id` / `group_id` trước khi ANN search

#### Bảo mật API & Dữ liệu
- **Gemini API Key & Neo4j credentials**: KHÔNG nhúng vào client app – chỉ gọi qua FastAPI backend (server-side)
- File PDF/ảnh gốc lưu Supabase Storage với signed URL (TTL 1 giờ/link); **tự động xóa file gốc sau 24h** sau khi pipeline hoàn tất
- Token lưu client: **Capacitor SecureStore** (iOS Keychain / Android Keystore) – mã hóa AES-256
- IndexedDB content: Chỉ lưu processed chunks và graph JSON (không lưu file nhị phân gốc)
- HTTPS/TLS 1.3 bắt buộc cho mọi API call; WebSocket với wss://

#### Tuân thủ
- PDPA (Personal Data Protection Act – Vietnam) compliance
- Người dùng có quyền xóa toàn bộ dữ liệu (Right to Erasure): xóa cascade users → documents → chunks → graph nodes/edges
- **Không** dùng dữ liệu người dùng để train/fine-tune model
- Audit log cho mọi hành động xử lý AI (ai xử lý, lúc nào, tài liệu nào)

---

## 5. Risks & Roadmap

### 🗺️ Phased Rollout

#### Phase 1 – MVP (Tháng 1–2)
**Mục tiêu**: Kiểm chứng core value proposition với ~50 sinh viên beta

| Feature | Priority | Effort |
|---------|----------|--------|
| Authentication (Email + Google) | 🔴 P0 | M |
| Upload & AI Summarization (PDF) | 🔴 P0 | L |
| Chat AI (text only) | 🔴 P0 | M |
| Tủ sách cá nhân (offline) | 🔴 P0 | S |
| Study Group (tạo/gia nhập/chia sẻ tóm tắt) | 🔴 P0 | L |

#### Phase 2 – v1.1 (Tháng 3–4)
**Mục tiêu**: Tăng engagement, thêm gamification

| Feature | Priority | Effort |
|---------|----------|--------|
| Mindmap Generator | 🟠 P1 | L |
| Personal Quiz (thi + luyện tập) | 🟠 P1 | L |
| Camera OCR input | 🟠 P1 | M |
| Sổ tay câu sai | 🟠 P1 | S |
| Chat Multimodal (ảnh) | 🟠 P1 | M |

#### Phase 3 – v2.0 (Tháng 5–6)
**Mục tiêu**: Real-time gamification, scale lên 10,000 users

| Feature | Priority | Effort |
|---------|----------|--------|
| Real-time Quiz Battle | 🟡 P2 | XL |
| Live Leaderboard | 🟡 P2 | L |
| Battle History & Analytics | 🟡 P2 | M |
| Push Notifications (study reminders) | 🟡 P2 | M |
| SRS (Spaced Repetition System) | 🟡 P2 | L |

---

### ⚠️ Technical Risks

| # | Rủi ro | Khả năng | Tác động | Chiến lược giảm thiểu |
|---|--------|----------|----------|-----------------------|
| 1 | **Gemini API latency / quota** trong giờ cao điểm | Trung bình | Cao | Cache embedding + graph kết quả; Retry exponential backoff; One-time processing cho nhóm; Cost alert budget |
| 2 | **Neo4j Aura free tier giới hạn** (200K nodes) khi scale | Trung bình | Cao | Prune graph nodes cũ; Nâng cấp lên Pro; Hoặc self-host Neo4j Community |
| 3 | **pgvector ANN search chậm** khi embedding table > 1M rows | Trung bình | Cao | IVFFlat index; Partition by doc_id; Cân nhắc migrate sang Pinecone/Qdrant nếu cần |
| 4 | **PaddleOCR chất lượng thấp** với ảnh mờ/nghiêng/phức tạp | Cao | Trung bình | Pre-process: deskew + denoise ảnh trước khi OCR; User preview + confirm trước pipeline; Fallback Google ML Kit |
| 5 | **Gemini JSON output không hợp lệ** (hallucinated schema) | Trung bình | Trung bình | Structured JSON Output mode (Gemini API); JSON schema validation + repair; Retry ≤ 3 lần |
| 6 | **Supabase Realtime disconnect** trong Quiz Battle | Trung bình | Cao | Auto-reconnect WebSocket; Server-side timer là source of truth; Graceful degradation (disable battle, không crash) |
| 7 | **IndexedDB quota exceeded** trên thiết bị lưu trữ thấp | Thấp | Trung bình | Eviction policy: xóa graph cũ nhất khi > 80% quota; Cảnh báo user |
| 8 | **Capacitor Bridge latency** (JS ↔ Native) cho OCR camera | Thấp | Thấp | Dùng ML Kit native plugin trực tiếp; Tránh gọi bridge > 30fps |
| 9 | **File PDF mã hóa / password-protected** | Cao | Trung bình | Detect trước khi xử lý; Yêu cầu user nhập password hoặc export PDF không khóa |

---

### 📋 Appendix: Definition of Done (DoD)

Một feature được coi là **Done** khi:

- [ ] Code review được approve bởi ≥ 1 peer
- [ ] Unit tests coverage ≥ 70% cho business logic
- [ ] Integration test pass trên staging environment
- [ ] Performance benchmark đạt ngưỡng đã định (xem Success Criteria)
- [ ] Không có lỗi crash trên physical device (Android mid-range + iPhone 12)
- [ ] UI/UX được review theo design system
- [ ] Tài liệu API/Component được cập nhật

---

*PRD này được tạo theo JTBD (Jobs-To-Be-Done) framework, phục vụ cho quá trình phát triển DocuGraph AI v1.0 → v2.0. Mọi thay đổi phải được phê duyệt bởi Product Owner trước khi cập nhật.*

---

## 6. Tech Stack Summary Card

| Tier | Công nghệ | Vai trò |
|------|-----------|----------|
| **Web Frontend** | Next.js 15 + React 19 | Dashboard, SSR, SEO |
| **Mobile Shell** | Capacitor | Android APK + iOS từ Next.js |
| **On-device AI** | Google ML Kit | OCR Camera offline |
| **Graph UI** | Cytoscape.js / Vis.js / D3.js | Knowledge Graph visualization |
| **Offline Cache** | IndexedDB | Sync queue + offline graph/docs |
| **Backend** | FastAPI (Python 3.11) | Pipeline OCR→Embed→Graph, GraphRAG query |
| **Auth/Proxy** | Next.js API Routes | Session, phân quyền |
| **Task Queue** | Celery + Redis | Async background pipeline jobs |
| **OCR (Cloud)** | PaddleOCR v4/v5 | Tiếng Việt, scan mờ, bảng biểu |
| **LLM** | Gemini 2.5 Flash | Extraction, RAG answer, Quiz, Summary |
| **Embedding** | Gemini text-embedding-004 | Vector 768D semantic search |
| **Graph DB** | Neo4j Aura | Knowledge Graph, multi-hop reasoning |
| **Vector DB** | PostgreSQL + pgvector | Chunks + ANN embedding search |
| **App DB** | Supabase PostgreSQL | Users, Groups, Quiz, Scores |
| **File Storage** | Supabase Storage | PDF/ảnh gốc (xóa sau 24h) |
| **Auth** | Supabase Auth | OAuth2 Google + Email/Password |
| **Realtime** | Supabase Realtime | Quiz Battle WebSocket sync |
