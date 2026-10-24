import prisma from '../config/db.js';

export const getAllVendors = async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: { select: { expenses: true } },
      },
    });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createVendor = async (req, res) => {
  try {
    const { name, contact, category } = req.body;
    const vendor = await prisma.vendor.create({
      data: { name, contact, category },
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};