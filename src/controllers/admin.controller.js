import prisma from '../config/db.js';

// Dohvatanje svih pretplatnika i njihovih projekata
export const getAllSubscribers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        projects: {
          include: {
            _count: {
              select: { expenses: true, documents: true, companies: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const metrics = {
      totalUsers: users.length,
      activePaid: users.filter(u => u.subscriptionStatus === 'ACTIVE').length,
      trials: users.filter(u => u.subscriptionStatus === 'TRIAL').length,
      expired: users.filter(u => u.subscriptionStatus === 'EXPIRED').length
    };

    res.json({ metrics, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ručna promena plana, statusa i datuma isteka pretplate
export const updateSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionPlan, subscriptionStatus, daysToAdd } = req.body;

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });

    let newExpiresAt = user.subscriptionExpiresAt || new Date();
    if (daysToAdd) {
      newExpiresAt = new Date(newExpiresAt.getTime() + parseInt(daysToAdd) * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionPlan: subscriptionPlan || user.subscriptionPlan,
        subscriptionStatus: subscriptionStatus || user.subscriptionStatus,
        subscriptionExpiresAt: daysToAdd ? newExpiresAt : user.subscriptionExpiresAt
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};