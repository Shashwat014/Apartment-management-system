import RentRecord from '../models/rent-record.model.js';
import { asyncHandler } from '../utils/api-error.js';

export const getRentSummary = asyncHandler(async (request, response) => {
  const match = request.user.role === 'owner' ? { owner: request.user._id } : {};
  const summary = await RentRecord.aggregate([{ $match: match }, { $group: { _id: '$status', amount: { $sum: '$amount' }, count: { $sum: 1 } } }]);
  const totals = Object.fromEntries(summary.map((item) => [item._id, { amount: item.amount, count: item.count }]));
  response.json({ success: true, data: { paid: totals.paid || { amount: 0, count: 0 }, pending: totals.pending || { amount: 0, count: 0 }, overdue: totals.overdue || { amount: 0, count: 0 } } });
});
