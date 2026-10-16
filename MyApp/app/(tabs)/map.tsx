import CampusMap from "@/components/campus-map";
import { colors, s } from "@/constants/campus";
import {
  campusMap,
  isValidCoordinate,
  locationCoordinates,
  type Coordinate,
} from "@/data/campusMap";
import { canRoute, findCampusRoute, insideCampus } from "@/data/campusRouting";
import { locationImages } from "@/data/locationImages";
import { locations } from "@/data/mockData";
import {
  getGpxHeading,
  getRemainingGpxDistance,
  gpxNavigationInfo,
  gpxNavigationRoute,
} from "@/data/gpxNavigation";
import { showAlert } from "@/utils/feedback";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
// Dữ liệu cố định không làm tạo lại lớp ghim khi gõ tìm kiếm.
const places = locations.flatMap((item) => {
  const coordinate = locationCoordinates[item.id];
  return isValidCoordinate(coordinate) && insideCampus(coordinate)
    ? [{ id: item.id, name: item.name, coordinate }]
    : [];
});

export default function MapScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [category, setCategory] = useState("Tất cả");
  const params = useLocalSearchParams<{
    locationId?: string;
    directions?: string;
  }>();
  const requestedLocationId = Number(params.locationId);
  const selectedId = locations.some(
    (place) => place.id === requestedLocationId,
  )
    ? requestedLocationId
    : undefined;
  const [originId, setOriginId] = useState(10);
  const [center, setCenter] = useState(() => {
    const isSelectedPlace = locations.some(
      (place) => place.id === requestedLocationId,
    );
    return isSelectedPlace && params.directions !== "0"
      ? (locationCoordinates[requestedLocationId] ?? campusMap.center)
      : campusMap.center;
  });
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locating, setLocating] = useState(false);
  const showRoute = params.directions === "1";
  const [navigationStep, setNavigationStep] = useState<number | null>(null);
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);
  const [search, setSearch] = useState("");
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  const selected = locations.find((place) => place.id === selectedId);
  const origin = locations.find((place) => place.id === originId)!;
  const navigationActive = navigationStep !== null;
  const navigationCoordinate =
    navigationStep === null ? undefined : gpxNavigationRoute[navigationStep];
  const remainingDistance =
    navigationStep === null ? 0 : getRemainingGpxDistance(navigationStep);
  const remainingMinutes = Math.ceil(remainingDistance / 75);
  const navigationCamera = useMemo(
    () =>
      navigationCoordinate && navigationStep !== null
        ? {
            coordinate: navigationCoordinate,
            heading: getGpxHeading(navigationStep),
          }
        : undefined,
    [navigationCoordinate, navigationStep],
  );
  useEffect(() => {
    if (!navigationActive) return;
    const timer = setInterval(() => {
      setNavigationStep((step) =>
        step === null || step >= gpxNavigationRoute.length - 1 ? step : step + 1,
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [navigationActive]);
  // Tính đường trên đồ thị nội bộ trong bộ nhớ, không đợi API định tuyến.
  const route = useMemo(
    () =>
      selectedId !== undefined && showRoute
        ? findCampusRoute(originId, selectedId)
        : null,
    [originId, selectedId, showRoute],
  );
  const results = locations.filter(
    (place) =>
      normalize(place.name).includes(normalize(search)) &&
      (picker !== "origin" || canRoute(place.id)),
  );

  function selectPlace(id: number) {
    setNavigationStep(null);
    setCenter(locationCoordinates[id] ?? campusMap.center);
    router.setParams({ locationId: String(id), directions: "0" });
  }
  function openPicker(mode: "origin" | "destination") {
    setSearch("");
    setPicker(mode);
  }

  async function locate() {
    if (locating) return;
    const id = ++request.current;
    setLocating(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!(await Location.requestForegroundPermissionsAsync()).granted) {
        showAlert(
          "Chưa có quyền vị trí",
          "Bạn vẫn có thể chọn điểm xuất phát trong trường.",
        );
        return;
      }
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), 15000);
        }),
      ]);
      if (request.current !== id) return;
      if (!insideCampus(position.coords)) {
        setUserLocation(null);
        showAlert(
          "Bạn đang ngoài khu vực trường",
          "Bản đồ chỉ hỗ trợ khuôn viên Đại học Tây Nguyên. Chọn cổng chính hoặc cổng sau làm điểm xuất phát.",
        );
        return;
      }
      if ((position.coords.accuracy ?? Infinity) > 50) {
        showAlert(
          "Vị trí chưa đủ chính xác",
          "Hãy thử lại ở nơi thoáng hơn hoặc chọn điểm xuất phát trên sơ đồ.",
        );
        return;
      }
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setCenter({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      // Chỉ hiển thị GPS. Không tự nối GPS tới đường bằng đoạn thẳng qua tòa nhà.
      router.setParams({ directions: "0" });
    } catch {
      if (request.current === id)
        showAlert(
          "Chưa lấy được vị trí",
          "Kiểm tra GPS hoặc chọn điểm xuất phát trong trường.",
        );
    } finally {
      if (timer) clearTimeout(timer);
      if (request.current === id) setLocating(false);
    }
  }

  return (
    <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
      <View style={styles.mapArea}>
        <CampusMap
          center={center}
          places={
            navigationActive
              ? []
              : category === "Tất cả"
                ? places
                : places.filter(
                    (p) =>
                      locations.find((l) => l.id === p.id)?.category ===
                      category,
                  )
          }
          selectedId={navigationActive ? undefined : selectedId}
          userLocation={navigationActive ? null : userLocation}
          onSelect={selectPlace}
          route={navigationActive ? gpxNavigationRoute : route?.points}
          navigation={navigationCamera}
        />
        {!navigationActive && (
          <View style={styles.controls}>
            <Pressable
              style={styles.round}
              accessibilityRole="button"
              accessibilityLabel="Vị trí của tôi"
              disabled={locating}
              onPress={locate}
            >
              <Ionicons
                name={locating ? "hourglass-outline" : "locate"}
                size={23}
                color={colors.primary}
              />
            </Pressable>
            <Pressable
              style={styles.round}
              accessibilityRole="button"
              accessibilityLabel="Xem toàn trường"
              onPress={() => {
                setCenter({ ...campusMap.center });
                setNavigationStep(null);
                router.setParams({ locationId: "", directions: "0" });
              }}
            >
              <Ionicons
                name="school-outline"
                size={23}
                color={colors.primary}
              />
            </Pressable>
          </View>
        )}
      </View>

      {navigationActive ? (
        <>
          <View style={styles.navigationHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thoát mô phỏng chỉ đường"
              style={styles.navigationBack}
              onPress={() => setNavigationStep(null)}
            >
              <Ionicons name="close" size={23} color="#202124" />
            </Pressable>
            <View style={styles.navigationHeaderText}>
              <Text style={styles.navigationInstruction} numberOfLines={1}>
                {remainingDistance === 0
                  ? "Bạn đã đến Nhà số 7"
                  : "Tiếp tục đi theo tuyến"}
              </Text>
              <Text style={styles.navigationDestination} numberOfLines={1}>
                KTX Lào  →  Nhà số 7
              </Text>
            </View>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO</Text>
            </View>
          </View>
          <View style={styles.navigationSheet}>
            <View style={styles.navigationSummary}>
              <Ionicons name="navigate" size={25} color="#1A73E8" />
              <View style={styles.navigationSummaryText}>
                <Text style={styles.navigationDistance}>
                  {remainingDistance === 0
                    ? "Đã đến nơi"
                    : `Còn ${remainingDistance} m`}
                </Text>
                <Text style={styles.navigationMeta}>
                  {remainingDistance === 0
                    ? "Nhà số 7"
                    : `Đi bộ · khoảng ${remainingMinutes} phút`}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      ((navigationStep ?? 0) /
                        (gpxNavigationRoute.length - 1)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.demoNotice}>
              Mô phỏng theo tuyến GPX đã ghi · Không dùng GPS trực tiếp
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.endNavigationButton}
              onPress={() => setNavigationStep(null)}
            >
              <Text style={styles.endNavigationText}>Kết thúc mô phỏng</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View
            style={[styles.topBar, { left: wide && selected ? 424 : 16 }]}
            pointerEvents="box-none"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tìm kiếm địa điểm trong trường"
              style={styles.searchBar}
              onPress={() => openPicker("destination")}
            >
              <Ionicons name="menu" size={23} color="#5F6368" />
              <Text style={styles.fieldText} numberOfLines={1}>
                {selected?.name ?? "Tìm kiếm trong khuôn viên"}
              </Text>
              <Ionicons name="search" size={23} color="#5F6368" />
            </Pressable>
            {wide && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 8, alignItems: "center" }}
              >
                {[
                  "Tất cả",
                  "Học tập",
                  "Giảng đường",
                  "Tiện ích",
                  "Thể thao",
                  "Cổng trường",
                ].map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === item }}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.chip,
                      category === item && styles.activeChip,
                    ]}
                  >
                    <Text
                      style={{
                        color: category === item ? "#007C91" : "#3C4043",
                        fontWeight: "600",
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
      {selected && (
        <View
          style={[
            styles.detailPanel,
            wide ? styles.desktopPanel : styles.mobilePanel,
          ]}
        >
          <ScrollView key={selected.id} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              {locationImages[selected.id] ? (
                <Image
                  source={locationImages[selected.id]}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityLabel={`Ảnh ${selected.name}`}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="images-outline" size={44} color="#007C91" />
                  <Text style={styles.photoCaption}>Chưa có ảnh địa điểm</Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng chi tiết địa điểm"
                style={styles.closeDetail}
                onPress={() => {
                  router.setParams({ locationId: "", directions: "0" });
                }}
              >
                <Ionicons name="close" size={23} color="#3C4043" />
              </Pressable>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.placeTitle}>{selected.name}</Text>
              <Text style={styles.categoryText}>
                {selected.category} · Đại học Tây Nguyên
              </Text>
            </View>
            <View style={styles.overviewTab}>
              <Text style={styles.overviewText}>Tổng quan</Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={!canRoute(selected.id)}
                style={styles.action}
                onPress={() => {
                  router.setParams({ directions: "1" });
                }}
              >
                <View
                  style={[
                    styles.actionCircle,
                    {
                      backgroundColor: canRoute(selected.id)
                        ? "#007F92"
                        : "#94A3B8",
                    },
                  ]}
                >
                  <Ionicons name="navigate" size={23} color="white" />
                </View>
                <Text style={styles.actionLabel}>Đường đi</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.action}
                onPress={() => openPicker("origin")}
              >
                <View style={styles.actionCircle}>
                  <Ionicons
                    name="radio-button-on-outline"
                    size={23}
                    color="#007F92"
                  />
                </View>
                <Text style={styles.actionLabel}>Điểm xuất phát</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.action}
                onPress={() =>
                  router.push({
                    pathname: "/location-detail",
                    params: { id: String(selected.id) },
                  })
                }
              >
                <View style={styles.actionCircle}>
                  <Ionicons
                    name="information-circle-outline"
                    size={23}
                    color="#007F92"
                  />
                </View>
                <Text style={styles.actionLabel}>Chi tiết</Text>
              </Pressable>
            </View>
            <View style={styles.detailBody}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={24} color="#008698" />
                <Text style={styles.infoText}>567 Lê Duẩn, Đắk Lắk</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={24} color="#008698" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoText}>{selected.hours}</Text>
                  <Text style={styles.categoryText}>
                    Giờ hoạt động tham khảo
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="reader-outline" size={24} color="#008698" />
                <Text style={styles.infoText}>{selected.description}</Text>
              </View>
              {showRoute && (
                <View style={styles.routeCard}>
                  <Text style={styles.routeTitle}>
                    {selected.id === 7
                      ? `${Math.ceil(getRemainingGpxDistance(0) / 75)} phút · ${getRemainingGpxDistance(0)} m`
                      : route
                        ? `${route.minutes} phút · ${route.meters} m`
                        : "Chưa có tuyến đi bộ phù hợp"}
                  </Text>
                  <Text style={styles.infoText}>
                    {selected.id === 7
                      ? "KTX Lào → Nhà số 7"
                      : `${origin.name} → ${selected.name}`}
                  </Text>
                  <Text style={styles.notice}>
                    {selected.id === 7
                      ? "Tuyến GPS đã ghi, dùng để chạy thử mô phỏng; chưa có chỉ dẫn rẽ hoặc định vị trực tiếp."
                      : "Tuyến tham khảo theo sơ đồ, chưa khảo sát lối đi thực tế."}
                  </Text>
                  {selected.id === 7 && (
                    <>
                      <Text style={styles.gpxDetails}>
                        Ghi ngày {gpxNavigationInfo.recordedAt} ·{" "}
                        {gpxNavigationInfo.recordedPointCount} điểm GPS ·{" "}
                        {Math.floor(
                          gpxNavigationInfo.recordedDurationSeconds / 60,
                        )}
                        :
                        {String(
                          gpxNavigationInfo.recordedDurationSeconds % 60,
                        ).padStart(2, "0")}
                      </Text>
                      <Text style={styles.gpxDetails}>
                        Tốc độ TB{" "}
                        {gpxNavigationInfo.averageSpeedKmh.toFixed(1)} km/h ·
                        tối đa {gpxNavigationInfo.maximumSpeedKmh.toFixed(1)}{" "}
                        km/h
                      </Text>
                      <Text style={styles.gpxDetails}>
                        Độ cao GPS: {gpxNavigationInfo.minimumElevationMeters}–
                        {gpxNavigationInfo.maximumElevationMeters} m
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.startNavigationButton}
                        onPress={() => setNavigationStep(0)}
                      >
                        <Ionicons name="navigate" size={19} color="#fff" />
                        <Text style={styles.startNavigationText}>
                          Mô phỏng điều hướng 3D
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.picker}>
            <View style={s.between}>
              <Text style={s.heading}>
                {picker === "origin"
                  ? "Điểm xuất phát"
                  : "Điểm đến trong trường"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng danh sách"
                onPress={() => setPicker(null)}
                style={{ padding: 12 }}
              >
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Tìm địa điểm"
              value={search}
              onChangeText={setSearch}
              style={s.input}
              placeholder="Thư viện, nhà số 9, cổng chính..."
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ marginTop: 10 }}
            >
              {results.length === 0 && (
                <Text style={s.muted}>Không tìm thấy địa điểm.</Text>
              )}
              {results.map((place) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  style={styles.result}
                  onPress={() => {
                    if (picker === "origin") {
                      setOriginId(place.id);
                      router.setParams({ directions: "1" });
                    } else selectPlace(place.id);
                    setPicker(null);
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    color={colors.primary}
                    size={22}
                  />
                  <View style={s.grow}>
                    <Text style={s.label}>{place.name}</Text>
                    <Text style={s.muted}>
                      {canRoute(place.id)
                        ? place.category
                        : "Chưa có dữ liệu lối đi"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    gap: 16,
    zIndex: 20,
  },
  searchBar: {
    width: 380,
    maxWidth: "100%",
    backgroundColor: "white",
    borderRadius: 32,
    padding: 17,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    elevation: 5,
    boxShadow: "0px 2px 8px #0002",
  },
  chip: {
    backgroundColor: "white",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  activeChip: { backgroundColor: "#D9F4F8", borderColor: "#007C91" },
  detailPanel: {
    position: "absolute",
    backgroundColor: "white",
    overflow: "hidden",
    zIndex: 15,
    elevation: 6,
    boxShadow: "0px 4px 18px #0002",
  },
  desktopPanel: { top: 16, bottom: 16, left: 16, width: 392, borderRadius: 24 },
  mobilePanel: {
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "58%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  hero: { height: 200, backgroundColor: "#E5F3F0" },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  photoCaption: { color: "#457176", fontSize: 13 },
  closeDetail: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 22,
    backgroundColor: "white",
    padding: 9,
  },
  detailBody: { padding: 24, gap: 20 },
  placeTitle: { fontSize: 25, color: "#202124", fontWeight: "600" },
  categoryText: { color: "#70757A", fontSize: 13, marginTop: 4 },
  overviewTab: {
    borderBottomWidth: 1,
    borderColor: "#DADCE0",
    alignItems: "center",
  },
  overviewText: {
    color: "#008698",
    fontWeight: "600",
    fontSize: 15,
    padding: 15,
    borderBottomWidth: 3,
    borderColor: "#008698",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#E8EAED",
  },
  action: { alignItems: "center", gap: 9, flex: 1 },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1F6FF",
  },
  actionLabel: { color: "#006577", fontSize: 12, textAlign: "center" },
  infoRow: { flexDirection: "row", gap: 18, alignItems: "flex-start" },
  infoText: { flexShrink: 1, fontSize: 14, lineHeight: 23, color: "#3C4043" },
  routeCard: {
    backgroundColor: "#EDF8F8",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  startNavigationButton: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: "#1A73E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startNavigationText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  gpxDetails: { color: "#3C4043", fontSize: 13, lineHeight: 19 },
  navigationHeader: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 25,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#fff",
    elevation: 8,
    boxShadow: "0px 3px 12px #0003",
  },
  navigationBack: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationHeaderText: { flex: 1, gap: 4 },
  navigationInstruction: { fontSize: 16, fontWeight: "700", color: "#202124" },
  navigationDestination: { fontSize: 12, color: "#5F6368" },
  demoBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E8F0FE",
  },
  demoBadgeText: { color: "#1A73E8", fontWeight: "800", fontSize: 10 },
  navigationSheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 25,
    padding: 18,
    gap: 12,
    borderRadius: 22,
    backgroundColor: "#fff",
    elevation: 8,
    boxShadow: "0px 3px 12px #0003",
  },
  navigationSummary: { flexDirection: "row", alignItems: "center", gap: 14 },
  navigationSummaryText: { gap: 3 },
  navigationDistance: { color: "#202124", fontSize: 22, fontWeight: "800" },
  navigationMeta: { color: "#5F6368", fontSize: 14 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#DDE3EA",
  },
  progressFill: { height: "100%", backgroundColor: "#1A73E8" },
  demoNotice: { fontSize: 12, color: "#64748B" },
  endNavigationButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 24,
    backgroundColor: "#F1F3F4",
  },
  endNavigationText: { color: "#3C4043", fontWeight: "700" },
  routeTitle: { color: "#007C91", fontSize: 18, fontWeight: "700" },
  page: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    padding: 14,
    gap: 9,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  brand: { fontWeight: "800", fontSize: 13, color: "#166534", flexShrink: 1 },
  pill: {
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { color: "#166534", fontSize: 11, fontWeight: "700" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    padding: 12,
  },
  fieldText: { flex: 1, color: "#0F172A", fontSize: 14 },
  mapArea: { flex: 1, minHeight: 200 },
  controls: { position: "absolute", right: 12, bottom: 20, gap: 10 },
  round: {
    width: 46,
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 16,
    gap: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 3,
  },
  eta: { fontSize: 22, fontWeight: "800", color: "#15803D", flexShrink: 1 },
  notice: { color: "#92400E", fontSize: 12, lineHeight: 17 },
  caption: { fontSize: 10, color: "#64748B", textAlign: "center" },
  backdrop: { flex: 1, backgroundColor: "#0006", justifyContent: "flex-end" },
  picker: {
    height: "75%",
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
});
