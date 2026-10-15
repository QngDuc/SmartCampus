import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export function AuthLoadingOverlay({ visible, title }: { visible: boolean; title: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      progress.setValue(0);
      return;
    }

    const animation = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [progress, visible]);

  const pulseScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const pulseOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.iconArea}>
            <Animated.View style={[styles.pulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
            <View style={styles.iconCircle}>
              <Ionicons name="school" size={26} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>Đang xác thực và đồng bộ điểm cùng thời khóa biểu.</Text>
          <ActivityIndicator color="#2563EB" style={styles.indicator} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 30,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconArea: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  pulse: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#2563EB',
  },
  iconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#2563EB',
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  indicator: {
    marginTop: 20,
  },
});