/**
 * Seed script — creates a super-admin user.
 *
 * Usage:
 *   node scripts/seed-admin.js <email> <pin> [firstName] [lastName]
 *
 * Example:
 *   node scripts/seed-admin.js admin@medivault.com 291847 Admin User
 *
 * PIN rules: 4 or 6 digits, not all-same (1111), not sequential (1234/4321).
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Sequelize, DataTypes } = require('sequelize');

const [,, emailArg, pinArg, firstNameArg = 'Admin', lastNameArg = 'User'] = process.argv;

if (!emailArg || !pinArg) {
  console.error('Usage: node scripts/seed-admin.js <email> <pin> [firstName] [lastName]');
  process.exit(1);
}

// Validate PIN
if (!/^\d{4}$|^\d{6}$/.test(pinArg)) {
  console.error('PIN must be exactly 4 or 6 digits');
  process.exit(1);
}
if (/^(\d)\1+$/.test(pinArg)) {
  console.error('PIN cannot be all the same digit (e.g., 1111)');
  process.exit(1);
}
const digits = pinArg.split('').map(Number);
let seqAsc = true, seqDesc = true;
for (let i = 1; i < digits.length; i++) {
  if (digits[i] !== digits[i - 1] + 1) seqAsc = false;
  if (digits[i] !== digits[i - 1] - 1) seqDesc = false;
}
if (seqAsc || seqDesc) {
  console.error('PIN cannot be sequential digits (e.g., 1234 or 6543)');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

const User = sequelize.define('User', {
  userId:           { type: DataTypes.STRING, unique: true, allowNull: false },
  email:            { type: DataTypes.STRING, unique: true, allowNull: true },
  mobile:           { type: DataTypes.STRING, unique: true, allowNull: true },
  isEmailVerified:  { type: DataTypes.BOOLEAN, defaultValue: false },
  isMobileVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationDate: { type: DataTypes.DATE, allowNull: true },
  pinHash:          { type: DataTypes.STRING, allowNull: false },
  pinLength:        { type: DataTypes.ENUM('4', '6'), allowNull: false },
  userType:         { type: DataTypes.ENUM('patient', 'doctor', 'admin', 'pharmacy'), allowNull: false },
  role:             { type: DataTypes.STRING, allowNull: true },
  hospital:         { type: DataTypes.STRING, allowNull: true },
  department:       { type: DataTypes.STRING, allowNull: true },
  firstName:        { type: DataTypes.STRING, allowNull: true },
  lastName:         { type: DataTypes.STRING, allowNull: true },
  licenseNumber:    { type: DataTypes.STRING, allowNull: true },
  fabricCertPath:   { type: DataTypes.STRING, allowNull: true },
  fabricMSPID:      { type: DataTypes.STRING, allowNull: true },
  fabricUserId:     { type: DataTypes.STRING, allowNull: true },
  abhaId:           { type: DataTypes.STRING, unique: true, allowNull: true },
  abhaVerified:     { type: DataTypes.BOOLEAN, defaultValue: false },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockedUntil:      { type: DataTypes.DATE, allowNull: true },
  lastLoginAt:      { type: DataTypes.DATE, allowNull: true },
  lastLoginIP:      { type: DataTypes.STRING, allowNull: true },
  registeredDevices: { type: DataTypes.JSON, defaultValue: [] },
  isActive:         { type: DataTypes.BOOLEAN, defaultValue: true },
  isBlocked:        { type: DataTypes.BOOLEAN, defaultValue: false },
  blockReason:      { type: DataTypes.STRING, allowNull: true },
  metadata:         { type: DataTypes.JSON, defaultValue: {} },
}, { timestamps: true });

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');

    // Check if already exists
    const existing = await User.findOne({ where: { email: emailArg } });
    if (existing) {
      console.log(`Admin user with email "${emailArg}" already exists (userId: ${existing.userId})`);
      await sequelize.close();
      return;
    }

    const userId = `MV-IND-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const pinHash = await bcrypt.hash(pinArg, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    const admin = await User.create({
      userId,
      email: emailArg,
      isEmailVerified: true,
      verificationDate: new Date(),
      pinHash,
      pinLength: String(pinArg.length),
      userType: 'admin',
      role: 'super_admin',
      firstName: firstNameArg,
      lastName: lastNameArg,
      isActive: true,
      isBlocked: false,
    });

    console.log('\n========================================');
    console.log('Admin user created successfully!');
    console.log('========================================');
    console.log(`User ID   : ${admin.userId}`);
    console.log(`Email     : ${admin.email}`);
    console.log(`Name      : ${admin.firstName} ${admin.lastName}`);
    console.log(`Role      : ${admin.role}`);
    console.log('========================================\n');
    console.log('You can now log in at /admin/login with the email and PIN you provided.');

    await sequelize.close();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
