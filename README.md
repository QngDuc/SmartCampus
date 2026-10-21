## Chạy API và web trên Windows

Lưu hồ sơ cần API backend chạy phiên bản mới. Nếu đang có API cũ chạy, dừng bằng `Ctrl+C` trước khi chạy lại.

**Terminal 1 — API**

```powershell
cd D:\SmartCampus\SmartCampus\backend
npm start
```

Chờ dòng `Server đang chạy tại http://localhost:3000` và thông báo kết nối MongoDB thành công.

**Terminal 2 — ứng dụng web**

```powershell
cd D:\SmartCampus\SmartCampus\MyApp
npm run web
```

Trang hồ sơ lưu thông tin qua `PATCH /api/auth/profile` trên API cổng 3000. Nếu đổi code backend, hãy khởi động lại API; chỉ tải lại trang web sẽ không cập nhật tiến trình backend đang chạy.

<div align="center">

# 🎓 Smart Campus

**Ứng dụng đồng hành cùng sinh viên Đại học Tây Nguyên**
*Tra cứu thông tin học tập · Khám phá khuôn viên trường · Cập nhật thông báo*

![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)

</div>

---

## 📑 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Chức năng](#-chức-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Yêu cầu](#-yêu-cầu)
- [Cài đặt và chạy dự án](#-cài-đặt-và-chạy-dự-án)
- [Kết nối API khi chạy app](#-kết-nối-api-khi-chạy-app)
- [API hiện có](#-api-hiện-có)
- [Kiểm tra frontend](#-kiểm-tra-frontend)
- [Lưu ý](#-lưu-ý)

---

## 📖 Giới thiệu

**Smart Campus** là ứng dụng hỗ trợ sinh viên Đại học Tây Nguyên tra cứu thông tin học tập và khám phá khuôn viên trường.

Dự án gồm hai phần:

| Thành phần | Mô tả | Thư mục |
|---|---|---|
| 📱 **Ứng dụng** | Ứng dụng đa nền tảng (web, Android, iOS) xây dựng bằng Expo/React Native | `MyApp/` |
| 🖥️ **API** | Máy chủ Node.js/Express cung cấp dữ liệu thông báo, thời khóa biểu, điểm | `backend/` |

---

## ✨ Chức năng

| | Chức năng | Chi tiết |
|---|---|---|
| 🏠 | **Tài khoản** | Trang chủ, đăng nhập, đăng ký, hồ sơ sinh viên |
| 🗺️ | **Bản đồ khuôn viên** | Xem bản đồ, tìm kiếm địa điểm, xem thông tin địa điểm |
| 📅 | **Sự kiện & lịch học** | Danh sách sự kiện, thông báo trong ứng dụng, lịch học |
| 📢 | **Thông báo trường** | Lấy thông báo mới từ RSS của trường |
| 🎯 | **Tra cứu học tập** | Tra thời khóa biểu và kết quả học tập theo mã sinh viên qua website trường |
| 🗄️ | **Lịch học lưu trữ** | Endpoint lịch học lưu bằng MongoDB |

> [!NOTE]
> Một số luồng như đăng nhập, đăng ký, hồ sơ, sự kiện và dữ liệu nhắc nhở hiện dùng **dữ liệu mẫu/mô phỏng**; đây chưa phải hệ thống xác thực hay lưu trữ tài khoản hoàn chỉnh.

---

## 🧰 Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Frontend | Expo, React Native, TypeScript |
| Backend | Node.js, Express |
| Cơ sở dữ liệu | MongoDB (local hoặc Atlas) |
| Nguồn dữ liệu | RSS và website của trường |

---

## 📂 Cấu trúc dự án

```text
SmartCampus-dev/
├── backend/        # API Node.js/Express
│   ├── server.js   # Điểm khởi chạy API
│   └── .env        # Cấu hình PORT, MONGO_URI (không đưa lên Git)
└── MyApp/          # Ứng dụng Expo/React Native
```

---

## 📋 Yêu cầu

- ✅ **Node.js** phiên bản LTS và **npm**
- ✅ **Expo Go** để chạy trên điện thoại, hoặc **Android Emulator / iOS Simulator** tương ứng
- ✅ **MongoDB** (local hoặc Atlas) nếu cần dùng các API truy cập dữ liệu lịch học trong MongoDB

---

## 🚀 Cài đặt và chạy dự án

Frontend và API chạy riêng trong **hai terminal**.
### 1️⃣Cấu hình MongoDB (tùy chọn)

Tạo file `backend/.env` (file này đã được Git bỏ qua) và điền URI MongoDB của bạn:

```env
PORT=3000
MONGO_URI=<MongoDB connection string>
```

Thay `<MongoDB connection string>` bằng URI thật của MongoDB local hoặc Atlas.

> [!TIP]
> API vẫn có thể khởi động khi chưa kết nối được MongoDB, nhưng các endpoint cần cơ sở dữ liệu sẽ không hoạt động.

### 2️⃣ Chạy API (terminal thứ nhất)

```powershell
cd D:\SmartCampus-dev\backend
npm install
node server.js
```

Mặc định API chạy tại `http://localhost:3000`. Mở URL này trong trình duyệt để kiểm tra; API sẽ trả về thông báo server đang hoạt động.



### 3️⃣ Chạy ứng dụng Expo (terminal thứ hai)

```powershell
cd D:\SmartCampus-dev\MyApp
npm install
npm start
```

Trong giao diện Expo:

| Phím / Thao tác | Kết quả |
|---|---|
| `w` | Mở phiên bản web |
| `a` | Mở Android Emulator |
| Quét mã QR | Chạy trên điện thoại bằng Expo Go |

Có thể chạy web trực tiếp bằng:

```powershell
npm run web
```

---

## 🔌 Kết nối API khi chạy app

Mặc định, app gọi API tại `http://localhost:3000`.

- 📢 **Thông báo trường** có thể cấu hình URL bằng biến môi trường `EXPO_PUBLIC_API_BASE_URL` khi chạy Expo. Nếu không đặt, app dùng URL mặc định ở trên.
- 📅 **Thời khóa biểu và điểm** hiện gọi trực tiếp `http://localhost:3000`.

### 📱 Chạy trên điện thoại thật

`localhost` chỉ phù hợp khi chạy web trên cùng máy. Với điện thoại thật:

1. Dùng **địa chỉ IP nội bộ** của máy tính thay cho `localhost` trong các URL API tương ứng.
2. Điện thoại và máy tính phải cùng mạng **Wi-Fi**.
3. **Firewall** cần cho phép kết nối tới cổng API.

---

## 📡 API hiện có

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/` | Kiểm tra API đang hoạt động |
| `GET` | `/api/notices` | Lấy thông báo từ RSS của trường |
| `GET` | `/api/timetable/:msv` | Tra thời khóa biểu theo mã sinh viên 8 chữ số |
| `GET` | `/api/grades/:msv` | Tra kết quả học tập theo mã sinh viên 8 chữ số |
| `GET` | `/api/schedules` | Lấy lịch học từ MongoDB |

**Ví dụ:**

```text
http://localhost:3000/api/timetable/23103047
```

---

## 🧪 Kiểm tra frontend

```powershell
cd D:\SmartCampus-dev\MyApp
npm run typecheck
npm run lint
npm run export:web
```

| Lệnh | Mục đích |
|---|---|
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | Kiểm tra chất lượng mã nguồn |
| `npm run export:web` | Xuất bản build web |

---

## ⚠️ Lưu ý

- Dữ liệu đăng nhập, đăng ký, hồ sơ, sự kiện và nhắc nhở hiện là dữ liệu mô phỏng.
- Các endpoint cần cơ sở dữ liệu chỉ hoạt động khi đã cấu hình `MONGO_URI` hợp lệ.
- Không đưa file `.env` chứa thông tin kết nối thật lên Git.

---

<div align="center">

Made with ❤️ for sinh viên Đại học Tây Nguyên

</div>
