import Unit from '../models/unit.model.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { ensurePropertyAccess } from './property.controller.js';
import { writeAudit } from '../services/audit.service.js';

async function getUnitForWrite(unitId, user) {
  const unit = await Unit.findById(unitId);
  if (!unit) throw new ApiError(404, 'Unit not found.');
  await ensurePropertyAccess(unit.property, user);
  if (user.role === 'tenant') throw new ApiError(403, 'Tenants cannot manage units.');
  return unit;
}

export const listUnits = asyncHandler(async (request, response) => {
  const filter = request.query.propertyId ? { property: request.query.propertyId } : {};
  if (request.user.role === 'owner') {
    const owned = await Property.find({ owner: request.user.id }).select('_id');
    filter.property = { $in: owned.map((property) => property.id) };
  }
  if (request.user.role === 'tenant') filter.currentTenant = request.user.id;
  const items = await Unit.find(filter).populate('property', 'name address owner').populate('currentTenant', 'name email phone').sort({ unitNumber: 1 });
  response.json({ success: true, data: { items } });
});

export const createUnit = asyncHandler(async (request, response) => {
  const { propertyId, ...payload } = request.validated.body;
  await ensurePropertyAccess(propertyId, request.user);
  if (request.user.role === 'tenant') throw new ApiError(403, 'Tenants cannot create units.');
  const unit = await Unit.create({ ...payload, property: propertyId });
  await writeAudit({ actor: request.user.id, action: 'unit.created', targetType: 'Unit', targetId: unit.id });
  response.status(201).json({ success: true, data: { unit } });
});

export const updateUnit = asyncHandler(async (request, response) => {
  const unit = await getUnitForWrite(request.params.unitId, request.user);
  const updates = request.validated.body;
  if (unit.currentTenant && updates.status && updates.status !== 'occupied') throw new ApiError(409, 'Unassign the tenant before changing unit availability.');
  Object.assign(unit, updates);
  await unit.save();
  await writeAudit({ actor: request.user.id, action: 'unit.updated', targetType: 'Unit', targetId: unit.id });
  response.json({ success: true, data: { unit } });
});

export const assignTenant = asyncHandler(async (request, response) => {
  const unit = await getUnitForWrite(request.params.unitId, request.user);
  const { tenantId } = request.validated.body;
  const tenant = await User.findOne({ _id: tenantId, role: 'tenant', isActive: true });
  if (!tenant) throw new ApiError(422, 'A valid active tenant is required.');
  await Unit.updateMany({ currentTenant: tenant.id, _id: { $ne: unit.id } }, { $set: { currentTenant: null, status: 'vacant' } });
  unit.currentTenant = tenant.id;
  unit.status = 'occupied';
  await unit.save();
  await writeAudit({ actor: request.user.id, action: 'unit.tenant_assigned', targetType: 'Unit', targetId: unit.id, metadata: { tenantId: tenant.id } });
  response.json({ success: true, data: { unit } });
});

export const removeTenant = asyncHandler(async (request, response) => {
  const unit = await getUnitForWrite(request.params.unitId, request.user);
  unit.currentTenant = null;
  unit.status = 'vacant';
  await unit.save();
  await writeAudit({ actor: request.user.id, action: 'unit.tenant_removed', targetType: 'Unit', targetId: unit.id });
  response.json({ success: true, data: { unit } });
});

export const deleteUnit = asyncHandler(async (request, response) => {
  const unit = await getUnitForWrite(request.params.unitId, request.user);
  if (unit.currentTenant) throw new ApiError(409, 'Unassign the tenant before deleting this unit.');
  await unit.deleteOne();
  await writeAudit({ actor: request.user.id, action: 'unit.deleted', targetType: 'Unit', targetId: unit.id });
  response.status(204).send();
});
