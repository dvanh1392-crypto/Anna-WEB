# Pipeline cập nhật quán

Thư mục này giúp bạn tự cập nhật dữ liệu quán mà không cần sửa trực tiếp `app.js`.

## Luồng làm việc

1. Chạy `discover-osm.mjs` để lấy ứng viên quán mới từ nguồn mở OSM.
2. Chạy `build-review-queue.mjs` để so với dữ liệu hiện có và tạo hàng chờ duyệt.
3. Mở `data/review/pending-candidates.json`, chọn quán phù hợp rồi thêm vào `data/master/venues.master.json`.
4. Chạy `publish.mjs` để xuất dữ liệu sạch sang `data/published/venues.json`.
5. Mở website và kiểm tra lại.

## Các lệnh chính

```bash
node pipeline/scripts/discover-osm.mjs
node pipeline/scripts/build-review-queue.mjs
node pipeline/scripts/publish.mjs
```

## Các file quan trọng

- `pipeline/config/source-config.json`: cấu hình vùng quét và nguồn dữ liệu
- `data/master/venues.master.json`: dữ liệu quán đã duyệt
- `data/review/osm-discovery.json`: dữ liệu phát hiện tự động từ OSM
- `data/review/pending-candidates.json`: hàng chờ để bạn xem lại
- `data/published/venues.json`: dữ liệu web đang dùng

## Nguyên tắc duyệt

- Chỉ đưa quán vào `master` khi có tên, địa chỉ hoặc toạ độ đủ tin cậy
- Nếu nghi ngờ trùng quán cũ, ưu tiên sửa bản ghi cũ thay vì thêm mới
- Ảnh và menu nên dùng nguồn bạn có quyền sử dụng hoặc nguồn chính thức của quán
