// internAI-main/vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
      // --- CHANGE THIS LINE ---
      // Replace 'internAI' with the EXACT name of your GitHub repository.
      // Example: If your repo is named 'my-intern-app', change to '/my-intern-app/'
      base: '/InternAI/', // <--- Make sure this matches your GitHub repo name exactly!

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
