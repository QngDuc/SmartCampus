const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
require('dotenv').config();

const Schedule = require('./models/Schedule');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());


// ========================================
// 1. API KIỂM TRA SERVER
// ========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus API đang hoạt động',
  });
});


// Lấy thông báo sinh viên mới nhất từ RSS chính thức của Trường Đại học Tây Nguyên.
app.get('/api/notices', async (req, res) => {
  const sourceUrl = 'https://www.ttn.edu.vn/index.php/svthongbao';

  try {
    const response = await axios.get(sourceUrl, {
      params: { format: 'feed', type: 'rss' },
      headers: { 'User-Agent': 'SmartCampus/1.0' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const notices = $('item')
      .map((_, item) => {
        const entry = $(item);
        const title = entry.find('title').text().trim();
        const articleUrl = entry.find('link').text().trim();
        const publishedAt = entry.find('pubDate').text().trim();
        const descriptionHtml = entry.find('description').text();
        const description = cheerio
          .load(descriptionHtml)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        if (!title || !articleUrl) return null;

        return {
          id: articleUrl,
          title,
          url: new URL(articleUrl, sourceUrl).toString(),
          publishedAt: Number.isNaN(Date.parse(publishedAt))
            ? null
            : new Date(publishedAt).toISOString(),
          description: description.slice(0, 240),
        };
      })
      .get()
      .filter(Boolean);

    res.set('Cache-Control', 'no-store');
    res.json({ sourceUrl, notices });
  } catch (error) {
    console.error('Không lấy được RSS thông báo của trường:', error.message);
    res.status(502).json({ message: 'Không lấy được thông báo từ website trường.' });
  }
});


// ========================================
// 2. API THÊM LỊCH HỌC VÀO MONGODB
// POST /api/schedules
// ========================================
app.get('/api/timetable/:msv', async (req, res) => {
  try {
    const msv = req.params.msv;

    if (!/^\d{8}$/.test(msv)) {
      return res.status(400).json({
        message: 'Mã sinh viên phải gồm 8 chữ số',
      });
    }

    const formData = new URLSearchParams();

    formData.append('msv', msv);
    formData.append('dk', '10');

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios.post(
      'https://www.ttn.edu.vn/libraries/tnu/tkbieusinhvien.php',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Referer:
            'https://www.ttn.edu.vn/index.php/component/tnu/?view=sinhvien',
        },

        httpsAgent: agent,

        timeout: 30000,
      }
    );

    const html = response.data;

    // Đọc HTML
    const $ = cheerio.load(html);

    // =====================================
    // LẤY MSSV VÀ HỌ TÊN
    // =====================================

    // Website trường đặt MSSV và họ tên trong 2 thẻ <b>
    const boldTexts = $('b')
      .map((index, element) => $(element).text().trim())
      .get();

    const student = {
      id: boldTexts[0] || msv,
      name: boldTexts[1] || '',
    };

    // =====================================
    // LẤY THỜI KHÓA BIỂU
    // =====================================
const schedules = [];

$('table').each((tableIndex, table) => {
  // =====================================
  // LẤY KHOẢNG NGÀY CỦA TUẦN
  // Ví dụ:
  // Từ ngày 28/09/2026 đến ngày 04/10/2026
  // =====================================

  const weekText = $(table)
    .prevAll('p')
    .first()
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  const weekMatch = weekText.match(
    /Từ ngày\s*(\d{2}\/\d{2}\/\d{4})\s*đến ngày\s*(\d{2}\/\d{2}\/\d{4})/
  );

  const weekStart = weekMatch
    ? weekMatch[1]
    : '';

  const weekEnd = weekMatch
    ? weekMatch[2]
    : '';

  // =====================================
  // LẤY THỨ + NGÀY
  // =====================================

  const headers = [];

  $(table)
    .find('tr')
    .first()
    .find('th')
    .each((index, th) => {
      if (index === 0) {
        return;
      }

      const text = $(th)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

      headers.push(text);
    });

  // =====================================
  // ĐỌC SÁNG / CHIỀU / TỐI
  // =====================================

  $(table)
    .find('tr')
    .slice(1)
    .each((rowIndex, row) => {
      const cells = $(row).find('td');

      if (cells.length === 0) {
        return;
      }

      const session = $(cells[0])
        .text()
        .trim();

      for (let i = 1; i < cells.length; i++) {
        const cell = $(cells[i]);

        const rawText = cell
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        // Ô trống
        if (!rawText) {
          continue;
        }

        const header = headers[i - 1] || '';

        const headerMatch = header.match(
          /(Thứ\s+\d|CN)\s*(\d{2}\/\d{2})?/
        );

        const day = headerMatch
          ? headerMatch[1]
          : '';

        const date = headerMatch
          ? headerMatch[2] || ''
          : '';

        const subjectMatch = rawText.match(
          /HP:\s*(.*?)\s*\((.*?)\)/
        );

        const teacherMatch = rawText.match(
          /GV:\s*(.*?)\s*Phòng:/
        );

        const roomMatch = rawText.match(
          /Phòng:\s*(.*)/
        );

        schedules.push({
          day,
          date,
          session,

          subject: subjectMatch
            ? subjectMatch[1].trim()
            : '',

          period: subjectMatch
            ? subjectMatch[2].trim()
            : '',

          teacher: teacherMatch
            ? teacherMatch[1].trim()
            : '',

          room: roomMatch
            ? roomMatch[1].trim()
            : '',

          // Quan trọng:
          weekStart,
          weekEnd,
        });
      }
    });
});

    res.status(200).json({
      student: student,
      schedules: schedules,
    });

  } catch (error) {
    console.log('Lỗi lấy thời khóa biểu:');
    console.log(error.message);

    res.status(500).json({
      message:
        'Không thể lấy thời khóa biểu từ website trường',
    });
  }
});

// ========================================
// 3. API LẤY TẤT CẢ LỊCH HỌC TỪ MONGODB
// GET /api/schedules
// ========================================
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find();

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});


// ========================================
// 4. API TRA THỜI KHÓA BIỂU TỪ WEB TRƯỜNG
// GET /api/timetable/:msv
//
// Ví dụ:
// GET /api/timetable/23103047
// ========================================
app.get('/api/timetable/:msv', async (req, res) => {
  try {
    // Lấy MSSV từ URL
    const msv = req.params.msv;

    // Kiểm tra MSSV có đúng 8 chữ số hay không
    if (!/^\d{8}$/.test(msv)) {
      return res.status(400).json({
        message: 'Mã sinh viên phải gồm 8 chữ số',
      });
    }

    // Tạo dữ liệu giống Form Data của website trường
    const formData = new URLSearchParams();

    formData.append('msv', msv);
    formData.append('dk', '10');

    // Gửi request đến website trường
    const response = await axios.post(
      'https://www.ttn.edu.vn/libraries/tnu/tkbieusinhvien.php',
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Referer:
            'https://www.ttn.edu.vn/index.php/component/tnu/?view=sinhvien',
        },

        // Nếu web trường phản hồi quá lâu thì dừng sau 10 giây
        timeout: 10000,
      }
    );

    // Hiện tại trả nguyên HTML về để kiểm tra trước
    res.send(response.data);

  } catch (error) {
    console.log('Lỗi lấy thời khóa biểu:');
    console.log(error.message);

    res.status(500).json({
      message: 'Không thể lấy thời khóa biểu từ website trường',
    });
  }
});


// ========================================
// 5. KẾT NỐI MONGODB
// ========================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Kết nối MongoDB Atlas thành công');
  })
  .catch((error) => {
    console.log('Kết nối MongoDB thất bại');
    console.log(error.message);
  });


// ========================================
// 6. CHẠY SERVER
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
