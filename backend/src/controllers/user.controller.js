const prisma = require('../config/prisma');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { userId: req.user.userId },
      select: {
        userId: true, email: true, mobile: true, userType: true, firstName: true,
        lastName: true, hospital: true, department: true, isActive: true,
        isEmailVerified: true, isMobileVerified: true, lastLoginAt: true,
        createdAt: true, abhaId: true, abhaVerified: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.getLoginHistory = async (req, res, next) => {
  try {
    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.status(200).json({ success: true, data: history });
  } catch (err) { next(err); }
};

exports.revokeDevice = async (req, res, next) => {
  try {
    const { fingerprint } = req.params;
    const user = await prisma.user.findFirst({ where: { userId: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const devices = Array.isArray(user.registeredDevices) ? [...user.registeredDevices] : [];
    const updated = devices.map(d =>
      d.fingerprint === fingerprint ? { ...d, revokedAt: new Date().toISOString() } : d
    );

    await prisma.user.update({ where: { userId: req.user.userId }, data: { registeredDevices: updated } });
    res.status(200).json({ success: true, message: 'Device revoked' });
  } catch (err) { next(err); }
};
