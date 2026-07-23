import mongoose from 'mongoose';

const portFindingSchema = new mongoose.Schema(
  {
    port: Number,
    protocol: String,
    state: String,
    service: String,
    product: String,
    version: String,
    riskSeverity: String,
    riskScore: Number,
    riskDescription: String
  },
  { _id: false }
);

const scanResultSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true
    },
    hostIp: { type: String, required: true },
    hostStatus: { type: String, default: 'unknown' },
    ports: { type: [portFindingSchema], default: [] },
    osGuess: { type: String, default: '' },
    riskSummary: {
      highestSeverity: { type: String, default: 'info' },
      totalScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export const ScanResultModel = mongoose.model('ScanResult', scanResultSchema);
