import { Router } from 'express';
import prisma from '../config/db.js';
import { getCurrentWeather } from '../services/weather.service.js';

const router = Router();

// Dohvat svih zapisa dnevnika za aktivno gradilište
router.get('/', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const logs = await prisma.siteLog.findMany({
      where: { projectId },
      orderBy: { date: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dodavanje novog zapisa u građevinski dnevnik s automatskim vremenskim uvjetima
router.post('/', async (req, res) => {
  try {
    const { projectId, notes, workType, temperature, weatherDesc } = req.body;
    const pId = parseInt(projectId);

    let finalTemp = temperature !== undefined && temperature !== '' ? parseFloat(temperature) : null;
    let finalDesc = weatherDesc && weatherDesc.trim() !== '' ? weatherDesc.trim() : null;
    let finalWind = null;

    // Ako korisnik nije ručno upisao, automatski dohvati sa lokacije gradilišta
    if (finalTemp === null || finalDesc === null) {
      const project = await prisma.project.findUnique({ where: { id: pId } });
      const weather = await getCurrentWeather(project?.latitude, project?.longitude);
      if (weather) {
        if (finalTemp === null) finalTemp = weather.temperature;
        if (finalDesc === null) finalDesc = weather.weatherDesc;
        finalWind = weather.windSpeed;
      }
    }

    const log = await prisma.siteLog.create({
      data: {
        projectId: pId,
        notes,
        workType,
        temperature: finalTemp,
        weatherDesc: finalDesc,
        windSpeed: finalWind
      }
    });

    res.status(201).json(log);
  } catch (err) {
    console.error('Greška pri kreiranju unosa u dnevnik:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;