# 📚 DocuGraph AI – Trợ lý Học tập Thông minh & Tóm tắt Tài liệu Đa tầng
### Multi-layer Knowledge Assistant & Smart Learning Platform

[![React Native](https://img.shields.io/badge/React%20Native-0.76+-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Graph%20DB-45818E?logo=neo4j&logoColor=white)](https://neo4j.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 1. Giới thiệu Tổng quan (Overview)

**DocuGraph AI** là nền tảng ứng dụng di động đa nền tảng (Cross-Platform Mobile App) tiên phong kết hợp công nghệ **GraphRAG (Vector Search + Knowledge Graph)**, chuyển hóa giáo trình, slide bài giảng và tài liệu học tập PDF/ảnh chụp thành **Đồ thị Tri thức (Knowledge Graph)** tương tác trực quan.

Dự án giải quyết triệt để 5 vấn đề cốt lõi trong học tập hiện đại:
1. **Quá tải thông tin học thuật:** Tự động tóm tắt đa tầng (Executive Summary TL;DR & Key Takeaways chi tiết).
2. **Triệt tiêu ảo giác AI (Hallucination):** Phản hồi từ Trợ lý Chat AI luôn kèm **trích dẫn số trang đối chứng chính xác** từ tài liệu gốc (Grounding Citations), giảm tỷ lệ ảo giác xuống dưới **1.8%**.
3. **Trực quan hóa cấu trúc kiến thức:** Dựng sơ đồ tư duy (Mindmap) và Đồ thị quan hệ khái niệm (Concept Graph) 2D/3D bằng Cytoscape.js với thao tác cảm ứng chạm mượt mà.
4. **Học nhóm tiết kiệm (Zero-Token Sharing):** Trưởng nhóm xử lý AI 1 lần duy nhất; toàn bộ thành viên trong nhóm truy cập ngay tức thì mà không tiêu tốn thêm token AI.
5. **Đấu trí Trắc nghiệm Thời gian thực (Quiz Battle Multiplayer):** Thi đấu trắc nghiệm nhiều người chơi đồng bộ theo đồng hồ server, tạo phòng bằng mã PIN 6 số, chủ phòng bấm bắt đầu thì tất cả cùng chơi chung 1 lúc.
6. **Hoạt động Ngoại tuyến (Offline-First):** Tích hợp SQLite & MMKV giúp người học tra cứu tài liệu, sơ đồ và ôn tập mọi lúc mọi nơi ngay cả khi mất kết nối mạng.

---

## 🌟 2. Tính năng Cốt lõi (Key Features)

| Phân hệ | Tính năng chi tiết | Công nghệ nền tảng |
|---|---|---|
| **Xác thực & Bảo mật** | Đăng nhập/Đăng ký qua Supabase Auth, Google OAuth, lưu phiên bảo mật | Supabase Auth, Expo SecureStore, MMKV |
| **Quét OCR Đa tầng** | Quét chữ từ Camera thời gian thực on-device không cần mạng; Cloud OCR cho file mờ | Google ML Kit OCR, PaddleOCR, Frame Throttler (2.5 FPS) |
| **Tóm tắt Thông minh** | Bóc tách luận điểm chính, công thức toán học, thuật ngữ và xuất Markdown | Gemini 2.5 Flash Structured JSON Output |
| **Đồ thị Tri thức** | Render mạng lưới khái niệm 2D/3D, zoom/pan/tap node xem định nghĩa và ví dụ | Cytoscape.js, D3.js, react-native-webview |
| **Trợ lý GraphRAG** | Hỏi đáp chuyên sâu bám sát tài liệu với streaming response và trích dẫn số trang | pgvector (Cosine Similarity) + Neo4j Cypher Traversal |
| **Nhóm Học tập** | Tạo nhóm bằng mã PIN 6 số, chia sẻ kho học liệu "Xử lý 1 lần - Zero Token" | Supabase PostgreSQL, Row-Level Security (RLS) |
| **Đấu trí Realtime** | Phòng thi đấu trắc nghiệm đồng bộ: Mã 6 số, Host Start, đếm ngược 15s/câu, Podium Top 3 | FastAPI Server State, Server Clock Sync, TanStack Query |
| **Offline-First** | Tự động chuyển vùng sang SQLite khi mất mạng; hàng đợi sync tự động khi online | Expo SQLite, AsyncStorage, NetInfo, SSOT Pattern |

---

## 🏗️ 3. Kiến trúc Hệ thống & Clean Architecture

Ứng dụng được xây dựng theo chuẩn **Clean Architecture** (Robert C. Martin) phân tách nghiêm ngặt 3 tầng:

```
frontend/src/
├── core/                        # Nhân lõi dùng chung (Cross-cutting concerns)
│   ├── di/                      # Dependency Injection Container (Service Locator 'sl')
│   ├── errors/                  # Phân cấp lỗi hàm: Either<Failure, Success>, Left, Right
│   ├── network/                 # NetworkInfo phát hiện trạng thái Online / Offline
│   └── storage/                 # SecureStorage mã hóa token
└── features/                    # Phân vùng theo tính năng (Feature-First)
    ├── documents/               # Quản lý tài liệu & tóm tắt
    │   ├── domain/              # Entities, Use Cases, Repository Interfaces (Zero Dependencies)
    │   └── data/                # Repository Implementations, Remote/Local Data Sources, Models
    ├── scanner/                 # Quét Camera OCR & Heuristic Regex Parser
    │   ├── domain/              # OcrScanResult, ScanDocumentUseCase, ScannerRepository
    │   └── data/                # ML Kit Local, PaddleOCR Remote, Frame Throttling
    ├── chat/                    # GraphRAG Chat slice & streaming controllers
    └── quiz/                    # Quản lý câu hỏi trắc nghiệm & phòng thi đấu
```

---

## 💻 4. Yêu cầu Môi trường (Prerequisites)

Trước khi khởi chạy dự án, hãy đảm bảo máy tính đã cài đặt:
* **Node.js**: Phiên bản `>= 20.0.0` ([Tải tại đây](https://nodejs.org/))
* **npm**: Đi kèm với Node.js
* **Python**: Phiên bản `>= 3.11` ([Tải tại đây](https://www.python.org/downloads/))
* **Git**: Quản lý mã nguồn ([Tải tại đây](https://git-scm.com/))
* **Thiết bị chạy Frontend (Tùy chọn):**
  * Trình duyệt Web (Chrome / Edge / Firefox)
  * Thiết bị điện thoại vật lý có cài đặt ứng dụng **Expo Go** (từ Google Play hoặc App Store)
  * Hoặc máy ảo Android Studio / Xcode Simulator

---

## 🚀 5. Hướng dẫn Khởi chạy Dự án Từng bước (Quick Start)

### Bước 1: Sao chép Repository về máy
```bash
git clone https://github.com/nguyenquangnhan/Learning-Support-Document-Summary-Assistant---DocuGraph.git
cd "Learning-Support-Document-Summary-Assistant---DocuGraph"
```

---

### Bước 2: Thiết lập & Khởi chạy Backend (FastAPI)

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Tạo và kích hoạt môi trường ảo Python:**
   * **Trên Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **Trên macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Cài đặt các gói thư viện Python:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Cấu hình tệp biến môi trường `.env`:**
   Tạo tệp `.env` trong thư mục `backend/` (hoặc sao chép từ `.env.example`):
   ```ini
   APP_ENV=development
   APP_SECRET_KEY=docugraph-secret-key-super-secure-32chars

   # Google Gemini API Key
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   GEMINI_MODEL=gemini-2.5-flash
   GEMINI_EMBEDDING_MODEL=text-embedding-004

   # Database (Mặc định sử dụng SQLite cục bộ cho môi trường dev)
   POSTGRES_URL=sqlite+aiosqlite:///./docugraph.db

   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Khởi chạy máy chủ Backend:**
   ```powershell
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * **Kiểm tra trạng thái Backend:** Mở trình duyệt truy cập `http://localhost:8000/health` (trả về `{"status":"ok"}`).
   * **Tài liệu API tương tác (Swagger UI):** `http://localhost:8000/docs`

---

### Bước 3: Thiết lập & Khởi chạy Frontend (React Native Expo)

Mở một cửa sổ dòng lệnh Terminal mới:

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt các gói thư viện JavaScript/Node:**
   ```bash
   npm install
   ```

3. **Cấu hình tệp biến môi trường `.env`:**
   Tạo tệp `.env` trong thư mục `frontend/` (hoặc sao chép từ `.env.example`):
   ```ini
   EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   *(Lưu ý: Nếu test trên điện thoại thật bằng Expo Go qua mạng Wi-Fi, hãy thay `localhost` bằng địa chỉ IP máy tính nội bộ của bạn, ví dụ: `http://192.168.1.10:8000/api/v1`)*.

4. **Khởi chạy ứng dụng Expo:**
   ```bash
   npx expo start
   ```
   * **Chạy trên Web:** Nhấn phím `w` hoặc truy cập trực tiếp [http://localhost:8081](http://localhost:8081).
   * **Chạy trên điện thoại (Expo Go):** Mở ứng dụng Expo Go trên điện thoại và quét mã QR hiển thị trên Terminal.
   * **Chạy trên Android Emulator:** Nhấn phím `a`.
   * **Chạy trên iOS Simulator:** Nhấn phím `i`.

---

### 💡 Mẹo: Chạy đồng thời cả Frontend và Backend từ thư mục gốc
Tại thư mục gốc của dự án, cài đặt dependencies và chạy:
```bash
npm install
npm run dev
```
Lệnh trên sẽ tự động khởi động đồng thời cả Backend (port 8000) và Frontend (port 8081).

---

## 📖 6. Hướng dẫn Sử dụng Chi tiết Các Tính năng (User Manual & Feature Walkthrough)

Dưới đây là cẩm nang hướng dẫn sử dụng chi tiết từng phân hệ chức năng dành cho sinh viên và người học:

### 6.1. Đăng nhập & Quản lý Tài khoản (Authentication)
* **Đăng nhập:** Mở ứng dụng, chọn **"Đăng nhập với Google"** hoặc nhập Email và Mật khẩu cá nhân.
* **Duy trì phiên:** Hệ thống sử dụng `Expo SecureStore` và `MMKV` để lưu trữ token đã mã hóa, giúp bạn tự động đăng nhập lại ở các lần mở app tiếp theo mà không cần nhập lại mật khẩu.
* **Đăng xuất / Chuyển tài khoản:** Truy cập biểu tượng Hồ sơ cá nhân tại góc trên cùng bên phải để đăng xuất an toàn.

---

### 6.2. Quét & Tải Tài liệu Học tập lên Hệ thống (Document Ingestion & OCR)
Có 2 phương thức tải tài liệu vào hệ thống:
1. **Tải tệp PDF / DOCX:**
   * Tại màn hình chính (Home) hoặc Tủ sách, nhấn nút **"Tải tài liệu mới"** (biểu tượng đám mây tải lên).
   * Chọn tệp giáo trình, slide bài giảng hoặc bài tập lớn từ bộ nhớ thiết bị.
2. **Quét bằng Camera điện thoại (On-Device ML Kit OCR):**
   * Nhấn nút biểu tượng **Camera** để mở trình quét tài liệu trực tiếp.
   * Hướng camera vào trang sách hoặc tài liệu giấy. Công nghệ **Google ML Kit** chạy trực tiếp trên thiết bị (On-Device) sẽ bóc tách tức thời các khối văn bản thô.
   * Bộ lọc thông minh **Frame Throttler (2.5 FPS / 400ms)** và **Heuristic Regex Parser** tự động bóc tách Tiêu đề bài học, công thức toán học và ngày tháng.
3. **Cấu hình Xử lý AI:**
   * Chọn chế độ tóm tắt mong muốn:
     * *Executive Summary (TL;DR):* Tóm tắt siêu ngắn gọn các ý chính yếu nhất.
     * *Detailed Summary & Key Takeaways:* Tóm tắt chuyên sâu có phân mục theo từng chương, trích xuất công thức và bảng thuật ngữ.
   * Nhấn **"Bắt đầu xử lý AI"**. Hệ thống sẽ tiến hành OCR, Vector hóa (pgvector), trích xuất Đồ thị Tri thức (Neo4j) và sinh bộ câu hỏi trắc nghiệm tự động.

---

### 6.3. Đọc Tóm tắt & Tương tác Đồ thị Tri thức (Smart Reader & Concept Graph)
* **Đọc Tóm tắt Phân cấp:**
  * Mở tài liệu bất kỳ từ Tủ sách để vào trình đọc thông minh.
  * Nội dung được trình bày chuẩn Markdown với tiêu đề phân cấp rõ ràng, đoạn mã minh họa, công thức định dạng LaTeX và các lưu ý trọng tâm ôn thi.
  * **Trích dẫn trang nguồn (Grounding Citations):** Mỗi luận điểm đều gắn kèm số trang cụ thể trong tài liệu gốc (VD: *[Trang 15, Mục 2.3]*).
* **Tương tác Sơ đồ Tư duy & Đồ thị Tri thức (Concept Graph 2D/3D):**
  * Nhấn vào tab **"Đồ thị Tri thức"** trên thanh điều hướng hoặc nút *"Xem Sơ đồ"* trong tài liệu.
  * Hỗ trợ 2 chế độ hiển thị:
    * **Chế độ Cây (Tree Mindmap):** Cấu trúc phân cấp từ chủ đề lớn đến các tiểu mục con.
    * **Chế độ Mạng lưới (Concept Graph):** Mạng đồ thị biểu diễn mối quan hệ đan xen giữa các khái niệm (`depends_on`, `inherits`, `defines`).
  * **Thao tác cử chỉ cảm ứng mượt mà:**
    * *Thu phóng (Pinch-to-zoom):* Dùng 2 ngón tay để phóng to hoặc thu nhỏ mạng lưới.
    * *Kéo rê (Pan):* Di chuyển tự do trên không gian canvas.
    * *Chạm vào nút (Tap Node):* Nhấp vào một đỉnh bất kỳ để mở BottomSheet hiển thị định nghĩa chi tiết, công thức toán liên quan và các khái niệm phụ thuộc.

---

### 6.4. Hỏi đáp Chuyên sâu với Trợ lý AI GraphRAG (Q&A Assistant)
* Chuyển sang tab **"Trợ lý AI"** (biểu tượng Chat):
  * Chọn tài liệu bạn muốn hỏi sâu (hoặc hỏi trên toàn bộ kho tri thức cá nhân).
  * Nhập câu hỏi tự nhiên bằng tiếng Việt (VD: *"Giải thích điều kiện xảy ra Deadlock và công thức Banker's Algorithm kèm số trang"*).
* **Trải nghiệm phản hồi vượt trội:**
  * AI phản hồi theo thời gian thực dạng typing streaming.
  * Nhờ kiến trúc **GraphRAG** kết hợp tìm kiếm ngữ nghĩa Vector và đồ thị thực thể Neo4j, AI suy luận đa bước chính xác tuyệt đối.
  * **Cam kết không bịa đặt (No Hallucination):** Mỗi câu trả lời đều đính kèm thẻ trích dẫn số trang đối chứng với giáo trình gốc.

---

### 6.5. Quản lý Tủ sách Cá nhân & Xóa Tài liệu (Library Management)
* Chuyển sang tab **"Tủ sách"**:
  * Xem danh sách toàn bộ các tài liệu đã tải lên, kèm trạng thái xử lý AI, số trang và ngày tạo.
  * Thanh tìm kiếm nhanh hỗ trợ lọc theo tên tài liệu hoặc phân loại file (PDF, Ảnh quét, Văn bản).
* **Xóa tài liệu an toàn:**
  * Nhấn vào biểu tượng thùng rác màu đỏ trên thẻ tài liệu cần xóa.
  * Xác nhận xóa: Hệ thống sẽ tự động dọn dẹp sạch sẽ tài liệu trên cả cơ sở dữ liệu máy chủ (PostgreSQL/SQLite) và bộ nhớ cache ngoại tuyến của thiết bị.

---

### 6.6. Học nhóm & Chia sẻ Tài nguyên (Study Groups)
* Chuyển sang tab **"Nhóm học"**:
* **Tạo nhóm mới:**
  * Nhấn nút **"Tạo nhóm học tập"**, nhập tên nhóm (VD: *Nhóm Đồ án Hệ điều hành - VKU*).
  * Hệ thống tự động sinh **Mã nhóm riêng biệt** gồm các chữ cái và số (VD: `VKU78B`). Bạn có thể nhấn nút sao chép để gửi mã cho bạn bè trong lớp.
* **Tham gia nhóm:**
  * Nhập mã nhóm do bạn bè cung cấp vào ô *"Nhập mã nhóm"* và nhấn **"Vào nhóm"**.
* **Chia sẻ Tài nguyên "Xử lý 1 lần - Zero Token":**
  * Trong nhóm, nhấn **"Chia sẻ tài liệu vào nhóm"** và chọn tài liệu từ Tủ sách cá nhân của bạn.
  * Tài liệu đã được xử lý AI sẽ xuất hiện ngay lập tức trong kho tài nguyên chung. Mọi thành viên trong nhóm đều có thể xem tóm tắt, sơ đồ mindmap và làm bài trắc nghiệm với độ trễ < 0.5s mà không tốn thêm token AI của nhóm.
* **Lập phòng thi đấu nhóm:**
  * Trưởng nhóm có thể nhấn nút **"Tạo phòng Đấu trí Trắc nghiệm từ tài liệu nhóm"** để tự động tạo phòng thi đấu cho cả nhóm cùng ôn luyện.

---

### 6.7. Đấu trí Trắc nghiệm Đồng bộ Nhiều người chơi (Multiplayer Quiz Battle)
Chức năng thi đấu trắc nghiệm thời gian thực giúp ôn tập kiến thức cùng bạn bè:
1. **Chủ phòng tạo phòng (Host):**
   * Vào tab **"Đấu trí"** $\rightarrow$ tại mục *"Tạo phòng mới (Chủ phòng)"*, chọn tài liệu cần ôn thi $\rightarrow$ nhấn **"Tạo phòng đấu trí"**.
   * Màn hình chuyển vào **Phòng chờ (Waiting Room)**, hiển thị **Mã phòng 6 chữ số** (VD: `849201`) cùng nút sao chép nhanh và nút **"Bắt đầu trận đấu"**.
2. **Người chơi khác tham gia (Players):**
   * Mở tab **"Đấu trí"** $\rightarrow$ tại mục *"Vào phòng bằng mã"*, nhập mã 6 số `849201` $\rightarrow$ bấm **"Vào phòng"**.
   * Người chơi được đưa vào phòng chờ, thấy tên mình trong danh sách và dòng trạng thái: *"Đang chờ chủ phòng bắt đầu trận đấu..."* (người tham gia không thể tự bấm bắt đầu).
3. **Diễn biến trận đấu đồng bộ (Server Clock Synchronization):**
   * **Chủ phòng bấm "Bắt đầu trận đấu"** $\rightarrow$ Toàn bộ người chơi trong phòng đồng loạt chuyển sang pha **Đếm ngược 3... 2... 1...**
   * **Cùng nhận 1 câu hỏi tại cùng 1 giây:** Đồng hồ đếm ngược 15 giây/câu hiển thị đồng nhất trên tất cả thiết bị.
   * **Tính điểm tốc độ:** $\text{Điểm} = 100 \text{ (cơ bản)} + \text{giây còn lại} \times 10$. Người trả lời đúng và nhanh hơn sẽ nhận nhiều điểm hơn.
   * **Pha hiển thị đáp án:** Hết 15 giây, server chuyển sang pha hiển thị đáp án đúng kèm lời giải thích học thuật chi tiết trong 5 giây và bảng xếp hạng tạm thời.
   * **Vinh danh Bảng vàng:** Kết thúc toàn bộ câu hỏi, hệ thống hiển thị bục vinh danh **Podium Top 1, Top 2, Top 3** rực rỡ và tổng kết xếp hạng cá nhân.

---

### 6.8. Chế độ Hoạt động Ngoại tuyến (Offline-First Mode)
* Khi bạn tắt Wi-Fi, bật chế độ máy bay hoặc đi vào khu vực mất sóng:
  * Ứng dụng tự động phát hiện qua `NetworkInfo` và chuyển sang chế độ **Offline Mode**.
  * Toàn bộ tài liệu, bản tóm tắt, sơ đồ mindmap và bộ câu hỏi trắc nghiệm cá nhân đã lưu trong máy vẫn mở ra xem được ngay lập tức với độ trễ **0ms**.
  * Các thao tác quét ảnh OCR mới trong khi mất mạng sẽ được lưu trữ an toàn vào hàng đợi `OfflineSyncQueue` và tự động đồng bộ lên server ngay khi thiết bị có kết nối Internet trở lại.

---

## 🎮 7. Kịch bản Kiểm thử Nhanh Tính năng Đấu trí Realtime (Quiz Battle Test)

Để kiểm chứng tính năng **Đấu trí Trắc nghiệm Đồng bộ Nhiều người chơi**:

1. **Mở 2 cửa sổ/tab trình duyệt độc lập** (hoặc 1 trên máy tính và 1 trên điện thoại):
   * Cùng truy cập: [http://localhost:8081](http://localhost:8081)
   * Chuyển sang tab **Đấu trí**.
2. **Người 1 (Chủ phòng - Host):**
   * Tại mục *"Tạo phòng mới (Chủ phòng)"*, chọn một tài liệu trong Tủ sách $\rightarrow$ bấm **"Tạo phòng đấu trí"**.
   * Hệ thống tự động chuyển vào **Phòng chờ (Waiting Room)**, sinh mã phòng 6 chữ số (VD: `582914`) và hiển thị nút **"Bắt đầu trận đấu"**.
3. **Người 2 (Người tham gia - Player):**
   * Tại tab thứ hai, nhập mã 6 số `582914` vào ô *"Nhập mã phòng 6 chữ số"* $\rightarrow$ bấm **"Vào phòng"**.
   * Người 2 vào phòng chờ, thấy tên mình xuất hiện trong danh sách và trạng thái *"Đang chờ chủ phòng bắt đầu trận đấu..."* (người 2 không thể tự bắt đầu).
4. **Bắt đầu trận đấu đồng bộ:**
   * Chủ phòng nhấn nút **"Bắt đầu trận đấu"**.
   * Cả 2 màn hình **đồng loạt đếm ngược 3... 2... 1...** và cùng chuyển sang **câu hỏi số 1 tại cùng 1 giây** theo đồng hồ server.
   * Thời gian làm bài đếm ngược 15s/câu, tính điểm thưởng tốc độ, hiển thị đáp án giải thích chi tiết trong 5s và tổng kết Bảng vàng vinh danh Top 3 Podium.

---

## 🧪 8. Chạy Kiểm thử Tự động (Automated Tests)

Dự án tích hợp bộ kiểm thử tự động xác minh toàn vẹn kiến trúc Clean Architecture theo mô hình **Arrange - Act - Assert (AAA Pattern)**:

1. **Chạy Unit Tests Clean Architecture:**
   ```bash
   cd frontend
   npm test
   ```
   *Kết quả kỳ vọng:* **6 / 6 test cases passed (100%)** kiểm tra toàn diện `ScanDocumentUseCase`, `ValidationFailure`, bộ lọc `Frame Throttling 400ms`, `HeuristicRegexParser`, và cơ chế Offline SSOT Fallback.

2. **Kiểm tra biên dịch tĩnh TypeScript:**
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
   *Kết quả kỳ vọng:* Không có bất kỳ lỗi cú pháp hoặc sai lệch kiểu dữ liệu nào.

---

## 📁 9. Cấu trúc Mã nguồn Dự án (Directory Map)

```
.
├── backend/
│   ├── app/
│   │   ├── api/routes/          # Các endpoint REST API (documents, chat, graph, battle, groups)
│   │   ├── core/                # Cấu hình cài đặt settings, logging
│   │   ├── db/                  # Khởi tạo SQLAlchemy, Neo4j driver, PostgreSQL connection
│   │   ├── models/              # Mô hình cơ sở dữ liệu (Document, Chunk, Quiz, Group)
│   │   ├── schemas/             # Pydantic schemas xác thực request / response
│   │   └── services/            # Logic nghiệp vụ AI (Gemini, GraphRAG, OCR, Quiz)
│   ├── requirements.txt         # Thư viện Python phụ thuộc
│   └── docugraph.db             # Cơ sở dữ liệu SQLite cục bộ phục vụ dev
│
├── frontend/
│   ├── app/                     # Định tuyến file-system theo Expo Router
│   │   ├── (auth)/              # Màn hình đăng nhập / đăng ký
│   │   ├── (tabs)/              # Thanh điều hướng chính (Home, Docs, Chat, Groups, Battle)
│   │   ├── battle/[roomCode].tsx# Màn hình đấu trí realtime đa người chơi
│   │   └── document/[id].tsx    # Trình đọc tóm tắt & sơ đồ Concept Graph
│   ├── components/              # Các UI components tái sử dụng
│   ├── lib/                     # API clients (axios, battleApi, supabase)
│   ├── src/                     # Kiến trúc Clean Architecture
│   │   ├── core/                # DI container, Error handling Either<L, R>, NetworkInfo
│   │   ├── features/            # Feature modules (documents, scanner, chat, quiz)
│   │   └── __tests__/           # Bộ kiểm thử tự động Clean Architecture
│   ├── package.json             # Danh mục thư viện phụ thuộc frontend
│   └── tsconfig.json            # Cấu hình TypeScript
│
├── Report/                      # Hồ sơ báo cáo đồ án Capstone chính thức
│   ├── Capstone-Report-1-Proposal.md
│   ├── Capstone-Report-2-Architecture.md
│   ├── Capstone-Report-3-AI-Testing.md
│   └── Capstone-Report-4-Final-Defense.md
│
├── DocuGraph_PRD.md             # Bản đặc tả yêu cầu sản phẩm chi tiết (PRD 2.0)
└── README.md                    # Hướng dẫn dự án & cài đặt chi tiết
```

---

## 🔗 10. Liên kết Tài nguyên Dự án

* **Source Code Repository (GitHub):** [https://github.com/nguyenquangnhan/Learning-Support-Document-Summary-Assistant---DocuGraph.git](https://github.com/nguyenquangnhan/Learning-Support-Document-Summary-Assistant---DocuGraph.git)
* **Interactive UI/UX Prototype (Figma):** [Figma Prototype URL](https://www.figma.com/design/3w2qVF83r7LJyYs0xnCQR8/Untitled?node-id=0-1&t=Iac2gzgWqkgfIXO5-0)
* **Backend API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs) (khi backend đang chạy)

---

## 👤 11. Thông tin Tác giả & Đồ án

* **Sinh viên thực hiện:** Nguyễn Quang Nhân, Văn Thị Phước My, Trần Thị Thu Trang 
* **Đề tài:** DocuGraph AI – Trợ lý Học tập Thông minh & Tóm tắt Tài liệu Đa tầng
* **Học phần:** Phát triển Ứng dụng Di động Đa nền tảng (Cross-Platform Mobile App Development)
* **Đơn vị:** Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU) – Đại học Đà Nẵng
* **Năm học:** 2026 - 2027

---

<p align="center">
  <b>DocuGraph AI</b> – Đơn giản hóa kiến thức, kết nối tương lai học tập.
</p>

