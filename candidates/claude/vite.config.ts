import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'/site-lab-artifacts/candidates/claude/',build:{outDir:'../../docs-site/candidates/claude',emptyOutDir:true}});
