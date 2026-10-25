import prisma from '../config/db.js';

export const getMaterials = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const materials = await prisma.material.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const { name, unit, category, description, priceEst } = req.body;

    const material = await prisma.material.create({
      data: {
        name,
        unit: unit || 'kom',
        category: category || 'Opšte',
        description,
        priceEst: priceEst ? parseFloat(priceEst) : 0.0,
        projectId
      }
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};