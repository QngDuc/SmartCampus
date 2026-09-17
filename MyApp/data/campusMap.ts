export type Coordinate = { latitude: number; longitude: number };

export type CampusMapConfig = {
  name: string;
  address: string;
  center: Coordinate;
};

// Tâm khuôn viên: https://mapcarta.com/W241971731.
export const campusMap: CampusMapConfig = {
  name: 'Trường Đại học Tây Nguyên',
  address: '567 Lê Duẩn, phường Ea Kao, Đắk Lắk',
  center: { latitude: 12.65067, longitude: 108.02621 },
};

// Hai cổng lấy từ POI OpenStreetMap qua OpenFreeMap (snapshot 2026-09-13).
const mainGate = { latitude: 12.65155538, longitude: 108.02389741 };
const rearGate = { latitude: 12.64841486, longitude: 108.02800119 };

// Số hóa sơ đồ ảnh 960x910 do người dùng cung cấp, neo ở hai cổng.
// Đây chỉ là ước lượng vị trí khu nhà, KHÔNG dùng làm đích GPS chính xác.
function fromDiagram(x: number, y: number): Coordinate {
  return {
    latitude: mainGate.latitude + (y - 335) / (740 - 335) * (rearGate.latitude - mainGate.latitude),
    longitude: mainGate.longitude + (x - 150) / (680 - 150) * (rearGate.longitude - mainGate.longitude),
  };
}

export const locationCoordinates: Partial<Record<number, Coordinate>> = {
  // Mapcarta / OpenStreetMap way 241971731: tâm khuôn viên, không phải cổng trường.
  100: campusMap.center,
  1: fromDiagram(330, 360),
  2: fromDiagram(260, 410),
  3: fromDiagram(625, 620),
  5: fromDiagram(155, 520),
  6: fromDiagram(365, 475),
  7: fromDiagram(310, 245),
  8: fromDiagram(365, 170),
  9: fromDiagram(425, 95),
  10: mainGate,
  11: rearGate,
  12: fromDiagram(590, 700),
  13: fromDiagram(370, 605),
  14: { latitude: 12.65035675, longitude: 108.02887559 },
};

export const approximateLocationIds = new Set([1, 2, 3, 5, 6, 7, 8, 9, 12, 13]);

export function getDirectionsDestination(id: number, name: string): Coordinate | string {
  if (id === 100) return mainGate;
  const coordinate = locationCoordinates[id];
  if (coordinate && !approximateLocationIds.has(id)) return coordinate;
  return `${name}, Trường Đại học Tây Nguyên, 567 Lê Duẩn, Đắk Lắk`;
}

export const campusMapSource = 'https://mapcarta.com/W241971731';

export function isValidCoordinate(value: Coordinate | undefined | null): value is Coordinate {
  return !!value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}
