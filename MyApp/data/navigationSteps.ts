import type { Coordinate } from "./campusMap";

// Chỉ dẫn rẽ được suy ra từ hình dạng tuyến GPX (không có tên đường trong dữ liệu).
export type NavStep = {
  /** Khoảng cách từ đầu tuyến tới ngã rẽ, tính theo mét. */
  distance: number;
  /** Góc rẽ có dấu: dương là rẽ phải, âm là rẽ trái. */
  turn: number;
  text: string;
  end?: boolean;
};

type Point = { x: number; y: number };
const RAD = Math.PI / 180;
const EARTH = 6371000;

function toLocal(route: Coordinate[]): Point[] {
  const origin = route[0];
  const scale = Math.cos(origin.latitude * RAD);
  return route.map((p) => ({
    x: (p.longitude - origin.longitude) * RAD * EARTH * scale,
    y: (p.latitude - origin.latitude) * RAD * EARTH,
  }));
}
const bearing = (a: Point, b: Point) => Math.atan2(b.x - a.x, b.y - a.y) / RAD;
const wrap = (degrees: number) => ((degrees + 540) % 360) - 180;

// Douglas–Peucker: bỏ nhiễu GPS nhỏ hơn eps mét, giữ các đỉnh thật sự đổi hướng.
function simplify(points: Point[], indexes: number[], eps: number): number[] {
  if (indexes.length < 3) return indexes;
  const a = points[indexes[0]];
  const b = points[indexes[indexes.length - 1]];
  const length = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  let far = 0;
  let farIndex = 0;
  for (let i = 1; i < indexes.length - 1; i++) {
    const p = points[indexes[i]];
    const d =
      Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / length;
    if (d > far) {
      far = d;
      farIndex = i;
    }
  }
  if (far < eps) return [indexes[0], indexes[indexes.length - 1]];
  return simplify(points, indexes.slice(0, farIndex + 1), eps)
    .slice(0, -1)
    .concat(simplify(points, indexes.slice(farIndex), eps));
}

function describeTurn(turn: number) {
  const side = turn > 0 ? "phải" : "trái";
  const size = Math.abs(turn);
  return (size < 45 ? "Rẽ nhẹ sang " : size < 120 ? "Rẽ " : "Rẽ gấp ") + side;
}

export function buildSteps(
  route: Coordinate[],
  totalMeters: number,
  destinationName: string,
): NavStep[] {
  const end: NavStep = {
    distance: totalMeters,
    turn: 0,
    text: `Đến ${destinationName}`,
    end: true,
  };
  if (route.length < 3) return [end];
  const points = toLocal(route);
  const cumulative = [0];
  for (let i = 1; i < points.length; i++)
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    );
  const length = cumulative[cumulative.length - 1] || 1;
  const at = (s: number): Point => {
    const clamped = Math.max(0, Math.min(length, s));
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < clamped) i++;
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const t = (clamped - cumulative[i - 1]) / span;
    const a = points[i - 1];
    const b = points[i];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  const found: { s: number; turn: number }[] = [];
  const corners = simplify(
    points,
    points.map((_, i) => i),
    3,
  ).slice(1, -1);
  for (const i of corners) {
    const s = cumulative[i];
    // Bỏ nhiễu GPS khi mới xuất phát/đã gần đích.
    if (s < 15 || s > length - 10) continue;
    const turn = wrap(bearing(at(s), at(s + 12)) - bearing(at(s - 12), at(s)));
    if (Math.abs(turn) < 25) continue;
    const previous = found[found.length - 1];
    if (previous && s - previous.s < 25) {
      // Hai góc rẽ liền nhau: cùng chiều thì gộp thành một, ngược chiều giữ góc lớn hơn.
      if (Math.sign(turn) === Math.sign(previous.turn)) {
        previous.turn += turn;
        previous.s = (previous.s + s) / 2;
      } else if (Math.abs(turn) > Math.abs(previous.turn)) {
        previous.s = s;
        previous.turn = turn;
      }
      continue;
    }
    found.push({ s, turn });
  }
  return [
    ...found.map((item) => ({
      distance: (item.s / length) * totalMeters,
      turn: item.turn,
      text: describeTurn(item.turn),
    })),
    end,
  ];
}

export function getNextStep(steps: NavStep[], traveled: number) {
  const found = steps.findIndex((step) => step.distance > traveled + 1);
  const index = found < 0 ? steps.length - 1 : found;
  const step = steps[index];
  return {
    step,
    index,
    distance: Math.max(0, Math.round(step.distance - traveled)),
    following: steps[index + 1] as NavStep | undefined,
  };
}

export function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.max(5, Math.round(meters / 5) * 5)} m`;
}
