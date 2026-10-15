import { useEffect } from 'react';
import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/components/auth-provider';

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments.join('/');
    const isAuthScreen = currentRoute === '' || currentRoute === 'index' || currentRoute === 'register';
    if (user && isAuthScreen) router.replace('/(tabs)/home');
    if (!user && !isAuthScreen) router.replace('/');
  }, [isLoading, segments, user]);

  return <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="location-detail" />
      <Stack.Screen name="event-detail" />
    </Stack>
    <StatusBar style="dark" />
  </>;
}

export default function RootLayout() {
  return <AuthProvider><RootNavigator /></AuthProvider>;
}

