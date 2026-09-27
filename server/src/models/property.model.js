import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: {
      line1: { type: String, required: true, trim: true, maxlength: 200 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100, default: '' },
      postalCode: { type: String, trim: true, maxlength: 20, default: '' },
      country: { type: String, trim: true, maxlength: 100, default: 'India' },
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

export default mongoose.model('Property', propertySchema);
