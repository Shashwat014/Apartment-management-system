import mongoose from 'mongoose';

const rentRecordSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billingMonth: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending', index: true },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'upi', 'card', 'other'], default: null },
    referenceId: { type: String, trim: true, maxlength: 100, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

rentRecordSchema.index({ unit: 1, billingMonth: 1 }, { unique: true });
export default mongoose.model('RentRecord', rentRecordSchema);
