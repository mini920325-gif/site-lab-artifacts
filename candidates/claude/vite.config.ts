import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const id = ['ip-2', 'ip-3'].includes(mode) ? mode : 'claude';
  const name = id === 'ip-2' ? '2안 · 제도와 일상' : id === 'ip-3' ? '3안 · 일상동료' : '1안 · 커뮤니티';
  return { plugins: [react(), { name: 'edition-title', transformIndexHtml(html: string) { return html.replace(/<title>.*?<\/title>/, '<title>' + name + '</title>'); } }], base: '/site-lab-artifacts/candidates/' + id + '/', build: { outDir: '../../docs-site/candidates/' + id, emptyOutDir: true } };
});
