# SMART CAMPUS — Báo cáo triển khai

## A. File đã tạo
- app/index.tsx: LoginScreen.
- app/register.tsx: RegisterScreen.
- app/(tabs)/home.tsx: HomeScreen.
- app/(tabs)/profile.tsx: ProfileScreen.
- app/(tabs)/map.tsx: MapScreen.
- app/(tabs)/events.tsx: EventsScreen.
- app/(tabs)/schedule.tsx: ScheduleScreen.
- app/notifications.tsx: NotificationsScreen.
- app/location-detail.tsx: LocationDetailScreen.
- app/event-detail.tsx: EventDetailScreen.
- constants/campus.ts: bảng màu và StyleSheet dùng chung.
- components/campus-ui.tsx: Screen và Button dùng chung.
- data/mockData.ts: array địa điểm, sự kiện, thông báo và lịch học.
- utils/feedback.ts: hộp thoại cho native và web.
- reference/student-example.tsx.txt: bản sao nguyên văn bài tập thông tin sinh viên cũ.
- SMART_CAMPUS_REPORT.md: tài liệu này.
- dist-smart-campus/: kết quả build web để kiểm tra, có thể tạo lại bằng lệnh export.

## B. File đã sửa
- app/_layout.tsx: Stack điều hướng các màn hình, StatusBar tối.
- app/(tabs)/_layout.tsx: 5 tab Trang chủ, Bản đồ, Lịch, Sự kiện, Cá nhân.
- app.json: tên hiển thị SMART CAMPUS; giao diện sáng để đồng bộ bảng màu.
- .gitignore: bỏ qua thư mục build dist-smart-campus.
- app/(tabs)/index.tsx: lưu bài tập cũ vào reference/student-example.tsx.txt rồi bỏ route cũ để không trùng đường dẫn / với Login.
- Không có Login/Register cũ trong project khi kiểm tra. Register được tạo mới.
- Giữ nguyên các component, hook và màn hình Explore/Modal từ template; Explore được ẩn khỏi thanh tab.

## C. Màn hình hiện có
10 màn hình Smart Campus: Login, Register, Home, Notifications, Map, LocationDetail, Events, EventDetail, Schedule, Profile.
Ngoài ra còn Explore và Modal từ template, không thuộc luồng sử dụng chính.

## D. Chức năng đã triển khai
- F1: đăng ký kiểm tra trường trống, khoảng trắng và xác nhận mật khẩu; thông báo thành công rồi về Login.
- F2: đăng nhập nếu email và mật khẩu không trống; thay Login bằng Home.
- F3: trang chủ có avatar, welcome card, 4 tiện ích, 2 sự kiện và 2 thông báo.
- F4: bản đồ placeholder.
- F5: tìm tên địa điểm bằng filter + includes, không phân biệt hoa/thường; có trạng thái không có kết quả.
- F6: chi tiết địa điểm theo id; id không tồn tại có thông báo thay vì lỗi.
- F7/F8: vị trí, xem bản đồ và chỉ đường bằng hộp thoại mô phỏng.
- F9: danh sách và chi tiết 3 sự kiện mẫu.
- F10: đăng ký sự kiện đổi nhãn nút thành Đã đăng ký và khóa nút.
- F11: bấm thông báo để đánh dấu đã đọc, thay màu card và cập nhật số chưa đọc.
- F12: chọn Thứ 2–Thứ 7, lọc môn học; ngày trống có thông báo.
- F13: bật nhắc lịch mô phỏng, đổi nhãn và khóa nút đã bật.
- F14: hồ sơ mẫu Nguyễn Văn A, 23103047, CNTT K23, 23103047@student.edu.vn.
- F15: xác nhận đăng xuất; Hủy giữ màn hình hiện tại, Đăng xuất về Login.
- Quên mật khẩu có thông báo chức năng sẽ được tích hợp sau.

Giới hạn có chủ ý:
- Không backend, database, API, GPS, bản đồ thật, xác thực thật hoặc push notification.
- Không lưu mật khẩu/tài khoản. Đăng ký không thay đổi hồ sơ mẫu.
- useState chỉ tồn tại khi component còn được giữ: đăng ký sự kiện và thông báo đọc sẽ reset khi rời và mở lại màn hình; nhắc lịch giữ khi chuyển tab nhưng reset khi ứng dụng được tải lại.
- Home hiển thị bản tin mẫu, không hiển thị trạng thái đọc chung.
- Không có cơ chế bảo vệ route/authentication. Có thể mở route trực tiếp; đây là demo giao diện.
- Tìm kiếm có phân biệt dấu tiếng Việt.
- Avatar là chữ viết tắt; hình địa điểm/sự kiện là placeholder bằng View + icon.

## E. Kiến thức React Native đã dùng
View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert; SafeAreaView từ react-native-safe-area-context đã cài sẵn; useState của React; Flexbox gồm flex, flexDirection, flexWrap, gap, alignItems, justifyContent.
Không cần Image vì dùng placeholder và avatar chữ.
Ionicons dùng package @expo/vector-icons đã có trong project.
Screen giới hạn chiều rộng tối đa 720 nhưng width 100% để dùng được trên điện thoại và web; form có cuộn và né bàn phím.

## F. JavaScript / TypeScript đã dùng
const, function, arrow function, if, object, array, map, filter, find, slice, includes, trim, toLowerCase, String, spread (...), toán tử ba ngôi, props, kiểu number/string/boolean, type và number[].
Không Redux, Zustand, useReducer, custom hook, service hay kiến trúc nhiều lớp.

## G. Phần khó hơn cơ bản

### 1. Navigation và Stack/Tabs
File: app/_layout.tsx, app/(tabs)/_layout.tsx, app/index.tsx, app/(tabs)/home.tsx, app/(tabs)/profile.tsx.
Ví dụ:
```tsx
router.replace('/(tabs)/home');
router.navigate('/(tabs)/map');
router.push('/notifications');
router.dismissAll();
router.replace('/');
```
Stack quản lý màn hình xếp chồng; Tabs là 5 mục dưới cùng. push mở màn hình mới, back quay lại, navigate chuyển tab, replace thay màn hình hiện tại. dismissAll trở về đầu Stack trước khi thay bằng Login.
Cần hiểu đường dẫn tương ứng file trong app và sự khác nhau giữa thêm/thay màn hình.
Giữ Expo Router là cách đơn giản nhất vì project đã dùng sẵn. Không cần tự quản lý một state chứa tên màn hình.
Đây không phải bảo vệ đăng nhập thật; không ngăn mở URL trực tiếp.

### 2. Route params và find
File: app/(tabs)/map.tsx, app/(tabs)/events.tsx, app/(tabs)/home.tsx, app/location-detail.tsx, app/event-detail.tsx.
```tsx
router.push({ pathname: '/event-detail', params: { id: event.id } });
const { id } = useLocalSearchParams<{ id: string }>();
const event = events.find(item => String(item.id) === id);
```
Truyền id của card, nhận id từ đường dẫn rồi tìm object tương ứng.
Cần hiểu object, tham số URL dạng chuỗi, so sánh ===, find có thể trả undefined. Vì vậy có if (!event) để xử lý id không hợp lệ.
Có thể viết đơn giản hơn bằng cách hiển thị cố định một sự kiện, nhưng sẽ sai khi bấm các sự kiện khác; truyền một id là cách gọn cho yêu cầu này.

### 3. Props và kiểu TypeScript
File: components/campus-ui.tsx và app/(tabs)/schedule.tsx.
```tsx
type ButtonProps = {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
};
const [reminders, setReminders] = useState<number[]>([]);
```
Props là dữ liệu cha truyền vào con. onPress là một hàm không trả giá trị. Dấu ? là thuộc tính không bắt buộc. number[] là array số; cần ghi rõ vì array ban đầu rỗng.
ReactNode trong Screen mô tả phần JSX đặt giữa thẻ mở/đóng; children là phần nội dung đó.
Có thể chép nút/khung vào từng màn hình nhưng lặp nhiều; hai component dùng chung giúp đồng bộ style mà không tạo kiến trúc phức tạp.

### 4. Callback và cập nhật array
File: app/notifications.tsx, app/(tabs)/schedule.tsx và các danh sách.
```tsx
setItems(items.map(item =>
  item.id === id ? { ...item, isRead: true } : item
));
setReminders([...reminders, id]);
```
Callback là hàm truyền cho map hoặc onPress. Spread sao chép dữ liệu. React cần state mới để render lại; không sửa trực tiếp object trong array mẫu.
Cần hiểu map trả array mới, toán tử ba ngôi, spread và useState.
Có thể viết callback thành function có if/else để dễ đọc; không cần reducer hoặc thư viện state.

### 5. Keyboard, SafeArea và khác biệt nền tảng
File: components/campus-ui.tsx, utils/feedback.ts, app/(tabs)/profile.tsx.
```tsx
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
```
KeyboardAvoidingView tránh bàn phím che form. SafeAreaView tránh vùng camera/status bar.
showAlert dùng Alert.alert trên native và window.alert trên web. Đăng xuất dùng window.confirm trên web vì Alert native không cung cấp cùng hành vi trong trình duyệt.
Cần hiểu Platform.OS và callback của nút trong Alert. Nếu chỉ chạy điện thoại có thể bỏ nhánh web, nhưng hiện giữ để hỗ trợ cả npm run web.

### 6. Code template có sẵn
Các file components/parallax-scroll-view.tsx, components/hello-wave.tsx, hooks/* và explore.tsx có animation/theme từ template cũ; chúng không được dùng trong 10 màn hình Smart Campus.
React Compiler và typedRoutes đã được bật sẵn trong app.json, không được thêm mới cho tính năng này.
Không dùng FlatList, Context riêng hoặc custom hook mới.

## H. Luồng ứng dụng
Login → Home.
Login → Register → Login.
Home → Map → LocationDetail → quay lại.
Home → Events → EventDetail → đăng ký → quay lại.
Home → Notifications → đánh dấu đã đọc.
Home → Schedule → chọn ngày → nhắc lịch.
Home → Profile → xác nhận Logout → Login.
5 tab có thể chuyển trực tiếp qua lại.

## I. Hướng dẫn chạy và kiểm tra
PowerShell:
```powershell
cd D:\react-expo\MyApp
npm install
npx expo start
```
node_modules đã có nên có thể bỏ npm install trên máy hiện tại. Không thêm package mới.
Trong terminal Expo, dùng a cho Android emulator hoặc w cho web; có thể quét QR bằng bản Expo Go tương thích SDK 54.

Kiểm tra:
```powershell
npx tsc --noEmit
npx eslint .
npx expo export --platform web --output-dir dist-smart-campus
```
Nếu TypeScript báo route mới chưa tồn tại, chạy npx expo start để Expo sinh lại .expo/types/router.d.ts rồi chạy tsc lại.

Kết quả đã thực hiện:
- TypeScript: đạt, không lỗi.
- ESLint toàn project: đạt, không lỗi/cảnh báo.
- Expo khởi động offline ở cổng 8082; HTTP 200.
- Web export: thành công, 20 route bao gồm alias và màn hình template.
- Kiểm tra HTTP và nội dung HTML 12 trường hợp: 10 màn hình, chi tiết có id hợp lệ và hai trường hợp id không tồn tại đều đạt.
- Chưa kiểm tra thao tác bấm trên trình duyệt thật/emulator/điện thoại, chưa xác nhận trực quan kích thước nhỏ hoặc bàn phím thiết bị. HTTP/build không thay thế kiểm thử tương tác.

Checklist kiểm tra thủ công:
1. Login bỏ trống/khoảng trắng → báo lỗi; nhập email và mật khẩu → Home.
2. Register bỏ trống, mật khẩu khác nhau → báo lỗi; hợp lệ → thành công và Login.
3. Từ Home bấm đủ 4 tiện ích, avatar và 2 card sự kiện; chuyển đủ 5 tab.
4. Tìm Thư viện, tên viết hoa, tên không tồn tại; bấm cả 4 địa điểm.
5. Bấm Vị trí của tôi, Xem trên bản đồ, Chỉ đường → hộp thoại.
6. Mở mỗi sự kiện; đăng ký → nút Đã đăng ký và không bấm lặp.
7. Bấm thông báo chưa đọc → màu/nhãn/số chưa đọc thay đổi.
8. Chọn đủ 6 ngày; Thứ 5–7 có trạng thái không có lịch; bật nhắc lịch.
9. Logout → Hủy ở lại; xác nhận về Login.
10. Kiểm tra cuộn form khi mở bàn phím, màn hình nhỏ, xoay/kích thước web.

Tài liệu đã đối chiếu theo AGENTS.md:
- https://docs.expo.dev/versions/v54.0.0/
- https://docs.expo.dev/versions/v54.0.0/sdk/router/
