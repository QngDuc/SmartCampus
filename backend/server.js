const express = require('express');
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
require('dotenv').config();

const Schedule = require('./models/Schedule');
const authRouter = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRouter);


// ========================================
// 1. API KIỂM TRA SERVER
// ========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Campus API đang hoạt động',
  });
});


// Lấy danh sách thông báo mới nhất từ trang thông báo chính thức của trường.
app.get('/api/announcements', async (req, res) => {
  const sourceUrl = 'https://www.ttn.edu.vn/index.php/mthongbao/thongbao';

  try {
    const response = await axios.get(sourceUrl, {
      headers: { 'User-Agent': 'SmartCampus/1.0' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);
    const pageUrls = $('.pagination a[href*="start="]')
      .map((_, link) => new URL($(link).attr('href'), sourceUrl).toString())
      .get()
      .filter(url => new URL(url).origin === new URL(sourceUrl).origin);
    const remainingPages = await Promise.all(
      [...new Set(pageUrls)].map(url =>
        axios.get(url, {
          headers: { 'User-Agent': 'SmartCampus/1.0' },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          timeout: 20000,
        }).then(page => page.data).catch(() => '')
      )
    );
    const notices = [response.data, ...remainingPages].flatMap(html => {
      const page = cheerio.load(html);
      return page('td.list-title a').map((_, link) => {
        const article = page(link);
        const title = article.text().replace(/\s+/g, ' ').trim();
        const articleUrl = article.attr('href');
        if (!title || !articleUrl) return null;

        const url = new URL(articleUrl, sourceUrl).toString();
        return {
          id: url,
          slug: new URL(url).pathname.split('/').filter(Boolean).pop(),
          title,
          url,
          publishedAt: null,
          description: '',
        };
      }).get().filter(Boolean);
    });

    res.set('Cache-Control', 'no-store');
    res.json({ sourceUrl, notices });
  } catch (error) {
    console.error('Không lấy được RSS thông báo của trường:', error.message);
    res.status(502).json({ message: 'Không lấy được thông báo từ website trường.' });
  }
});

app.get('/api/announcements/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
    return res.status(400).json({ message: 'Mã thông báo không hợp lệ.' });
  }

  const sourceUrl = 'https://www.ttn.edu.vn/index.php/mthongbao/thongbao';
  const articleUrl = new URL(`/index.php/thongbao/${slug}`, sourceUrl).toString();

  try {
    const response = await axios.get(articleUrl, {
      headers: { 'User-Agent': 'SmartCampus/1.0' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });
    const $ = cheerio.load(response.data);
    const article = $('.item-page').first();
    if (!article.length) return res.status(404).json({ message: 'Không tìm thấy thông báo.' });

    const content = article.children('p, h3, h4, ul, ol, blockquote')
      .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    const attachments = article.find('.attachmentsContainer a.at_url')
      .map((_, link) => ({
        name: $(link).text().trim(),
        url: new URL($(link).attr('href'), sourceUrl).toString(),
      }))
      .get();

    res.set('Cache-Control', 'no-store');
    res.json({
      title: article.find('.page-header h2').text().replace(/\s+/g, ' ').trim(),
      publishedLabel: article.find('.article-info dd.create').text().replace(/\s+/g, ' ').trim(),
      content,
      attachments,
      url: articleUrl,
    });
  } catch (error) {
    console.error('Không lấy được nội dung thông báo:', error.message);
    res.status(502).json({ message: 'Không lấy được nội dung thông báo từ website trường.' });
  }
});

// Giữ API thông báo sinh viên riêng để màn hình Sự kiện tiếp tục hoạt động như trước.
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
    const notices = $('item').map((_, item) => {
      const entry = $(item);
      const title = entry.find('title').text().trim();
      const articleUrl = entry.find('link').text().trim();
      const publishedAt = entry.find('pubDate').text().trim();
      const description = cheerio.load(entry.find('description').text()).text().replace(/\s+/g, ' ').trim();
      if (!title || !articleUrl) return null;
      return {
        id: articleUrl,
        title,
        url: new URL(articleUrl, sourceUrl).toString(),
        slug: new URL(articleUrl, sourceUrl).pathname.split('/').filter(Boolean).pop(),
        publishedAt: Number.isNaN(Date.parse(publishedAt)) ? null : new Date(publishedAt).toISOString(),
        description: description.slice(0, 240),
      };
    }).get().filter(Boolean);

    res.set('Cache-Control', 'no-store');
    res.json({ sourceUrl, notices });
  } catch (error) {
    console.error('Không lấy được RSS thông báo sinh viên:', error.message);
    res.status(502).json({ message: 'Không lấy được thông báo từ website trường.' });
  }
});

app.get('/api/notices/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
    return res.status(400).json({ message: 'Mã thông báo không hợp lệ.' });
  }

  const sourceUrl = 'https://www.ttn.edu.vn/index.php/svthongbao';
  const articleUrl = new URL(`/index.php/svthongbao/${slug}`, sourceUrl).toString();

  try {
    const response = await axios.get(articleUrl, {
      headers: { 'User-Agent': 'SmartCampus/1.0' },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });
    const $ = cheerio.load(response.data);
    const article = $('.item-page').first();
    if (!article.length) return res.status(404).json({ message: 'Không tìm thấy thông báo.' });

    const content = article.children('p, h3, h4, ul, ol, blockquote')
      .map((_, element) => $(element).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean);
    const attachments = article.find('.attachmentsContainer a.at_url')
      .map((_, link) => ({
        name: $(link).text().trim(),
        url: new URL($(link).attr('href'), sourceUrl).toString(),
      }))
      .get();

    res.set('Cache-Control', 'no-store');
    res.json({
      title: article.find('.page-header h2').text().replace(/\s+/g, ' ').trim(),
      publishedLabel: article.find('.article-info dd.create').text().replace(/\s+/g, ' ').trim(),
      content,
      attachments,
      url: articleUrl,
    });
  } catch (error) {
    console.error('Không lấy được nội dung thông báo sinh viên:', error.message);
    res.status(502).json({ message: 'Không lấy được nội dung thông báo từ website trường.' });
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


// Tra cứu kết quả học tập hệ chính quy từ cổng chính thức của trường.
app.get('/api/grades/:msv', async (req, res) => {
  const msv = req.params.msv;

  if (!/^\d{8}$/.test(msv)) {
    return res.status(400).json({ message: 'Mã sinh viên phải gồm 8 chữ số.' });
  }

  try {
    const response = await axios.post(
      'https://www.ttn.edu.vn/libraries/tnu/kqcq.php',
      new URLSearchParams({ msv, dk: '10' }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: 'https://www.ttn.edu.vn/index.php?option=com_tnu&view=kqchinhquy',
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 20000,
      }
    );

    const $ = cheerio.load(response.data);
    const responseText = $('body').text().replace(/\s+/g, ' ').trim() || $.text().trim();

    if (/không tìm thấy dữ liệu/i.test(responseText)) {
      return res.status(404).json({ message: 'Không tìm thấy kết quả học tập cho mã sinh viên này.' });
    }

    const tables = [];
    $('table').each((tableIndex, table) => {
      const parsedRows = [];
      $(table).find('tr').each((rowIndex, row) => {
        const cells = $(row)
          .find('th, td')
          .map((cellIndex, cell) => $(cell).text().replace(/\s+/g, ' ').trim())
          .get();
        if (cells.length) {
          parsedRows.push({ cells, isHeader: $(row).find('th').length > 0 });
        }
      });

      const headerRow = parsedRows.find(row => row.isHeader);
      const rows = parsedRows.filter(row => !row.isHeader).map(row => row.cells);
      if (headerRow || rows.length) {
        tables.push({
          title: $(table).find('caption').first().text().replace(/\s+/g, ' ').trim(),
          headers: headerRow?.cells ?? [],
          rows,
        });
      }
    });

    if (!tables.length) {
      return res.status(502).json({ message: 'Website trường trả về dữ liệu điểm không đúng định dạng.' });
    }

    res.set('Cache-Control', 'no-store');
    res.json({ studentId: msv, tables });
  } catch (error) {
    console.error('Không lấy được kết quả học tập từ website trường:', error.message);
    res.status(502).json({ message: 'Không thể lấy kết quả học tập từ website trường.' });
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
