import prisma from '../config/db.js';

export const createExpense = async (req, res) => {
  try {
    const projectId = parseInt(req.body.projectId || '1');
    const {
      title,
      amount,
      category,
      paymentMethod,
      status,
      date,
      documentNo,
      note,
      phaseId,
      companyId
    } = req.body;

    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        category: category || 'MATERIJAL',
        paymentMethod: paymentMethod || 'GOTOVINA',
        status: status || 'PLACENO',
        date: date ? new Date(date) : new Date(),
        documentNo,
        note,
        invoiceUrl,
        projectId,
        phaseId: phaseId && phaseId !== '' ? parseInt(phaseId) : null,
        companyId: companyId && companyId !== '' ? parseInt(companyId) : null
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');
    const { phaseId, status } = req.query;

    const where = { projectId };
    if (phaseId && phaseId !== 'all') where.phaseId = parseInt(phaseId);
    if (status && status !== 'all') where.status = status;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        phase: true,
        company: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const exportExpensesCSV = async (req, res) => {
  try {
    const projectId = parseInt(req.query.projectId || '1');

    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: {
        phase: true,
        company: true
      },
      orderBy: { date: 'desc' }
    });

    let csv = 'ID,Datum,Faza,Opis,Iznos (RSD),Kategorija,Nacin Placanja,Status,Firma,Broj Dokumenta\n';

    expenses.forEach((e) => {
      const d = e.date.toISOString().split('T')[0];
      const phase = `"${(e.phase?.title || 'Bez faze').replace(/"/g, '""')}"`;
      const title = `"${(e.title || '').replace(/"/g, '""')}"`;
      const comp = `"${(e.company?.name || 'N/A').replace(/"/g, '""')}"`;
      const doc = `"${(e.documentNo || '').replace(/"/g, '""')}"`;

      csv += `${e.id},${d},${phase},${title},${e.amount},${e.category},${e.paymentMethod},${e.status},${comp},${doc}\n`;
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`kuca-melenci-troskovi-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};