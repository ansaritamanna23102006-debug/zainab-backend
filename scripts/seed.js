/**
 * Seed Script — Creates default superadmin account.
 * Run once: node scripts/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin    = require('../models/Admin');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  // Check if admin already exists
  const existing = await Admin.findOne({ email: 'admin@zainabclinic.com' });
  if (existing) {
    console.log('⚠️  Admin already exists. Skipping seed.');
    process.exit(0);
  }

  await Admin.create({
    name:     'Clinic Admin',
    email:    'admin@zainabclinic.com',
    password: 'Admin@1234',
    role:     'superadmin',
  });

  console.log('✅ Superadmin created:');
  console.log('   Email:    admin@zainabclinic.com');
  console.log('   Password: Admin@1234');
  console.log('   ⚠️  Change this password after first login!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
