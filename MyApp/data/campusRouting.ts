import { fromDiagram, locationCoordinates, type Coordinate } from "./campusMap";
import { campusBoundary } from "./campusBoundary";
import { surveyedJunctions, surveyedLinks } from "./surveyedPaths";

export { campusBoundary };
const BOUNDS_PADDING = 0.0003;
export const campusBounds = {
  south: Math.min(...campusBoundary.map((p) => p.latitude)) - BOUNDS_PADDING,
  north: Math.max(...campusBoundary.map((p) => p.latitude)) + BOUNDS_PADDING,
  west: Math.min(...campusBoundary.map((p) => p.longitude)) - BOUNDS_PADDING,
  east: Math.max(...campusBoundary.map((p) => p.longitude)) + BOUNDS_PADDING,
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
  ...surveyedJunctions,
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
  ...surveyedLinks,
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
  15: "ag_0",
  16: "ktx_0",
  17: "hall400_0",
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

// Danh sách kề dựng một lần khi nạp module: mỗi lần tính đường không còn quét lại
// toàn bộ lối đi và không tính lại khoảng cách giữa các nút.
type Edge = { to: string; cost: number };
const adjacency = new Map<string, Edge[]>();
for (const id of Object.keys(nodes)) adjacency.set(id, []);
for (const [a, b] of links) {
  const cost = distance(nodes[a], nodes[b]);
  adjacency.get(a)!.push({ to: b, cost });
  adjacency.get(b)!.push({ to: a, cost });
}

// Hàng đợi ưu tiên (heap nhị phân) thay cho việc quét toàn bộ tập nút chưa duyệt.
function popMin(heap: [number, string][]): [number, string] {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1,
        r = l + 1;
      let m = i;
      if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
      if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
      if (m === i) break;
      [heap[i], heap[m]] = [heap[m], heap[i]];
      i = m;
    }
  }
  return top;
}
function pushHeap(heap: [number, string][], item: [number, string]) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent][0] <= heap[i][0]) break;
    [heap[parent], heap[i]] = [heap[i], heap[parent]];
    i = parent;
  }
}

function computeRoute(startId: number, endId: number): CampusRoute | null {
  const start = `p${startId}`,
    end = `p${endId}`;
  const costs = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const done = new Set<string>();
  const heap: [number, string][] = [[0, start]];
  while (heap.length) {
    const [cost, next] = popMin(heap);
    if (done.has(next)) continue;
    done.add(next);
    if (next === end) break;
    for (const edge of adjacency.get(next)!) {
      if (done.has(edge.to)) continue;
      const total = cost + edge.cost;
      if (total < (costs.get(edge.to) ?? Infinity)) {
        costs.set(edge.to, total);
        previous.set(edge.to, next);
        pushHeap(heap, [total, edge.to]);
      }
    }
  }
  const total = costs.get(end);
  if (total === undefined || !done.has(end)) return null;
  const ids = [end];
  while (ids[0] !== start) {
    const parent = previous.get(ids[0]);
    if (!parent) return null;
    ids.unshift(parent);
  }
  const points = ids
    .map((id) => nodes[id])
    .filter((p, index, all) => !index || distance(p, all[index - 1]) > 0.2);
  // Kiểm tra cả đoạn thay vì chỉ hai đầu để không đi xuyên ra ngoài đa giác giới hạn.
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!insideCampus(p)) return null;
    if (i === 0) continue;
    const a = points[i - 1];
    for (let n = 0; n < 20; n++) {
      const t = n / 20;
      if (
        !insideCampus({
          latitude: a.latitude + (p.latitude - a.latitude) * t,
          longitude: a.longitude + (p.longitude - a.longitude) * t,
        })
      )
        return null;
    }
  }
  return {
    points,
    meters: Math.round(total),
    minutes: Math.max(1, Math.ceil(total / 75)),
  };
}

// Mạng đường cố định trong app nên kết quả của mỗi cặp điểm luôn giống nhau:
// tính một lần rồi dùng lại (kể cả kết quả "không có đường").
const routeCache = new Map<string, CampusRoute | null>();

// Dijkstra chạy cục bộ trên mạng lối đi, không gọi API và không đưa tuyến ra ngoài trường.
export function findCampusRoute(
  startId: number,
  endId: number,
): CampusRoute | null {
  if (!canRoute(startId) || !canRoute(endId)) return null;
  const key = `${startId}>${endId}`;
  if (!routeCache.has(key)) routeCache.set(key, computeRoute(startId, endId));
  return routeCache.get(key) ?? null;
}
