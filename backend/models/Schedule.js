const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },

  room: {
    type: String,
    required: true,
  },

  day: {
    type: String,
    required: true,
  },

  startTime: {
    type: String,
    required: true,
  },

  endTime: {
    type: String,
    required: true,
  },

  reminder: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Schedule', scheduleSchema);