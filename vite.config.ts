import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import path from 'path';

// https://vite.dev/config/ - Touched to force invalidation of Vite cache
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|react-router-dom|@tanstack|zustand)/,
            },
            {
              name: 'vendor-lexical',
              test: /node_modules\/@lexical|node_modules\/lexical/,
            },
            {
              name: 'vendor-katex',
              test: /node_modules\/(katex|lowlight)/,
            },
            {
              name: 'vendor-emoji',
              test: /node_modules\/emoji-picker-react/,
            },
            {
              name: 'vendor-icons-a-d',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[A-Da-d]/,
            },
            {
              name: 'vendor-icons-e-h',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[E-He-h]/,
            },
            {
              name: 'vendor-icons-i-l',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[I-Li-l]/,
            },
            {
              name: 'vendor-icons-m-p',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[M-Pm-p]/,
            },
            {
              name: 'vendor-icons-q-t',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[Q-Tq-t]/,
            },
            {
              name: 'vendor-icons-u-z',
              test: /node_modules\/@phosphor-icons\/react\/dist\/csr\/[U-Zu-z]/,
            },
            {
              name: 'vendor-icons-other',
              test: /node_modules\/(@phosphor-icons|phosphor-react)/,
            },
            {
              name: 'vendor-animation',
              test: /node_modules\/(framer-motion|gsap|motion)/,
            },
            {
              name: 'vendor-dnd',
              test: /node_modules\/@dnd-kit/,
            },
          ],
        },
      },
    },
  },
})
