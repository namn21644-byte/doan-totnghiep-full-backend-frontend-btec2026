import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    sourceType: { type: String, enum: ['scan_result', 'log'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true
    },
    status: {
      type: String,
      enum: ['new', 'acknowledged', 'resolved', 'ignored'],
      default: 'new'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

alertSchema.index({ deviceId: 1, createdAt: -1 });
alertSchema.index({ status: 1 });
alertSchema.index({ severity: 1 });

export const AlertModel = mongoose.model('Alert', alertSchema);
