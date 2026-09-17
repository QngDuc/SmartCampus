import { useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '@/constants/campus';
import { approximateLocationIds } from '@/data/campusMap';
import type { CampusMapProps } from './campus-map.types';

export default function CampusMap({ center, places, selectedId, userLocation, onSelect }: CampusMapProps) {
  const map = useRef<MapView>(null);
  // Native dùng SDK bản đồ của hệ điều hành, không dùng WebGL/Worker của bản web.
  // Android dùng zoom; iOS dùng altitude. Cố định pitch=0 cho sơ đồ 2D.
  useEffect(() => {
    map.current?.animateCamera({ center, pitch: 0, heading: 0, zoom: selectedId ? 17 : 16, altitude: selectedId ? 650 : 1100 }, { duration: 180 });
  }, [center, selectedId]);

  return <MapView ref={map} style={{ width: '100%', height: 430 }}
    initialCamera={{ center, pitch: 0, heading: 0, zoom: 16, altitude: 1100 }}
    mapType="standard"
    showsBuildings={false} pitchEnabled={false} rotateEnabled={false} showsCompass showsScale toolbarEnabled={false}>
    {places.map(place => <Marker key={place.id} coordinate={place.coordinate} title={place.name}
      description={approximateLocationIds.has(place.id) ? 'Vị trí ước lượng từ sơ đồ trường' : 'Dữ liệu OpenStreetMap'}
      pinColor={place.id === selectedId ? '#E11D48' : colors.primary}
      onPress={() => onSelect(place.id)} />)}
    {userLocation && <Marker coordinate={userLocation} title="Vị trí của bạn" pinColor="#16A34A" />}
  </MapView>;
}
