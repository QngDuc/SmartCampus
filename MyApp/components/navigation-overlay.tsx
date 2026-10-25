import { useAdaptiveStyles } from '@/components/theme-provider';
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDistance } from "@/data/navigationSteps";
import type { GpxNavigation } from "@/hooks/use-gpx-navigation";

// Banner rẽ + thẻ thông tin kiểu Google Maps cho chế độ mô phỏng GPX.
export default function NavigationOverlay({ nav }: { nav: GpxNavigation }) {
  const styles = useAdaptiveStyles(baseStyles);
  const { track, next } = nav;
  if (!track || !next) return null;
  const { step, following, distance } = next;
  const turn = Math.max(-150, Math.min(150, step.turn));
  const title = nav.arrived ? `Bạn đã đến ${track.toName}` : step.text;
  return (
    <>
      <View style={styles.banner}>
        <View style={styles.main}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thoát mô phỏng chỉ đường"
            onPress={nav.stop}
            style={styles.close}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          {step.end || nav.arrived ? (
            <Ionicons name="flag" size={44} color="#fff" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={48}
              color="#fff"
              style={{ transform: [{ rotate: `${turn}deg` }] }}
            />
          )}
          <View style={styles.text}>
            {!nav.arrived && (
              <Text style={styles.distance}>{formatDistance(distance)}</Text>
            )}
            <Text style={styles.instruction} numberOfLines={2}>
              {title}
            </Text>
          </View>
          <View style={styles.demo}>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        </View>
        {following && !nav.arrived && (
          <View style={styles.then}>
            <Text style={styles.thenText}>Sau đó: {following.text}</Text>
          </View>
        )}
      </View>
      <View style={styles.sheet}>
        <Text style={styles.eta}>
          {nav.arrived ? "Đã đến nơi" : `${nav.minutes} phút`}
        </Text>
        <Text style={styles.meta}>
          {nav.arrived
            ? track.toName
            : `Còn ${nav.remaining} m · ${track.paceLabel}`}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${nav.progress * 100}%` }]} />
        </View>
        <Text style={styles.notice}>
          {track.fromName} → {track.toName} · Mô phỏng theo tuyến GPX đã ghi,
          không dùng GPS trực tiếp
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.end}
          onPress={nav.stop}
        >
          <Text style={styles.endText}>Kết thúc mô phỏng</Text>
        </Pressable>
      </View>
    </>
  );
}

const baseStyles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 25,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#05664A",
    elevation: 8,
    boxShadow: "0px 3px 12px #0004",
  },
  main: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  close: { padding: 4 },
  text: { flex: 1, gap: 2 },
  distance: { color: "#fff", fontSize: 30, fontWeight: "700" },
  instruction: { color: "#fff", fontSize: 18 },
  demo: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E8F0FE",
  },
  demoText: { color: "#1A73E8", fontWeight: "800", fontSize: 10 },
  then: {
    backgroundColor: "#03503A",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  thenText: { color: "#fff", fontSize: 14 },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 25,
    padding: 18,
    gap: 10,
    borderRadius: 22,
    backgroundColor: "#fff",
    elevation: 8,
    boxShadow: "0px 3px 12px #0003",
  },
  eta: {
    color: "#188038",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  meta: { color: "#5F6368", fontSize: 14, textAlign: "center" },
  track: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#DDE3EA",
  },
  fill: { height: "100%", backgroundColor: "#1A73E8" },
  notice: { fontSize: 12, color: "#64748B", textAlign: "center" },
  end: {
    minHeight: 44,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F4",
  },
  endText: { color: "#3C4043", fontWeight: "700" },
});

const styles = baseStyles;