import MaintenanceRequest from '../models/maintenance-request.model.js';
import Unit from '../models/unit.model.js';
import Property from '../models/property.model.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';
import { getPagination, paginationMeta } from '../utils/query.js';
import { writeAudit } from '../services/audit.service.js';

export const listMaintenance = asyncHandler(async (request, response) => {
  const { page, limit, skip } = getPagination(request.query);
  const filter = {};
  if (request.user.role === 'tenant') filter.tenant = request.user.id;
  if (request.user.role === 'owner') filter.owner = request.user.id;
  if (request.query.status) filter.status = request.query.status;
  const [items, total] = await Promise.all([
    MaintenanceRequest.find(filter).populate('property', 'name').populate('unit', 'unitNumber').populate('tenant', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    MaintenanceRequest.countDocuments(filter),
  ]);
  response.json({ success: true, data: { items, pagination: paginationMeta(total, page, limit) } });
});

export const createMaintenance = asyncHandler(async (request, response) => {
  const { unitId, ...payload } = request.validated.body;
  const unit = await Unit.findOne({ _id: unitId, currentTenant: request.user.id });
  if (!unit) throw new ApiError(403, 'You can only file a request for your assigned unit.');
  const property = await Property.findById(unit.property);
  const requestItem = await MaintenanceRequest.create({ ...payload, property: property.id, unit: unit.id, tenant: request.user.id, owner: property.owner });
  response.status(201).json({ success: true, data: { request: requestItem } });
});

export const updateMaintenance = asyncHandler(async (request, response) => {
  const requestItem = await MaintenanceRequest.findById(request.params.requestId);
  if (!requestItem) throw new ApiError(404, 'Maintenance request not found.');
  const ownerAllowed = request.user.role === 'owner' && requestItem.owner.equals(request.user.id);
  if (request.user.role !== 'admin' && !ownerAllowed) throw new ApiError(403, 'You do not have permission to update this request.');
  Object.assign(requestItem, request.validated.body);
  await requestItem.save();
  await writeAudit({ actor: request.user.id, action: 'maintenance.updated', targetType: 'MaintenanceRequest', targetId: requestItem.id });
  response.json({ success: true, data: { request: requestItem } });
});
