const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  bytesUp: { type: Number, default: 0 },
  bytesDown: { type: Number, default: 0 },
});

module.exports = mongoose.model('Connection', connectionSchema);
