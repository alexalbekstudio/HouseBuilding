import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'housebuilding-super-secret-key-2026';

// Middleware za verifikaciju prijavljenog korisnika
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Niste prijavljeni. Nedostaje token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { projects: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Korisnik više ne postoji.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Nevažeći ili istekao token.' });
  }
};

// Middleware koji dozvoljava pristup samo vašem administratorskom nalogu
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Pristup odbijen. Samo administrator ima ovlašćenje.' });
  }
};