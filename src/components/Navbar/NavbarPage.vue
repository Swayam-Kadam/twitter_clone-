<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue';
import { supabase } from '../lib/supabaseClient'

// Import icons directly (alternative approach)
import IconHome from '~icons/mdi/home'
import IconUser from '~icons/fa6-solid/user'
import IconChat from '~icons/mdi/chat'
import IconSearch from '~icons/mdi/magnify'

const props = defineProps({
  logout: { type: Function, required: true }
})

const router = useRouter()
const searchQuery = ref('')
const searchResults = ref([])
const showResults = ref(false)
const isSearching = ref(false)
const searchTimeout = ref(null)

const reload = () => {
  showResults.value = false; // Your existing code
  setTimeout(() => {
    location.reload(); // Add reload
  }, 50);
};

// Watch for search query changes
watch(searchQuery, (newQuery) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  if (!newQuery.trim()) {
    searchResults.value = []
    showResults.value = false
    return
  }

  isSearching.value = true
  showResults.value = true

  // Debounce search to avoid too many API calls
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
  }, 300) // 300ms debounce
})

// Close results when clicking outside
const closeResults = () => {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

// Handle manual search (if still needed)
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

// Clear timeout on component unmount
onMounted(() => {
  return () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }
  }
})
</script>

<template>
  <div class='border-b border-gray-200 bg-white sticky top-0 z-10' style="background-image: url('/bg.jpg')">
    <div class='flex max-w-4xl mx-auto justify-between items-center p-2'>
      <div class='flex items-center space-x-2 md:space-x-6'>
        <router-link 
          to='/' 
          class='p-2 text-lg md:text-xl  text-gray-200 bg-blue-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200'
        >
          <IconHome />
        </router-link>

        <router-link 
          to='/profile' 
          class='p-2 text-lg md:text-xl  text-gray-200 bg-blue-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200'
        >
          <IconUser />
        </router-link>
        <router-link
          to='/chat'
          class='p-2 text-lg md:text-xl text-gray-200 bg-blue-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200'>
          <IconChat />  
        </router-link>
      </div>

      <!-- Search Bar -->
      <div class="relative flex-1 max-w-md mx-4">
        <form @submit="handleSearch" class="relative">
          <input
            type="text"
            placeholder="Search accounts..."
            v-model="searchQuery"
            class="w-full py-2 px-4 pr-10 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            @focus="searchQuery && (showResults = true)"
            @blur="closeResults"
          />
          <button
            type="submit"
            class="absolute right-3 top-2.5 text-white hover:text-blue-500"
          >
            <IconSearch width="20" />
          </button>
        </form>

        <!-- Search Results Dropdown -->
        <div
          v-if="showResults && (searchResults.length > 0 || searchQuery.trim())" 
          class="absolute z-30 w-full mt-1 bg-white rounded-md shadow-lg border min-w-[10.5rem] border-gray-200 max-h-60 overflow-auto"
        >
          <!-- Loading state -->
          <div v-if="isSearching" class="px-4 py-2 text-gray-500 text-center">
            Searching...
          </div>

          <!-- No results state -->
          <div v-else-if="searchResults.length === 0 && searchQuery.trim()" class="px-4 py-2 text-gray-500 text-center">
            No users found
          </div>

          <!-- Results -->
          <router-link
            v-for="user in searchResults"
            :key="user.id"
            :to="`/profile/${user.id}`"
            class="flex items-center px-4 py-2 hover:bg-blue-50 text-gray-800 hover:text-blue-600"
             @click="reload"
          >
            <!-- Avatar (if available) -->
            <img
              v-if="user.avatar_url" 
              :src="user.avatar_url"
              class="w-8 h-8 rounded-full mr-3"
              :alt="user.username"
            />
            <div class="flex-1">
              <div class="font-medium  text-[0.8rem] sm:text-[1rem]">{{ user.username }}</div>
              <div v-if="user.full_name" class="text-[0.6rem] sm:text-[0.9rem] text-gray-500">{{ user.full_name }}</div>
            </div>
          </router-link>
        </div>
      </div>

      <div class='flex items-center space-x-4'>
        <!-- <button 
          @click="props.logout" 
          class='bg-red-500 px-4 py-2 text-sm sm:text-lg rounded-full text-white hover:bg-red-600 cursor-pointer transition-colors duration-200 font-medium'
        >
          Logout

        </button> -->
      
        <div class='flex items-center space-x-4'>
  <!-- Mobile: Icon only -->
  <button 
    @click="props.logout" 
    class='bg-red-500 p-2 rounded-full text-white hover:bg-red-600 cursor-pointer transition-colors duration-200 sm:hidden'
  >
    <Icon icon="mdi:logout" class="w-5 h-5" />
  </button>
  
  <!-- Desktop: Text with icon -->
  <button 
    @click="props.logout" 
    class='bg-red-500 px-4 py-2 text-sm sm:text-lg rounded-full text-white hover:bg-red-600 cursor-pointer transition-colors duration-200 font-medium hidden sm:flex items-center space-x-2'
  >
    <span>Logout</span>
    
  </button>
</div>
      </div>
    </div>
  </div>
</template>