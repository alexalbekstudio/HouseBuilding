import prisma from '../config/db.js';

export const getCapitals = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const capitals = await prisma.capital.findMany({
      where: { projectId },
      orderBy: { date: 'desc' }
    });

    const totalCapital = capitals.reduce((acc, c) => acc + c.amount, 0);

    // Dohvati ukupno potrošeno iz troškova za poređenje
    const expenses = await prisma.expense.findMany({
      where: { projectId }
    });
    const totalSpent = expenses.reduce((acc, e) => acc + e.amount, 0);

    res.json({
      capitals,
      totalCapital,
      totalSpent,
      remainingCapital: totalCapital - totalSpent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCapital = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const { sourceName, amount, category, date, note } = req.body;

    const capital = await prisma.capital.create({
      data: {
        sourceName,
        amount: parseFloat(amount),
        category: category || 'Ušteđevina',
        date: date ? new Date(date) : new Date(),
        note,
        projectId
      }
    });
    res.status(201).json(capital);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteCapital = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.capital.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};