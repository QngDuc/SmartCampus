import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/constants/campus';

// Mỗi file trong nhóm (tabs) là một màn hình trên thanh điều hướng.
export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown: false, tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.card },
    tabBarLabelStyle: { fontSize: 11 },
  }}>
    <Tabs.Screen name="home" options={{ title: 'Trang chủ', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="map" options={{ title: 'Bản đồ', tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="schedule" options={{ title: 'Lịch', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="events" options={{ title: 'Sự kiện', tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="explore" options={{ href: null }} />
  </Tabs>;
}

