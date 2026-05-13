const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  // Seed superadmin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@medivault.in';
  const adminPin   = process.env.ADMIN_PIN   || '123456';

  const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!existing) {
    const pinHash = await bcrypt.hash(adminPin, 10);
    await prisma.user.create({
      data: {
        userId: uuidv4(), email: adminEmail, mobile: '+910000000000',
        pinHash, pinSalt: '', pinLength: '6',
        userType: 'admin', role: 'superadmin',
        firstName: 'Super', lastName: 'Admin',
        isActive: true,
        metadata: { firstLoginCompleted: true },
      },
    });
    console.log(`Admin seeded: ${adminEmail} / PIN: ${adminPin}`);
  } else {
    console.log('Admin already exists — skipping.');
  }

  // Seed default specializations
  const specs = [
    'General Medicine', 'Internal Medicine', 'Cardiology', 'Neurology', 'Orthopaedics',
    'Gynaecology & Obstetrics', 'Paediatrics', 'Ophthalmology', 'ENT', 'Dermatology',
    'Psychiatry', 'Oncology', 'Urology', 'Nephrology', 'Gastroenterology', 'Pulmonology',
    'Endocrinology', 'Rheumatology', 'Haematology', 'Radiology', 'Pathology',
    'Anaesthesiology', 'Emergency Medicine', 'Dental / BDS', 'Ayurveda / BAMS', 'Homoeopathy / BHMS',
  ];
  await prisma.specialization.createMany({
    data: specs.map(name => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Specializations seeded (${specs.length})`);

  // Seed system config defaults
  await prisma.systemConfig.createMany({
    data: [
      { key: 'default_slot_duration', value: '30',  updatedBy: 'system' },
      { key: 'platform_fee_percent',  value: '5',   updatedBy: 'system' },
      { key: 'gst_percent',           value: '18',  updatedBy: 'system' },
    ],
    skipDuplicates: true,
  });
  console.log('System config seeded');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
