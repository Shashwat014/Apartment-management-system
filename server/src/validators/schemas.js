import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');
const optionalText = (max) => z.string().trim().max(max).optional();

export const registerSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), password: z.string().min(8).max(128), phone: optionalText(30).default(''), role: z.enum(['owner', 'tenant']) }), params: z.object({}), query: z.object({}) });
export const loginSchema = z.object({ body: z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) }), params: z.object({}), query: z.object({}) });
export const profileSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), phone: optionalText(30).default(''), avatarUrl: optionalText(500).default('') }), params: z.object({}), query: z.object({}) });

const addressSchema = z.object({ line1: z.string().trim().min(2).max(200), city: z.string().trim().min(2).max(100), state: optionalText(100).default(''), postalCode: optionalText(20).default(''), country: optionalText(100).default('India') });
const propertyBody = z.object({ name: z.string().trim().min(2).max(120), ownerId: id.optional(), address: addressSchema, description: optionalText(2000).default(''), status: z.enum(['active', 'inactive']).default('active') });
export const propertyCreateSchema = z.object({ body: propertyBody, params: z.object({}), query: z.object({}) });
export const propertyUpdateSchema = z.object({ body: propertyBody.partial(), params: z.object({ propertyId: id }), query: z.object({}) });

const unitBody = z.object({ unitNumber: z.string().trim().min(1).max(30), floor: optionalText(30).default(''), type: z.enum(['studio', '1bhk', '2bhk', '3bhk', 'other']).default('other'), rentAmount: z.coerce.number().min(0), securityDeposit: z.coerce.number().min(0).default(0), status: z.enum(['vacant', 'occupied', 'maintenance']).default('vacant') });
export const unitCreateSchema = z.object({ body: unitBody.extend({ propertyId: id }), params: z.object({}), query: z.object({}) });
export const unitUpdateSchema = z.object({ body: unitBody.partial(), params: z.object({ unitId: id }), query: z.object({}) });
export const assignTenantSchema = z.object({ body: z.object({ tenantId: id }), params: z.object({ unitId: id }), query: z.object({}) });

export const rentCreateSchema = z.object({ body: z.object({ unitId: id, billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), amount: z.coerce.number().positive(), dueDate: z.coerce.date(), notes: optionalText(1000).default('') }), params: z.object({}), query: z.object({}) });
export const rentPaymentSchema = z.object({ body: z.object({ paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'card', 'other']), referenceId: optionalText(100).default(''), notes: optionalText(1000).default('') }), params: z.object({ rentId: id }), query: z.object({}) });

export const maintenanceCreateSchema = z.object({ body: z.object({ unitId: id, category: z.enum(['plumbing', 'electrical', 'appliance', 'cleaning', 'security', 'other']).default('other'), description: z.string().trim().min(5).max(2000), priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium') }), params: z.object({}), query: z.object({}) });
export const maintenanceUpdateSchema = z.object({ body: z.object({ status: z.enum(['open', 'in_progress', 'resolved', 'rejected']).optional(), assignedTo: optionalText(100), resolutionNote: optionalText(1000) }).refine((body) => Object.keys(body).length > 0), params: z.object({ requestId: id }), query: z.object({}) });

export const noticeCreateSchema = z.object({ body: z.object({ propertyId: id.optional(), title: z.string().trim().min(2).max(200), description: z.string().trim().min(2).max(5000), audience: z.enum(['all', 'owners', 'tenants', 'property_tenants']).default('all'), expiresAt: z.coerce.date().nullable().optional() }), params: z.object({}), query: z.object({}) });
export const userUpdateSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), phone: optionalText(30).default(''), role: z.enum(['admin', 'owner', 'tenant']), isActive: z.boolean() }), params: z.object({ userId: id }), query: z.object({}) });
export const adminUserCreateSchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), password: z.string().min(8).max(128), phone: optionalText(30).default(''), role: z.enum(['admin', 'owner', 'tenant']) }), params: z.object({}), query: z.object({}) });
