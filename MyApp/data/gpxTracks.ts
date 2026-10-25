import type { Coordinate } from "./campusMap";
import {
  getRemainingGpxDistance,
  gpxNavigationInfo,
  gpxNavigationRoute,
} from "./gpxNavigation";
import { surveyedJunctions } from "./surveyedPaths";

// Mỗi tuyến GPX đã ghi dùng cho chế độ mô phỏng điều hướng 3D.
export type GpxTrackInfo = {
  recordedAt: string;
  recordedDurationSeconds: number;
  recordedPointCount: number;
  averageSpeedKmh: number;
  maximumSpeedKmh: number;
  minimumElevationMeters: number;
  maximumElevationMeters: number;
};

export type GpxTrack = {
  id: string;
  /** id địa điểm xuất phát trong data/mockData.ts */
  originId: number;
  /** id địa điểm đích trong data/mockData.ts */
  destinationId: number;
  fromName: string;
  toName: string;
  route: Coordinate[];
  /** Mét tích lũy tại từng điểm của route. */
  cumulative: number[];
  totalMeters: number;
  /** Thời gian giữa hai điểm khi phát lại (ms). */
  stepMs: number;
  /** Dùng để ước lượng thời gian còn lại. */
  metersPerMinute: number;
  paceLabel: string;
  info: GpxTrackInfo;
};

function meters(a: Coordinate, b: Coordinate) {
  const rad = Math.PI / 180;
  const x =
    (b.longitude - a.longitude) *
    rad *
    Math.cos(((a.latitude + b.latitude) * rad) / 2);
  const y = (b.latitude - a.latitude) * rad;
  return Math.hypot(x, y) * 6371000;
}

function resampleRoute(route: Coordinate[], spacingMeters = 8): Coordinate[] {
  const sampled: Coordinate[] = [route[0]];
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1];
    const end = route[i];
    const segments = Math.max(1, Math.ceil(meters(start, end) / spacingMeters));
    for (let segment = 1; segment <= segments; segment++) {
      const fraction = segment / segments;
      sampled.push({
        latitude: start.latitude + (end.latitude - start.latitude) * fraction,
        longitude:
          start.longitude + (end.longitude - start.longitude) * fraction,
      });
    }
  }
  return sampled;
}

function createRecordedTrack({
  id,
  originId,
  destinationId,
  fromName,
  toName,
  waypoints,
  recordedDistanceMeters,
  recordedDurationSeconds,
  recordedPointCount,
  maximumSpeedKmh,
  minimumElevationMeters,
  maximumElevationMeters,
}: {
  id: string;
  originId: number;
  destinationId: number;
  fromName: string;
  toName: string;
  waypoints: Coordinate[];
  recordedDistanceMeters: number;
  recordedDurationSeconds: number;
  recordedPointCount: number;
  maximumSpeedKmh: number;
  minimumElevationMeters: number;
  maximumElevationMeters: number;
}): GpxTrack {
  const route = resampleRoute(waypoints);
  const geometricCumulative = [0];
  for (let index = 1; index < route.length; index++) {
    geometricCumulative.push(
      geometricCumulative[index - 1] + meters(route[index - 1], route[index]),
    );
  }
  const geometryLength = geometricCumulative[geometricCumulative.length - 1];
  const cumulative = geometricCumulative.map(
    (distance) => (distance / geometryLength) * recordedDistanceMeters,
  );
  return {
    id,
    originId,
    destinationId,
    fromName,
    toName,
    route,
    cumulative,
    totalMeters: recordedDistanceMeters,
    stepMs: Math.max(
      1000,
      Math.round((recordedDurationSeconds * 1000) / (route.length - 1)),
    ),
    metersPerMinute: Math.max(
      1,
      (recordedDistanceMeters / recordedDurationSeconds) * 60,
    ),
    paceLabel: "Theo tốc độ đã ghi",
    info: {
      recordedAt: "14/10/2026",
      recordedDurationSeconds,
      recordedPointCount,
      averageSpeedKmh:
        (recordedDistanceMeters / recordedDurationSeconds) * 3.6,
      maximumSpeedKmh,
      minimumElevationMeters,
      maximumElevationMeters,
    },
  };
}

// Track KTX Lào → Nhà số 7: giữ nguyên dữ liệu cũ trong gpxNavigation.ts.
const ktxTotal = getRemainingGpxDistance(0);
export const ktxLaosToHouse7: GpxTrack = {
  id: "ktx-laos-nha-7",
  originId: 16,
  destinationId: 7,
  fromName: "KTX Lào",
  toName: "Nhà số 7",
  route: gpxNavigationRoute,
  cumulative: gpxNavigationRoute.map(
    (_, i) => ktxTotal - getRemainingGpxDistance(i),
  ),
  totalMeters: ktxTotal,
  stepMs: 5000,
  metersPerMinute: 75,
  paceLabel: "Đi bộ",
  info: gpxNavigationInfo,
};
const house7ToKtxLaos: GpxTrack = {
  ...ktxLaosToHouse7,
  id: "nha-7-ktx-lao",
  originId: 7,
  destinationId: 16,
  fromName: ktxLaosToHouse7.toName,
  toName: ktxLaosToHouse7.fromName,
  route: [...ktxLaosToHouse7.route].reverse(),
  cumulative: [...ktxLaosToHouse7.cumulative]
    .reverse()
    .map(
      (distance) =>
        ktxLaosToHouse7.cumulative[ktxLaosToHouse7.cumulative.length - 1] -
        distance,
    ),
};

// Track_Nong_nghiep_-_cong_truoc.gpx (91 điểm, ghi 14/10/2026 16:22:08–16:23:38).
const nongNghiepRoute: Coordinate[] = [
  { latitude: 12.651479, longitude: 108.026585 },
  { latitude: 12.651481, longitude: 108.026583 },
  { latitude: 12.651482, longitude: 108.026584 },
  { latitude: 12.651492, longitude: 108.02658 },
  { latitude: 12.65149, longitude: 108.026582 },
  { latitude: 12.651501, longitude: 108.026588 },
  { latitude: 12.651517, longitude: 108.026589 },
  { latitude: 12.65152, longitude: 108.026579 },
  { latitude: 12.651515, longitude: 108.02658 },
  { latitude: 12.651515, longitude: 108.026577 },
  { latitude: 12.651519, longitude: 108.026568 },
  { latitude: 12.651517, longitude: 108.026555 },
  { latitude: 12.651499, longitude: 108.026528 },
  { latitude: 12.65147, longitude: 108.026504 },
  { latitude: 12.65144, longitude: 108.026479 },
  { latitude: 12.65141, longitude: 108.026446 },
  { latitude: 12.651379, longitude: 108.0264 },
  { latitude: 12.651347, longitude: 108.026359 },
  { latitude: 12.651313, longitude: 108.02631 },
  { latitude: 12.651274, longitude: 108.026261 },
  { latitude: 12.651229, longitude: 108.026205 },
  { latitude: 12.65118, longitude: 108.026148 },
  { latitude: 12.651147, longitude: 108.026104 },
  { latitude: 12.651116, longitude: 108.026056 },
  { latitude: 12.651073, longitude: 108.026007 },
  { latitude: 12.651031, longitude: 108.025961 },
  { latitude: 12.650981, longitude: 108.025911 },
  { latitude: 12.650946, longitude: 108.025872 },
  { latitude: 12.650921, longitude: 108.025833 },
  { latitude: 12.650896, longitude: 108.025804 },
  { latitude: 12.650878, longitude: 108.025776 },
  { latitude: 12.650859, longitude: 108.025758 },
  { latitude: 12.650843, longitude: 108.025733 },
  { latitude: 12.650831, longitude: 108.025711 },
  { latitude: 12.650835, longitude: 108.025686 },
  { latitude: 12.650871, longitude: 108.025669 },
  { latitude: 12.650901, longitude: 108.025628 },
  { latitude: 12.650929, longitude: 108.025599 },
  { latitude: 12.650962, longitude: 108.025554 },
  { latitude: 12.651003, longitude: 108.025517 },
  { latitude: 12.651042, longitude: 108.025471 },
  { latitude: 12.651087, longitude: 108.025422 },
  { latitude: 12.651139, longitude: 108.02537 },
  { latitude: 12.651184, longitude: 108.025321 },
  { latitude: 12.651235, longitude: 108.025271 },
  { latitude: 12.651287, longitude: 108.025218 },
  { latitude: 12.651338, longitude: 108.025158 },
  { latitude: 12.651392, longitude: 108.025105 },
  { latitude: 12.651446, longitude: 108.025058 },
  { latitude: 12.651499, longitude: 108.025009 },
  { latitude: 12.651546, longitude: 108.024959 },
  { latitude: 12.651596, longitude: 108.024909 },
  { latitude: 12.651645, longitude: 108.02486 },
  { latitude: 12.651684, longitude: 108.024814 },
  { latitude: 12.65172, longitude: 108.024774 },
  { latitude: 12.651757, longitude: 108.024732 },
  { latitude: 12.65179, longitude: 108.024695 },
  { latitude: 12.651828, longitude: 108.024655 },
  { latitude: 12.651858, longitude: 108.024615 },
  { latitude: 12.651887, longitude: 108.024581 },
  { latitude: 12.651911, longitude: 108.024556 },
  { latitude: 12.651926, longitude: 108.024533 },
  { latitude: 12.651929, longitude: 108.024501 },
  { latitude: 12.651931, longitude: 108.024474 },
  { latitude: 12.651921, longitude: 108.024454 },
  { latitude: 12.651903, longitude: 108.024423 },
  { latitude: 12.651872, longitude: 108.024391 },
  { latitude: 12.651831, longitude: 108.024353 },
  { latitude: 12.651791, longitude: 108.024314 },
  { latitude: 12.651747, longitude: 108.024271 },
  { latitude: 12.651702, longitude: 108.02422 },
  { latitude: 12.651662, longitude: 108.024167 },
  { latitude: 12.651619, longitude: 108.024119 },
  { latitude: 12.651583, longitude: 108.024077 },
  { latitude: 12.65155, longitude: 108.024043 },
  { latitude: 12.651526, longitude: 108.024016 },
  { latitude: 12.651504, longitude: 108.023998 },
  { latitude: 12.651502, longitude: 108.02397 },
  { latitude: 12.651526, longitude: 108.023956 },
  { latitude: 12.651537, longitude: 108.023934 },
  { latitude: 12.651548, longitude: 108.023916 },
  { latitude: 12.651561, longitude: 108.023899 },
  { latitude: 12.651572, longitude: 108.023892 },
  { latitude: 12.651584, longitude: 108.02388 },
  { latitude: 12.651597, longitude: 108.02388 },
  { latitude: 12.651597, longitude: 108.02389 },
  { latitude: 12.651599, longitude: 108.023884 },
  { latitude: 12.651601, longitude: 108.023879 },
  { latitude: 12.651604, longitude: 108.023878 },
  { latitude: 12.651608, longitude: 108.023871 },
  { latitude: 12.651607, longitude: 108.023873 },
];
const nongNghiepCumulative = nongNghiepRoute.map((_, i, all) => {
  let total = 0;
  for (let k = 1; k <= i; k++) total += meters(all[k - 1], all[k]);
  return Math.round(total * 10) / 10;
});
const nongNghiepTotal = Math.round(
  nongNghiepCumulative[nongNghiepCumulative.length - 1],
);
export const nongNghiepToMainGate: GpxTrack = {
  id: "nong-nghiep-cong-truoc",
  originId: 15,
  destinationId: 10,
  fromName: "Nhà Nông nghiệp",
  toName: "Cổng chính",
  route: nongNghiepRoute,
  cumulative: nongNghiepCumulative,
  totalMeters: nongNghiepTotal,
  stepMs: 1000, // mỗi điểm GPX cách nhau 1 giây → phát lại đúng thời gian đã ghi
  metersPerMinute: 270, // ≈ tốc độ trung bình đã ghi 16.2 km/h
  paceLabel: "Theo tốc độ đã ghi",
  info: {
    recordedAt: "14/10/2026",
    recordedDurationSeconds: 90,
    recordedPointCount: 91,
    averageSpeedKmh: 16.2,
    maximumSpeedKmh: 28.7,
    minimumElevationMeters: 422.8,
    maximumElevationMeters: 426,
  },
};
const mainGateToNongNghiep: GpxTrack = {
  ...nongNghiepToMainGate,
  id: "cong-truoc-nong-nghiep",
  originId: 10,
  destinationId: 15,
  fromName: nongNghiepToMainGate.toName,
  toName: nongNghiepToMainGate.fromName,
  route: [...nongNghiepToMainGate.route].reverse(),
  cumulative: [...nongNghiepToMainGate.cumulative]
    .reverse()
    .map(
      (distance) =>
        nongNghiepToMainGate.cumulative[
          nongNghiepToMainGate.cumulative.length - 1
        ] - distance,
    ),
};

const routeFromSurveyed = (prefix: string, count: number) =>
  Array.from(
    { length: count },
    (_, index) => surveyedJunctions[`${prefix}_${index}`],
  );

export const hall400ToKtxLaos = createRecordedTrack({
  id: "hoi-truong-400-ktx-lao",
  originId: 17,
  destinationId: 16,
  fromName: "Hội trường 400 chỗ",
  toName: "KTX Lào",
  waypoints: routeFromSurveyed("hall400", 12),
  recordedDistanceMeters: 306,
  recordedDurationSeconds: 246,
  recordedPointCount: 247,
  maximumSpeedKmh: 18.5,
  minimumElevationMeters: 422.7,
  maximumElevationMeters: 427.2,
});
const ktxLaosToHall400: GpxTrack = {
  ...hall400ToKtxLaos,
  id: "ktx-lao-hoi-truong-400",
  originId: 16,
  destinationId: 17,
  fromName: hall400ToKtxLaos.toName,
  toName: hall400ToKtxLaos.fromName,
  route: [...hall400ToKtxLaos.route].reverse(),
  cumulative: [...hall400ToKtxLaos.cumulative]
    .reverse()
    .map(
      (distance) =>
        hall400ToKtxLaos.cumulative[
          hall400ToKtxLaos.cumulative.length - 1
        ] - distance,
    ),
};

export const ktxLaosToNongNghiep = createRecordedTrack({
  id: "ktx-lao-nong-nghiep",
  originId: 16,
  destinationId: 15,
  fromName: "KTX Lào",
  toName: "Nhà Nông Lâm",
  waypoints: routeFromSurveyed("ktxAg", 8),
  recordedDistanceMeters: 179,
  recordedDurationSeconds: 71,
  recordedPointCount: 31,
  maximumSpeedKmh: 26.1,
  minimumElevationMeters: 417.7,
  maximumElevationMeters: 426.8,
});
const nongNghiepToKtxLaos: GpxTrack = {
  ...ktxLaosToNongNghiep,
  id: "nha-nong-lam-ktx-lao",
  originId: 15,
  destinationId: 16,
  fromName: ktxLaosToNongNghiep.toName,
  toName: ktxLaosToNongNghiep.fromName,
  route: [...ktxLaosToNongNghiep.route].reverse(),
  cumulative: [...ktxLaosToNongNghiep.cumulative]
    .reverse()
    .map(
      (distance) =>
        ktxLaosToNongNghiep.cumulative[
          ktxLaosToNongNghiep.cumulative.length - 1
        ] - distance,
    ),
};

export const house6ToKtxLaos = createRecordedTrack({
  id: "nha-6-ktx-lao",
  originId: 6,
  destinationId: 16,
  fromName: "Nhà số 6",
  toName: "KTX Lào",
  waypoints: routeFromSurveyed("house6Ktx", 12),
  recordedDistanceMeters: 244,
  recordedDurationSeconds: 189,
  recordedPointCount: 185,
  maximumSpeedKmh: 32.1,
  minimumElevationMeters: 423.5,
  maximumElevationMeters: 426.4,
});
const ktxLaosToHouse6: GpxTrack = {
  ...house6ToKtxLaos,
  id: "ktx-lao-nha-6",
  originId: 16,
  destinationId: 6,
  fromName: house6ToKtxLaos.toName,
  toName: house6ToKtxLaos.fromName,
  route: [...house6ToKtxLaos.route].reverse(),
  cumulative: [...house6ToKtxLaos.cumulative]
    .reverse()
    .map(
      (distance) =>
        house6ToKtxLaos.cumulative[
          house6ToKtxLaos.cumulative.length - 1
        ] - distance,
    ),
};

export const house2ToKtxLaos = createRecordedTrack({
  id: "nha-2-ktx-lao",
  originId: 2,
  destinationId: 16,
  fromName: "Nhà số 2",
  toName: "KTX Lào",
  waypoints: routeFromSurveyed("house2Ktx", 16),
  recordedDistanceMeters: 295,
  recordedDurationSeconds: 252,
  recordedPointCount: 254,
  maximumSpeedKmh: 18.5,
  minimumElevationMeters: 423,
  maximumElevationMeters: 427.1,
});
const ktxLaosToHouse2: GpxTrack = {
  ...house2ToKtxLaos,
  id: "ktx-lao-nha-2",
  originId: 16,
  destinationId: 2,
  fromName: house2ToKtxLaos.toName,
  toName: house2ToKtxLaos.fromName,
  route: [...house2ToKtxLaos.route].reverse(),
  cumulative: [...house2ToKtxLaos.cumulative]
    .reverse()
    .map(
      (distance) =>
        house2ToKtxLaos.cumulative[
          house2ToKtxLaos.cumulative.length - 1
        ] - distance,
    ),
};

export const gpxTracks = [
  ktxLaosToHouse7,
  house7ToKtxLaos,
  nongNghiepToMainGate,
  mainGateToNongNghiep,
  hall400ToKtxLaos,
  ktxLaosToHall400,
  ktxLaosToNongNghiep,
  nongNghiepToKtxLaos,
  house6ToKtxLaos,
  ktxLaosToHouse6,
  house2ToKtxLaos,
  ktxLaosToHouse2,
];

/** Hướng (độ, 0 = Bắc) nhìn trước ≥ 10 m để không bị rung khi GPS đứng yên/nhiễu. */
export function getTrackHeading(track: GpxTrack, index: number) {
  const { route, cumulative } = track;
  const last = route.length - 1;
  const from = Math.max(0, Math.min(last, index));
  let a = from;
  let b = from;
  while (b < last && cumulative[b] - cumulative[from] < 10) b++;
  if (b === from) while (a > 0 && cumulative[from] - cumulative[a] < 10) a--;
  if (a === b) return 0;
  const rad = Math.PI / 180;
  const x =
    (route[b].longitude - route[a].longitude) *
    Math.cos(((route[a].latitude + route[b].latitude) * rad) / 2);
  const y = route[b].latitude - route[a].latitude;
  return (Math.atan2(x, y) / rad + 360) % 360;
}
