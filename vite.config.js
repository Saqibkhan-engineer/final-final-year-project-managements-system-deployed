import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://172.20.20.121:3000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/socket.io': {
          target: apiUrl,
          ws: true,
          changeOrigin: true,
        },
        '/github-api': {
          target: 'https://api.github.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/github-api/, ''),
          headers: {
            'User-Agent': 'FYP-Management-System',
          },
        },
      },
    },
  };
});