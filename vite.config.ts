import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type UserConfig} from 'vite';

export default defineConfig((): UserConfig => {
  const disableHmr = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Allow hosted preview domains (Replit / Cloud Run)
      allowedHosts: true,
      hmr: disableHmr ? false : undefined,
      watch: disableHmr ? { ignored: ['**/*'] } : undefined,
    },
  };
});
