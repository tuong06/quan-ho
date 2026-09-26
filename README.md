# Quan họ Bắc Ninh — 발표 요약 페이지

Trang tĩnh one-page tóm tắt bài thuyết trình tiếng Hàn *Quan họ Bắc Ninh (민요)* — 광운대학교 대학한국어(01), 2026-10-21.

- HTML/CSS/JS thuần, không build step. GitHub Pages serve trực tiếp từ root.
- Leaflet 1.9.4 và `qrcode-generator` 1.4.4 được vendor trong `assets/vendor/` (không phụ thuộc CDN).
- Font: Noto Sans KR / Noto Serif KR (Hangul) + Be Vietnam Pro / Noto Serif (chữ Latin có dấu tiếng Việt) qua Google Fonts.

## Tương tác

- **Nghe phát âm**: chạm vào chip 발음 도움말, thẻ 발성 4대 기준 hoặc nút 발음 듣기 ở Hero — dùng Web Speech API giọng `vi-VN` (không cần file âm thanh). Nếu máy không có giọng tiếng Việt, trang hiện thông báo.
- **Quan họ 퀴즈** (mục 09): 7 câu trắc nghiệm/OX, chấm điểm tức thì, giải thích + link về đúng mục, rung nhẹ trên Android, xếp hạng cuối bài. Sửa câu hỏi trong mảng `QUIZ` ở `script.js`.
- **Đếm ngược Hội Lim**: D-day tới ngày 13 tháng Giêng âm lịch tiếp theo (mảng `DATES` trong `script.js`, hiện có 2027-02-18 và 2028-02-07).
- **Nút "퀴즈 풀기" nổi** trên điện thoại, tự ẩn ở Hero, mục quiz và phần cuối trang.

## Cấu trúc

```
index.html          nội dung 10 section + nguồn
style.css           giao diện mobile-first
script.js           scroll-reveal, nav active, smooth scroll, count-up, bản đồ, QR
assets/img/         ảnh thật (xem assets/img/README.md)
assets/vendor/      Leaflet, qrcode-generator
.nojekyll           tắt Jekyll trên GitHub Pages
```

## Bản đồ

Marker đặt ở **tâm gần đúng cấp huyện/thành phố** (박닌시, 옌퐁현, 띠엔주현·림, 비엣옌현), không vẽ tọa độ từng làng vì nguồn chỉ cho số lượng theo tỉnh (44 / 5). Vùng đường nét đứt là **sơ đồ khái quát** vùng Quan họ trong Kinh Bắc xưa, không phải ranh giới lịch sử đo đạc. Sửa trong `PLACES` / `ZONE` ở `script.js`.

## QR code

Khi chạy trên `*.github.io`, QR tự mã hóa đúng URL đang mở. Khi xem local, QR dùng hằng `SITE_URL` trong `script.js`.

## Xem local

```bash
python3 -m http.server 8000   # mở http://localhost:8000
```
