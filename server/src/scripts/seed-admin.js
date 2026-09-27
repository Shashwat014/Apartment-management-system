import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/user.model.js';

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding an admin.');
  process.exit(1);
}

try {
  await connectDatabase();
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.info('An account with this administrator email already exists.');
  } else {
    await User.create({ name: ADMIN_NAME || 'System Administrator', email: ADMIN_EMAIL.toLowerCase(), password: ADMIN_PASSWORD, role: 'admin' });
    console.info('Administrator account created.');
  }
} finally {
  await disconnectDatabase();
}
