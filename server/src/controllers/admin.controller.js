import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import Unit from '../models/unit.model.js';
import RentRecord from '../models/rent-record.model.js';
import MaintenanceRequest from '../models/maintenance-request.model.js';
import AuditLog from '../models/audit-log.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/query.js';
import { writeAudit } from '../services/audit.service.js';

export const createUser = asyncHandler(async (request, response) => {
  const { name, email, password, phone, role } = request.validated.body;
  if (await User.exists({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email: email.toLowerCase(), password, phone, role });
  await writeAudit({ actor: request.user.id, action: 'user.created', targetType: 'User', targetId: user.id });
  response.status(201).json({ success: true, data: { user } });
});

export const listUsers = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const filter = request.query.role ? { role: request.query.role } : {};
  if (request.query.search) filter.$or = [{ name: new RegExp(request.query.search, 'i') }, { email: new RegExp(request.query.search, 'i') }];
  const [items, total] = await Promise.all([User.find(filter).select('+isActive').sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  response.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const updateUser = asyncHandler(async (request, response) => {
  const user = await User.findById(request.params.userId).select('+isActive');
  if (!user) throw new ApiError(404, 'User not found.');
  const { name, phone, role, isActive } = request.validated.body;
  if (user.id === request.user.id && isActive === false) throw new ApiError(422, 'You cannot deactivate your own account.');
  Object.assign(user, { name, phone, role, isActive });
  await user.save();
  await writeAudit({ actor: request.user.id, action: 'user.updated', targetType: 'User', targetId: user.id });
  response.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (request, response) => {
  const user = await User.findById(request.params.userId);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.id === request.user.id) throw new ApiError(422, 'You cannot delete your own account.');
  await user.deleteOne();
  await writeAudit({ actor: request.user.id, action: 'user.deleted', targetType: 'User', targetId: user.id });
  response.status(204).send();
});

export const getAdminDashboard = asyncHandler(async (_request, response) => {
  const [totalUsers, owners, tenants, properties, totalUnits, occupied, rent, pending, maintenance, recentActivities] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'owner' }), User.countDocuments({ role: 'tenant' }), Property.countDocuments(), Unit.countDocuments(), Unit.countDocuments({ status: 'occupied' }),
    RentRecord.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    RentRecord.aggregate([{ $match: { status: { $in: ['pending', 'overdue'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    MaintenanceRequest.countDocuments({ status: { $in: ['open', 'in_progress'] } }), AuditLog.find().populate('actor', 'name role').sort({ createdAt: -1 }).limit(8),
  ]);
  response.json({ success: true, data: { totals: { totalUsers, owners, tenants, properties, totalUnits, occupied, vacant: totalUnits - occupied, rentCollected: rent[0]?.total || 0, pendingRent: pending[0]?.total || 0, maintenance }, recentActivities } });
});

export const listAuditLogs = asyncHandler(async (_request, response) => {
  const items = await AuditLog.find().populate('actor', 'name role').sort({ createdAt: -1 }).limit(100);
  response.json({ success: true, data: { items } });
});
