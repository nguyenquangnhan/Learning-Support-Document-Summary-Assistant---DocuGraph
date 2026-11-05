# [REPORT 1] PROJECT PROPOSAL & INTERACTIVE WIREFRAME PROTOTYPE

**Course:** Cross-Platform Mobile App Development  
**Project Title:** DocuGraph AI – Trợ lý Học tập Thông minh & Tóm tắt Tài liệu Đa tầng (Multi-layer Knowledge Assistant & Smart Learning Platform)  
**Team Name:** DocuGraph Team (Nguyễn Quang Nhân) • **Academic Term:** Semester 1 (2026 - 2027) • **Deadline:** Week 4  

---

## 1. PROJECT MOTIVATION & PROBLEM STATEMENT

### 1.1. Context & Practical Problem Space
Trong môi trường giáo dục đại học và tự nghiên cứu hiện đại, sinh viên và giảng viên đang phải đối mặt với **tình trạng quá tải thông tin (information overload)** nghiêm trọng. Mỗi học kỳ, một sinh viên tiếp nhận hàng chục bộ giáo trình dài từ 200 đến 500 trang, slide bài giảng phức tạp, bài báo nghiên cứu khoa học và các tập tài liệu dạng PDF scan. Thực trạng này dẫn đến các thách thức thực tế sau:

1. **Hiệu suất đọc và tổng hợp thấp:** Việc đọc và ghi chép thủ công tốn hàng chục giờ mỗi tuần, khiến người học dễ bỏ sót các luận điểm cốt lõi và các mối liên kết bản chất giữa các chương hồi.
2. **Ảo giác thông tin (Hallucination) từ AI truyền thống:** Khi sử dụng các mô hình ngôn ngữ lớn (LLM) phổ thông (như ChatGPT hoặc các công cụ tóm tắt cơ bản), người học thường gặp phải thông tin bịa đặt, thiếu cơ chế trích dẫn đối chiếu trang/dòng cụ thể với văn bản gốc, gây rủi ro lớn trong học thuật và thi cử.
3. **Thiếu tư duy cấu trúc đồ thị:** Kiến thức học thuật là một mạng lưới khái niệm đan xen (định nghĩa, công thức, tiên đề, quan hệ phụ thuộc/kế thừa). Các bản tóm tắt văn bản tuyến tính (linear text) thông thường không giúp người học xây dựng được mô hình tư duy trực quan (Mental Model).
4. **Lãng phí tài nguyên và chi phí trong học nhóm:** Trong các nhóm môn học, nhiều sinh viên cùng tải lên và tóm tắt lặp đi lặp lại một file giáo trình, gây lãng phí thời gian và chi phí token AI không đáng có.
5. **Thiếu sự hứng thú và kiểm chứng kiến thức tức thì:** Ôn tập thụ động một mình dễ gây nhàm chán; người học thiếu công cụ trắc nghiệm tương tác thời gian thực để tự đánh giá năng lực so với bạn bè cùng lớp.

**DocuGraph AI** ra đời nhằm giải quyết triệt để các vấn đề trên bằng cách xây dựng một ứng dụng di động đa nền tảng kết hợp công nghệ **GraphRAG (Vector Search + Knowledge Graph)**, chuyển hóa tài liệu thô thành đồ thị tri thức sống động, có trích dẫn chính xác, hỗ trợ học tập cộng tác và ôn luyện tương tác ngoại tuyến.

---

### 1.2. Target User Personas

#### Persona 1 (Primary Persona) – Sinh viên chuyên ngành cần tối ưu hóa học tập
* **Họ tên & Vai trò:** Nguyễn Văn Minh, 20 tuổi, Sinh viên năm 3 chuyên ngành Kỹ thuật / Công nghệ Thông tin.
* **Mục tiêu:** 
  * Tóm tắt nhanh chóng các giáo trình chuyên ngành dày hàng trăm trang trước các kỳ thi.
  * Nắm bắt được sơ đồ liên kết giữa các thuật ngữ, công thức mà không cần đọc thủ công toàn bộ.
  * Tự kiểm tra lỗ hổng kiến thức thông qua bộ câu hỏi trắc nghiệm bám sát nội dung bài giảng.
* **Nỗi đau (Pain points):**
  * Quá nhiều tài liệu scan chất lượng kém, tài liệu tiếng Việt có dấu phức tạp khó tìm kiếm.
  * Mất nhiều giờ để vẽ mindmap hoặc tóm tắt ra sổ tay.
  * E ngại các trợ lý AI bịa đặt công thức hoặc định lý sai lệch.
  * Thường xuyên phải học tập trên xe bus hoặc thư viện nơi mạng Internet chập chờn.

#### Persona 2 (Secondary Persona) – Trưởng nhóm học tập & Điều phối viên học liệu
* **Họ tên & Vai trò:** Lê Thị Linh, 21 tuổi, Lớp phó học tập / Trưởng nhóm đồ án môn học.
* **Mục tiêu:**
  * Xây dựng kho tri thức số hóa chuẩn mực dùng chung cho cả nhóm môn học.
  * Tiết kiệm chi phí: Chỉ cần xử lý AI một lần, tất cả thành viên trong nhóm đều truy cập tức thì (Zero-Token retrieval).
  * Tổ chức các buổi ôn tập tương tác (Quiz Battle) để các bạn cùng thi đua giải đề.
* **Nỗi đau (Pain points):**
  * Tài liệu nhóm phân tán trên Zalo, Google Drive, không có bản tóm tắt thống nhất.
  * Khó theo dõi tiến độ và mức độ nắm bài của từng thành viên.

#### Typical User Story (Kịch bản người dùng điển hình)
> *"Là một sinh viên đang chuẩn bị cho đợt thi kết thúc môn, tôi muốn mở ứng dụng DocuGraph AI trên điện thoại, dùng camera quét nhanh các trang sách bài tập hoặc tải trực tiếp file PDF giáo trình 150 trang lên hệ thống. Ngay lập tức, tính năng OCR On-device của Google ML Kit quét nhanh văn bản, kết hợp pipeline Cloud PaddleOCR để nhận diện chính xác tiếng Việt. Sau chưa đầy 15 giây, ứng dụng trả về bản tóm tắt có cấu trúc (Executive Summary & Key Takeaways) cùng một Sơ đồ quan hệ khái niệm (Concept Graph) trực quan. Tôi có thể chạm vào từng nút trên sơ đồ để xem công thức liên quan, hỏi sâu Trợ lý Chat AI với câu trả lời luôn đính kèm trích dẫn số trang tài liệu gốc. Sau đó, tôi chia sẻ tài liệu này vào Nhóm học tập để cả nhóm cùng ôn luyện qua phòng thi đấu trắc nghiệm trực tiếp (Quiz Battle). Ngay cả khi mất kết nối mạng, tôi vẫn mở lại được toàn bộ sơ đồ và tóm tắt nhờ bộ nhớ cục bộ SQLite & MMKV."*

---

## 2. SYSTEM SCOPE & FUNCTIONAL SPECIFICATIONS

Hệ thống được thiết kế theo chuẩn phân cấp ưu tiên MoSCoW (Must-Have, Should-Have, Could-Have, Won't-Have) phục vụ phạm vi đồ án Cross-Platform Mobile Application:

| # | Feature Category | Concrete Feature | Priority | Business Logic & Scope |
|:---:|---|---|:---:|---|
| **1** | **Authentication & Profile** | OAuth Sign-in (Google), Email/Password, Session Persistence | **Must-Have** | Tích hợp **Supabase Auth**. Lưu trữ JWT an toàn trên thiết bị qua **Expo SecureStore / MMKV** để tự động đăng nhập lại khi mở app; quản lý thông tin sinh viên, lịch sử học tập cá nhân. |
| **2** | **Document Processing & AI Summarization** | Multi-modal Upload (PDF, Image), Chế độ tóm tắt kép (TL;DR & Bullet Points) | **Must-Have** | Cho phép tải tệp PDF hoặc chụp ảnh từ Camera. Xử lý bóc tách văn bản, gửi đến **Google Gemini 2.5 Flash** để sinh tóm tắt Markdown chuẩn, tự động trích xuất từ khóa, định nghĩa và công thức toán học. |
| **3** | **Interactive Knowledge Graph & Mindmap** | Sơ đồ tư duy (Tree Hierarchy) & Đồ thị quan hệ (Concept Graph) 2D/3D | **Must-Have** | Render trực quan trên Canvas di động qua **react-native-webview** tích hợp **Cytoscape.js** / **D3.js**. Hỗ trợ cử chỉ cảm ứng mượt mà (Pinch-to-zoom, Pan, Tap node để mở BottomSheet xem chi tiết định nghĩa và ví dụ). |
| **4** | **Multi-layer AI Assistant (GraphRAG)** | Trợ lý Chat Q&A chuyên sâu bám sát tài liệu với Streaming Response & Citations | **Must-Have** | Kết hợp tìm kiếm tương đồng Vector (**pgvector**) với đồ thị thực thể (**Neo4j**) qua kiến trúc GraphRAG. Phản hồi luồng (typing effect), đính kèm số trang trích dẫn chính xác, cam kết triệt tiêu hallucination. |
| **5** | **On-Device OCR & Computer Vision** | Quét chữ viết và văn bản thô từ Camera thời gian thực | **Must-Have** | Tích hợp **Google ML Kit (`@react-native-ml-kit/text-recognition`)** chạy trực tiếp on-device, nhận dạng ký tự tức thì không phụ thuộc internet; kết nối **PaddleOCR** trên Cloud cho các văn bản bảng biểu, scan mờ tiếng Việt. |
| **6** | **Study Group & Shared Resources** | Khởi tạo nhóm (Mã PIN 6 số), One-time AI Processing, Zero-Token re-use | **Should-Have** | Trưởng nhóm tải tài liệu và chạy AI 1 lần duy nhất; toàn bộ thành viên trong nhóm mở xem ngay bản tóm tắt và sơ đồ mindmap với độ trễ < 0.5s mà không tốn thêm token AI. |
| **7** | **Gamified Real-time Quiz Battle** | Phòng thi đấu trắc nghiệm trực tiếp nhiều người chơi, Live Leaderboard | **Should-Have** | AI tự động sinh câu hỏi trắc nghiệm từ tài liệu. Hỗ trợ tạo phòng đấu trí (2 - 8 sinh viên) kết nối qua **Supabase Realtime (WebSocket)**, đếm ngược 10 giây/câu, tính điểm theo tốc độ và cập nhật bảng xếp hạng trực tiếp. |
| **8** | **Offline Resilience & Data Sync** | Local Caching (Expo SQLite / MMKV) & Hàng đợi đồng bộ nền | **Must-Have** | Toàn bộ tóm tắt, sơ đồ tri thức và câu hỏi ôn tập được lưu cục bộ trên thiết bị qua **Expo SQLite** và **MMKV**. Cho phép sinh viên học tập ngoại tuyến hoàn toàn khi mất mạng và tự động đồng bộ kết quả khi có kết nối trở lại. |
| **9** | **Export & Share** | Xuất tài liệu tóm tắt ra PDF/Markdown và chia sẻ liên kết đồ thị | **Could-Have** | Tạo file PDF đẹp mắt có nhúng biểu đồ mindmap để in ấn hoặc nộp báo cáo môn học. |

---

## 3. TECH STACK & INITIAL ARCHITECTURE

* **Framework:** **React Native (Expo SDK 52+, TypeScript)** • **State Management:** **Zustand 5.x** + **TanStack Query v5**
* **Backend:** **FastAPI (Python 3.11+)** + **Supabase (PostgreSQL, Auth, Realtime)** • **AI Engine:** **Google ML Kit** + **PaddleOCR** + **Gemini 2.5 Flash** + **Neo4j GraphRAG**
* **🔗 Figma Prototype URL:** [https://www.figma.com/design/3w2qVF83r7LJyYs0xnCQR8/Untitled?node-id=0-1&t=Iac2gzgWqkgfIXO5-0](https://www.figma.com/design/3w2qVF83r7LJyYs0xnCQR8/Untitled?node-id=0-1&t=Iac2gzgWqkgfIXO5-0)

### 3.1. Tech Stack Overview

* **Cross-Platform Mobile Framework:** **React Native (Expo SDK 52+, React 19 / React Native 0.76+)**  
  * *Lý do lựa chọn:* Framework đa nền tảng chuẩn mực hàng đầu hiện nay, biên dịch thành ứng dụng native 100% trên cả Android và iOS, mang lại hiệu năng cao, trải nghiệm cử chỉ vuốt chạm native mượt mà và tận dụng hệ sinh thái phong phú của Expo.
* **Navigation & Routing:** **Expo Router (v4)** – Định tuyến dạng file-system chuẩn mực tương tự Next.js, hỗ trợ Deep Linking, Stack và Tabs navigation tối ưu.
* **Client State Management & Data Fetching:** **Zustand 5.x** & **TanStack Query (React Query v5)**  
  * Quản lý trạng thái giao diện linh hoạt, tối ưu hóa caching dữ liệu từ xa và giảm thiểu re-render không cần thiết.
* **Styling & Animation:** **NativeWind v4 (Tailwind CSS for React Native)** & **React Native Reanimated**  
  * Viết giao diện nhanh chóng với các class Tailwind tiện dụng, kết hợp animation mượt mà ở mức 60-120 FPS.
* **On-Device AI & Hardware Vision:** **Google ML Kit (`@react-native-ml-kit/text-recognition`)**  
  * Chạy trực tiếp trên phần cứng di động để quét văn bản, nhận dạng chữ viết thô từ Camera hoàn toàn ngoại tuyến.
* **Backend API & Orchestration Engine:** **FastAPI (Python 3.11+)**  
  * FastAPI xử lý các pipeline AI bất đồng bộ (async), xử lý file dung lượng lớn và điều phối GraphRAG; cung cấp RESTful API & SSE Streaming cho ứng dụng di động.
* **AI & Machine Learning Services:**
  * **Google Gemini 2.5 Flash:** Trích xuất thực thể/mối quan hệ cấu trúc chuẩn (Structured JSON) và sinh câu trả lời Streaming RAG tốc độ cao.
  * **Google text-embedding-004:** Tạo vector embeddings 768 chiều phục vụ tìm kiếm ngữ nghĩa.
  * **PaddleOCR (v4/v5):** Công cụ OCR chuyên sâu trên server xử lý tiếng Việt có dấu cho tài liệu scan phức tạp.
* **Databases & Multi-tier Storage:**
  * **Supabase (PostgreSQL + Supabase Auth + Supabase Storage + Realtime WebSocket):** Quản lý định danh người dùng, lưu trữ file tài liệu gốc và truyền nhận socket cho phòng đấu trí Quiz Battle.
  * **PostgreSQL / pgvector:** Lưu trữ Vector Embeddings và thực hiện tìm kiếm tương đồng (Cosine Similarity / HNSW / IVFFlat).
  * **Neo4j (Graph Database):** Lưu trữ các thực thể tri thức (Knowledge Nodes) và mối quan hệ (Edges) phục vụ suy luận đa bước (Multi-hop Reasoning).
  * **Expo SQLite & MMKV (Mobile Local Storage):** Bộ lưu trữ cục bộ tốc độ cao trên điện thoại giúp ứng dụng vận hành mượt mà ngoại tuyến.
* **Interactive Visualization:** **react-native-webview** tích hợp **Cytoscape.js**, **D3.js**, **KaTeX** (hiển thị công thức toán học) và **React Native Markdown Display**.

---

### 3.2. Initial System Architecture

Hệ thống được tổ chức theo kiến trúc 4 tầng phân tách rõ ràng (Client – Gateway – Processing – Data & AI):

```
+-----------------------------------------------------------------------------------+
|                        1. CLIENT / REACT NATIVE MOBILE APP                        |
|  - Framework: React Native (Expo SDK 52+, Expo Router, NativeWind v4)             |
|  - On-Device Vision: Google ML Kit (@react-native-ml-kit/text-recognition)        |
|  - Graph Canvas: react-native-webview (Cytoscape.js & D3.js with Touch Gestures)  |
|  - Local Storage: Expo SQLite & MMKV (Offline Vault & Sync Queue)                 |
|  - State Management: Zustand 5.x + TanStack Query                                 |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
+------------------------------------------v----------------------------------------+
|                      2. API GATEWAY & AUTHENTICATION                              |
|  - Supabase Auth (Google OAuth2 & JWT Token Verification)                         |
|  - Secure Token Storage via Expo SecureStore                                      |
+------------------------------------------+----------------------------------------+
                                           | Async Requests / Internal RPC
+------------------------------------------v----------------------------------------+
|                       3. BACKEND & AI PIPELINE ENGINE                             |
|  - FastAPI (Python 3.11+, Async Workers)                                          |
|  - Ingestion & OCR: PDF Extractor + Cloud PaddleOCR (Vietnamese Diacritics)       |
|  - GraphRAG Engine: Gemini 2.5 Flash + text-embedding-004                        |
|  - Hybrid Retrieval: Vector Similarity + Graph Multi-hop Traversal                |
+-------------------+----------------------+--------------------+-------------------+
                    |                      |                    |
+-------------------v---+  +---------------v----+  +------------v----+  +-----------v-------+
|  Neo4j Graph Database |  |  Supabase / pgvector|  | Supabase Storage|  | Supabase Realtime |
|  - Knowledge Nodes    |  |  - Document Chunks |  |  - Raw PDFs     |  |  - Quiz Battles   |
|  - Semantic Edges     |  |  - 768-D Embeddings|  |  - Scanned Imgs |  |  - Room State Sync|
+-----------------------+  +--------------------+  +-----------------+  +-------------------+
```
+-----------------------+  +--------------------+  +-----------------+  +-------------------+
```

---

### 3.3. Key Technical Workflows

#### Workflow A: Pipeline Xử lý Tài liệu & Tạo Đồ thị Tri thức (Ingestion Pipeline)
1. **Tiếp nhận:** Người dùng tải file PDF hoặc chụp ảnh giáo trình bằng Camera.
2. **Tiền xử lý OCR:** Google ML Kit bóc tách nhanh text thô; đối với file PDF phức tạp, FastAPI gọi PaddleOCR trích xuất văn bản tiếng Việt chuẩn xác.
3. **Chunking & Vector hóa:** Văn bản được chia thành các chunk 512 tokens (overlap 64 tokens), gọi model `text-embedding-004` để tạo vector 768 chiều lưu vào `pgvector`.
4. **Trích xuất Thực thể (Entity-Relation Extraction):** Gemini 2.5 Flash phân tích cấu trúc bài học, trả về danh sách các Nodes (Khái niệm, Định lý, Công thức) và Edges (Mối quan hệ) dưới định dạng JSON cấu trúc.
5. **Nạp Đồ thị:** Backend nạp dữ liệu vào **Neo4j** và trả về cấu trúc cho client render trên **Cytoscape.js**.

#### Workflow B: Truy vấn Thông minh GraphRAG & Triệt tiêu Hallucination
1. Người dùng đặt câu hỏi tự nhiên bằng tiếng Việt trong khung Chat.
2. Hệ thống chuyển câu hỏi thành Vector và tìm kiếm top chunks tương đồng trong **pgvector**.
3. Đồng thời, hệ thống truy vấn các thực thể liên quan trong **Neo4j** để mở rộng ngữ cảnh liên chương (Multi-hop Expansion).
4. Prompt tổng hợp bao gồm *Ngữ cảnh Vector + Đồ thị Tri thức + Vị trí số trang gốc* được gửi đến Gemini 2.5 Flash.
5. AI phản hồi câu trả lời dạng Streaming trực tiếp tới màn hình người dùng kèm theo thẻ trích dẫn chính xác (Grounding Citations).

---

### 3.4. Interactive Wireframe & Prototype Reference

* **🔗 Figma Prototype URL:** [https://www.figma.com/design/3w2qVF83r7LJyYs0xnCQR8/Untitled?node-id=0-1&t=Iac2gzgWqkgfIXO5-0](https://www.figma.com/design/3w2qVF83r7LJyYs0xnCQR8/Untitled?node-id=0-1&t=Iac2gzgWqkgfIXO5-0)  
  *(Figma Workspace Node ID: `0-1` – DocuGraph AI Interactive Mobile Wireframe & UI Flows)*

* **Cấu trúc luồng 11 màn hình chính trên Figma Prototype:**
  1. `Screen 01: Đăng nhập (Sign In / Login)` – Đăng nhập bằng Google hoặc email và mật khẩu; hỗ trợ ẩn/hiện mật khẩu, truy cập chức năng quên mật khẩu và chuyển sang đăng ký tài khoản.
  2. `Screen 02: Đăng ký (Sign Up / Register)` – Tạo tài khoản bằng họ tên, email, mật khẩu và xác nhận mật khẩu; hiển thị yêu cầu độ mạnh mật khẩu, điều khoản sử dụng, chính sách quyền riêng tư và liên kết quay lại đăng nhập.
  3. `Screen 03: Quên mật khẩu (Forgot Password)` – Nhập email đã đăng ký để yêu cầu mã xác thực 6 chữ số; hướng dẫn kiểm tra hộp thư và thư rác, hỗ trợ quay lại đăng nhập.
  4. `Screen 04: Xác thực OTP & Đặt lại mật khẩu (Verify OTP & Reset Password)` – Nhập mã xác thực qua 6 ô OTP, hiển thị thời gian đếm ngược và tùy chọn gửi lại mã; nhập và xác nhận mật khẩu mới trước khi hoàn tất đặt lại mật khẩu.
  5. `Screen 05: Trang chủ & Quản lý Tài liệu (Home Dashboard & Document Hub)` – Hiển thị lời chào cá nhân hóa, trạng thái kết nối và dung lượng ngoại tuyến; tìm kiếm, lọc và xem tài liệu gần đây cùng trạng thái OCR, Mindmap, Quiz, Offline; cung cấp nút tải lên/quét và thanh điều hướng các chức năng chính.
  6. `Screen 06: Tải lên, Quét OCR & Cấu hình Xử lý AI (Upload, Scanner & AI Pipeline Config)` – Bảng BottomSheet cho phép tải PDF/DOCX hoặc chọn chụp ảnh OCR; lựa chọn tóm tắt TL;DR hoặc tóm tắt chi tiết và luận điểm chính; hiển thị tiến trình trích xuất chữ, tạo Vector Embedding và xây dựng đồ thị tri thức, đồng thời khóa thao tác bắt đầu mới khi đang xử lý.
  7. `Screen 07: Đọc Tóm tắt Tài liệu Thông minh (Smart Document Summary Reader)` – Trình đọc tóm tắt theo chương với tiêu đề phân cấp, các luận điểm chính, đoạn mã minh họa và trích dẫn trang/mục nguồn; hiển thị tiến độ đọc, nút nghe và chia sẻ, cùng các hành động Vẽ Mindmap, Sinh Quiz và Lưu vào Nhóm.
  8. `Screen 08: Sơ đồ Tư duy & Đồ thị Tri thức Tương tác (Interactive Mindmap & Concept Graph Canvas)` – Không gian trực quan hóa kiến thức với hai chế độ Mindmap dạng cây và Concept Graph dạng mạng lưới; hiển thị khái niệm và quan hệ, các nút phóng to/thu nhỏ/vừa khung, bảng chi tiết khái niệm đang chọn, nguồn trích xuất và tùy chọn hỏi thêm AI.
  9. `Screen 09: Nhóm Học tập & Kho Tài nguyên Dùng chung (Study Group & Shared Resources Hub)` – Hiển thị thông tin nhóm riêng tư, mã nhóm, danh sách thành viên và chức năng mời bạn; quản lý kho tài liệu dùng chung với thông điệp xử lý một lần – Zero Token; cung cấp thao tác xem tóm tắt, xem Mindmap, lưu offline, tải tài liệu lên nhóm và tạo phòng đấu trí trắc nghiệm.
  10. `Screen 10: Phòng Đấu trí Trắc nghiệm Thời gian thực (Real-time Quiz Battle Room)` – Giao diện thi đấu trắc nghiệm theo chủ đề, hiển thị mã PIN phòng và số người tham gia; trình bày tiến độ câu hỏi, đồng hồ đếm ngược, bốn phương án trả lời, trạng thái đáp án đã chọn, điểm thưởng tốc độ và bảng xếp hạng trực tiếp.
  11. `Screen 11: Bảng vàng Tổng kết & Đánh giá Năng lực (Quiz Battle Podium & Performance Summary)` – Tổng kết trận đấu bằng bục xếp hạng ba người dẫn đầu; hiển thị thứ hạng cá nhân, tổng điểm, số câu đúng và thời gian trả lời trung bình; cung cấp lựa chọn lưu bộ câu hỏi kèm sổ tay câu sai hoặc chơi lại trận mới.

* **Đặc tả Thiết kế UI/UX & Tương tác (Design System Specs):**
  * **Viewport mục tiêu:** Mobile-First Native (chuẩn 390 × 844 px, tối ưu hóa giao diện Native mượt mà trên cả Android & iOS qua React Native Expo).
  * **Hệ thống màu sắc (Color Palette):**
    * *Primary Brand:* Deep Indigo (`#4F46E5`) & Electric Violet (`#7C3AED`) thể hiện tính công nghệ và trí tuệ nhân tạo.
    * *Graph Node Accents:* Emerald Green (`#10B981` - Concepts), Amber Yellow (`#F59E0B` - Formulas/Rules), Rose Red (`#EF4444` - Warnings/Exam Pitfalls).
    * *Background & Surfaces:* Dark Mode / Clean Light Mode hỗ trợ đọc lâu không mỏi mắt.
  * **Điều hướng (Navigation Pattern):** Bottom Navigation Bar 4 tab cốt lõi (`Trang chủ`, `Đồ thị Tri thức`, `Trợ lý AI`, `Nhóm & Đấu trí`) kết hợp Floating Action Button (FAB) cho tác vụ quét tài liệu tức thì. 