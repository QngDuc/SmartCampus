import type { Coordinate } from '@/data/campusMap';

export type MapPlace = { id: number; name: string; coordinate: Coordinate };
export type CampusMapProps = {
  center: Coordinate;
  places: MapPlace[];
  selectedId?: number;
  userLocation: Coordinate | null;
  onSelect: (id: number) => void;
};
