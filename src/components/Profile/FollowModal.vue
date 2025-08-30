<!-- FollowModal.vue -->
<script setup>
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'followers' or 'following'
  userId: String
})

const emit = defineEmits(['onClose'])
const users = ref([])
const isLoading = ref(false)

const fetchUsers = async () => {
  try {
    isLoading.value = true
    users.value = [] // Clear previous data
    
    let query
    
    if (props.type === 'followers') {
      // Get users who follow the profile user
      const { data: followerData, error: followerError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', props.userId)
      
      if (followerError) throw followerError
      
      const followerIds = followerData.map(item => item.follower_id)
      
      if (followerIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followerIds)
        
        if (usersError) throw usersError
        users.value = usersData
      }
    } else if (props.type === 'following') {
      // Get users that the profile user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', props.userId)
      
      if (followingError) throw followingError
      
      const followingIds = followingData.map(item => item.following_id)
      
      if (followingIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds)
        
        if (usersError) throw usersError
        users.value = usersData
      }
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for changes in modal type or userId
watch(() => props.type, () => {
  if (props.isOpen) {
    fetchUsers()
  }
})

watch(() => props.userId, () => {
  if (props.isOpen) {
    fetchUsers()
  }
})

// Fetch data when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchUsers()
  } else {
    // Clear data when modal closes
    users.value = []
  }
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="$emit('onClose')">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-96 overflow-hidden">
      <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold dark:text-white capitalize">{{ type }}</h2>
        <button 
          @click="$emit('onClose')"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
        >
          &times;
        </button>
      </div>
      
      <div class="overflow-y-auto max-h-80">
        <div v-if="isLoading" class="p-4 text-center">
          <p class="text-gray-500">Loading...</p>
        </div>
        
        <div v-else-if="users.length === 0" class="p-4 text-center">
          <p class="text-gray-500">No {{ type }} found.</p>
        </div>
        
        <div v-else>
          <div 
            v-for="user in users" 
            :key="user.id"
            class="p-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <img 
              :src="user.avatar_url || '/default-avatar.png'" 
              :alt="user.username"
              class="w-10 h-10 rounded-full object-cover mr-3"
            />
            <div>
              <p class="font-semibold dark:text-white">{{ user.full_name }}</p>
              <p class="text-gray-500">@{{ user.username }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>