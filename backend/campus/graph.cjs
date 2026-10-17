// Mỗi edge là một đoạn thẳng; đường cong cần chia thành nhiều nodes khảo sát.
// Gắn mã HTTP vào lỗi để api.cjs trả thông báo thống nhất cho phía gọi API.
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
// Xấp xỉ khoảng cách theo mét giữa hai tọa độ, phù hợp phạm vi nhỏ của trường.
function distance(a, b) {
  const rad = Math.PI / 180;
  return Math.hypot((b.longitude - a.longitude) * rad * Math.cos((a.latitude + b.latitude) * rad / 2), (b.latitude - a.latitude) * rad) * 6371000;
}
// Kiểm tra điểm trong ranh giới bằng cách đếm số lần tia cắt cạnh đa giác (chẵn/lẻ).
function inside(p, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.latitude > p.latitude) !== (b.latitude > p.latitude) && p.longitude < (b.longitude - a.longitude) * (p.latitude - a.latitude) / (b.latitude - a.latitude) + a.longitude) result = !result;
  }
  return result;
}
// Chia đoạn tại mọi giao điểm với ranh giới và kiểm tra từng khoảng.
function contained(a, b, polygon) {
  if (!inside(a, polygon) || !inside(b, polygon)) return false;
  const cross = (x, y) => x[0] * y[1] - x[1] * y[0];
  const r = [b.longitude - a.longitude, b.latitude - a.latitude], cuts = [0, 1];
  for (let i = 0; i < polygon.length; i++) {
    const c = polygon[i], d = polygon[(i + 1) % polygon.length];
    const s = [d.longitude - c.longitude, d.latitude - c.latitude];
    const q = [c.longitude - a.longitude, c.latitude - a.latitude];
    const denominator = cross(r, s);
    if (Math.abs(denominator) < 1e-18) continue;
    const t = cross(q, s) / denominator, u = cross(q, r) / denominator;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) cuts.push(t);
  }
  cuts.sort((x, y) => x - y);
  return cuts.slice(1).every((end, i) => {
    const t = (cuts[i] + end) / 2;
    return inside({ longitude: a.longitude + r[0] * t, latitude: a.latitude + r[1] * t }, polygon);
  });
}
// Danh sách trường hợp lệ và bắt buộc của từng loại bản ghi.
// node = tọa độ; edge = đoạn nối hai node; destination = tên địa điểm gắn với node.
const fields = {
  nodes: ['id', 'latitude', 'longitude'],
  edges: ['id', 'from', 'to', 'bidirectional', 'closed'],
  destinations: ['id', 'nodeId', 'name'],
};
// Kiểm tra cấu trúc một bản ghi; PATCH cũng phải được gộp với bản cũ trước bước này.
function validateRecord(collection, record) {
  const keys = fields[collection];
  if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(record, k))) fail(400, `Các trường bắt buộc: ${keys.join(', ')}`);
  if (typeof record.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(record.id)) fail(400, 'id phải là chuỗi 1–64 ký tự chữ, số, _ hoặc -.');
  if (collection === 'nodes' && (!Number.isFinite(record.latitude) || !Number.isFinite(record.longitude) || Math.abs(record.latitude) > 90 || Math.abs(record.longitude) > 180)) fail(400, 'Tọa độ không hợp lệ.');
  if (collection === 'edges' && (typeof record.from !== 'string' || typeof record.to !== 'string' || record.from === record.to || typeof record.bidirectional !== 'boolean' || typeof record.closed !== 'boolean')) fail(400, 'Lối đi không hợp lệ.');
  if (collection === 'destinations' && (typeof record.nodeId !== 'string' || typeof record.name !== 'string' || !record.name.trim() || record.name.length > 200)) fail(400, 'Tên hoặc nodeId không hợp lệ.');
}
// Kiểm tra quan hệ toàn bản đồ: id không trùng trong từng loại, tham chiếu tồn tại,
// các điểm và toàn bộ đoạn đường phải nằm trong ranh giới khuôn viên.
function validateGraph(graph) {
  for (const key of Object.keys(fields)) {
    const ids = new Set();
    for (const record of graph[key]) {
      validateRecord(key, record);
      if (ids.has(record.id)) fail(409, 'Trùng id.');
      ids.add(record.id);
    }
  }
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  for (const n of nodes.values()) if (!inside(n, graph.boundary)) fail(400, 'Điểm nằm ngoài khuôn viên.');
  for (const e of graph.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) fail(409, 'Lối đi tham chiếu node không tồn tại.');
    if (!contained(nodes.get(e.from), nodes.get(e.to), graph.boundary)) fail(400, 'Lối đi vượt ra ngoài khuôn viên.');
  }
  for (const d of graph.destinations) if (!nodes.has(d.nodeId)) fail(409, 'Điểm đến tham chiếu node không tồn tại.');
}
// from/to là id địa điểm (destination), không phải id node hay tọa độ GPS.
function route(graph, from, to) {
  const start = graph.destinations.find(d => d.id === from), end = graph.destinations.find(d => d.id === to);
  if (!start || !end) fail(404, 'Không tìm thấy điểm xuất phát hoặc điểm đến.');
  const nodes = new Map(graph.nodes.map(n => [n.id, n]));
  // Danh sách kề lưu các node có thể đi tới và chiều dài đoạn đường tương ứng.
  // Bỏ đường đóng; chỉ thêm chiều ngược lại khi bidirectional = true.
  const adjacency = new Map(graph.nodes.map(n => [n.id, []]));
  for (const edge of graph.edges) {
    if (edge.closed) continue;
    const cost = distance(nodes.get(edge.from), nodes.get(edge.to));
    adjacency.get(edge.from).push({ to: edge.to, cost, edgeId: edge.id });
    if (edge.bidirectional) adjacency.get(edge.to).push({ to: edge.from, cost, edgeId: edge.id });
  }
  // Dijkstra chọn tuyến có tổng chiều dài nhỏ nhất, kể cả khi có nhiều lối đi.
  // costs: quãng đường ngắn nhất đã biết; previous: bước trước để dựng lại tuyến.
  // pending: các node chưa chốt khoảng cách ngắn nhất.
  const costs = new Map([[start.nodeId, 0]]), previous = new Map(), pending = new Set(nodes.keys());
  while (pending.size) {
    let current, best = Infinity;
    for (const id of pending) if ((costs.get(id) ?? Infinity) < best) { current = id; best = costs.get(id); }
    if (current === undefined || current === end.nodeId) break;
    pending.delete(current);
    for (const next of adjacency.get(current)) {
      if (!pending.has(next.to)) continue;
      // Nếu đi qua current ngắn hơn tuyến đã biết, cập nhật khoảng cách và bước trước.
      const cost = best + next.cost;
      if (cost < (costs.get(next.to) ?? Infinity)) { costs.set(next.to, cost); previous.set(next.to, { from: current, edgeId: next.edgeId }); }
    }
  }
  if (!costs.has(end.nodeId)) fail(422, 'Không có lối đi đang mở nối hai điểm.');
  // Lần ngược từ đích về đầu, chèn vào đầu mảng để trả tuyến theo thứ tự di chuyển.
  const ids = [end.nodeId], edgeIds = [];
  while (ids[0] !== start.nodeId) { const p = previous.get(ids[0]); ids.unshift(p.from); edgeIds.unshift(p.edgeId); }
  // points dùng để vẽ đường trên bản đồ; minutes ước tính đi bộ 75 mét/phút.
  // surveyed vẫn là false vì dữ liệu mẫu chưa khảo sát; chưa tạo hướng dẫn rẽ từng chặng.
  const meters = Math.round(costs.get(end.nodeId));
  return { from, to, version: graph.version, surveyed: false, meters, minutes: Math.ceil(meters / 75), nodeIds: ids, edgeIds, points: ids.map(id => { const { latitude, longitude } = nodes.get(id); return { latitude, longitude }; }) };
}
module.exports = { fields, fail, validateRecord, validateGraph, route };
