// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load environment variables based on the current mode and current working directory
    const env = loadEnv(mode, process.cwd(), '');

    return {
      // THIS IS CRUCIAL FOR GITHUB PAGES.
      // Replace 'internai-ai-internship-recommender' with the EXACT name of your GitHub repository.
      // For example, if your repo URL is https://github.com/yourusername/my-intern-app,
      // then 'base' should be '/my-intern-app/'.
      base: '/internAI/', // <--- REPLACE THIS WITH YOUR REPO NAME EXACTLY

      define: {
        // These lines make your .env variables (like GEMINI_API_KEY)
        // available in your React code as `process.env.API_KEY` (or `process.env.GEMINI_API_KEY`).
        // Vite will replace these with the actual values during the build process.
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // Ensure consistent naming if only one is needed
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
