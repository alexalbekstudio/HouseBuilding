import prisma from '../config/db.js';

// Dohvatanje podsetnika projekta
export const getReminders = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const { category, isDone } = req.query;

    const where = { projectId };
    if (category && category !== 'Sve kategorije') where.category = category;
    if (isDone !== undefined) where.isDone = isDone === 'true';

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        phase: true,
        company: true
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Kreiranje novog podsetnika
export const createReminder = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const { title, dueDate, priority, category, note, phaseId, companyId } = req.body;

    const reminder = await prisma.reminder.create({
      data: {
        title,
        dueDate: new Date(dueDate),
        priority: priority || 'Srednje',
        category: category || 'Opšte',
        note,
        projectId,
        phaseId: phaseId ? parseInt(phaseId) : null,
        companyId: companyId ? parseInt(companyId) : null
      }
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Promena statusa podsetnika (završeno / u toku)
export const toggleReminderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.reminder.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Podsetnik nije pronađen' });

    const updated = await prisma.reminder.update({
      where: { id: parseInt(id) },
      data: { isDone: !existing.isDone }
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Brisanje podsetnika
export const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Automatsko generisanje 5 ključnih zakonskih podsetnika za gradnju
export const generateLegalReminders = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const today = new Date();

    const legalDefaults = [
      {
        title: 'Podnošenje zahteva za lokacijske uslove (CEOP)',
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        priority: 'Visoko',
        category: 'Dozvole',
        note: 'Pribaviti kopiju plana i izvod iz katastra pre podnošenja.'
      },
      {
        title: 'Izrada Glavnog projekta i predaja za Građevinsku dozvolu',
        dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        priority: 'Visoko',
        category: 'Dozvole',
        note: 'Koordinisati sa projektantom montažne kuće.'
      },
      {
        title: 'Prijava početka radova nadležnom organu (minimum 8 dana pre radova)',
        dueDate: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000),
        priority: 'Visoko',
        category: 'Zakonski rok',
        note: 'Zakonska obaveza: najmanje 8 dana pre početka iskopa temelja.'
      },
      {
        title: 'Izjava o završetku izrade temelja i geodetski snimak',
        dueDate: new Date(today.getTime() + 65 * 24 * 60 * 60 * 1000),
        priority: 'Srednje',
        category: 'Gradilište',
        note: 'Overa nadzornog organa i geodete pre postavljanja montažnih panela.'
      },
      {
        title: 'Zahtev za tehnički pregled i izdavanje upotrebne dozvole',
        dueDate: new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000),
        priority: 'Visoko',
        category: 'Dozvole',
        note: 'Nakon završetka svih radova i priključaka (struja, voda, kanalizacija).'
      }
    ];

    for (const r of legalDefaults) {
      await prisma.reminder.create({
        data: {
          ...r,
          projectId
        }
      });
    }

    res.json({ success: true, count: legalDefaults.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};