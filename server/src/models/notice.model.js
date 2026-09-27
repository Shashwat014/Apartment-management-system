import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    audience: { type: String, enum: ['all', 'owners', 'tenants', 'property_tenants'], default: 'all' },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.model('Notice', noticeSchema);
