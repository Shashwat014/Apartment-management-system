import RentRecord from '../models/rent-record.model.js';
import Unit from '../models/unit.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { ensurePropertyAccess } from './property.controller.js';
import { getPagination, paginationMeta } from '../utils/query.js';
import { writeAudit } from '../services/audit.service.js';

async function markOverdue(filter = {}) {
  await RentRecord.updateMany({ ...filter, status: 'pending', dueDate: { $lt: new Date() } }, { $set: { status: 'overdue' } });
}

export const listRentRecords = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const filter = {};
  if (request.user.role === 'owner') filter.owner = request.user.id;
  if (request.user.role === 'tenant') filter.tenant = request.user.id;
  if (request.query.status) filter.status = request.query.status;
  if (request.query.propertyId) filter.property = request.query.propertyId;
  await markOverdue(filter);
  const [items, total] = await Promise.all([
    RentRecord.find(filter).populate('property', 'name').populate('unit', 'unitNumber').populate('tenant', 'name email').sort({ dueDate: -1 }).skip(skip).limit(limit),
    RentRecord.countDocuments(filter),
  ]);
  response.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const createRentRecord = asyncHandler(async (request, response) => {
  const { unitId, ...payload } = request.validated.body;
  const unit = await Unit.findById(unitId).populate('property');
  if (!unit?.currentTenant) throw new ApiError(422, 'Rent can only be created for an occupied unit.');
  await ensurePropertyAccess(unit.property.id, request.user);
  if (request.user.role === 'tenant') throw new ApiError(403, 'Tenants cannot create rent records.');
  const record = await RentRecord.create({ ...payload, property: unit.property.id, unit: unit.id, owner: unit.property.owner, tenant: unit.currentTenant });
  await writeAudit({ actor: request.user.id, action: 'rent.created', targetType: 'RentRecord', targetId: record.id });
  response.status(201).json({ success: true, data: { record } });
});

export const markRentPaid = asyncHandler(async (request, response) => {
  const record = await RentRecord.findById(request.params.rentId);
  if (!record) throw new ApiError(404, 'Rent record not found.');
  if (request.user.role === 'tenant') throw new ApiError(403, 'Tenants cannot record payments.');
  if (request.user.role === 'owner' && !record.owner.equals(request.user.id)) throw new ApiError(403, 'You do not have access to this rent record.');
  if (record.status === 'paid') throw new ApiError(409, 'This rent record is already paid.');
  Object.assign(record, { ...request.validated.body, status: 'paid', paidAt: new Date() });
  await record.save();
  await writeAudit({ actor: request.user.id, action: 'rent.marked_paid', targetType: 'RentRecord', targetId: record.id });
  response.json({ success: true, data: { record } });
});
