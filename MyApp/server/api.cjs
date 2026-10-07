// Máy chủ API chạy riêng bằng `npm run api`; ứng dụng Expo chưa gọi API này.
// Luồng xử lý: đọc yêu cầu → kiểm tra quyền/dữ liệu → tìm đường hoặc lưu → trả JSON.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const {
  fields,
  fail,
  validateRecord,
  validateGraph,
  route,
} = require("./graph.cjs");

// Cho phép truyền cấu hình để chạy thật hoặc kiểm thử với file dữ liệu riêng.
function createApi({
  dataFile = path.join(__dirname, "storage/campus.json"),
  adminToken = "",
  origins = [],
} = {}) {
  // Ưu tiên dữ liệu đã lưu; lần đầu chạy mới dùng seed.json làm bản đồ ban đầu.
  let graph = JSON.parse(
    fs.readFileSync(
      fs.existsSync(dataFile) ? dataFile : path.join(__dirname, "seed.json"),
      "utf8",
    ),
  );
  validateGraph(graph);
  // Kiểm tra toàn bộ quan hệ trước khi lưu, rồi tăng version để nhận biết bản cập nhật.
  function commit(next) {
    validateGraph(next);
    next.version = graph.version + 1;
    next.updatedAt = new Date().toISOString();
    // Ghi file tạm rồi đổi tên; chỉ cập nhật bộ nhớ khi lưu thành công.
    // Thiết kế cho một tiến trình API, không dùng chung file giữa nhiều server.
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(`${dataFile}.tmp`, JSON.stringify(next, null, 2) + "\n");
    fs.renameSync(`${dataFile}.tmp`, dataFile);
    graph = next;
  }

  // Đọc các phần dữ liệu gửi lên, giới hạn 64 KB và chỉ nhận một object JSON.
  async function body(req) {
    if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || ""))
      fail(415, "Dùng Content-Type: application/json.");
    let bytes = 0;
    const chunks = [];
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 65536) fail(413, "JSON tối đa 64 KB.");
      chunks.push(chunk);
    }
    let value;
    try {
      value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      fail(400, "JSON không hợp lệ.");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
      fail(400, "Body phải là object JSON.");
    return value;
  }
  return http.createServer(async (req, res) => {
    const send = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(value === undefined ? undefined : JSON.stringify(value));
    };
    try {
      // CORS cho trình duyệt: chỉ chấp nhận Origin trong danh sách cấu hình.
      // Đây không phải xác thực quản trị; quyền ghi vẫn được kiểm tra bằng token bên dưới.
      if (req.headers.origin) {
        if (!origins.includes(req.headers.origin))
          fail(403, "Origin chưa được cho phép.");
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
        res.setHeader("Vary", "Origin");
      }

      // Trả lời yêu cầu kiểm tra CORS (preflight) trước khi trình duyệt gửi yêu cầu chính.
      if (req.method === "OPTIONS") {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );
        return send(204);
      }
      // Ví dụ /api/nodes/gate được tách thành collection = nodes, id = gate.
      const url = new URL(req.url, "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "api" || parts.length > 3)
        fail(404, "Endpoint không tồn tại.");
      const [, collection, id] = parts;

      // Các endpoint đọc và tính tuyến không cần token quản trị.
      // /health kiểm tra server; /map trả toàn bộ dữ liệu kèm phiên bản.
      if (collection === "health" && !id && req.method === "GET")
        return send(200, { ok: true });
      if (collection === "map" && !id && req.method === "GET")
        return send(200, graph);
      if (
        collection === "routes" &&
        !id &&
        ["GET", "POST"].includes(req.method)
      ) {
        // GET nhận ?from=10&to=1; POST nhận { "from": "10", "to": "1" }.
        // POST /routes chỉ tính tuyến, không tạo bản ghi hay thay đổi bản đồ.
        const query =
          req.method === "GET"
            ? Object.fromEntries(url.searchParams)
            : await body(req);
        if (typeof query.from !== "string" || typeof query.to !== "string")
          fail(400, "from và to phải là id điểm đến dạng chuỗi.");
        return send(200, route(graph, query.from, query.to));
      }

      if (!Object.hasOwn(fields, collection || ""))
        fail(404, "Endpoint không tồn tại.");
      // Dùng chung CRUD cho nodes (điểm), edges (đoạn đường), destinations (địa điểm).
      // GET có id trả một bản ghi; không có id trả cả danh sách.
      if (req.method === "GET") {
        const result = id
          ? graph[collection].find((item) => item.id === id)
          : graph[collection];
        if (!result) fail(404, "Không tìm thấy dữ liệu.");
        return send(200, result);
      }
      if (
        !["POST", "PUT", "PATCH", "DELETE"].includes(req.method) ||
        (req.method === "POST" ? !!id : !id)
      )
        fail(405, "Phương thức không hỗ trợ tại URL này.");
      // Token quản trị chỉ đặt trên máy chủ/Postman, không nhúng vào ứng dụng Expo.
      if (!adminToken) fail(503, "Chưa cấu hình API_ADMIN_TOKEN để chỉnh sửa.");
      if (req.headers.authorization !== `Bearer ${adminToken}`)
        fail(401, "Cần token quản trị hợp lệ.");
      const payload = req.method === "DELETE" ? null : await body(req);
      // Tạo snapshot sau await để hai yêu cầu đồng thời không ghi đè snapshot cũ.
      const next = structuredClone(graph),
        list = next[collection];
      const index = list.findIndex((item) => item.id === id);
      if (req.method !== "POST" && index < 0)
        fail(404, "Không tìm thấy dữ liệu.");
      // DELETE chỉ thành công nếu dữ liệu còn hợp lệ sau khi xóa.
      // Ví dụ: phải xóa đoạn đường/địa điểm tham chiếu trước khi xóa node của chúng.
      if (req.method === "DELETE") {
        list.splice(index, 1);
        commit(next);
        return send(204);
      }
      if (id && Object.hasOwn(payload, "id") && payload.id !== id)
        fail(400, "Không được đổi id.");
      // PATCH gộp các trường gửi lên với bản cũ; PUT thay toàn bộ nên cần đủ trường.
      // POST thêm bản ghi mới; validateGraph trong commit sẽ phát hiện id trùng.
      const record =
        req.method === "PATCH" ? { ...list[index], ...payload } : payload;
      validateRecord(collection, record);
      if (req.method === "POST") list.push(record);
      else list[index] = record;
      commit(next);
      return send(req.method === "POST" ? 201 : 200, record);
    } catch (error) {
      // Lỗi dự kiến giữ mã HTTP; lỗi nội bộ trả 500 và chỉ ghi chi tiết ở server.
      if (!error.status) console.error(error);
      if (!res.headersSent)
        send(error.status || 500, {
          error: {
            message: error.status ? error.message : "Không thể xử lý yêu cầu.",
          },
        });
    }
  });
}
// Chỉ mở cổng khi chạy trực tiếp; import createApi trong test không tự khởi động server.
// API_HOST/API_PORT: địa chỉ lắng nghe; API_DATA_FILE: file lưu dữ liệu.
// API_ADMIN_TOKEN: khóa sửa dữ liệu; API_CORS_ORIGINS: các web origin cách nhau bằng dấu phẩy.
if (require.main === module) {
  const host = process.env.API_HOST || "127.0.0.1",
    port = Number(process.env.API_PORT || 3001);
  const server = createApi({
    dataFile: process.env.API_DATA_FILE,
    adminToken: process.env.API_ADMIN_TOKEN,
    origins: (
      process.env.API_CORS_ORIGINS ||
      "http://localhost:8081,http://localhost:19006"
    )
      .split(",")
      .map((s) => s.trim()),
  });
  server.listen(port, host, () =>
    console.log(`Campus API: http://${host}:${port}/api/health`),
  );
}
module.exports = { createApi };
