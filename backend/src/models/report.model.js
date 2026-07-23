import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['scan_summary', 'risk_summary', 'device_report'],
      required: true
    },
    title: { type: String, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    format: { type: String, enum: ['pdf', 'xlsx'], required: true },
    filePath: { type: String, required: true, select: false },
    fileUrl: { type: String, required: true },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const ReportModel = mongoose.model('Report', reportSchema);
