const Connection = require('../models/Connection');
const Server = require('../models/Server');

async function start(req, res, next) {
  try {
    const { serverId } = req.body;
    if (!serverId) {
      return res.status(400).json({ error: 'serverId is required' });
    }

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const connection = await Connection.create({
      userId: req.user._id,
      serverId,
    });

    await Server.findByIdAndUpdate(serverId, { $inc: { currentUsers: 1 } });

    res.status(201).json({ connectionId: connection._id });
  } catch (err) {
    next(err);
  }
}

async function stop(req, res, next) {
  try {
    const { connectionId, bytesUp, bytesDown } = req.body;
    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId is required' });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    connection.endTime = new Date();
    connection.bytesUp = bytesUp || 0;
    connection.bytesDown = bytesDown || 0;
    await connection.save();

    await Server.findByIdAndUpdate(connection.serverId, {
      $inc: { currentUsers: -1 },
    });

    res.json({ message: 'Connection stopped' });
  } catch (err) {
    next(err);
  }
}

async function stats(req, res, next) {
  try {
    const result = await Connection.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalConnections: { $sum: 1 },
          totalBytesUp: { $sum: '$bytesUp' },
          totalBytesDown: { $sum: '$bytesDown' },
        },
      },
    ]);

    const data = result[0] || { totalConnections: 0, totalBytesUp: 0, totalBytesDown: 0 };
    res.json({
      totalConnections: data.totalConnections,
      totalBytesUp: data.totalBytesUp,
      totalBytesDown: data.totalBytesDown,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { start, stop, stats };
