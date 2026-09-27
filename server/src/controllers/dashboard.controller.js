import Property from '../models/property.model.js';
import Unit from '../models/unit.model.js';
import RentRecord from '../models/rent-record.model.js';
import MaintenanceRequest from '../models/maintenance-request.model.js';
import Notice from '../models/notice.model.js';
import { asyncHandler } from '../utils/api-error.js';

export const getOwnerDashboard = asyncHandler(async (request, response) => {
  const properties = await Property.find({ owner: request.user.id }).select('_id');
  const propertyIds = properties.map((property) => property.id);
  const [totalUnits, occupied, rentTotals, maintenance, recentPayments] = await Promise.all([
    Unit.countDocuments({ property: { $in: propertyIds } }),
    Unit.countDocuments({ property: { $in: propertyIds }, status: 'occupied' }),
    RentRecord.aggregate([{ $match: { owner: request.user._id } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }]),
    MaintenanceRequest.countDocuments({ owner: request.user.id, status: { $in: ['open', 'in_progress'] } }),
    RentRecord.find({ owner: request.user.id, status: 'paid' }).populate('tenant', 'name').populate('unit', 'unitNumber').sort({ paidAt: -1 }).limit(6),
  ]);
  const totalFor = (status) => rentTotals.find((item) => item._id === status)?.total || 0;
  response.json({ success: true, data: { totals: { properties: propertyIds.length, totalUnits, occupied, vacant: totalUnits - occupied, expectedRent: rentTotals.reduce((sum, item) => sum + item.total, 0), collectedRent: totalFor('paid'), pendingRent: totalFor('pending') + totalFor('overdue'), maintenance }, recentPayments } });
});

export const getTenantDashboard = asyncHandler(async (request, response) => {
  await RentRecord.updateMany({ tenant: request.user.id, status: 'pending', dueDate: { $lt: new Date() } }, { $set: { status: 'overdue' } });
  const unit = await Unit.findOne({ currentTenant: request.user.id }).populate({ path: 'property', populate: { path: 'owner', select: 'name email phone' } });
  const [rentRecords, maintenance, notices] = await Promise.all([
    RentRecord.find({ tenant: request.user.id }).sort({ dueDate: -1 }).limit(6),
    MaintenanceRequest.find({ tenant: request.user.id }).sort({ createdAt: -1 }).limit(6),
    Notice.find({ $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }, { $or: [{ audience: { $in: ['all', 'tenants'] } }, ...(unit ? [{ audience: 'property_tenants', property: unit.property.id }] : [])] }] }).sort({ createdAt: -1 }).limit(5),
  ]);
  const nextRent = rentRecords.find((record) => record.status !== 'paid') || null;
  response.json({ success: true, data: { unit, nextRent, rentRecords, maintenance, notices } });
});
