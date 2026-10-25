import prisma from '../config/db.js';

export const getDocuments = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const { phaseId, search } = req.query;

    const where = { projectId };
    if (phaseId && phaseId !== 'all') where.phaseId = parseInt(phaseId);
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const documents = await prisma.document.findMany({
      where,
      include: { phase: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDocument = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const { title, phaseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Morate priložiti fajl (PDF ili sliku).' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.includes('pdf') ? 'PDF' : 'SLIKA';

    const document = await prisma.document.create({
      data: {
        title,
        fileUrl,
        fileType,
        phaseId: phaseId && phaseId !== '' ? parseInt(phaseId) : null,
        projectId
      }
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};