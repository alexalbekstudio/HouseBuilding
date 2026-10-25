import prisma from '../config/db.js';

export const getAllPhases = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');

    const phases = await prisma.phase.findMany({
      where: { projectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        expenses: {
          include: { company: true }
        },
        documents: true,
        reminders: true
      }
    });

    const summary = phases.map((phase) => {
      const totalSpent = phase.expenses.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        ...phase,
        totalSpent,
        remainingBudget: phase.budgetPlan - totalSpent,
        documentsCount: phase.documents.length
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePhaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, budgetPlan, startDate, endDate } = req.body;

    const data = {};
    if (status) data.status = status;
    if (budgetPlan !== undefined) data.budgetPlan = parseFloat(budgetPlan);
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

    const updated = await prisma.phase.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};