import prisma from '../config/db.js';

export const createExpense = async (req, res) => {
  try {
    const { title, amount, paidDate, phaseId, vendorId } = req.body;
    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        phaseId: parseInt(phaseId),
        vendorId: vendorId && vendorId !== '' ? parseInt(vendorId) : null,
        invoiceUrl,
      },
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getExpensesByPhase = async (req, res) => {
  try {
    const { phaseId } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { phaseId: parseInt(phaseId) },
      include: { vendor: true },
      orderBy: { paidDate: 'desc' },
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
    const expenses = await prisma.expense.findMany({
      include: {
        phase: true,
        vendor: true,
      },
      orderBy: { paidDate: 'desc' },
    });

    let csv = 'ID,Datum,Faza,Stavka,Iznos (EUR),Dobavljac / Majstor\n';

    expenses.forEach((item) => {
      const date = item.paidDate.toISOString().split('T')[0];
      const phaseTitle = `"${(item.phase?.title || '').replace(/"/g, '""')}"`;
      const title = `"${(item.title || '').replace(/"/g, '""')}"`;
      const vendorName = `"${(item.vendor?.name || 'N/A').replace(/"/g, '""')}"`;
      
      csv += `${item.id},${date},${phaseTitle},${title},${item.amount},${vendorName}\n`;
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`housebuilding-troskovi-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};