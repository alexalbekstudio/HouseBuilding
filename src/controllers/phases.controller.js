import prisma from '../config/db.js';

export const getAllPhases = async (req, res) => {
  try {
    const phases = await prisma.phase.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        expenses: true,
      },
    });

    // Dodavanje izračunatog stvarnog troška po fazi
    const summary = phases.map(phase => {
      const totalSpent = phase.expenses.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        ...phase,
        totalSpent,
        remainingBudget: phase.budget - totalSpent,
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPhase = async (req, res) => {
  try {
    const { title, description, orderIndex, budget, status, startDate, endDate } = req.body;
    const phase = await prisma.phase.create({
      data: {
        title,
        description,
        orderIndex: orderIndex ? parseInt(orderIndex) : 0,
        budget: budget ? parseFloat(budget) : 0.0,
        status: status || 'PLANIRANO',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    res.status(201).json(phase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePhase = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.phase.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePhase = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.phase.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};