// Chỉ tạo seed được commit; không ghi đè dữ liệu API đang sử dụng.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
// Chuyển TypeScript sang CommonJS trong tiến trình này để đọc dữ liệu của ứng dụng.
// Không tạo file JavaScript trung gian và không khởi động Expo.
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    file,
  );
const { campusGraphSeed, campusBoundary } = require("../data/campusRouting.ts");
const { locations } = require("../data/mockData.ts");
// Ghép mạng đường với tên địa điểm theo id; version 1 là phiên bản khởi đầu.
// surveyed: false cho biết tọa độ/lối đi mới được dựng theo sơ đồ tham khảo.
const seed = {
  version: 1,
  surveyed: false,
  boundary: campusBoundary,
  ...campusGraphSeed,
  destinations: campusGraphSeed.destinations.map((item) => ({
    ...item,
    name: locations.find((p) => String(p.id) === item.id).name,
  })),
};
// Chạy `npm run api:seed` khi cần tạo lại seed.json từ dữ liệu nguồn.
// API đã có storage/campus.json sẽ tiếp tục dùng file lưu đó thay vì seed mới.
fs.mkdirSync(path.join(__dirname, "../server"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "../server/seed.json"),
  JSON.stringify(seed, null, 2) + "\n",
);
console.log("Created server/seed.json (approximate campus graph).");
