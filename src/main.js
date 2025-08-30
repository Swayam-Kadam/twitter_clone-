import { createApp } from 'vue'
import './style.css'
import router from './components/Navbar/index'
import App from './App.vue'
import VueToast from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'

const app = createApp(App)

app.use(router)
app.use(VueToast)
app.mount('#app')
