import { ApiError } from '../utils/api-error.js';

export function notFound(_request, response) {
  response.status(404).json({ success: false, message: 'Route not found.' });
}

export function errorHandler(error, _request, response, _next) {
  if (error.name === 'ValidationError') {
    return response.status(422).json({ success: false, message: 'Request validation failed.' });
  }
  if (error.code === 11000) {
    return response.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }
  if (error.name === 'CastError') {
    return response.status(400).json({ success: false, message: 'Invalid resource identifier.' });
  }
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const payload = { success: false, message: error.message || 'Internal server error.' };
  if (error instanceof ApiError && error.details) payload.details = error.details;
  if (statusCode >= 500) console.error(error.message);
  response.status(statusCode).json(payload);
}
