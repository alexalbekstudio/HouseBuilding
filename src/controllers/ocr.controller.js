import { createWorker } from 'tesseract.js';
import fs from 'fs';

export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Niste poslali sliku računa.' });
    }

    const filePath = req.file.path;

    // Pokrećemo Tesseract sa podrškom za srpski i engleski
    const worker = await createWorker('srp');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();

    // Regex za automatsko pronalaženje ukupnog iznosa (npr. "ZA UPLATU", "UKUPNO", "TOTAL")
    let detectedAmount = null;
    const amountRegex = /(?:ukupan iznos|za uplatu|ukupno|total|iznos)[:\s]*([0-9.,]+)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      const cleanNum = amountMatch[1].replace(/\./g, '').replace(',', '.');
      detectedAmount = parseFloat(cleanNum);
    }

    // Regex za datum (npr. 24.10.2026 ili 2026-10-24)
    let detectedDate = null;
    const dateRegex = /(\d{2}[./-]\d{2}[./-]\d{4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      detectedDate = dateMatch[1];
    }

    // Regex za PIB (9 cifara)
    let detectedPib = null;
    const pibMatch = text.match(/pib[:\s]*(\d{9})/i);
    if (pibMatch) {
      detectedPib = pibMatch[1];
    }

    res.json({
      success: true,
      fileUrl: `/uploads/${req.file.filename}`,
      rawText: text,
      extracted: {
        amount: detectedAmount,
        date: detectedDate,
        pib: detectedPib
      }
    });
  } catch (error) {
    console.error('OCR Greška:', error);
    res.status(500).json({ error: error.message });
  }
};