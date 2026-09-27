import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: ['plumbing', 'electrical', 'appliance', 'cleaning', 'security', 'other'], default: 'other' },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open', index: true },
    assignedTo: { type: String, trim: true, maxlength: 100, default: '' },
    resolutionNote: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
