import type { Coordinate } from "./campusMap";

// Simplified from gps-track/Track_Ktx_Laos_-_Nha_7.gpx for a lightweight map line.
export const gpxNavigationInfo = {
  name: "KTX Lào - Nhà số 7",
  recordedAt: "14/10/2026",
  recordedDurationSeconds: 263,
  recordedPointCount: 263,
  averageSpeedKmh: 3.35,
  maximumSpeedKmh: 6.3,
  minimumElevationMeters: 423,
  maximumElevationMeters: 425.9,
} as const;

export const gpxNavigationRoute: Coordinate[] = [
  { latitude: 12.651035, longitude: 108.027015 },
  { latitude: 12.651074, longitude: 108.026948 },
  { latitude: 12.651069, longitude: 108.026887 },
  { latitude: 12.651034, longitude: 108.026827 },
  { latitude: 12.650982, longitude: 108.026808 },
  { latitude: 12.650959, longitude: 108.026757 },
  { latitude: 12.650904, longitude: 108.026728 },
  { latitude: 12.650904, longitude: 108.026666 },
  { latitude: 12.650950, longitude: 108.026625 },
  { latitude: 12.650976, longitude: 108.026571 },
  { latitude: 12.651009, longitude: 108.026513 },
  { latitude: 12.651041, longitude: 108.026464 },
  { latitude: 12.651090, longitude: 108.026422 },
  { latitude: 12.651120, longitude: 108.026376 },
  { latitude: 12.651163, longitude: 108.026335 },
  { latitude: 12.651206, longitude: 108.026297 },
  { latitude: 12.651223, longitude: 108.026237 },
  { latitude: 12.651222, longitude: 108.026181 },
  { latitude: 12.651177, longitude: 108.026138 },
  { latitude: 12.651145, longitude: 108.026084 },
  { latitude: 12.651159, longitude: 108.026030 },
  { latitude: 12.651204, longitude: 108.025990 },
  { latitude: 12.651253, longitude: 108.025940 },
  { latitude: 12.651298, longitude: 108.025894 },
  { latitude: 12.651334, longitude: 108.025852 },
  { latitude: 12.651376, longitude: 108.025815 },
  { latitude: 12.651434, longitude: 108.025783 },
  { latitude: 12.651489, longitude: 108.025751 },
  { latitude: 12.651552, longitude: 108.025731 },
  { latitude: 12.651607, longitude: 108.025699 },
  { latitude: 12.651634, longitude: 108.025646 },
  { latitude: 12.651680, longitude: 108.025600 },
  { latitude: 12.651725, longitude: 108.025548 },
  { latitude: 12.651757, longitude: 108.025498 },
  { latitude: 12.651802, longitude: 108.025449 },
  { latitude: 12.651785, longitude: 108.025392 },
  { latitude: 12.651789, longitude: 108.025328 },
  { latitude: 12.651808, longitude: 108.025270 },
  { latitude: 12.651851, longitude: 108.025219 },
  { latitude: 12.651881, longitude: 108.025170 },
  { latitude: 12.651923, longitude: 108.025128 },
  { latitude: 12.651953, longitude: 108.025081 },
  { latitude: 12.651984, longitude: 108.025034 },
  { latitude: 12.652026, longitude: 108.024987 },
  { latitude: 12.652064, longitude: 108.024944 },
  { latitude: 12.652110, longitude: 108.024904 },
  { latitude: 12.652150, longitude: 108.024863 },
  { latitude: 12.652171, longitude: 108.024829 },
];

// Cumulative meters at each simplified point, measured along all original GPX points.
const cumulativeMeters = [
  0, 8.8, 16.1, 25.3, 32.2, 46.2, 53.5, 61.3, 68.1, 74.9, 82.9, 89.7,
  96.9, 103.3, 110, 116.5, 123.4, 129.6, 137, 143.9, 150.5, 157.3, 165.2,
  172.4, 178.6, 184.9, 192.4, 199.8, 207.2, 214.4, 221.5, 231.8, 239.4,
  246.3, 253.7, 260.8, 268.4, 275.8, 283.1, 289.5, 296.1, 302.3, 308.6,
  315.9, 322.5, 331.5, 337.8, 342.3,
];

export function getRemainingGpxDistance(pointIndex: number) {
  const lastIndex = cumulativeMeters.length - 1;
  const index = Math.max(0, Math.min(lastIndex, Math.floor(pointIndex)));
  return Math.round(cumulativeMeters[lastIndex] - cumulativeMeters[index]);
}

export function getGpxHeading(pointIndex: number) {
  const from = gpxNavigationRoute[pointIndex];
  const to =
    gpxNavigationRoute[Math.min(pointIndex + 1, gpxNavigationRoute.length - 1)];
  if (!from || !to) return 0;
  const radians = Math.PI / 180;
  const x =
    (to.longitude - from.longitude) *
    Math.cos(((from.latitude + to.latitude) * radians) / 2);
  const y = to.latitude - from.latitude;
  return (Math.atan2(x, y) * 180) / Math.PI;
}
