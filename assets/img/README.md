# Ảnh cần thay

Trang tự hiện ảnh khi file tồn tại đúng tên dưới đây; nếu thiếu, khung placeholder "cần thay ảnh thật" được giữ nguyên. Không cần sửa HTML.

| Tên file        | Vị trí trên trang   | Ảnh gốc trong .pptx (`ppt/media/`) | Ghi công bắt buộc (đã có sẵn trên trang)                  |
|-----------------|---------------------|------------------------------------|-----------------------------------------------------------|
| `hero.jpg`      | Hero (đầu trang) — **đã có** | `image_42c27f35aa8514ab.jpg` (slide 1)  | © Altostratus / Wikimedia Commons / CC BY-SA 3.0     |
| `intro-quanho.jpg` | 01 소개와 등재  | chưa có — **cần thay ảnh thật** (ảnh Quan họ) | Ghi nguồn khi thêm ảnh (hiện trang chưa hiển thị credit nào) |
| `campus.jpg`    | Hero · cạnh thông tin 발표자 — **đã có** | — (ảnh ngoài .pptx) | campus.jpg — Kwangwoon University 본관 전경, 출처: 대학저널(UNN, unn.net) |
| `costume.jpg`   | 05 전통 의상        | `image_a549ce7559730c4b.jpg` (slide 7)  | by vi:User:Viethavvh via Wikimedia Commons — CC BY-SA 3.0 |
| `closing.jpg`   | 09 맺음말           | `image_7bbd92cb33fbcaf1.jpg` (slide 11) | © Nguoivietbao / Wikimedia Commons / CC BY-SA 4.0    |

Lấy ảnh gốc: đổi đuôi `.pptx` → `.zip`, giải nén, vào `ppt/media/`.
Khuyến nghị nén về chiều rộng ≤ 1600px, JPEG chất lượng ~80 để tải nhanh trên 4G.

> Không dùng lại tên `intro.jpg`: slot 01 đã đổi sang `intro-quanho.jpg` để file `intro.jpg` cũ (ảnh không rõ bản quyền) còn sót trong bản clone local không bị hiển thị nhầm. Xóa file đó nếu còn.
