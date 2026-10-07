import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { campusBoundary, campusBounds } from '@/data/campusRouting';
import { colors } from '@/constants/campus';
import { approximateLocationIds, campusMap } from '@/data/campusMap';
import type { CampusMapProps } from './campus-map.types';

export default function CampusMap({ center, places, selectedId, userLocation, onSelect, route }: CampusMapProps) {
  const map = useRef<MapView>(null);
  // Native dùng SDK bản đồ của hệ điều hành, không dùng WebGL/Worker của bản web.
  // Android dùng zoom; iOS dùng altitude. Cố định pitch=0 cho sơ đồ 2D.
  useEffect(() => {
    if (route?.length) {
      map.current?.fitToCoordinates(route, { edgePadding: { top: 45, right: 40, bottom: 45, left: 40 }, animated: false });
      return;
    }
    if (selectedId === undefined && places.length && center.latitude === campusMap.center.latitude && center.longitude === campusMap.center.longitude) {
      map.current?.fitToCoordinates(places.map(place => place.coordinate), { edgePadding: { top: 35, right: 35, bottom: 35, left: 35 }, animated: false });
      return;
    }
    map.current?.animateCamera({ center, pitch: 0, heading: 0, zoom: selectedId ? 17 : 16, altitude: selectedId ? 650 : 1100 }, { duration: 180 });
  }, [center, selectedId, route, places]);

  return <MapView ref={map} style={{ width: '100%', height: '100%' }}
    minZoomLevel={14} maxZoomLevel={19}
    onMapReady={() => {
      // Apple Maps không hỗ trợ setMapBoundaries; onRegionChangeComplete bên dưới
      // cũng giữ tâm camera trong phạm vi trên iOS.
      if (Platform.OS === 'android') map.current?.setMapBoundaries({ latitude: campusBounds.north, longitude: campusBounds.east }, { latitude: campusBounds.south, longitude: campusBounds.west });
      if (route?.length) map.current?.fitToCoordinates(route, { edgePadding: { top: 45, right: 40, bottom: 45, left: 40 }, animated: false });
      else if (selectedId === undefined && places.length) map.current?.fitToCoordinates(places.map(place => place.coordinate), { edgePadding: { top: 35, right: 35, bottom: 35, left: 35 }, animated: false });
    }}
    onRegionChangeComplete={region => {
      const latitude = Math.max(campusBounds.south, Math.min(campusBounds.north, region.latitude));
      const longitude = Math.max(campusBounds.west, Math.min(campusBounds.east, region.longitude));
      if (Math.abs(latitude - region.latitude) + Math.abs(longitude - region.longitude) > 0.00001)
        map.current?.animateCamera({ center: { latitude, longitude } }, { duration: 150 });
    }}
    initialCamera={{ center, pitch: 0, heading: 0, zoom: 16, altitude: 1100 }}
    mapType="standard"
    showsBuildings={false} pitchEnabled={false} rotateEnabled={false} showsCompass showsScale toolbarEnabled={false}>
    <Polygon coordinates={[
      { latitude: campusBounds.south - 1, longitude: campusBounds.west - 1 },
      { latitude: campusBounds.north + 1, longitude: campusBounds.west - 1 },
      { latitude: campusBounds.north + 1, longitude: campusBounds.east + 1 },
      { latitude: campusBounds.south - 1, longitude: campusBounds.east + 1 },
    ]} holes={[campusBoundary]} fillColor="rgba(226,232,240,0.94)" strokeWidth={0} />
    <Polygon coordinates={campusBoundary} strokeColor="#15803D" strokeWidth={2} fillColor="transparent" />
    {!!route?.length && <Polyline coordinates={route} strokeColor="#FFFFFF" strokeWidth={10} />}
    {!!route?.length && <Polyline coordinates={route} strokeColor="#2563EB" strokeWidth={6} />}
    {places.map(place => <Marker key={place.id} coordinate={place.coordinate} title={place.name}
      description={approximateLocationIds.has(place.id) ? 'Vị trí ước lượng từ sơ đồ trường' : 'Dữ liệu OpenStreetMap'}
      pinColor={place.id === selectedId ? '#E11D48' : colors.primary}
      onPress={() => onSelect(place.id)} />)}
    {userLocation && <Marker coordinate={userLocation} title="Vị trí của bạn" pinColor="#16A34A" />}
    {!!route?.length && <Marker coordinate={route[0]} title="Điểm xuất phát" pinColor="#2563EB" />}
  </MapView>;
}
