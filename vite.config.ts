import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
  ],
  server: {
    allowedHosts: true, 
  },
  base: './', // <--- NAH INI YANG PALING PENTING BUAT CLOUD STORAGE WOK!
})