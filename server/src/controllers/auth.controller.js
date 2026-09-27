import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils/api-error.js';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function issueToken(user) {
  if (!env.jwtSecret) throw new ApiError(500, 'Server authentication configuration is incomplete.');
  return jwt.sign({ role: user.role }, env.jwtSecret, { subject: user.id, expiresIn: env.jwtExpiresIn });
}

function respondWithSession(response, user, statusCode = 200) {
  const token = issueToken(user);
  response.cookie('accessToken', token, cookieOptions()).status(statusCode).json({ success: true, data: { user } });
}

export const register = asyncHandler(async (request, response) => {
  const { name, email, password, phone, role } = request.validated.body;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) throw new ApiError(409, 'An account with this email already exists.');
  const user = await User.create({ name, email: normalizedEmail, password, phone, role });
  respondWithSession(response, user, 201);
});

export const login = asyncHandler(async (request, response) => {
  const { email, password } = request.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +isActive');
  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  respondWithSession(response, user);
});

export function logout(_request, response) {
  response.clearCookie('accessToken', { ...cookieOptions(), maxAge: undefined }).status(200).json({ success: true, message: 'Logged out successfully.' });
}

export function getCurrentUser(request, response) {
  response.json({ success: true, data: { user: request.user } });
}

export const updateProfile = asyncHandler(async (request, response) => {
  const { name, phone, avatarUrl } = request.validated.body;
  const user = await User.findByIdAndUpdate(request.user.id, { name, phone, avatarUrl }, { new: true, runValidators: true });
  response.json({ success: true, data: { user } });
});
