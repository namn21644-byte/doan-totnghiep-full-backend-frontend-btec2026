import mongoose from 'mongoose';

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => IPV4_REGEX.test(v),
        message: (props) => `${props.value} không phải là địa chỉ IPv4 hợp lệ`
      }
    },
    hostname: { type: String, trim: true, default: '' },
    osType: {
      type: String,
      enum: ['windows', 'linux', 'other'],
      default: 'other'
    },
    location: { type: String, trim: true, default: '' },
    tags: { type: [String], default: [] },
    apiKeyHash: { type: String, required: true, select: false },
    apiKeyPrefix: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'unreachable'],
      default: 'active'
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

deviceSchema.index({ name: 'text', hostname: 'text' });

export const DeviceModel = mongoose.model('Device', deviceSchema);
