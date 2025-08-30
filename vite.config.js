import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),tailwindcss(),
    Components({
      resolvers: IconsResolver({
        prefix: 'icon',
        enabledCollections: ['mdi', 'fa6-solid']
      }),
    }),
    Icons({ 
      compiler: 'vue3',
      autoInstall: true,
      scale: 1.2, // optional
      defaultClass: 'inline-block' //optional
    }),
  ],
})
