import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { app, tickSimulations } from './app.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const SIMULATION_TICK_MS = 1800;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  setInterval(() => {
    tickSimulations().catch((err) => console.error('Simulation tick error:', err));
  }, SIMULATION_TICK_MS);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DoubtMap server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
