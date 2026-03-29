import path from 'path';
import express from 'express';
import cors from 'cors';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from './generated/prisma/client';

const dbPath = path.resolve(__dirname, '../dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(cors());
app.use(express.json());

/** GET /api/merchants — list all merchants */
app.get('/api/merchants', async (_req, res) => {
  try {
    const merchants = await prisma.merchant.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(merchants);
  } catch (err) {
    console.error('GET /api/merchants error:', err);
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

/** GET /api/merchants/:id — get a single merchant with its latest assessment */
app.get('/api/merchants/:id', async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.params['id'] },
      include: {
        assessments: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!merchant) {
      res.status(404).json({ error: 'Merchant not found' });
      return;
    }
    res.json(merchant);
  } catch (err) {
    console.error('GET /api/merchants/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch merchant' });
  }
});

app.listen(PORT, () => {
  console.log(`RateIt API running on http://localhost:${PORT}`);
});
