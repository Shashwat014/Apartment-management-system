import Property from '../models/property.model.js';
import Unit from '../models/unit.model.js';
import User from '../models/user.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/query.js';
import { writeAudit } from '../services/audit.service.js';

async function ensurePropertyAccess(propertyId, user) {
  const property = await Property.findById(propertyId);
  if (!property) throw new ApiError(404, 'Property not found.');
  if (user.role === 'admin') return property;
  if (user.role === 'owner' && property.owner.equals(user.id)) return property;
  if (user.role === 'tenant' && await Unit.exists({ property: property.id, currentTenant: user.id })) return property;
  throw new ApiError(403, 'You do not have access to this property.');
}

export const listProperties = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const filter = {};
  if (request.user.role === 'owner') filter.owner = request.user.id;
  if (request.user.role === 'tenant') {
    const unit = await Unit.findOne({ currentTenant: request.user.id }).select('property');
    filter._id = unit?.property || null;
  }
  const [items, total] = await Promise.all([
    Property.find(filter).populate('owner', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Property.countDocuments(filter),
  ]);
  response.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const createProperty = asyncHandler(async (request, response) => {
  const payload = { ...request.validated.body };
  const ownerId = request.user.role === 'admin' && payload.ownerId ? payload.ownerId : request.user.id;
  delete payload.ownerId;
  const owner = await User.findOne({ _id: ownerId, role: 'owner', isActive: true });
  if (!owner) throw new ApiError(422, 'A valid active owner is required.');
  const property = await Property.create({ ...payload, owner: ownerId });
  await writeAudit({ actor: request.user.id, action: 'property.created', targetType: 'Property', targetId: property.id });
  response.status(201).json({ success: true, data: { property } });
});

export const getProperty = asyncHandler(async (request, response) => {
  await ensurePropertyAccess(request.params.propertyId, request.user);
  const property = await Property.findById(request.params.propertyId).populate('owner', 'name email phone');
  response.json({ success: true, data: { property } });
});

export const updateProperty = asyncHandler(async (request, response) => {
  const property = await ensurePropertyAccess(request.params.propertyId, request.user);
  if (request.user.role === 'tenant') throw new ApiError(403, 'Tenants cannot update properties.');
  const updates = { ...request.validated.body };
  if (request.user.role !== 'admin') delete updates.ownerId;
  if (updates.ownerId) {
    const owner = await User.findOne({ _id: updates.ownerId, role: 'owner', isActive: true });
    if (!owner) throw new ApiError(422, 'A valid active owner is required.');
    updates.owner = updates.ownerId;
    delete updates.ownerId;
  }
  Object.assign(property, updates);
  await property.save();
  await writeAudit({ actor: request.user.id, action: 'property.updated', targetType: 'Property', targetId: property.id });
  response.json({ success: true, data: { property } });
});

export const deleteProperty = asyncHandler(async (request, response) => {
  const property = await ensurePropertyAccess(request.params.propertyId, request.user);
  if (request.user.role === 'tenant') throw new ApiError(403, 'Tenants cannot delete properties.');
  const unitCount = await Unit.countDocuments({ property: property.id });
  if (unitCount) throw new ApiError(409, 'Remove all units before deleting this property.');
  await property.deleteOne();
  await writeAudit({ actor: request.user.id, action: 'property.deleted', targetType: 'Property', targetId: property.id });
  response.status(204).send();
});

export { ensurePropertyAccess };
