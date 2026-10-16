# Smart Campus

Smart Campus là ứng dụng hỗ trợ sinh viên Đại học Tây Nguyên tra cứu thông tin học tập và khám phá khuôn viên trường. Dự án gồm ứng dụng đa nền tảng xây dựng bằng Expo/React Native và API Node.js/Express.

## Chức năng

- Trang chủ và các màn hình đăng nhập, đăng ký, hồ sơ sinh viên.
- Bản đồ khuôn viên, tìm kiếm địa điểm và xem thông tin địa điểm.
- Danh sách sự kiện, thông báo trong ứng dụng và lịch học.
- Lấy thông báo mới từ RSS của trường; tra thời khóa biểu và kết quả học tập theo mã sinh viên qua website trường.
- API có endpoint lịch học lưu bằng MongoDB.

Một số luồng như đăng nhập, đăng ký, hồ sơ, sự kiện và dữ liệu nhắc nhở hiện dùng dữ liệu mẫu/mô phỏng; đây chưa phải hệ thống xác thực hay lưu trữ tài khoản hoàn chỉnh.

## Yêu cầu

- Node.js phiên bản LTS và npm.
- Expo Go để chạy trên điện thoại, hoặc Android Emulator/iOS Simulator tương ứng.
- MongoDB (local hoặc Atlas) nếu cần dùng các API truy cập dữ liệu lịch học trong MongoDB.

## Chạy dự án

Frontend và API chạy riêng trong hai terminal. Mở terminal thứ nhất để chạy API:

```powershell
cd D:\SmartCampus-dev\api
npm install
node server.js
```

Mặc định API chạy tại `http://localhost:3000`. Có thể kiểm tra server bằng cách mở URL đó trong trình duyệt; API sẽ trả về thông báo server đang hoạt động.

Để cấu hình MongoDB, tạo file `api/.env` (file này đã được Git bỏ qua) và điền URI MongoDB của bạn:

```env
PORT=3000
MONGO_URI=<MongoDB connection string>
```

Thay `<MongoDB connection string>` bằng URI thật của MongoDB local hoặc Atlas. API vẫn có thể khởi động khi chưa kết nối được MongoDB, nhưng các endpoint cần cơ sở dữ liệu sẽ không hoạt động.

Mở terminal thứ hai để chạy ứng dụng Expo:

```powershell
cd D:\SmartCampus-dev\MyApp
npm install
npm start
```

Trong giao diện Expo, nhấn `w` để mở phiên bản web, nhấn `a` để mở Android Emulator, hoặc quét mã QR bằng Expo Go. Có thể chạy web trực tiếp bằng `npm run web`.

## Kết nối API khi chạy app

Mặc định, app gọi API tại `http://localhost:3000`. Riêng thông báo trường có thể cấu hình URL bằng biến `EXPO_PUBLIC_API_BASE_URL` trong môi trường chạy Expo; nếu không đặt, app dùng URL mặc định trên.

Các yêu cầu thời khóa biểu và điểm hiện đang gọi trực tiếp `http://localhost:3000`. Vì vậy, `localhost` phù hợp khi chạy web trên cùng máy. Khi chạy trên điện thoại thật, hãy dùng địa chỉ IP nội bộ của máy tính thay cho `localhost` trong các URL API tương ứng; điện thoại và máy tính cần cùng mạng Wi-Fi, và firewall cần cho phép kết nối tới cổng API.

## API hiện có

- `GET /` - kiểm tra API.
- `GET /api/notices` - lấy thông báo từ RSS của trường.
- `GET /api/timetable/:msv` - tra thời khóa biểu theo mã sinh viên 8 chữ số.
- `GET /api/grades/:msv` - tra kết quả học tập theo mã sinh viên 8 chữ số.
- `GET /api/schedules` - lấy lịch học từ MongoDB.

Ví dụ: `http://localhost:3000/api/timetable/23103047`.

## Kiểm tra frontend

```powershell
cd D:\SmartCampus-dev\MyApp
npm run typecheck
npm run lint
npm run export:web
```
