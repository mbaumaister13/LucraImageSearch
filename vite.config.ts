import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';

export default defineConfig(() => {
  const appTarget = process.env.APP;

  if (!appTarget) {
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
    root: resolve(__dirname, `apps/${ appTarget }`),

    build: {
      // Force the build output to go to the main dist folder under the app name
      outDir: resolve(__dirname, `dist/${ appTarget }`),
      emptyOutDir: true
    },

    // Optional: Allow the apps to easily import things from the root shared folder
    resolve: {
      alias: {
        '@shared': resolve(__dirname, './shared-components')
      }
    }
  }
})
