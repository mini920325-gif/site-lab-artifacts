import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'/site-lab-artifacts/candidates/fable/',build:{outDir:'../../docs-site/candidates/fable',emptyOutDir:true}});
