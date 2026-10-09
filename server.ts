import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Persistent storage file
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'custom_records.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCustomRecords(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading custom records from disk:', err);
  }
  return [];
}

function writeCustomRecords(records: any[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing custom records to disk:', err);
    return false;
  }
}

// Required security password
const REQUIRED_PASSWORD = 'BMSRP2026';

// --- API Endpoints ---

// 1. Fetch all custom records (public read for dashboard visualization)
app.get('/api/custom-records', (_req, res) => {
  const records = readCustomRecords();
  res.json({ records });
});

// 2. Save or update a custom record (requires BMSRP2026 password)
app.post('/api/custom-records', (req, res) => {
  const { password, record } = req.body || {};
  if (password !== REQUIRED_PASSWORD) {
    return res.status(403).json({ error: 'Contraseña no autorizada. Clave requerida: BMSRP2026' });
  }

  if (!record || !record.id) {
    return res.status(400).json({ error: 'Datos de registro incompletos o sin ID' });
  }

  const current = readCustomRecords();
  const filtered = current.filter((r: any) => r.id !== record.id);
  const updated = [...filtered, record];
  writeCustomRecords(updated);
  return res.json({ success: true, records: updated });
});

// 3. Delete a custom record (requires BMSRP2026 password)
app.delete('/api/custom-records/:id', (req, res) => {
  const { password } = req.body || {};
  if (password !== REQUIRED_PASSWORD) {
    return res.status(403).json({ error: 'Contraseña no autorizada. Clave requerida: BMSRP2026' });
  }

  const { id } = req.params;
  const current = readCustomRecords();
  const updated = current.filter((r: any) => r.id !== id);
  writeCustomRecords(updated);
  return res.json({ success: true, records: updated });
});

// 4. Clear all custom records (requires BMSRP2026 password)
app.post('/api/custom-records/clear', (req, res) => {
  const { password } = req.body || {};
  if (password !== REQUIRED_PASSWORD) {
    return res.status(403).json({ error: 'Contraseña no autorizada. Clave requerida: BMSRP2026' });
  }

  writeCustomRecords([]);
  return res.json({ success: true, records: [] });
});

// --- Server Lifecycle & Vite Integration ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Determine listening port
  let port = 3000;
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    port = parseInt(process.argv[portArgIdx + 1], 10) || 3000;
  } else if (process.env.PORT) {
    port = parseInt(process.env.PORT, 10) || 3000;
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`> Servidor activo en http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Error al inicializar el servidor:', err);
  process.exit(1);
});
