<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './components/lib/supabaseClient'
import Navbar from './components/Navbar/NavbarPage.vue'
import Posts from './components/Posts/Posts.vue'
import Profile from './components/Profile/Profile.vue'
import AuthPage from './components/Auth/AuthPage.vue'
import UserProfile from './components/UserProfile.vue'
import ChatPage from './components/Chats/ChatPage.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'

const session = ref(null)
const loading = ref(true)
const router = useRouter()

const fetchSession = async () => {
  try {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
  } catch (error) {
    console.error("Error fetching session:", error)
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
  window.location.reload()
}

onMounted(() => {
  fetchSession()
})
</script>

<template>
  <template v-if="loading">
    <LoadingSpinner />
  </template>
  <template v-else>
    <Navbar v-if="session" :logout="logout" />
    <RouterView :session="session" />
  </template>
</template>