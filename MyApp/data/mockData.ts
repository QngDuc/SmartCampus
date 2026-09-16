// Dữ liệu mẫu dùng chung cho trang chủ, danh sách và chi tiết.
export const locations = [
  { id: 1, name: 'Thư viện', category: 'Học tập', description: 'Thư viện dành cho sinh viên, cung cấp không gian học tập yên tĩnh, sách và tài liệu tham khảo.', hours: '07:00 - 17:00' },
  { id: 2, name: 'Giảng đường A', category: 'Giảng đường', description: 'Khu giảng đường và phòng học với các phòng lý thuyết, thực hành dành cho sinh viên.', hours: '07:00 - 18:00' },
  { id: 3, name: 'Căn tin sinh viên', category: 'Tiện ích', description: 'Khu vực ăn uống dành cho sinh viên với nhiều món ăn và nước uống.', hours: '06:30 - 18:00' },
  { id: 4, name: 'Phòng Công tác sinh viên', category: 'Phòng ban', description: 'Hỗ trợ các vấn đề dành cho sinh viên: giấy xác nhận, học bổng và hoạt động sinh viên.', hours: '07:30 - 17:00' },
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
export const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const schedules = [
  { id: 1, subject: 'Lập trình React Native', room: 'A101', time: '07:30 - 09:30', day: 'Thứ 2' },
  { id: 2, subject: 'Cơ sở dữ liệu', room: 'B203', time: '09:45 - 11:45', day: 'Thứ 2' },
  { id: 3, subject: 'Mạng máy tính', room: 'A305', time: '13:30 - 15:30', day: 'Thứ 3' },
  { id: 4, subject: 'Tiếng Anh chuyên ngành', room: 'B105', time: '07:30 - 09:30', day: 'Thứ 4' },
];

