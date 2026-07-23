import mongoose from 'mongoose';

const riskRuleSchema = new mongoose.Schema(
  {
    matchType: { type: String, enum: ['port', 'service'], required: true },
    port: { type: Number, default: null },
    protocol: { type: String, enum: ['tcp', 'udp', 'any'], default: 'any' },
    serviceName: { type: String, default: null, lowercase: true, trim: true },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true
    },
    score: { type: Number, min: 0, max: 100, required: true },
    description: { type: String, required: true },
    recommendation: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

riskRuleSchema.index({ port: 1, protocol: 1 });
riskRuleSchema.index({ serviceName: 1 });

export const RiskRuleModel = mongoose.model('RiskRule', riskRuleSchema);
