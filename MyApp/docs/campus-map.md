# Sơ đồ 2D Đại học Tây Nguyên

## Hiển thị và tốc độ

- Web dùng Leaflet 1.9.4 và ảnh nền OpenStreetMap, không cần WebGL, GPU hoặc Worker. Thư viện chỉ tải phía trình duyệt để hỗ trợ Expo static rendering.
- Android/iOS giữ react-native-maps, cố định góc nhìn 2D, tắt nghiêng/xoay/nhà 3D.
- Mở bản đồ hiển thị toàn bộ các điểm trong khuôn viên. Chọn ghim/tên địa điểm để xem chi tiết và dẫn đường. Nút “Về trường” trở lại toàn cảnh.
- Dữ liệu ghim nằm sẵn trong app, hiển thị không cần đợi ảnh nền. Danh sách ghim ổn định; tìm kiếm không tạo lại ghim. Khi chọn điểm chỉ cập nhật camera và màu ghim.
- Chỉ tải ô ảnh nền trong vùng đang xem, giữ cache HTTP của trình duyệt và các ô lân cận. Không tải trước hàng loạt hoặc tải offline từ máy chủ tile công cộng.
- GPS chỉ đọc khi nhấn “Vị trí của tôi”, có xử lý từ chối quyền và hết thời gian chờ.

## Cập nhật sơ đồ

Tên, mô tả, giờ mở cửa: `data/mockData.ts` (locations). Tọa độ: `data/campusMap.ts` (locationCoordinates). Giữ id nhất quán ở hai file. Khi đang chạy Expo dev server, lưu dữ liệu sẽ được Fast Refresh cập nhật trong app. Bản phát hành cần phát hành bản cập nhật; chưa có cơ chế quản trị dữ liệu trực tuyến.

Tâm trường: 12.65067, 108.02621, theo https://mapcarta.com/W241971731 (OSM way 241971731). Địa chỉ 567 Lê Duẩn, phường Ea Kao, Đắk Lắk; đối chiếu https://tuyensinh.ttn.edu.vn/contact-us/.

Hai cổng lấy từ OpenStreetMap qua OpenFreeMap snapshot 20260913_164504_pt: node 10889665835 (Lê Duẩn), node 8647574544 (Y Wang). Trường THPT Thực hành Cao Nguyên từ OSM way 971349650. Đây là điểm bản đồ, chưa khảo sát GPS hiện trường.

Các nhà số 2, 5, 6, 7, 8, 9, thư viện, căn tin, nhà thi đấu và trung tâm GDQP được ước lượng từ ảnh sơ đồ do người dùng gửi, neo tại hai cổng. `approximateLocationIds` đánh dấu các điểm này. Không dùng tọa độ ước lượng làm đích GPS: Google Maps tìm theo tên đầy đủ và địa chỉ trường để người dùng kiểm tra trước khi đi. Phòng Công tác sinh viên chưa có tọa độ.

Khi có tọa độ lối vào đã khảo sát, sửa `locationCoordinates` và bỏ id khỏi `approximateLocationIds`. Nút dẫn đến trường dùng cổng chính thay vì tâm khuôn viên. Ứng dụng mở Google Maps để dẫn đường; chưa tính tuyến đường nội bộ trong app.

## Kiểm tra

Chạy `npm run typecheck`, `npm run lint`, `npm run export:web`. Mở `npm run web` để kiểm tra chọn ghim, nhấn tên, tìm không dấu, về trường, mất mạng và GPS. Kiểm tra điện thoại bằng Expo Go. Bản Android riêng vẫn cần Google Maps API key theo https://docs.expo.dev/versions/v54.0.0/sdk/map-view/.

Không còn MapLibre hoặc script chuẩn bị Worker. Nếu ảnh nền không tải, các ghim vẫn hiển thị và có nút thử tải lại ô ảnh. Nền bản đồ cần kết nối Internet. Tốc độ thực tế phụ thuộc mạng và thiết bị; dung lượng bundle không phải phép đo thời gian tải.
