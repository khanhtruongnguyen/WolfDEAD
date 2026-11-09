# 🔥 Kiến Trúc & Cơ Chế Vận Hành WolfDEAD (v3.1)

Tài liệu này giải thích toàn bộ cơ chế vận hành của trò chơi Ma Sói Offline **WolfDEAD v3.1**, bao gồm:
1. **Bảng Tóm Tắt Luật & Vai Trò Của 4 Lá Bài (Dân Làng - Ma Sói - Bảo Vệ - Phù Thủy)** được nạp trực tiếp cho AI.
2. **Luật Ẩn Vai Khi Chết (No Role Reveal on Death)** & **Rút ngắn tối đa 5 Turn đấu khẩu/ngày**.
3. **Mỗi Role chạy 1 Model AI khác nhau** (tránh trùng lặp tư duy suy luận).
4. **Kiến trúc 2 Lõi cho mỗi Role: Lõi "Tính Cách" (`PersonaCore`) + Lõi "Kho" (`VaultCore`)**.

---

## 1. Bảng Tóm Tắt Luật & Vai Trò 4 Lá Bài Nạp Cho AI (`buildGameRulesCodex`)

Mỗi lần Bộ xử lý AI nhập vào bất kỳ ghế nào trên bàn, hệ thống luôn đính kèm khối **`[BẢNG TÓM TẮT LUẬT CHƠI & CƠ CHẾ 4 LÁ BÀI TRÊN BÀN]`** để AI hiểu rõ tương tác chiến thuật:

### 1.1. Vai trò & Kỹ năng của 4 Lá Bài
| Lá Bài | Phe | Kỹ năng Ban Đêm | Chiến thuật & Hệ quả Suy luận Ban Ngày |
| :--- | :--- | :--- | :--- |
| 🐺 **Ma Sói** | Phe Sói | Mỗi đêm, mỗi con Sói còn sống được chọn cắn **1 người**. | Biết rõ ai là Sói, ai là người ngoài. Ban ngày giả làm Dân cứng hoặc **nhận vơ (fake claim)** làm Bảo Vệ / Phù Thủy để đánh lạc hướng. |
| 🛡️ **Bảo Vệ** | Phe Dân | Mỗi đêm chọn **1 người** (kể cả bản thân) để canh gác khỏi vết cắn của Sói. **Không được bảo vệ cùng 1 người 2 đêm liên tiếp.** | Chỉ chặn được vết cắn của Sói, **không chặn được Bình Giết của Phù Thủy**. Nếu đêm qua không ai chết, rất có thể người Bảo Vệ vừa canh gác chính là mục tiêu bị cắn! |
| 🧙‍♀️ **Phù Thủy** | Phe Dân | Sở hữu **1 Bình Cứu** và **1 Bình Giết (Độc)** cho cả ván. Trong đêm biết ai bị cắn, có thể: chỉ Cứu, chỉ Giết, **dùng CẢ 2 BÌNH trong cùng đêm**, hoặc Không hành động. | Nắm giữ thông tin cực mạnh (biết ai được cứu sống, biết ai chết do độc của mình). Nếu bàn có 1 Sói mà sáng ra có **2 xác chết**, chắc chắn 1 người do Sói cắn và 1 người do Phù Thủy quăng độc! |
| 🧑‍🌾 **Dân Làng** | Phe Dân | Không có kỹ năng ban đêm. | Dựa vào số xác chết mỗi sáng, mâu thuẫn lời nói giữa các Turn và lý do bỏ phiếu để lôi đầu Ma Sói lên giàn treo cổ. |

### 1.2. Luật Ẩn Vai Khi Chết (No Role Reveal on Death)
* Khi một người chơi chết (dù tử nạn trong đêm hay bị treo cổ ban ngày), **vai trò (Role) của họ TUYỆT ĐỐI KHÔNG ĐƯỢC TIẾT LỘ** trên bàn chơi cũng như trong dữ liệu gửi cho các AI khác.
* Kể cả nguyên nhân chết trong đêm cũng chỉ được thông báo chung là *"Tử nạn trong đêm"* (không lộ là do Sói cắn hay trúng độc Phù Thủy).
* Nhờ luật này, ván đấu trở nên kịch tính hơn gấp bội: Sói có thể mạo danh vai chức năng của người đã khuất, và Dân làng phải tự suy luận xem kẻ vừa bị treo cổ đã thật sự là Sói hay chưa.

---

## 2. Cơ Chế "Mỗi Role = 1 Model AI Riêng Biệt" (Multi-Model Per-Role)

Mỗi ghế AI trên bàn được gán một **Model AI riêng biệt** từ danh sách của bạn:

| Ghế AI | Model AI Được Gán Mặc Định (`assignedModel`) | Đặc trưng tư duy |
| :--- | :--- | :--- |
| **Role AI #1** | `dungcsnd113/gemini-flash-3.8` | Phản xạ nhanh, bóc tách mâu thuẫn trực diện |
| **Role AI #2** | `levuphong2909/gemini-3.8-flash-high` | Lập luận sâu, chuyên soi chuỗi hành vi |
| **Role AI #3** | `dungcsnd113/gemini-4-argon` | Tư duy chiến thuật sắc lạnh, gài bẫy cực gắt |
| **Role AI #4** | `thanhnhan9023/gemini-3.7-flash-high` | Bắt lỗi câu chữ, truy vấn dồn dập |
| **Role AI #5** | `sypham98/claude-fable-5-1` | Nhập vai cực cháy, ngôn từ đốp chát tự nhiên |
| *Dự phòng xoay vòng* | `tanynguyen97/gemini-4-argon`, `devdoclang/gemini-3.8-flash` | Tự động nhảy vào thay thế nếu model nào bị nghẽn mạng/403 |

---

## 3. Kiến Trúc 2 Lõi Cho Mỗi Role: "Lõi Tính Cách" & "Lõi Kho"

```
┌───────────────────────────────────────────────────────────────────────────┐
│              BỘ XỬ LÝ AI RIÊNG CỦA ROLE (ASSIGNED AI MODEL)               │
│   (VD: gemini-4-argon / claude-fable-5-1 / gemini-3.8-flash-high...)      │
└───────────────────▲───────────────────────────────────┬───────────────────┘
                    │ 1. Nạp đồng thời:                 │ 2. Xuất ra:
                    │ Bảng Luật + Lõi Tính Cách         │ Lời chửi/đấu khẩu
                    │           + Lõi Kho               │ + Ghi chú suy luận mới
┌───────────────────┴───────────────┐   ┌───────────────▼───────────────────┐
│   LÕI 1: LÕI TÍNH CÁCH            │   │   LÕI 2: LÕI KHO DỮ LIỆU          │
│       (PERSONA CORE)              │   │         (VAULT CORE)              │
│                                   │   │                                   │
│ • Hình mẫu nhân cách (Archetype)  │   │ • Vai trò bí mật (Sói/Phù/BV/Dân) │
│ • Cách xưng hô: "tao - mày"       │   │ • Ký ức hành động đêm bí mật      │
│ • Độ hổ báo / công kích (1-10)    │   │ • Toàn bộ lịch sử đấu khẩu chung  │
│ • Thiên kiến suy luận riêng       │   │   & Lý do vote của cả bàn         │
│ • Phong cách đấu khẩu / chửi bới  │   │ • Sổ tay suy luận & ghim thù riêng│
└───────────────────────────────────┘   └───────────────────────────────────┘
```

---

## 4. Nhịp Độ Đấu Khẩu Tối Đa 5 Turn & Bỏ Phiếu Kèm Lý Do

* **Đấu khẩu tối đa 5 Turn mỗi ngày:**
  * Trong mỗi Turn (`Turn 1/5` đến `Turn 5/5`), từng người còn sống lần lượt phát biểu và chọn trạng thái: **💬 "Trò chuyện tiếp"** hoặc **🗳️ "Đòi Vote ngay"**.
  * Cuộc đấu khẩu **kết thúc sớm ngay khi không còn ai chọn "Trò chuyện tiếp"**, hoặc sẽ **tự động kết thúc khi hết Turn 5** để chuyển sang Bỏ phiếu.
* **Bỏ phiếu kèm Lý Do:**
  * Khi bỏ phiếu, cả Người chơi và AI đều nêu rõ **Lý do vote** để ghi vào Lõi Kho chung cho các AI đọc vào và phân tích ở các lượt sau.

---

## 5. Chế Độ Trò Chuyện Sau Trận Đấu (`Post-Game Lobby Chat` - v3.2)

Khi ván đấu kết thúc (Phe Dân Làng hoặc Phe Ma Sói thắng), thay vì chỉ xem bảng kết quả rồi thoát, người chơi có thể bấm nút **`🍻 VÀO PHÒNG CHAT SAU TRẬN (CẢ BÀN XẢ GIẬN / GÁY BẨN)`**:

1. **Lật Toàn Bộ Bài & Nguyên Nhân Chết Thực Sự Trên Bàn:**
   * Mọi thẻ bài trên bàn (cả người còn sống lẫn người đã chết) đều lật công khai **Vai trò thật (`Ma Sói`, `Phù Thủy`, `Bảo Vệ`, `Dân Làng`)** và **Nguyên nhân chết thực sự** (bị Sói cắn, bị Phù Thủy quăng độc, hay bị treo cổ oan).
2. **Cả Bàn (Sống + Chết) Cùng Mở Mic Xả Giận / Gáy Bẩn:**
   * Trong chế độ này, **những người đã chết trong trận cũng được mở khóa mic** để chửi kẻ đã cắn/độc/treo cổ oan mình.
   * Mỗi AI được nạp bảng toàn cảnh sự thật sau trận (`FULL REVEAL`) + lịch sử ván đấu + **Lõi Tính Cách** để phản ứng đúng tâm lý:
     * **Kẻ thắng cuộc:** Gáy khét lẹt, cà khịa trình độ suy luận của phe thua, tự hào về những pha lừa đảo (bluff) hoặc đọc vị thần sầu.
     * **Kẻ thua cuộc / Chết oan:** Cay cú tột độ, đổ lỗi cho đồng đội ngu, chửi Phù Thủy ném độc bừa bãi hoặc chửi tên Sói lươn lẹo.
3. **Tương Tác Trực Tiếp & Gọi Tên Khịa AI:**
   * Người chơi có thể gõ chat tự do ở thanh điều khiển dưới cùng.
   * **Cơ chế Ré Tên (`Name-Mention Priority`):** Nếu trong câu chat của bạn có nhắc tên cụ thể AI nào (ví dụ: *"Minh giả Dân đỉnh đấy nhưng Bảo ném độc ngu quá"*), hệ thống sẽ ưu tiên gọi chính **Minh** và **Bảo** bật mic đáp trả trực tiếp câu nói của bạn!
   * Ngoài ra có nút **`🔥 Cho Cả Bàn Chửi Nhau Tiếp 1 Vòng`** để cả 5 AI tiếp tục đấu khẩu sau trận bất cứ lúc nào.
