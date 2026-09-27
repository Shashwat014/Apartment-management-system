import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';

function getToken(request) {
  if (request.cookies?.accessToken) return request.cookies.accessToken;
  const authorization = request.get('authorization');
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
}

export const authenticate = asyncHandler(async (request, _response, next) => {
  const token = getToken(request);
  if (!token || !env.jwtSecret) throw new ApiError(401, 'Authentication is required.');

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('+isActive');
    if (!user || !user.isActive) throw new ApiError(401, 'Your account is unavailable.');
    request.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Your session is invalid or has expired.');
  }
});

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}
