<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from './components/lib/supabaseClient'
import { ensureUserProfile } from './components/lib/ensureUserProfile'
import Navbar from './components/Navbar/NavbarPage.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'
import { useTheme } from './composables/useTheme'

const session = ref(null)
const loading = ref(true)
const router = useRouter()
const route = useRoute()
const { setThemeForRoute } = useTheme()

const setupProfileInBackground = (user) => {
  if (!user) return
  // Defer to avoid Supabase auth deadlock (never await inside onAuthStateChange)
  setTimeout(() => {
    ensureUserProfile(user).catch((err) =>
      console.error('Error ensuring user profile:', err)
    )
  }, 0)
}

const fetchSession = async () => {
  try {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    setupProfileInBackground(data.session?.user)
  } catch (error) {
    console.error('Error fetching session:', error)
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  router.push('/auth')
  window.location.reload()
}

watch(
  () => route.path,
  (path) => setThemeForRoute(path === '/auth'),
  { immediate: true }
)

onMounted(() => {
  fetchSession()

  supabase.auth.onAuthStateChange((event, newSession) => {
    session.value = newSession
    if (newSession?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      setupProfileInBackground(newSession.user)
    }
  })
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
