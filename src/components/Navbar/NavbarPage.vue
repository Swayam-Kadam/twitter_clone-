<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../lib/supabaseClient'
import { useTheme } from '../../composables/useTheme'
import chatflowIcon from '../../assets/chatflow-icon.svg'
import chatflowLogo from '../../assets/chatflow-logo.svg'

const props = defineProps({
  logout: { type: Function, required: true }
})

const { theme, toggleTheme } = useTheme()

const route = useRoute()
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const reload = () => {
  showResults.value = false
  setTimeout(() => location.reload(), 50)
}

watch(searchQuery, (newQuery) => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  if (!newQuery.trim()) {
    searchResults.value = []
    showResults.value = false
    return
  }
  isSearching.value = true
  showResults.value = true
  searchTimeout.value = setTimeout(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${newQuery}%,full_name.ilike.%${newQuery}%`)
        .limit(10)
      if (error) throw error
      searchResults.value = data || []
    } catch (error) {
      console.error('Error searching:', error.message)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
})

const closeResults = () => {
  setTimeout(() => { showResults.value = false }, 200)
}

const handleSearch = async (e) => {
  e.preventDefault()
  if (!searchQuery.value.trim()) return
  try {
    isSearching.value = true
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${searchQuery.value}%,full_name.ilike.%${searchQuery.value}%`)
      .limit(10)
    if (error) throw error
    searchResults.value = data || []
    showResults.value = true
  } catch (error) {
    console.error('Error searching:', error.message)
  } finally {
    isSearching.value = false
  }
}

onMounted(() => {
  return () => {
    if (searchTimeout.value) clearTimeout(searchTimeout.value)
  }
})
</script>

<template>
  <nav class="chat-header-bar sticky top-0 z-50 shadow-md">
    <div class="max-w-5xl mx-auto flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5">

      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 shrink-0 mr-1 group">
        <img
          :src="chatflowIcon"
          alt="ChatFlow"
          class="w-9 h-9 rounded-xl shadow-sm ring-2 ring-white/20 group-hover:ring-white/40 transition-all"
        />

      </router-link>

      <!-- Nav links -->
      <div class="flex items-center gap-1">
        <router-link
          to="/"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            isActive('/') && route.path === '/'
              ? 'bg-white/25 text-white'
              : 'text-white/75 hover:bg-white/15 hover:text-white',
          ]"
        >
          <Icon icon="mdi:home-outline" class="text-lg" />
          <span class="hidden md:inline">Feed</span>
        </router-link>

        <router-link
          to="/chat"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            isActive('/chat')
              ? 'bg-white/25 text-white'
              : 'text-white/75 hover:bg-white/15 hover:text-white',
          ]"
        >
          <Icon icon="mdi:message-text-outline" class="text-lg" />
          <span class="hidden md:inline">Chats</span>
        </router-link>

        <router-link
          to="/profile"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            isActive('/profile') && !route.params.user_id
              ? 'bg-white/25 text-white'
              : 'text-white/75 hover:bg-white/15 hover:text-white',
          ]"
        >
          <Icon icon="mdi:account-outline" class="text-lg" />
          <span class="hidden md:inline">Profile</span>
        </router-link>
      </div>

      <!-- Search -->
      <div class="relative flex-1 max-w-xs ml-auto">
        <form @submit="handleSearch" class="relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-lg pointer-events-none" />
          <input
            type="text"
            placeholder="Search people..."
            v-model="searchQuery"
            class="w-full py-1.5 pl-9 pr-4 rounded-full bg-white/15 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/25 focus:border-white/40 transition-all"
            @focus="searchQuery && (showResults = true)"
            @blur="closeResults"
          />
        </form>

        <div
          v-if="showResults && (searchResults.length > 0 || searchQuery.trim())"
          class="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1f2c34] rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-auto"
        >
          <div v-if="isSearching" class="px-4 py-3 text-gray-400 text-sm text-center flex items-center justify-center gap-2">
            <Icon icon="mdi:loading" class="animate-spin" />
            Searching...
          </div>
          <div v-else-if="searchResults.length === 0 && searchQuery.trim()" class="px-4 py-3 text-gray-400 text-sm text-center">
            No users found
          </div>
          <router-link
            v-for="user in searchResults"
            :key="user.id"
            :to="`/profile/${user.id}`"
            class="flex items-center px-4 py-2.5 hover:bg-brand/5 transition-colors"
            @click="reload"
          >
            <img
              v-if="user.avatar_url"
              :src="user.avatar_url"
              class="w-9 h-9 rounded-full mr-3 object-cover"
              :alt="user.username"
            />
            <div v-else class="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center mr-3 text-brand font-semibold text-sm">
              {{ user.username?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{{ user.username }}</div>
              <div v-if="user.full_name" class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ user.full_name }}</div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Theme toggle -->
      <button
        @click="toggleTheme"
        class="shrink-0 p-2 rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-all"
        :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Icon :icon="theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'" class="text-xl" />
      </button>

      <!-- Logout -->
      <button
        @click="props.logout"
        class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-all text-sm"
        title="Logout"
      >
        <Icon icon="mdi:logout" class="text-lg" />
        <span class="hidden sm:inline">Logout</span>
      </button>
    </div>
  </nav>
</template>
