# Ảnh cần thay

Trang tự hiện ảnh khi file tồn tại đúng tên dưới đây; nếu thiếu, khung placeholder "cần thay ảnh thật" được giữ nguyên. Không cần sửa HTML.

| Tên file        | Vị trí trên trang   | Ảnh gốc trong .pptx (`ppt/media/`) | Ghi công bắt buộc (đã có sẵn trên trang)                  |
|-----------------|---------------------|------------------------------------|-----------------------------------------------------------|
| `hero.jpg`      | Hero (đầu trang, ảnh 1 của nền động) — **đã có** | `image_ad653c2d9d3a7f35.jpg` (slide 2)  | © Chrisvomberg / Wikimedia Commons / CC BY-SA 3.0    |
| `intro-quanho.jpg` | 01 소개와 등재 — **đã có** | `image_a549ce7559730c4b.jpg` (slide 7, cùng ảnh với `costume.jpg`) | by vi:User:Viethavvh / Wikimedia Commons / CC BY-SA 3.0 |
| `costume.jpg`   | 05 전통 의상 — **đã có** | `image_a549ce7559730c4b.jpg` (slide 7)  | by vi:User:Viethavvh via Wikimedia Commons — CC BY-SA 3.0 |
| `closing.jpg`   | 10 맺음말 — **đã có** | `image_7bbd92cb33fbcaf1.jpg` (slide 11) | © Nguoivietbao / Wikimedia Commons / CC BY-SA 4.0    |

Lấy ảnh gốc: đổi đuôi `.pptx` → `.zip`, giải nén, vào `ppt/media/`.
Các ảnh đã được nén về chiều rộng ≤ 1600px, JPEG chất lượng ~82 để tải nhanh trên 4G.

> Không dùng lại tên `intro.jpg`: slot 01 đã đổi sang `intro-quanho.jpg` để file `intro.jpg` cũ (ảnh không rõ bản quyền) còn sót trong bản clone local không bị hiển thị nhầm. Xóa file đó nếu còn.

> Nền Hero là ảnh động: `hero.jpg` → `intro-quanho.jpg` → `closing.jpg` chuyển mờ luân phiên (~7 giây/ảnh), dòng credit ở góc dưới đổi theo ảnh đang hiện. Thứ tự/ảnh sửa ở các thẻ `img.hero-slide` trong `index.html`.
