# Bia & Nhậu Vĩnh Yên

Đây là website tĩnh giới thiệu các quán bia, quán nhậu ở thành phố Vĩnh Yên, Vĩnh Phúc.

Website hiện đã tách dữ liệu quán ra khỏi `app.js`. Giao diện sẽ đọc dữ liệu từ `data/published/venues.json`, còn dữ liệu gốc đã duyệt nằm trong `data/master/venues.master.json`.

## Có gì trong website

- Danh sách quán với tên, địa chỉ, số điện thoại, giờ mở cửa
- Điểm đánh giá và số review tham khảo
- Ảnh quán và phần món nổi bật / menu nếu có
- Tìm kiếm theo tên quán
- Lọc theo loại quán
- Sắp xếp theo đánh giá, số review hoặc khoảng cách
- Nút dùng vị trí hiện tại để tính khoảng cách từ bạn đến từng quán
- Hỗ trợ tiếng Việt, tiếng Anh và tiếng Trung

## Cách mở website

Bạn có thể mở trực tiếp `index.html`, nhưng để tính năng định vị hoạt động ổn định hơn nên chạy bằng một web server local.

Ví dụ với Python:

```bash
python -m http.server 8080
```

Sau đó mở trình duyệt tại `http://localhost:8080`.

## Cấu trúc dữ liệu mới

- `data/master/venues.master.json`: dữ liệu quán đã duyệt
- `data/published/venues.json`: dữ liệu web đang dùng
- `data/review/osm-discovery.json`: quán phát hiện tự động từ nguồn mở OSM
- `data/review/pending-candidates.json`: danh sách cần bạn xem lại trước khi nhập vào dữ liệu chính

## Quy trình tự động cào quán từ Google Maps (Nhanh nhất ⚡)

1. Mở file `pipeline/links.txt` và dán danh sách link Google Maps (mỗi link 1 dòng).
2. Chạy lệnh tự động cào Tên, Địa chỉ, Số điện thoại, Điểm sao & Tọa độ:

```bash
node pipeline/scripts/import-gmaps.mjs
```

3. Xuất dữ liệu bản công khai cho website:

```bash
node pipeline/scripts/publish.mjs
```

4. Đẩy lên GitHub:

```bash
git add .
git commit -m "Cập nhật quán mới từ Google Maps"
git push origin main
```

## Dữ liệu mẫu

Dữ liệu quán trong phiên bản đầu được tổng hợp từ các nguồn tham khảo công khai về quán nhậu tại Vĩnh Yên. Mỗi thẻ quán đều có nút `Nguồn thông tin` để mở trang tham khảo tương ứng.

Pipeline hiện có thể hỗ trợ bước phát hiện quán mới từ nguồn mở OSM, sau đó bạn chỉ cần duyệt lại trước khi đưa lên website.

## Gợi ý nâng cấp tiếp

- Thêm trang chi tiết cho từng quán
- Thêm nhiều nguồn public hơn ngoài OSM vào pipeline
- Tự động geocode, chống trùng và chấm điểm tin cậy sâu hơn
- Cho phép người dùng gửi đánh giá trực tiếp
- Kết nối cơ sở dữ liệu để quản lý quán từ trang quản trị
