const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BLOCKED_MESSAGE_LOGIN =
  'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết.';
const BLOCKED_MESSAGE_ONLINE =
  'Tài khoản của bạn vừa bị khóa bởi quản trị viên. Vui lòng liên hệ bộ phận hỗ trợ.';
const DELETED_MESSAGE =
  'Tài khoản của bạn đã bị xóa khỏi hệ thống. Vui lòng liên hệ bộ phận hỗ trợ.';

function isBlocked(user) {
  return user.status === 'blocked' || user.isActive === false;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    studentId: user.studentId,
    name: user.name,
    email: user.email,
    className: user.className || '',
    cohort: user.cohort || '',
    major: user.major || '',
    faculty: user.faculty || '',
    avatar: user.avatar || '',
  };
}

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' });
  }

  try {
    const user = await User.findById(payload.sub).select('status isActive');
    if (!user) {
      return res.status(401).json({ code: 'ACCOUNT_DELETED', message: DELETED_MESSAGE });
    }
    if (isBlocked(user)) {
      return res.status(403).json({ code: 'ACCOUNT_BLOCKED', message: BLOCKED_MESSAGE_ONLINE });
    }
    req.userId = payload.sub;
    return next();
  } catch (error) {
    console.error('Không thể xác thực tài khoản:', error.message);
    return res.status(500).json({ message: 'Không thể xác thực lúc này.' });
  }
}

router.post('/register', async (req, res) => {
  const studentId = String(req.body?.studentId ?? '').trim();
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Server chưa cấu hình JWT_SECRET.' });
  }
  if (!/^\d{8}$/.test(studentId)) {
    return res.status(400).json({ message: 'Mã sinh viên phải gồm 8 chữ số.' });
  }
  if (!name || name.length > 100) {
    return res.status(400).json({ message: 'Họ tên không hợp lệ.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Mật khẩu phải từ 8 đến 72 byte.' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ studentId }, { email }] });
    if (existingUser) {
      const duplicates = [];
      if (existingUser.email === email) duplicates.push('Email');
      if (existingUser.studentId === studentId) duplicates.push('MSSV');
      return res.status(409).json({ message: `${duplicates.join(' và ')} đã tồn tại.` });
    }

    const user = new User({
      studentId,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    await user.save();

    return res.status(201).json({
      user: publicUser(user),
      token: issueToken(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email hoặc MSSV đã tồn tại.' });
    }
    console.error('Không thể tạo tài khoản:', error.message);
    return res.status(500).json({ message: 'Không thể tạo tài khoản lúc này.' });
  }
});

router.post('/login', async (req, res) => {
  const identifier = String(req.body?.identifier ?? req.body?.email ?? '').trim();
  const password = String(req.body?.password ?? '');
  const isEmail = emailPattern.test(identifier);
  const isStudentId = /^\d{8}$/.test(identifier);

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ message: 'Server chưa cấu hình JWT_SECRET.' });
  }
  if ((!isEmail && !isStudentId) || !password) {
    return res.status(400).json({ message: 'Nhập email hoặc MSSV hợp lệ cùng mật khẩu.' });
  }

  try {
    const query = isEmail ? { email: identifier.toLowerCase() } : { studentId: identifier };
    const user = await User.findOne(query).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email/MSSV hoặc mật khẩu không chính xác.' });
    }

    // Kiểm tra khóa SAU khi mật khẩu đúng, tránh lộ tài khoản nào đang bị khóa
    if (isBlocked(user)) {
      return res.status(403).json({ code: 'ACCOUNT_BLOCKED', message: BLOCKED_MESSAGE_LOGIN });
    }

    user.lastLogin = new Date();
    user.lastSeen = user.lastLogin;
    await user.save();

    return res.json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    console.error('Không thể đăng nhập:', error.message);
    return res.status(500).json({ message: 'Không thể đăng nhập lúc này.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  // Log để kiểm tra app có gửi nhịp /me hay không (xóa sau khi test xong)
  console.log('[/me] heartbeat', req.userId, new Date().toISOString());
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ code: 'ACCOUNT_DELETED', message: DELETED_MESSAGE });
    }
    const result = await User.updateOne(
      { _id: user._id },
      { $set: { lastSeen: new Date() } },
      { timestamps: false }
    );
    if (!result.matchedCount) {
      console.warn('[/me] không ghi được lastSeen cho', req.userId);
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Không thể tải tài khoản:', error.message);
    return res.status(500).json({ message: 'Không thể tải tài khoản lúc này.' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const className = String(req.body?.className ?? '').trim();
  const cohort = String(req.body?.cohort ?? '').trim();
  const major = String(req.body?.major ?? '').trim();
  const faculty = String(req.body?.faculty ?? '').trim();
  const avatar = String(req.body?.avatar ?? '');

  if (!name || name.length > 100) {
    return res.status(400).json({ message: 'Họ tên không hợp lệ.' });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ.' });
  }
  if ([className, cohort, major, faculty].some(value => value.length > 150)) {
    return res.status(400).json({ message: 'Thông tin hồ sơ vượt quá độ dài cho phép.' });
  }
  if (avatar.length > 1400000 || (avatar && !/^data:image\/(png|jpeg|webp);base64,/.test(avatar))) {
    return res.status(400).json({ message: 'Ảnh đại diện không hợp lệ hoặc quá lớn.' });
  }

  try {
    const duplicate = await User.findOne({ email, _id: { $ne: req.userId } }).select('_id');
    if (duplicate) return res.status(409).json({ message: 'Email này đã được sử dụng.' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { name, email, className, cohort, major, faculty, avatar } },
      { new: true, runValidators: true },
    );
    if (!user) return res.status(401).json({ code: 'ACCOUNT_DELETED', message: DELETED_MESSAGE });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Không thể cập nhật hồ sơ:', error.message);
    return res.status(500).json({ message: 'Không thể cập nhật hồ sơ lúc này.' });
  }
});

module.exports = router;
