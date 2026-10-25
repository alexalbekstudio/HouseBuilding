import { Router } from 'express';
import prisma from '../config/db.js';

const router = Router();

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

// 1. Dohvati sve projekte korisnika
router.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Dohvati pojedinačan projekat po ID (potrebno za mapu i koordinate)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });
    if (!project) return res.status(404).json({ error: 'Projekat nije pronađen' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Ažuriranje koordinata parcele/gradilišta
router.put('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Kreiraj novu kuću / gradilište sa 8 faza
router.post('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { name, location, totalBudget } = req.body;

    const newProject = await prisma.project.create({
      data: {
        name: name || 'Nova kuća',
        location: location || 'Melenci',
        totalBudget: totalBudget ? parseFloat(totalBudget) : 4120000,
        latitude: 45.5167,
        longitude: 20.3167,
        userId,
        phases: {
          create: defaultPhases
        }
      }
    });

    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;