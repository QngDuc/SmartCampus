import CampusMap from "@/components/campus-map";
import { Button, Screen } from "@/components/campus-ui";
import { colors, s } from "@/constants/campus";
import {
  approximateLocationIds,
  campusMap,
  getDirectionsDestination,
  isValidCoordinate,
  locationCoordinates,
  type Coordinate,
} from "@/data/campusMap";
import { locations } from "@/data/mockData";
import { openDirections } from "@/utils/directions";
import { showAlert } from "@/utils/feedback";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

// Chuẩn hóa chuỗi để so sánh tên địa điểm không phân biệt dấu và ký tự đặc biệt.
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

// Tạo danh sách ghim cố định từ dữ liệu địa điểm để tránh re-render không cần thiết khi người dùng gõ tìm kiếm.
const places = locations.flatMap((item) => {
  const coordinate = locationCoordinates[item.id];
  return isValidCoordinate(coordinate)
    ? [{ id: item.id, name: item.name, coordinate }]
    : [];
});

export default function MapScreen() {
  const { locationId } = useLocalSearchParams<{ locationId?: string }>();
  const [searchText, setSearchText] = useState("");
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [center, setCenter] = useState<Coordinate | null>(
    campusMap?.center ?? null,
  );
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locating, setLocating] = useState(false);
  // Dùng để hủy bỏ request cũ nếu người dùng nhấn lại hoặc màn hình unmount trong lúc lấy vị trí.
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  // Đồng bộ lựa chọn địa điểm khi màn hình được mở từ màn hình chi tiết hoặc link có locationId.
  useEffect(() => {
    if (!locationId) return;
    // Nút "Xem trên bản đồ" gửi id qua URL; không nhận tọa độ tùy ý từ đường dẫn.
    const id = Number(locationId);
    if (!locations.some((item) => item.id === id)) return;
    setSelectedId(id);
    setSearchText("");
    const coordinate = locationCoordinates[id];
    const target = isValidCoordinate(coordinate)
      ? coordinate
      : campusMap.center;
    // selectPlace đã di chuyển ngay; URL đồng bộ sau đó không cần di chuyển lần hai.
    setCenter((previous) =>
      previous?.latitude === target.latitude &&
      previous.longitude === target.longitude
        ? previous
        : target,
    );
  }, [locationId]);

  // Khi người dùng chọn một địa điểm, cập nhật trạng thái chọn và di chuyển bản đồ đến vị trí đó.
  function selectPlace(id: number) {
    setSelectedId(id);
    const coordinate = locationCoordinates[id];
    setCenter(
      isValidCoordinate(coordinate)
        ? { ...coordinate }
        : { ...campusMap.center },
    );
    router.setParams({ locationId: String(id) });
  }

  // Xin quyền vị trí theo hành động người dùng, tránh truy cập GPS ngay khi mở màn hình.
  async function locateUser() {
    if (locating) return;
    setLocating(true);
    const currentRequest = ++requestId.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (currentRequest !== requestId.current) return;
      if (!permission.granted) {
        showAlert(
          "Chưa được cấp vị trí",
          "Bạn có thể cấp quyền vị trí trong cài đặt. Bạn vẫn xem được bản đồ và dùng Google Maps để dẫn đường.",
        );
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        showAlert(
          "GPS đang tắt",
          "Hãy bật dịch vụ vị trí trên thiết bị rồi thử lại.",
        );
        return;
      }
      const position = await Promise.race([
        // GPS có thể mất thời gian trong nhà hoặc nơi có tín hiệu yếu; dừng trạng thái loading sau 20 giây.
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), 20000);
        }),
      ]);
      if (currentRequest !== requestId.current) return;
      // Giữ chỉ vị trí mới nhất để tránh hiển thị dữ liệu cũ khi có nhiều request cùng lúc.
      const point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(point);
      setCenter(point);
    } catch {
      if (currentRequest === requestId.current)
        showAlert(
          "Chưa lấy được vị trí",
          "Hãy kiểm tra GPS, thử ở nơi thoáng hơn rồi nhấn lại.",
        );
    } finally {
      if (timer) clearTimeout(timer);
      if (currentRequest === requestId.current) setLocating(false);
    }
  }

  // Lọc địa điểm theo tên, bỏ dấu và chuẩn hóa để tìm kiếm mượt hơn trên tiếng Việt.
  const results = locations.filter((item) =>
    normalize(item.name).includes(normalize(searchText.trim())),
  );
  const selected = locations.find((item) => item.id === selectedId);
  // Dùng để biết tọa độ của địa điểm đang chọn có hợp lệ và có nên hiển thị cảnh báo không cập nhật không.
  const selectedCoordinate = selected
    ? locationCoordinates[selected.id]
    : undefined;

  return (
    <Screen>
      <Text style={s.badge}>SƠ ĐỒ TRƯỜNG · 2D</Text>
      <Text style={s.title}>{campusMap?.name ?? "Bản đồ khuôn viên"}</Text>
      {campusMap && <Text style={s.muted}>{campusMap.address}</Text>}
      <TextInput
        accessibilityLabel="Tìm địa điểm"
        style={s.input}
        placeholder="Tìm thư viện, giảng đường..."
        placeholderTextColor={colors.muted}
        value={searchText}
        onChangeText={setSearchText}
      />
      {isValidCoordinate(center) ? (
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <CampusMap
            center={center}
            places={places}
            selectedId={selectedId}
            userLocation={userLocation}
            onSelect={selectPlace}
          />
        </View>
      ) : (
        <View style={s.card}>
          <Text style={s.heading}>Chưa có vị trí trường</Text>
          <Text style={s.muted}>
            Thông tin bản đồ của cơ sở đang được cập nhật. Bạn có thể xem vị trí
            hiện tại bằng nút bên dưới.
          </Text>
        </View>
      )}
      <Text style={s.muted}>
        Chạm tên địa điểm để chọn. Kéo để di chuyển, chụm để thu phóng. Ghim các
        nhà được ước lượng từ sơ đồ trường.
      </Text>
      <Button
        title="Dẫn đường đến cổng chính"
        secondary
        onPress={() =>
          openDirections(getDirectionsDestination(100, campusMap.name))
        }
      />
      <View style={s.row}>
        <View style={s.grow}>
          <Button
            title={locating ? "Đang lấy vị trí..." : "Vị trí của tôi"}
            disabled={locating}
            onPress={locateUser}
          />
        </View>
        {campusMap && (
          <View style={s.grow}>
            <Button
              title="Về trường"
              secondary
              onPress={() => {
                if (campusMap) setCenter({ ...campusMap.center });
                setSelectedId(undefined);
                router.setParams({ locationId: "" });
              }}
            />
          </View>
        )}
      </View>
      {selected && (
        <View style={s.card}>
          <Text style={s.badge}>ĐỊA ĐIỂM ĐANG CHỌN</Text>
          <Text style={s.heading}>{selected.name}</Text>
          <Text style={s.muted}>{selected.description}</Text>
          <Text style={s.text}>Giờ hoạt động: {selected.hours}</Text>
          {!isValidCoordinate(selectedCoordinate) && (
            <Text style={s.muted}>Địa điểm này chưa được cập nhật tọa độ.</Text>
          )}
          {approximateLocationIds.has(selected.id) && (
            <Text style={s.muted}>
              Vị trí ghim ước lượng từ sơ đồ. Google Maps sẽ tìm điểm đến theo
              tên; hãy kiểm tra kết quả trước khi đi.
            </Text>
          )}
          <Button
            title="Dẫn đường bằng Google Maps"
            onPress={() =>
              openDirections(
                getDirectionsDestination(selected.id, selected.name),
              )
            }
          />
          <Text style={s.muted}>
            {selected.id === 100
              ? "Dẫn đến cổng chính tại 567 Lê Duẩn."
              : "Mở Google Maps để tìm đường đi bộ từ vị trí của bạn."}
          </Text>
          <Button
            title="Xem chi tiết"
            secondary
            onPress={() =>
              router.push({
                pathname: "/location-detail",
                params: { id: selected.id },
              })
            }
          />
        </View>
      )}
      <Text style={s.heading}>Địa điểm trong trường</Text>
      {results.length === 0 && (
        <Text style={s.muted}>
          Không tìm thấy địa điểm phù hợp. Thử tên khác.
        </Text>
      )}
      {results.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem ${item.name} trên bản đồ`}
          accessibilityState={{ selected: item.id === selectedId }}
          key={item.id}
          style={[
            s.card,
            item.id === selectedId && {
              borderColor: colors.primary,
              backgroundColor: "#EFF6FF",
            },
          ]}
          onPress={() => selectPlace(item.id)}
        >
          <Text style={s.badge}>{item.category}</Text>
          <Text style={s.heading}>{item.name}</Text>
          <Text style={s.muted}>{item.description}</Text>
          <Text style={s.link}>Xem trên bản đồ →</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
