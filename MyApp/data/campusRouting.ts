import { fromDiagram, locationCoordinates, type Coordinate } from "./campusMap";

// Phạm vi tham khảo số hóa từ ảnh người dùng, không phải ranh giới địa chính.
export const campusBoundary = [
  [75, 420],
  [400, 20],
  [860, 510],
  [690, 865],
  [100, 540],
].map(([x, y]) => fromDiagram(x, y));
export const campusBounds = {
  south: Math.min(...campusBoundary.map((p) => p.latitude)),
  north: Math.max(...campusBoundary.map((p) => p.latitude)),
  west: Math.min(...campusBoundary.map((p) => p.longitude)),
  east: Math.max(...campusBoundary.map((p) => p.longitude)),
};
export function insideCampus(p: Coordinate) {
  let inside = false;
  for (
    let i = 0, j = campusBoundary.length - 1;
    i < campusBoundary.length;
    j = i++
  ) {
    const a = campusBoundary[i],
      b = campusBoundary[j];
    if (
      a.latitude > p.latitude !== b.latitude > p.latitude &&
      p.longitude <
        ((b.longitude - a.longitude) * (p.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude
    )
      inside = !inside;
  }
  return inside;
}
export function distance(a: Coordinate, b: Coordinate) {
  const rad = Math.PI / 180;
  const x =
    (b.longitude - a.longitude) *
    rad *
    Math.cos(((a.latitude + b.latitude) * rad) / 2);
  const y = (b.latitude - a.latitude) * rad;
  return Math.hypot(x, y) * 6371000;
}

// Trục đường màu xanh và các nhánh trên ảnh sơ đồ. Không nối thẳng mọi cặp ghim.
// Chưa khảo sát thực địa: chỉ dùng để xem tuyến tham khảo, không chỉ dẫn rẽ trực tiếp.
const junctions: Record<string, Coordinate> = {
  gate: locationCoordinates[10]!,
  fork: fromDiagram(220, 275),
  library: fromDiagram(315, 360),
  bridge: fromDiagram(370, 420),
  middle: fromDiagram(490, 550),
  sport: fromDiagram(550, 610),
  canteen: fromDiagram(610, 675),
  rear: locationCoordinates[11]!,
  north7: fromDiagram(270, 220),
  north8: fromDiagram(305, 170),
  north9: fromDiagram(340, 138),
  west: fromDiagram(77, 420),
  medicine: fromDiagram(110, 485),
  agriculture: fromDiagram(495, 330),
  school: fromDiagram(720, 515),
};
const links: [string, string][] = [
  ["gate", "fork"],
  ["fork", "library"],
  ["library", "bridge"],
  ["bridge", "middle"],
  ["middle", "sport"],
  ["sport", "canteen"],
  ["canteen", "rear"],
  ["fork", "north7"],
  ["north7", "north8"],
  ["north8", "north9"],
  ["gate", "west"],
  ["west", "medicine"],
  ["bridge", "agriculture"],
  ["middle", "school"],
];
// Nhánh tiếp cận là ước lượng, cần xác minh lối vào trước khi bật điều hướng thực tế.
const anchors: Record<number, string> = {
  1: "library",
  2: "bridge",
  3: "canteen",
  5: "medicine",
  6: "bridge",
  7: "north7",
  8: "north8",
  9: "north9",
  10: "gate",
  11: "rear",
  12: "rear",
  13: "sport",
  14: "school",
  100: "gate",
};
const nodes = { ...junctions };
for (const [key, anchor] of Object.entries(anchors)) {
  const id = Number(key);
  nodes[`p${id}`] =
    id === 100 ? locationCoordinates[10]! : locationCoordinates[id]!;
  links.push([anchor, `p${id}`]);
}
export const walkways = links.map(([a, b]) => [nodes[a], nodes[b]]);
// Xuất bản sao để tạo dữ liệu khởi đầu cho API; không thay đổi mạng đường của ứng dụng.
export const campusGraphSeed = {
  // Chuyển bảng tọa độ thành danh sách node có id để API lưu và tham chiếu.
  nodes: Object.entries(nodes).map(([id, coordinate]) => ({
    id,
    ...coordinate,
  })),
  // Dữ liệu ban đầu coi các lối đi là hai chiều, đang mở; API cho phép sửa sau.
  edges: links.map(([from, to], index) => ({
    id: `e${index + 1}`,
    from,
    to,
    bidirectional: true,
    closed: false,
  })),
  // Giữ id địa điểm của ứng dụng, liên kết tới node p{id} trong mạng đường.
  destinations: Object.keys(anchors).map((id) => ({ id, nodeId: `p${id}` })),
};
export type CampusRoute = {
  points: Coordinate[];
  meters: number;
  minutes: number;
};
export function canRoute(id: number) {
  return !!anchors[id];
}

// Dijkstra chạy cục bộ trên mạng lối đi, không gọi API và không đưa tuyến ra ngoài trường.
export function findCampusRoute(
  startId: number,
  endId: number,
): CampusRoute | null {
  if (!canRoute(startId) || !canRoute(endId)) return null;
  const start = `p${startId}`,
    end = `p${endId}`;
  const costs: Record<string, number> = { [start]: 0 };
  const previous: Record<string, string> = {};
  const pending = new Set(Object.keys(nodes));
  while (pending.size) {
    const next = [...pending].reduce((a, b) =>
      (costs[a] ?? Infinity) <= (costs[b] ?? Infinity) ? a : b,
    );
    if (!Number.isFinite(costs[next])) break;
    pending.delete(next);
    if (next === end) break;
    for (const [a, b] of links) {
      const neighbor = a === next ? b : b === next ? a : undefined;
      if (!neighbor || !pending.has(neighbor)) continue;
      const cost = costs[next] + distance(nodes[next], nodes[neighbor]);
      if (cost < (costs[neighbor] ?? Infinity)) {
        costs[neighbor] = cost;
        previous[neighbor] = next;
      }
    }
  }
  if (!Number.isFinite(costs[end])) return null;
  const ids = [end];
  while (ids[0] !== start) {
    const parent = previous[ids[0]];
    if (!parent) return null;
    ids.unshift(parent);
  }
  const points = ids
    .map((id) => nodes[id])
    .filter((p, index, all) => !index || distance(p, all[index - 1]) > 0.2);
  // Kiểm tra cả đoạn thay vì chỉ hai đầu để không đi xuyên ra ngoài đa giác giới hạn.
  if (
    points.some(
      (p, i) =>
        !insideCampus(p) ||
        (i > 0 &&
          Array.from({ length: 20 }, (_, n) => {
            const t = n / 20,
              a = points[i - 1];
            return !insideCampus({
              latitude: a.latitude + (p.latitude - a.latitude) * t,
              longitude: a.longitude + (p.longitude - a.longitude) * t,
            });
          }).some(Boolean)),
    )
  )
    return null;
  return {
    points,
    meters: Math.round(costs[end]),
    minutes: Math.max(1, Math.ceil(costs[end] / 75)),
  };
}
