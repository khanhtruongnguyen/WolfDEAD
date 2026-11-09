# 🐺 WolfDEAD v3.2 - Sới Ma Sói Đấu Khẩu Thực Chiến & Phòng Chat Sau Trận

Trò chơi Ma Sói Single-player chạy trực tiếp trên trình duyệt, nơi **mỗi ghế AI được vận hành bởi 1 Model AI riêng biệt**, tích hợp **Bảng Tóm Tắt Luật 4 Lá Bài**, cấu tạo từ **2 Lõi độc lập (`PersonaCore` + `VaultCore`)**, và có **Phòng Chat Sau Trận (`Post-Game Lobby Chat`)** để cả bàn xả giận sau khi lật bài.

👉 **Đọc tài liệu giải thích chi tiết cơ chế, luật 4 lá bài & kiến trúc tại:** [MECHANICS_AND_ARCHITECTURE.md](file:///c:/Users/ADMIN/Downloads/WolfDEAD/MECHANICS_AND_ARCHITECTURE.md)

---

## 🔥 Các Cập Nhật Mới Nhất (v3.2)

1. 🍻 **Chế Độ Trò Chuyện Sau Trận Đấu (`Post-Game Lobby Chat`):**
   - Sau khi ván đấu kết thúc và lật toàn bộ vai trò thật, bấm **`🍻 VÀO PHÒNG CHAT SAU TRẬN`** để cả bàn (kể cả người sống lẫn người đã chết oan trong trận) cùng mở mic gáy bẩn, đổ lỗi, cay cú hoặc khen pha lừa đảo của nhau.
   - Bạn có thể gõ chat khịa bất kỳ AI nào (nhắc tên ai thì AI đó sẽ trực tiếp nhảy vào cãi tay đôi với bạn) hoặc bấm cho cả bàn chửi nhau tiếp!
2. 📜 **Bảng Tóm Tắt Luật & Vai Trò 4 Lá Bài Nạp Cho AI (`buildGameRulesCodex`):**
   - Mỗi lần AI suy luận đều được nạp bản tóm tắt đầy đủ về luật và hệ quả tương tác giữa **Dân Làng - Ma Sói - Bảo Vệ - Phù Thủy**.
3. 🔒 **Luật Ẩn Vai Khi Chết (No Role Reveal on Death):**
   - Khi bất kỳ người chơi nào chết (đêm hay bị treo cổ), **Role của họ không được lộ ra** (`🔒 Đã chết (Ẩn vai)`). Toàn bộ bài chỉ được lật khi ván đấu kết thúc!
4. ⏱️ **Rút Ngắn Tối Đa 5 Turn Đấu Khẩu Mỗi Ngày & Vote Kèm Lý Do:**
   - Phiên đấu khẩu ban ngày diễn ra tối đa **5 Turn** (hoặc dừng sớm ngay khi không còn ai chọn "Trò chuyện tiếp").

---

## 🚀 Cách Mở & Chơi Ngay

Có 2 cách cực kỳ tiện lợi:

### 🌟 Cách 1: Click đúp trực tiếp vào file `index.html` (Tiện nhất - Không cần bật server!)
1. Mở thư mục `WolfDEAD`.
2. **Click đúp chuột vào file `index.html`** để mở ngay trên trình duyệt (Chrome, Edge, Brave, Firefox...).
3. Trò chơi chạy độc lập 100%, Web Audio tự phát, AI kết nối thẳng qua API xah.io mà không cần cài đặt hay bật terminal Python.

### 🌐 Cách 2: Chạy qua Local Server
1. Click đúp vào file `start.bat` (sẽ tự động mở trình duyệt và chạy máy chủ local).
2. Hoặc truy cập: `http://localhost:8080`
