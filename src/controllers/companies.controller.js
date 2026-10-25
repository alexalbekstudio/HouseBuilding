import prisma from '../config/db.js';
import { geocodeAddress } from '../services/geocode.service.js';

// Dohvatanje svih firmi projekta
export const getCompanies = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const { search, category } = req.query;

    const where = { projectId };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category && category !== 'Sve kategorije') {
      where.category = category;
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { expenses: true } }
      }
    });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dodavanje nove firme sa automatskim geokodiranjem
export const createCompany = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const {
      name,
      pib,
      address,
      factoryAddress,
      city,
      postalCode,
      contactPerson,
      phone,
      email,
      category,
      note
    } = req.body;

    let latitude = null;
    let longitude = null;

    // Ako je adresa navedena, automatski izvuci koordinate za mapu
    if (address) {
      const geo = await geocodeAddress(address, city);
      latitude = geo.latitude;
      longitude = geo.longitude;
    }

    const company = await prisma.company.create({
      data: {
        name,
        pib,
        address,
        factoryAddress,
        city,
        postalCode,
        contactPerson,
        phone,
        email,
        category: category || 'Izvođač',
        note,
        latitude,
        longitude,
        projectId
      }
    });

    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Brisanje firme
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.company.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};