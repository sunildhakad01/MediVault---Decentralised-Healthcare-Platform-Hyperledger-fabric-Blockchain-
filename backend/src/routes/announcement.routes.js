const router = require('express').Router();
const prisma  = require('../config/prisma');
const logger = require('../utils/logger.util');

// GET /api/admin/announcements
router.get('/', async (req, res) => {
  try {
    const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
});

// POST /api/admin/announcements
router.post('/', async (req, res) => {
  try {
    const { title, message, targets, scheduledAt } = req.body;
    if (!title?.trim() || !message?.trim()) return res.status(400).json({ success: false, error: 'Title and message are required' });
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const adminId = req.headers['x-admin-session']
      ? JSON.parse(Buffer.from(req.headers['x-admin-session'], 'base64').toString())?.email || 'admin'
      : (req.user?.userId || 'admin');
    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(), message: message.trim(),
        targets: targets || ['all'],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: isScheduled ? null : new Date(),
        status: isScheduled ? 'scheduled' : 'sent',
        createdBy: adminId,
      },
    });
    res.status(201).json({ success: true, data: announcement, message: isScheduled ? 'Announcement scheduled' : 'Announcement sent' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

module.exports = router;
