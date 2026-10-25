import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Servis za podsjetnike i automatski cron
import { initReminderCron, checkUpcomingDeadlines } from './services/reminder.service.js';

import phaseRoutes from './routes/phases.routes.js';
import expenseRoutes from './routes/expenses.routes.js';
import companyRoutes from './routes/companies.routes.js';
import ocrRoutes from './routes/ocr.routes.js';
import materialRoutes from './routes/materials.routes.js';
import capitalRoutes from './routes/capitals.routes.js';
import reminderRoutes from './routes/reminders.routes.js';
import sitelogsRoutes from './routes/sitelogs.routes.js';

import projectRoutes from './routes/projects.routes.js';
import documentRoutes from './routes/documents.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serviranje statičkih datoteka i uploada
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// API rute
app.use('/api/phases', phaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/capitals', capitalRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sitelogs', sitelogsRoutes);

// Provera statusa servera (Health check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Test ruta za ručno pokretanje provjere i slanja obavijesti
app.post('/api/reminders/test-email', async (req, res) => {
  try {
    if (typeof checkUpcomingDeadlines === 'function') {
      await checkUpcomingDeadlines();
    }
    res.json({ message: 'Provjera i slanje obavještenja uspješno izvršeni.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pokretanje servera sa cron servisom
app.listen(PORT, () => {
  console.log(`HouseBuilding server pokrenut na portu ${PORT}`);
  
  // Pokretanje automatskog praćenja rokova faza
  initReminderCron();
  console.log('✔ Cron servis za podsetnike o rokovima je aktivan.');
});