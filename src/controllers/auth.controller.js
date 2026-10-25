import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'housebuilding-super-secret-key-2026';

const defaultPhases = [
  { orderIndex: 1, title: 'Provera parcele i identiteta', subtitle: 'Katastarska parcela, vlasništvo, tereti, pristupni put.', budgetPlan: 30000 },
  { orderIndex: 2, title: 'Planska pravila', subtitle: 'Namena, indeks zauzetosti i izgrađenosti, gabariti, spratnost.', budgetPlan: 25000 },
  { orderIndex: 3, title: 'Geodetski i geotehnički podaci', subtitle: 'Geodetski snimak i geotehnički elaborat tla.', budgetPlan: 70000 },
  { orderIndex: 4, title: 'Idejno rešenje (IDR)', subtitle: 'Idejno rešenje montažne kuće usklađeno sa parcelom.', budgetPlan: 120000 },
  { orderIndex: 5, title: 'Lokacijski uslovi', subtitle: 'Urbanistički, tehnički i komunalni uslovi. Preduslov za glavni projekat.', budgetPlan: 45000 },
  { orderIndex: 6, title: 'Projekat i građevinska dozvola (PGD)', subtitle: 'Glavni projekat i dobijanje građevinske dozvole.', budgetPlan: 250000 },
  { orderIndex: 7, title: 'Prijava radova i gradnja', subtitle: 'Prijava radova najmanje 8 dana pre početka. Izjave posle temelja i konstrukcije.', budgetPlan: 3500000 },
  { orderIndex: 8, title: 'Tehnički pregled i upotrebna dozvola', subtitle: 'Finalni pregled, upotrebna dozvola i uknjižba.', budgetPlan: 80000 }
];

export const register = async (req, res) => {
  try {
    const { email, password, fullName, projectName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email i lozinka su obavezni.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Korisnik sa ovim emailom već postoji.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 dana besplatnog probnog perioda

    // Prvi registrovani korisnik ili definisani email automatski dobija ADMIN ulogu
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || email.split('@')[0],
        role,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'TRIAL',
        subscriptionExpiresAt: expiresAt,
        projects: {
          create: {
            name: projectName || 'Moja Kuća',
            location: 'Melenci, Zrenjanin',
            latitude: 45.5167,
            longitude: 20.3167,
            totalBudget: 4120000,
            phases: {
              create: defaultPhases
            }
          }
        }
      },
      include: { projects: true }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        projectId: user.projects[0]?.id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { projects: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka.' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        projectId: user.projects[0]?.id || 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.fullName,
      role: req.user.role,
      subscriptionPlan: req.user.subscriptionPlan,
      subscriptionStatus: req.user.subscriptionStatus,
      subscriptionExpiresAt: req.user.subscriptionExpiresAt,
      projectId: req.user.projects[0]?.id || 1
    }
  });
};