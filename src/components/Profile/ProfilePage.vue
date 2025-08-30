<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from './LoadingSpinner.vue'
import PostModal from './PostModal.vue'
import PostList from './PostList.vue'
import LikedPost from './LikedPost.vue'
import RepliesPosts from './RepliesPosts.vue'
import FollowModal from './FollowModal.vue'

const props = defineProps({
  session: Object
})

const route = useRoute()
const profile = ref(null)
const isLoading = ref(true)
const isFollowing = ref(false)
const activeTab = ref('posts')
const isEditModalOpen = ref(false)
const isPostModalOpen = ref(false)
const editForm = ref({
  full_name: '',
  username: '',
  bio: '',
  location: '',
  website: '',
  avatar_url: ''
})
const avatarFile = ref(null)
const isUploading = ref(false)

const fetchProfile = async () => {
  try {
    isLoading.value = true
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      console.log('No authenticated user')
      isLoading.value = false
      return
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        followers:follows!follows_following_id_fkey(count),
        following:follows!follows_follower_id_fkey(count)
      `)
      .eq('id', data.session.user.id)
      .single()

    if (profileError) throw profileError

    profile.value = {
      ...profileData,
      followers_count: profileData.followers[0]?.count || 0,
      following_count: profileData.following[0]?.count || 0
    }

    if (data.session.user) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', data.session.user.id)
        .eq('following_id', profileData.id)
      
      if (!followError) {
        isFollowing.value = followData.length > 0
      }
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

const handleFollow = async () => {
  const { data } = await supabase.auth.getSession()
  if (!data.session.user) return
  
  try {
    if (isFollowing.value) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', data.session.user.id)
        .eq('following_id', profile.value.id)
      
      if (!error) {
        isFollowing.value = false
        fetchProfile()
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([
          { 
            follower_id: data.session.user.id, 
            following_id: profile.value.id 
          }
        ])
      
      if (!error) {
        isFollowing.value = true
        fetchProfile()
      }
    }
  } catch (error) {
    console.error('Error updating follow status:', error)
  }
}

const handleEditProfile = () => {
  editForm.value = {
    full_name: profile.value.full_name || '',
    username: profile.value.username || '',
    bio: profile.value.bio || '',
    location: profile.value.location || '',
    website: profile.value.website || '',
    avatar_url: profile.value.avatar_url || ''
  }
  isEditModalOpen.value = true
}

const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    avatarFile.value = e.target.files[0]
    editForm.value.avatar_url = URL.createObjectURL(e.target.files[0])
  }
}

const handleInputChange = (e) => {
  const { name, value } = e.target
  editForm.value = {
    ...editForm.value,
    [name]: value
  }
}

const handleSubmit = async (e) => {
  e.preventDefault()
  isUploading.value = true
  
  try {
    let avatarUrl = editForm.value.avatar_url

    if (avatarFile.value) {
      const { data } = await supabase.auth.getSession()
      const fileExt = avatarFile.value.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${data.session.user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile.value, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      avatarUrl = publicUrl
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.value.full_name,
        username: editForm.value.username,
        bio: editForm.value.bio,
        location: editForm.value.location,
        website: editForm.value.website,
        avatar_url: avatarUrl
      })
      .eq('id', profile.value.id)
      .single()

    if (error) throw error

    fetchProfile()
    isEditModalOpen.value = false
    
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    isUploading.value = false
  }
}

const handlePostCreated = (newPost) => {
  console.log('New post created:', newPost)
}

// Add these new reactive variables
const isFollowModalOpen = ref(false)
const followModalType = ref('followers') // 'followers' or 'following'

// Add this function to open the follow modal
const openFollowModal = (type) => {
  followModalType.value = type
  isFollowModalOpen.value = true
}
</script>

<template>
  <div class="max-w-4xl mx-auto bg-white dark:bg-gray-900 min-h-screen">
    <!-- Loading State -->
    <LoadingSpinner v-if="isLoading" />
    
    <!-- Profile Content -->
    <template v-else-if="profile">
      <!-- Profile Header -->
      <div class="relative">
        <div class="h-48 bg-blue-500 w-full"></div>
        
        <div class="px-4">
          <div class="flex justify-between items-end relative">
            <div class="absolute -top-16 border-4 border-white dark:border-gray-900 rounded-full">
              <img 
                :src="profile.avatar_url || '/default-avatar.png'" 
                :alt="profile.username"
                class="w-32 h-32 rounded-full object-cover"
              />
            </div>
            
            <div class="ml-auto pt-4 flex space-x-2">
              <button
                @click="handleEditProfile"
                class="px-4 py-2 rounded-full font-bold text-sm bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer" 
              >
                Edit Profile
              </button>
              
              <!-- <button
                @click="handleFollow"
                :class="`px-4 py-2 rounded-full font-bold text-sm ${isFollowing 
                  ? 'bg-white border border-gray-300 hover:border-red-300 text-red-500 cursor-pointer' 
                  : 'bg-white text-red dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer'
                }`"
              >
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button> -->

              <button 
                @click="isPostModalOpen = true"
                class="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        <!-- Profile Info -->
        <div class="px-4 pt-6 pb-4">
          <h1 class="text-xl font-bold dark:text-white">{{ profile.full_name }}</h1>
          <p class="text-gray-500">@{{ profile.username }}</p>
          
          <p class="mt-3 dark:text-gray-300">{{ profile.bio || 'No bio yet.' }}</p>
          
          <div class="flex-row md:flex items-center mt-3 text-gray-500 space-x-4">
            <div v-if="profile.location" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{{ profile.location }}</span>
            </div>
            
            <div v-if="profile.website" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a :href="profile.website" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
                {{ profile.website }}
              </a>
            </div>
            
            <div class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Joined {{ new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}</span>
            </div>
          </div>
          
          <div class="flex mt-4 space-x-5">
            <div class="flex items-center cursor-pointer" @click="openFollowModal('following')">
              <span class="font-bold dark:text-white">{{ profile.following_count || 0 }}</span>
              <span class="ml-1 text-gray-500">Following</span>
            </div>
            <div class="flex items-center cursor-pointer" @click="openFollowModal('followers')">
              <span class="font-bold dark:text-white">{{ profile.followers_count || 0 }}</span>
              <span class="ml-1 text-gray-500">Followers</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'posts'"
            :class="`px-4 py-3 text-sm font-medium ${activeTab === 'posts' 
              ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`"
          >
            Posts
          </button>
          <button
            @click="activeTab = 'replies'"
            :class="`px-4 py-3 text-sm font-medium ${activeTab === 'replies' 
              ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`"
          >
            Replies
          </button>
          <button
            @click="activeTab = 'likes'"
            :class="`px-4 py-3 text-sm font-medium ${activeTab === 'likes' 
              ? 'border-b-2 border-blue-500 text-blue-500 dark:text-blue-400' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`"
          >
            Likes
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-if="activeTab === 'posts'" class="p-4">
          <PostList :session="session" />
        </div>
        <div v-if="activeTab === 'replies'" class="p-4">
          <RepliesPosts :session="session" />
        </div>
        <div v-if="activeTab === 'likes'" class="p-4">
          <LikedPost :session="session" />
        </div>
      </div>
    </template>
    
    <!-- No Profile State -->
    <div v-else class="flex items-center justify-center h-64">
      <p class="text-gray-500">Creating your profile...</p>
      <button
                @click="handleEditProfile"
                class="px-4 py-2 rounded-full font-bold text-sm bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 cursor-pointer" 
              >
                Edit Profile
              </button>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold dark:text-white">Edit Profile</h2>
          <button 
            @click="isEditModalOpen = false"
            class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>
        
        <form @submit="handleSubmit">
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Avatar</label>
            <div class="flex items-center space-x-4">
              <img 
                :src="editForm.avatar_url || '/default-avatar.png'" 
                alt="Avatar preview"
                class="w-16 h-16 rounded-full object-cover"
              />
              <input
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              name="full_name"
              v-model="editForm.full_name"
              @input="handleInputChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              name="username"
              v-model="editForm.username"
              @input="handleInputChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Bio</label>
            <textarea
              name="bio"
              v-model="editForm.bio"
              @input="handleInputChange"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Location</label>
            <input
              type="text"
              name="location"
              v-model="editForm.location"
              @input="handleInputChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-gray-700 dark:text-gray-300 mb-2">Website</label>
            <input
              type="url"
              name="website"
              v-model="editForm.website"
              @input="handleInputChange"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="isEditModalOpen = false"
              class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isUploading"
              class="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {{ isUploading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Post Modal -->
    <PostModal 
      :isOpen="isPostModalOpen"
      @onClose="isPostModalOpen = false"
      @onPostCreated="handlePostCreated"
    />

    <FollowModal 
      :isOpen="isFollowModalOpen"
      :type="followModalType"
      :userId="profile?.id"
      @onClose="isFollowModalOpen = false"
    />
  </div>
</template>