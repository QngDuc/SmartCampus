// Tạo data/campusBoundary.ts từ đường viền thật của trường.
//   node scripts/make-boundary.cjs duong-vien.gpx     (đi bộ quanh trường, ghi GPX)
//   node scripts/make-boundary.cjs overpass.json      (xuất từ overpass-turbo: way(241971731); out geom;)
const fs = require("node:fs");
const path = require("node:path");
const file = process.argv[2];
if (!file) throw new Error("Cách dùng: node scripts/make-boundary.cjs <file.gpx|file.json>");
const text = fs.readFileSync(file, "utf8");
let ring;
if (file.toLowerCase().endsWith(".json")) {
  const json = JSON.parse(text);
  const way = (json.elements ?? []).find((e) => Array.isArray(e.geometry));
  if (!way) throw new Error("JSON không có way nào kèm geometry (dùng 'out geom;').");
  ring = way.geometry.map((p) => [p.lat, p.lon]);
} else {
  ring = [...text.matchAll(/<trkpt lat="([\d.\-]+)" lon="([\d.\-]+)"/g)].map((m) => [+m[1], +m[2]]);
}
if (ring.length < 4) throw new Error("Cần ít nhất 4 điểm.");
const first = ring[0], last = ring[ring.length - 1];
if (Math.abs(first[0] - last[0]) < 1e-7 && Math.abs(first[1] - last[1]) < 1e-7) ring.pop();
const k = Math.cos((ring[0][0] * Math.PI) / 180);
const m = ring.map(([la, lo]) => ({ x: lo * 111320 * k, y: la * 110574 }));
function simplify(idx, eps) {
  if (idx.length < 3) return idx;
  const a = m[idx[0]], b = m[idx[idx.length - 1]], L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let far = 0, at = 0;
  for (let i = 1; i < idx.length - 1; i++) {
    const p = m[idx[i]], d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L;
    if (d > far) { far = d; at = i; }
  }
  if (far < eps) return [idx[0], idx[idx.length - 1]];
  return simplify(idx.slice(0, at + 1), eps).slice(0, -1).concat(simplify(idx.slice(at), eps));
}
const keep = simplify(ring.map((_, i) => i), 3);
const rows = keep.map((i) => `  { latitude: ${ring[i][0]}, longitude: ${ring[i][1]} },`).join("\n");
const out = path.join(__dirname, "../data/campusBoundary.ts");
fs.writeFileSync(
  out,
  `import type { Coordinate } from "./campusMap";\n\n// Ranh giới khuôn viên lấy từ ${path.basename(file)}, giản lược còn các đỉnh lệch > 3 m.\nexport const campusBoundary: Coordinate[] = [\n${rows}\n];\n`,
);
console.log(`Đã ghi ${out}: ${ring.length} điểm gốc → ${keep.length} đỉnh.`);
