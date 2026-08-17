import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

export default defineConfig(() => {
  const appTarget = process.env.APP;
  const isTest = process.env.VITEST;

  if (!appTarget && !isTest) {
    throw new Error('Please specify an APP environment variable (e.g., APP=app1).');
  }

  return {
    plugins: [react()],
    server: {
      watch: {
        usePolling: true
      }
    },

    // Set the root to the target app folder so Vite finds index.html natively
    root: isTest ? __dirname : resolve(__dirname, `apps/${ appTarget }`),

    build: {
      // Force the build output to go to the main dist folder under the app name
      outDir: resolve(__dirname, `dist/${ appTarget }`),
      emptyOutDir: true
    },

    // Optional: Allow the apps to easily import things from the root shared folder
    resolve: {
      alias: {
        '@shared': resolve(__dirname, './apps/shared-components')
      }
    },

    test: {
      environment: 'happy-dom',
      globals: true,
      include: ['apps/**/*.{test,spec}.{ts,tsx}']
    }
  }
})
