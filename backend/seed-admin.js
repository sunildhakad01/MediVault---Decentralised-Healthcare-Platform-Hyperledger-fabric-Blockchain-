require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const existing = await User.findOne({ where: { email: 'admin@medivault.dev' } });
  if (existing) {
    console.log('Admin already exists:', existing.userId);
    await sequelize.close();
    return;
  }

  const pinHash = await bcrypt.hash('123456', 12);
  const admin = await User.create({
    userId: 'MV_ADMIN',
    email: 'admin@medivault.dev',
    pinHash,
    pinLength: '6',
    userType: 'admin',
    isEmailVerified: true,
    isActive: true,
    firstName: 'System',
    lastName: 'Administrator',
  });
  console.log('Admin seeded:', admin.userId);
  console.log('Email : admin@medivault.dev');
  console.log('PIN   : 123456');
  await sequelize.close();
}

seed().catch(e => { console.error(e); process.exit(1); });
