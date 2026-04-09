const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  ip: { type: String, required: true },
  publicKey: { type: String, required: true },
  port: { type: Number, default: 51820 },
  isPremium: { type: Boolean, default: false },
  maxUsers: { type: Number, default: 100 },
  currentUsers: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'online',
  },
}, { timestamps: true });

module.exports = mongoose.model('Server', serverSchema);
