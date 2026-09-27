import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    unitNumber: { type: String, required: true, trim: true, maxlength: 30 },
    floor: { type: String, trim: true, maxlength: 30, default: '' },
    type: { type: String, enum: ['studio', '1bhk', '2bhk', '3bhk', 'other'], default: 'other' },
    rentAmount: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['vacant', 'occupied', 'maintenance'], default: 'vacant', index: true },
    currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true },
);

unitSchema.index({ property: 1, unitNumber: 1 }, { unique: true });
export default mongoose.model('Unit', unitSchema);
