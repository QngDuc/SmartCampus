import type { Coordinate } from "./campusMap";

// Lối đi lấy từ hai tệp GPX đã ghi ngoài hiện trường (14/10/2026), giản lược còn các
// đỉnh lệch > 3 m. Đây là dữ liệu đo thật, khác với các nhánh số hóa từ ảnh sơ đồ.
// Hai đầu nối (ag_6 → cổng chính, ktx_12 → Nhà số 7) là đoạn thẳng ngắn, chưa khảo sát.

// Nhà Nông Lâm → cổng chính (Track_Nong_nghiep_-_cong_truoc.gpx). ag_0 là điểm bắt đầu ghi.
export const surveyedJunctions: Record<string, Coordinate> = {
  ag_0: { latitude: 12.651479, longitude: 108.026585 },
  ag_1: { latitude: 12.651517, longitude: 108.026589 },
  ag_2: { latitude: 12.651499, longitude: 108.026528 },
  ag_3: { latitude: 12.650831, longitude: 108.025711 },
  ag_4: { latitude: 12.651926, longitude: 108.024533 },
  ag_5: { latitude: 12.651903, longitude: 108.024423 },
  ag_6: { latitude: 12.651504, longitude: 108.023998 },
// KTX Lào → Nhà số 7 (Track_Ktx_Laos_-_Nha_7.gpx). ktx_0 là điểm bắt đầu ghi.
  ktx_0: { latitude: 12.651035, longitude: 108.027015 },
  ktx_1: { latitude: 12.651069, longitude: 108.026887 },
  ktx_2: { latitude: 12.650904, longitude: 108.026728 },
  ktx_3: { latitude: 12.650904, longitude: 108.026666 },
  ktx_4: { latitude: 12.651206, longitude: 108.026297 },
  ktx_5: { latitude: 12.651222, longitude: 108.026181 },
  ktx_6: { latitude: 12.651145, longitude: 108.026084 },
  ktx_7: { latitude: 12.651159, longitude: 108.02603 },
  ktx_8: { latitude: 12.651376, longitude: 108.025815 },
  ktx_9: { latitude: 12.651607, longitude: 108.025699 },
  ktx_10: { latitude: 12.651802, longitude: 108.025449 },
  ktx_11: { latitude: 12.651808, longitude: 108.02527 },
  ktx_12: { latitude: 12.652171, longitude: 108.024829 },
};

const chain = (prefix: string, count: number): [string, string][] =>
  Array.from({ length: count - 1 }, (_, i) => [`${prefix}_${i}`, `${prefix}_${i + 1}`]);

export const surveyedLinks: [string, string][] = [
  ...chain("ag", 7),
  ["ag_6", "gate"],
  ...chain("ktx", 13),
  ["ktx_12", "p7"],
];
