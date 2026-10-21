const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    className: { type: String, trim: true, default: '', maxlength: 100 },
    cohort: { type: String, trim: true, default: '', maxlength: 100 },
    major: { type: String, trim: true, default: '', maxlength: 150 },
    faculty: { type: String, trim: true, default: '', maxlength: 150 },
    avatar: { type: String, default: '', maxlength: 1400000 },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Trùng với web admin: 'active' | 'blocked'
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
