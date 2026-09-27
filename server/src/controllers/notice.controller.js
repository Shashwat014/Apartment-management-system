import Notice from '../models/notice.model.js';
import Unit from '../models/unit.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { ensurePropertyAccess } from './property.controller.js';

export const listNotices = asyncHandler(async (request, response) => {
  const activeFilter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
  let accessFilter = {};
  if (request.user.role === 'owner') accessFilter = { audience: { $in: ['all', 'owners'] } };
  if (request.user.role === 'tenant') {
    const unit = await Unit.findOne({ currentTenant: request.user.id }).select('property');
    accessFilter = {
      $or: [
        { audience: { $in: ['all', 'tenants'] } },
        ...(unit ? [{ audience: 'property_tenants', property: unit.property }] : []),
      ],
    };
  }
  const items = await Notice.find({ $and: [activeFilter, accessFilter] }).populate('author', 'name role').populate('property', 'name').sort({ createdAt: -1 });
  response.json({ success: true, data: { items } });
});

export const createNotice = asyncHandler(async (request, response) => {
  const payload = { ...request.validated.body };
  if (request.user.role === 'owner') {
    if (!payload.propertyId) throw new ApiError(422, 'Owners must select one of their properties.');
    await ensurePropertyAccess(payload.propertyId, request.user);
    payload.audience = 'property_tenants';
  }
  if (payload.propertyId) await ensurePropertyAccess(payload.propertyId, request.user);
  const property = payload.propertyId || null;
  delete payload.propertyId;
  const notice = await Notice.create({ ...payload, property, author: request.user.id });
  response.status(201).json({ success: true, data: { notice } });
});
