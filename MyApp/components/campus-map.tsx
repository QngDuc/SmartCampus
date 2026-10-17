import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MapView, { Marker, Polygon, Polyline } from "react-native-maps";
import { campusBoundary, campusBounds } from "@/data/campusRouting";
import { colors } from "@/constants/campus";
import { approximateLocationIds, campusMap } from "@/data/campusMap";
import type { CampusMapProps } from "./campus-map.types";

export default function CampusMap({
  center,
  places,
  selectedId,
  userLocation,
  onSelect,
  route,
  navigation,
}: CampusMapProps) {
  const map = useRef<MapView>(null);
  // Native dùng SDK bản đồ của hệ điều hành, không dùng WebGL/Worker của bản web.
  useEffect(() => {
    if (navigation) {
      map.current?.animateCamera(
        {
          center: navigation.coordinate,
          pitch: 55,
          heading: navigation.heading,
          zoom: 18,
          altitude: 500,
        },
        { duration: 900 },
      );
      return;
    }
    if (route?.length) {
      map.current?.fitToCoordinates(route, {
        edgePadding: { top: 45, right: 40, bottom: 45, left: 40 },
        animated: false,
      });
      return;
    }
    if (
      selectedId === undefined &&
      places.length &&
      center.latitude === campusMap.center.latitude &&
      center.longitude === campusMap.center.longitude
    ) {
      map.current?.fitToCoordinates(
        places.map((place) => place.coordinate),
        {
          edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
          animated: false,
        },
      );
      return;
    }
    map.current?.animateCamera(
      {
        center,
        pitch: 0,
        heading: 0,
        zoom: selectedId ? 17 : 16,
        altitude: selectedId ? 650 : 1100,
      },
      { duration: 180 },
    );
  }, [center, selectedId, route, places, navigation]);

  return (
    <MapView
      ref={map}
      style={{ width: "100%", height: "100%" }}
      minZoomLevel={14}
      maxZoomLevel={19}
      onMapReady={() => {
        // Apple Maps không hỗ trợ setMapBoundaries; onRegionChangeComplete bên dưới
        // cũng giữ tâm camera trong phạm vi trên iOS.
        if (Platform.OS === "android")
          map.current?.setMapBoundaries(
            { latitude: campusBounds.north, longitude: campusBounds.east },
            { latitude: campusBounds.south, longitude: campusBounds.west },
          );
        if (navigation)
          map.current?.animateCamera(
            {
              center: navigation.coordinate,
              pitch: 55,
              heading: navigation.heading,
              zoom: 18,
              altitude: 500,
            },
            { duration: 900 },
          );
        else if (route?.length)
          map.current?.fitToCoordinates(route, {
            edgePadding: { top: 45, right: 40, bottom: 45, left: 40 },
            animated: false,
          });
        else if (selectedId === undefined && places.length)
          map.current?.fitToCoordinates(
            places.map((place) => place.coordinate),
            {
              edgePadding: { top: 35, right: 35, bottom: 35, left: 35 },
              animated: false,
            },
          );
      }}
      onRegionChangeComplete={(region) => {
        const latitude = Math.max(
          campusBounds.south,
          Math.min(campusBounds.north, region.latitude),
        );
        const longitude = Math.max(
          campusBounds.west,
          Math.min(campusBounds.east, region.longitude),
        );
        if (
          Math.abs(latitude - region.latitude) +
            Math.abs(longitude - region.longitude) >
          0.00001
        )
          map.current?.animateCamera(
            { center: { latitude, longitude } },
            { duration: 150 },
          );
      }}
      initialCamera={{
        center: navigation?.coordinate ?? center,
        pitch: navigation ? 55 : 0,
        heading: navigation?.heading ?? 0,
        zoom: navigation ? 18 : 16,
        altitude: navigation ? 500 : 1100,
      }}
      mapType="standard"
      showsBuildings={false}
      pitchEnabled={false}
      rotateEnabled={false}
      showsCompass
      showsScale
      toolbarEnabled={false}
    >
      <Polygon
        coordinates={[
          {
            latitude: campusBounds.south - 1,
            longitude: campusBounds.west - 1,
          },
          {
            latitude: campusBounds.north + 1,
            longitude: campusBounds.west - 1,
          },
          {
            latitude: campusBounds.north + 1,
            longitude: campusBounds.east + 1,
          },
          {
            latitude: campusBounds.south - 1,
            longitude: campusBounds.east + 1,
          },
        ]}
        holes={[campusBoundary]}
        fillColor="rgba(226,232,240,0.94)"
        strokeWidth={0}
      />
      <Polygon
        coordinates={campusBoundary}
        strokeColor="#15803D"
        strokeWidth={2}
        fillColor="transparent"
      />
      {!!route?.length && (
        <Polyline coordinates={route} strokeColor="#FFFFFF" strokeWidth={10} />
      )}
      {!!route?.length && (
        <Polyline coordinates={route} strokeColor="#2563EB" strokeWidth={6} />
      )}
      {places.map((place) => (
        <Marker
          key={place.id}
          coordinate={place.coordinate}
          title={place.name}
          description={
            approximateLocationIds.has(place.id)
              ? "Vị trí ước lượng từ sơ đồ trường"
              : "Dữ liệu OpenStreetMap"
          }
          pinColor={place.id === selectedId ? "#E11D48" : colors.primary}
          onPress={() => onSelect(place.id)}
        />
      ))}
      {userLocation && (
        <Marker
          coordinate={userLocation}
          title="Vị trí của bạn"
          pinColor="#16A34A"
        />
      )}
      {!!route?.length && (
        <Marker
          coordinate={route[0]}
          title="Điểm xuất phát"
          pinColor="#2563EB"
        />
      )}
      {navigation && (
        <Marker
          coordinate={navigation.coordinate}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={navigation.heading}
          tracksViewChanges={false}
          zIndex={10}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#fff",
              borderWidth: 2,
              borderColor: "#1A73E8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-up" size={20} color="#1A73E8" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}
