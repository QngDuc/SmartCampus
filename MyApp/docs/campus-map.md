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

Các nhà số 2, 5, 6, 7, 8, 9, thư viện, căn tin, nhà thi đấu và trung tâm GDQP được ước lượng từ ảnh sơ đồ do người dùng gửi, neo tại hai cổng. `approximateLocationIds` đánh dấu các điểm này. Phòng Công tác sinh viên chưa có tọa độ/lối đi nên không tạo tuyến.

Khi có tọa độ lối vào đã khảo sát, sửa `locationCoordinates` và bỏ id khỏi `approximateLocationIds`. Cần cập nhật các nút, nhánh và phạm vi trong `data/campusRouting.ts` theo khảo sát tương ứng.

## Tuyến nội khu và phạm vi

Màn hình gồm hai ô chọn điểm xuất phát/đến, bản đồ chiếm phần giữa, nút vị trí/toàn trường và khung thông tin phía dưới. Nút dẫn đường từ chi tiết chuyển đến bản đồ trong app. Tuyến xanh được tính cục bộ bằng Dijkstra trên các nhánh số hóa từ sơ đồ; không gọi API định tuyến ngoài trường. Khoảng cách tính theo tọa độ ước lượng, thời gian theo tốc độ đi bộ giả định 75 m/phút.

Đường và các nhánh tiếp cận chưa được khảo sát. Đây là **xem trước tuyến tham khảo**, chưa xác nhận có thể đi được, chưa có hướng dẫn rẽ theo thời gian thực hay giọng nói. Không dùng đường thẳng từ GPS đến tòa nhà. GPS hiện chỉ hiển thị vị trí khi nằm trong đa giác và độ chính xác tốt hơn 50 m; điểm xuất phát do người dùng chọn.

Phạm vi đa giác được ước lượng từ ảnh, không phải ranh giới địa chính. Web dùng maxBounds, giới hạn zoom, giới hạn tile và che bên ngoài. Android dùng setMapBoundaries; iOS kiểm tra tâm camera sau thao tác. Cả hai native đều che bên ngoài đa giác. Đồ thị không có đường công cộng bên ngoài; các đoạn tuyến được kiểm tra không vượt đa giác. `npm run test:routes` kiểm tra 196 cặp điểm, chiều ngược, độ dài và phạm vi.

## Kiểm tra

Chạy `npm run typecheck`, `npm run lint`, `npm run export:web`. Mở `npm run web` để kiểm tra chọn ghim, nhấn tên, tìm không dấu, về trường, mất mạng và GPS. Kiểm tra điện thoại bằng Expo Go. Bản Android riêng vẫn cần Google Maps API key theo https://docs.expo.dev/versions/v54.0.0/sdk/map-view/.

Không còn MapLibre hoặc script chuẩn bị Worker. Nếu ảnh nền không tải, các ghim vẫn hiển thị và có nút thử tải lại ô ảnh. Nền bản đồ cần kết nối Internet. Tốc độ thực tế phụ thuộc mạng và thiết bị; dung lượng bundle không phải phép đo thời gian tải.
