import mongoose from 'mongoose';

const scanPresetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['quick', 'full', 'custom'], required: true },
    ports: { type: String, default: '' },
    arguments: { type: [String], default: [] }
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetIp: { type: String, required: true },
    scanPreset: { type: scanPresetSchema, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued'
    },
    errorMessage: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const ScanModel = mongoose.model('Scan', scanSchema);
