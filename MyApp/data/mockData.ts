// Dữ liệu mẫu dùng chung cho trang chủ, danh sách và chi tiết.
export const locations = [
  { id: 100, name: 'Trường Đại học Tây Nguyên', category: 'Khuôn viên', description: 'Cơ sở 567 Lê Duẩn. Ghim bản đồ thể hiện tâm khuôn viên theo OpenStreetMap, không phải vị trí cổng vào.', hours: 'Theo lịch hoạt động của trường' },
  { id: 1, name: 'Thư viện', category: 'Học tập', description: 'Thư viện dành cho sinh viên, cung cấp không gian học tập yên tĩnh, sách và tài liệu tham khảo.', hours: '07:00 - 17:00' },
  { id: 2, name: 'Nhà số 2', category: 'Giảng đường', description: 'Nhà số 2 theo sơ đồ khuôn viên được cung cấp, nằm giữa khu cổng chính và nhà số 6.', hours: 'Theo lịch học' },
  { id: 3, name: 'Căn tin sinh viên', category: 'Tiện ích', description: 'Khu vực ăn uống dành cho sinh viên với nhiều món ăn và nước uống.', hours: '06:30 - 18:00' },
  { id: 4, name: 'Phòng Công tác sinh viên', category: 'Phòng ban', description: 'Hỗ trợ các vấn đề dành cho sinh viên: giấy xác nhận, học bổng và hoạt động sinh viên.', hours: '07:30 - 17:00' },
  { id: 5, name: 'Nhà số 5', category: 'Giảng đường', description: 'Khu nhà số 5, phía bệnh viện trường theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 6, name: 'Nhà số 6', category: 'Giảng đường', description: 'Khu nhà số 6, phía giữa khuôn viên theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 7, name: 'Nhà số 7', category: 'Giảng đường', description: 'Nhà số 7, gần khu hội trường và đường Lê Duẩn theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 8, name: 'Nhà số 8', category: 'Giảng đường', description: 'Nhà số 8, giữa nhà số 7 và nhà số 9 theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 9, name: 'Nhà số 9', category: 'Giảng đường', description: 'Nhà số 9, phía bắc khuôn viên theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 10, name: 'Cổng chính', category: 'Cổng trường', description: 'Cổng trường phía đường Lê Duẩn, địa chỉ 567 Lê Duẩn.', hours: 'Theo quy định của trường' },
  { id: 11, name: 'Cổng sau', category: 'Cổng trường', description: 'Cổng phía đường Y Wang theo sơ đồ được cung cấp.', hours: 'Theo quy định của trường' },
  { id: 12, name: 'Trung tâm Giáo dục Quốc phòng và An ninh', category: 'Trung tâm', description: 'Khu giáo dục quốc phòng gần cổng sau theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
  { id: 13, name: 'Nhà thi đấu', category: 'Thể thao', description: 'Nhà thi đấu cạnh khu sân bóng theo sơ đồ được cung cấp.', hours: 'Theo lịch hoạt động' },
  { id: 14, name: 'Trường THPT Thực hành Cao Nguyên', category: 'Trường học', description: 'Trường thực hành ở phía đường Y Wang theo sơ đồ được cung cấp.', hours: 'Theo lịch học' },
];
export const events = [
  { id: 1, title: 'Ngày hội Công nghệ thông tin', date: '20/09/2026', time: '08:00', location: 'Hội trường A', description: 'Giao lưu và trải nghiệm công nghệ. Khám phá sản phẩm của sinh viên và kết nối với những người cùng đam mê.' },
  { id: 2, title: 'Workshop Kỹ năng CV', date: '25/09/2026', time: '14:00', location: 'Phòng B201', description: 'Hướng dẫn sinh viên xây dựng CV. Cùng thực hành giới thiệu bản thân và chuẩn bị hồ sơ thực tập.' },
  { id: 3, title: 'Ngày hội Câu lạc bộ', date: '30/09/2026', time: '07:30', location: 'Sân trường', description: 'Giới thiệu các câu lạc bộ sinh viên. Tìm cộng đồng phù hợp với sở thích và tham gia các hoạt động kết nối.' },
];
export const notifications = [
  { id: 1, title: 'Thay đổi phòng học', content: 'Môn React Native chuyển sang phòng A203', time: '10 phút trước', isRead: false },
  { id: 2, title: 'Sắp đến giờ học', content: 'Môn Cơ sở dữ liệu bắt đầu lúc 09:45', time: '30 phút trước', isRead: false },
  { id: 3, title: 'Sự kiện mới', content: 'Ngày hội Công nghệ sẽ diễn ra vào cuối tuần', time: '2 giờ trước', isRead: true },
];
export const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
export const upcomingEvents = [
  {
    id: 1,
    title: 'Sinh hoạt CLB Tiếng Anh',
    category: 'CLB',
    date: '15/10/2026',
    time: '17:00',
    location: 'Phòng C201',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    isRegistered: false,
  },
  {
    id: 2,
    title: 'Giao lưu văn nghệ chào sinh viên',
    category: 'Hoạt động sinh viên',
    date: '16/10/2026',
    time: '19:00',
    location: 'Sân khấu trung tâm',
    image: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=600&q=80',
    isRegistered: true,
  },
];

export const latestNotifications = [
  {
    id: 1,
    type: 'grade',
    title: 'Điểm thi Lập trình Web đã được cập nhật',
    content: 'Bạn đã đạt 8.2 điểm (B+). Xem chi tiết bảng điểm.',
    time: '2 giờ trước',
    isRead: false,
  },
  {
    id: 2,
    type: 'event',
    title: 'Sự kiện mới: Workshop React Native',
    content: 'Đăng ký ngay trước 26/09 để nhận quà tặng.',
    time: '5 giờ trước',
    isRead: false,
  },
  {
    id: 3,
    type: 'system',
    title: 'Bảo trì hệ thống',
    content: 'Hệ thống sẽ bảo trì từ 23:00 - 01:00 ngày 20/09.',
    time: '1 ngày trước',
    isRead: true,
  },
];

export const defaultGrades = [
  { code: 'TIN1023', subject: 'Lập trình Web', credits: 3, midterm: '8.0', final: '8.3', score10: '8.2', scoreLetter: 'B+', score4: '3.5', semester: 'HK1 (2026-2027)' },
  { code: 'TIN1044', subject: 'Xử lý ảnh số', credits: 3, midterm: '8.5', final: '8.0', score10: '8.2', scoreLetter: 'B+', score4: '3.5', semester: 'HK1 (2026-2027)' },
  { code: 'TIN1012', subject: 'Lập trình React Native', credits: 4, midterm: '9.0', final: '8.5', score10: '8.7', scoreLetter: 'A', score4: '3.8', semester: 'HK2 (2025-2026)' },
  { code: 'TIN1015', subject: 'Cơ sở dữ liệu nâng cao', credits: 3, midterm: '7.5', final: '8.0', score10: '7.8', scoreLetter: 'B', score4: '3.0', semester: 'HK2 (2025-2026)' },
  { code: 'TIN1008', subject: 'Mạng máy tính', credits: 3, midterm: '8.0', final: '7.5', score10: '7.7', scoreLetter: 'B', score4: '3.0', semester: 'HK2 (2025-2026)' },
  { code: 'TIN1005', subject: 'Cấu trúc dữ liệu & Giải thuật', credits: 4, midterm: '8.5', final: '8.0', score10: '8.2', scoreLetter: 'B+', score4: '3.5', semester: 'HK1 (2025-2026)' },
  { code: 'TOA1002', subject: 'Toán rời rạc', credits: 3, midterm: '7.0', final: '7.5', score10: '7.3', scoreLetter: 'B', score4: '3.0', semester: 'HK1 (2025-2026)' },
  { code: 'NNU1001', subject: 'Tiếng Anh chuyên ngành', credits: 3, midterm: '8.5', final: '9.0', score10: '8.8', scoreLetter: 'A', score4: '3.8', semester: 'HK1 (2025-2026)' },
];


