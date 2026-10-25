import { useAdaptiveStyles } from '@/components/theme-provider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { latestNotifications } from '@/data/mockData';

export default function NotificationsScreen() {
  const styles = useAdaptiveStyles(baseStyles);
  const [items, setItems] = useState(latestNotifications);

  function markRead(id: number) {
    setItems(items.map(item => (item.id === id ? { ...item, isRead: true } : item)));
  }

  function markAllRead() {
    setItems(items.map(item => ({ ...item, isRead: true })));
  }

  const unreadCount = items.filter(item => !item.isRead).length;

  return (
    <Screen back>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Thông báo</Text>
          <Text style={styles.subTitle}>{unreadCount} thông báo chưa đọc</Text>
        </View>
        {unreadCount > 0 && (
          <Pressable accessibilityRole="button" onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Đánh dấu đã đọc</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        {items.map(item => {
          const isUnread = !item.isRead;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thông báo: ${item.title}`}
              key={item.id}
              onPress={() => markRead(item.id)}
              style={[
                styles.notificationCard,
                isUnread ? styles.notificationUnread : styles.notificationRead,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  isUnread ? styles.iconBoxUnread : styles.iconBoxRead,
                ]}
              >
                {item.type === 'grade' && <Ionicons name="school" size={20} color="#2563EB" />}
                {item.type === 'event' && <Ionicons name="megaphone" size={20} color="#2563EB" />}
                {item.type === 'system' && (
                  <Ionicons name="settings-sharp" size={20} color="#2563EB" />
                )}
              </View>

              <View style={styles.contentCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.itemContent} numberOfLines={3}>
                  {item.content}
                </Text>

                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const baseStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  list: {
    gap: 10,
    marginTop: 8,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  notificationUnread: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  notificationRead: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    backgroundColor: '#DBEAFE',
  },
  iconBoxRead: {
    backgroundColor: '#EFF6FF',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 19,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 5,
  },
  itemContent: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
});

const styles = baseStyles;