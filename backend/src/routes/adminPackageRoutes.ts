import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

const createPackageSchema = z.object({
  name: z.string().min(1),
  priceUgx: z.number().positive(),
  durationMinutes: z.number().positive().optional(),
  dataMb: z.number().positive().optional()
});

const updatePackageSchema = createPackageSchema.partial();

// GET /admin/packages
router.get('/', adminAuth, async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: packages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// POST /admin/packages
router.post('/', adminAuth, async (req, res) => {
  try {
    const data = createPackageSchema.parse(req.body);
    
    const package_ = await prisma.package.create({
      data: {
        name: data.name,
        priceUgx: data.priceUgx,
        durationMinutes: data.durationMinutes || null,
        dataMb: data.dataMb || null
      }
    });
    
    res.status(201).json(package_);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create package' });
    }
  }
});

// PUT /admin/packages/:id
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updatePackageSchema.parse(req.body);
    
    const package_ = await prisma.package.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.priceUgx && { priceUgx: data.priceUgx }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.dataMb !== undefined && { dataMb: data.dataMb })
      }
    });
    
    res.json(package_);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update package' });
    }
  }
});

// DELETE /admin/packages/:id
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.package.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export { router as adminPackageRoutes };