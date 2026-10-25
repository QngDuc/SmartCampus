import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { s } from "@/constants/campus";
import { useAppTheme } from "@/components/theme-provider";

// Chỉ tách phần khung màn hình và nút vì chúng được dùng nhiều lần.
type ScreenProps = { children: ReactNode; back?: boolean; form?: boolean };
export function Screen({ children, back = false, form = false }: ScreenProps) {
  const { colors, isDark } = useAppTheme();
  const pageStyle = { flex: 1, backgroundColor: colors.background } as const;
  return (
    <SafeAreaView style={pageStyle} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={pageStyle}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={form}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {back && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.canGoBack()
                  ? router.back()
                  : router.replace("/(tabs)/home")
              }
              style={{ paddingVertical: 8 }}
            >
              <Text style={[s.link, { color: colors.primary }]}>‹ Quay lại</Text>
            </Pressable>
          )}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: ButtonProps) {
  const { colors, isDark } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: secondary ? colors.subtle : isDark ? '#3569C8' : colors.primary },
        disabled && s.disabled,
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: isDark ? '#FFFFFF' : colors.primary }]}>{title}</Text>
    </Pressable>
  );
}
