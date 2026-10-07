# API chỉ đường trong trường Tây Nguyên

API bản đồ nằm trong backend chung tại ../api/campus và chạy cùng API lịch học trên cổng 3000. Cài dependencies bằng npm install trong thư mục ../api; khởi động bằng npm start tại đó hoặc npm run api từ MyApp. Dữ liệu seed lấy từ sơ đồ tham khảo hiện có, **chưa khảo sát thực tế**. Chỉ tính tuyến đi bộ theo các lối đã nhập, không tự suy ra lối đi từ ảnh và không cung cấp điều hướng GPS từng chặng.

## Chạy trên máy tính (PowerShell)

```powershell
$env:API_ADMIN_TOKEN = 'thay-bang-token-rieng-cua-ban'
npm run api
```

Mở `http://127.0.0.1:3000/api/destinations` hoặc thử trong Postman. Không đặt token quản trị trong mã nguồn, biến `EXPO_PUBLIC_*` hay ứng dụng gửi cho sinh viên. Không cấu hình token thì API chỉ cho đọc và tính đường. Đây là backend phát triển cho một tiến trình; trước khi triển khai công khai cần HTTPS và cơ chế đăng nhập/phân quyền phù hợp.

## Các endpoint

| Phương thức | Đường dẫn | Công dụng |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra server |
| GET | `/api/map` | Snapshot gồm version, boundary, nodes, edges, destinations |
| GET | `/api/nodes`, `/api/edges`, `/api/destinations` | Danh sách |
| GET | `/api/nodes/:id`, `/api/edges/:id`, `/api/destinations/:id` | Một bản ghi |
| POST | `/api/nodes`, `/api/edges`, `/api/destinations` | Tạo bản ghi |
| PUT | Các URL có `/:id` | Thay toàn bộ bản ghi, gồm id |
| PATCH | Các URL có `/:id` | Sửa một số trường |
| DELETE | Các URL có `/:id` | Xóa bản ghi |
| GET | `/api/routes?from=10&to=1` | Đường ngắn nhất từ cổng chính tới thư viện |
| POST | `/api/routes` | Tính đường với JSON `{"from":"10","to":"1"}` |

`PUSH` không phải phương thức cập nhật HTTP; dùng `PUT` hoặc `PATCH`. POST routes chỉ tính đường, không lưu tuyến cố định. Khi thay đổi hoặc đóng lối đi, lần tính đường tiếp theo sử dụng dữ liệu mới.

## Dữ liệu và ví dụ Postman

Mọi id là **chuỗi**. Body dùng `Content-Type: application/json`. Tạo/sửa/xóa dữ liệu cần `Authorization: Bearer <API_ADMIN_TOKEN>`; tính đường không cần token.

Node là điểm giao nhau, điểm uốn của đường hoặc cửa vào tòa nhà:

```json
{"id":"survey-1","latitude":12.65155538,"longitude":108.02389741}
```

Edge nối hai node theo lối đi thực tế. Đường cong phải chia nhỏ thành nhiều đoạn. Tạo các node trước, sau đó POST `/api/edges`:

```json
{"id":"path-1","from":"gate","to":"survey-1","bidirectional":true,"closed":false}
```

POST `/api/destinations` gắn địa điểm với node tại **lối vào**, không phải tâm tòa nhà:

```json
{"id":"new-place","name":"Địa điểm khảo sát","nodeId":"survey-1"}
```

PATCH `/api/edges/path-1` để đóng lối đi:

```json
{"closed":true}
```

DELETE `/api/destinations/new-place` để xóa điểm đến. Trước khi xóa node, phải xóa hoặc đổi các edges/destinations tham chiếu node đó; nếu không, API trả 409. Xóa điểm đến không tự xóa đường dùng chung.

Thử tính đường bằng PowerShell:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3000/api/routes?from=10&to=1'
```

Kết quả gồm `from`, `to`, `version`, `surveyed:false`, `meters`, `minutes`, `nodeIds`, `edgeIds`, `points` (latitude/longitude để vẽ đường). Thời gian ước lượng theo 75 m/phút. Dijkstra chọn tổng chiều dài nhỏ nhất, bỏ đường `closed`, tôn trọng chiều đường. Nếu có nhiều tuyến bằng nhau, trả một tuyến; chưa trả danh sách tuyến thay thế hay hướng dẫn rẽ.

Lỗi: 400 dữ liệu sai/ngoài trường; 401 sai token; 403 origin web bị chặn; 404 không tìm thấy; 405 sai phương thức; 409 trùng id/tham chiếu không hợp lệ; 413 body quá 64 KB; 415 sai Content-Type; 422 không có đường; 503 chưa cấu hình token chỉnh sửa. Body lỗi: `{"error":{"message":"..."}}`.

## Dùng iPhone và cập nhật dữ liệu

Để thử qua cùng Wi-Fi, khởi động server với `$env:API_HOST = '0.0.0.0'`, dùng `http://<IPv4-may-tinh>:3000/api/destinations` trên iPhone. `localhost` trên iPhone là chính điện thoại. Cho phép cổng 3000 trong tường lửa mạng riêng nếu cần. Web chạy ở origin khác cần khai báo `API_CORS_ORIGINS` (các origin cách nhau dấu phẩy).

Dữ liệu chỉnh sửa lưu ở `../api/campus/storage/campus.json`, tồn tại sau khi khởi động lại và không commit Git. Có thể đổi bằng `API_DATA_FILE`; sao lưu file này. Một tiến trình API sở hữu một file; không chạy nhiều tiến trình dùng chung file. Dữ liệu ban đầu nằm trong `../api/campus/seed.json`; `npm run api:seed` chỉ tạo lại seed từ sơ đồ của app, không ghi đè dữ liệu đang sử dụng.

Ứng dụng bản đồ hiện vẫn dùng dữ liệu cục bộ, **chưa tự gọi hoặc đồng bộ API này**. GET `/api/map` cung cấp snapshot có version để làm phần đồng bộ tiếp theo. API cần kết nối tới server; dùng offline cần tải snapshot về điện thoại, lưu bản đồ nền và tính đường trên thiết bị. Chưa triển khai cache/offline sync trong thay đổi này.

## Kiểm tra

```powershell
npm run test:api
npm run test:routes
npm run typecheck
npm run lint
```
