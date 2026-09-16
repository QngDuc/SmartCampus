import { Alert, Platform } from 'react-native';

// Alert của React Native dùng trên điện thoại; trình duyệt dùng hộp thoại tương đương.
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(title + '\n\n' + message);
  } else {
    Alert.alert(title, message);
  }
}

