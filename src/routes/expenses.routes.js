import { Router } from 'express';
import prisma from '../config/db.js';
import multer from 'multer';
import path from 'path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import {
  createExpense,
  getExpenses,
  deleteExpense,
  exportExpensesCSV
} from '../controllers/expenses.controller.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const router = Router();

router.get('/export/csv', exportExpensesCSV);
router.get('/', getExpenses);

// 1. IZVOZ U EXCEL (.xlsx)
router.get('/export/excel', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { createdAt: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HouseBuilding SaaS';
    const worksheet = workbook.addWorksheet('Troškovi gradnje');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Datum', key: 'date', width: 14 },
      { header: 'Opis troška', key: 'title', width: 32 },
      { header: 'Faza gradnje', key: 'phase', width: 30 },
      { header: 'Firma / Izvođač', key: 'company', width: 25 },
      { header: 'Način plaćanja', key: 'method', width: 16 },
      { header: 'Iznos (RSD)', key: 'amount', width: 18 }
    ];

    // Stilizovanje zaglavlja
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Tamno plava / slate-800
    };

    let totalSum = 0;
    expenses.forEach((exp) => {
      totalSum += Number(exp.amount);
      worksheet.addRow({
        id: exp.id,
        date: new Date(exp.createdAt).toLocaleDateString('sr-RS'),
        title: exp.title,
        phase: exp.phase?.title || 'Opšti trošak',
        company: exp.company?.name || 'Direktna nabavka',
        method: exp.paymentMethod || 'Gotovina',
        amount: Number(exp.amount)
      });
    });

    // Formatiranje kolone za iznos
    worksheet.getColumn('amount').numFmt = '#,##0.00 "RSD"';

    // Red za ukupnu sumu
    const totalRow = worksheet.addRow({
      title: 'UKUPNO POTROŠENO:',
      amount: totalSum
    });
    totalRow.font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Troskovi_Gradiliste_${projectId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. IZVOZ U PDF (.pdf)
router.get('/export/pdf', async (req, res) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId) : 1;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const expenses = await prisma.expense.findMany({
      where: { projectId },
      include: { phase: true, company: true },
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Finansijski_Izvestaj_${projectId}.pdf`
    );

    doc.pipe(res);

    // Naslov i zaglavlje dokumenta
    doc.fontSize(18).text('HouseBuilding SaaS — Finansijski Izveštaj', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(`Objekat: ${project?.name || 'Gradilište'} (${project?.location || 'Srbija'})`, { align: 'center' });
    doc.text(`Datum generisanja: ${new Date().toLocaleDateString('sr-RS')}`, { align: 'center' });
    doc.moveDown(1.5);

    let totalSum = 0;
    const rows = expenses.map((exp) => {
      totalSum += Number(exp.amount);
      return [
        new Date(exp.createdAt).toLocaleDateString('sr-RS'),
        exp.title,
        exp.phase?.title ? exp.phase.title.substring(0, 25) : '-',
        exp.company?.name || '-',
        exp.paymentMethod || 'Gotovina',
        `${Number(exp.amount).toLocaleString('sr-RS')} RSD`
      ];
    });

    const table = {
      title: 'Dnevnik troškova i isplata',
      headers: ['Datum', 'Opis', 'Faza', 'Izvođač', 'Plaćanje', 'Iznos'],
      rows: rows
    };

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a'),
      prepareRow: (row, indexColumn, indexRow, rect, rowHeight) => {
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
      }
    });

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text(
      `UKUPNO POTROŠENO: ${totalSum.toLocaleString('sr-RS')} RSD`,
      { align: 'right' }
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('invoice'), createExpense);
router.delete('/:id', deleteExpense);

export default router;