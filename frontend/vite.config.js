import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 외부 IP에서 접근 가능
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
})
