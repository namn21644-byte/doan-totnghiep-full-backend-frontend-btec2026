import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true
    },
    logType: {
      type: String,
      enum: ['windows_event', 'linux_syslog', 'agent_heartbeat'],
      required: true
    },
    source: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    eventId: { type: Number, default: null },
    rawMessage: { type: String, default: '' },
    parsedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true },
    receivedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

logSchema.index({ deviceId: 1, timestamp: -1 });
logSchema.index({ logType: 1 });
logSchema.index({ severity: 1 });

export const LogModel = mongoose.model('Log', logSchema);
