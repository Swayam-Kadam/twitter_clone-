<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from './LoadingSpinner.vue'
import PostItem from './PostItem.vue'

const props = defineProps({
  session: Object
})

const likedPosts = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchLikedPosts = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const { data } = await supabase.auth.getSession()
    if (!data) {
      throw new Error('User not authenticated')
    }

    const { data: likesData, error: likesError } = await supabase
      .from('replies')
      .select('post_id')
      .eq('user_id', data.session.user.id)
    
    if (likesError) throw likesError
    
    if (!likesData || likesData.length === 0) {
      likedPosts.value = []
      return
    }

    const postIds = likesData.map(like => like.post_id)

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        image_url,
        created_at,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        ),
        likes:likes(count)
      `)
      .in('id', postIds)
      .order('created_at', { ascending: false })
    
    if (postsError) throw postsError
    
    const postsWithLikeStatus = postsData.map(post => ({
      ...post,
      isLikedByUser: true
    }))
    
    likedPosts.value = postsWithLikeStatus || []
  } catch (err) {
    console.error('Error fetching liked posts:', err)
    error.value = err.message || 'Failed to load liked posts. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLikedPosts()
})
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6 dark:text-white">Your Replies Posts</h1>
    
    <LoadingSpinner v-if="isLoading" />
    
    <div v-else-if="error" class="p-4 text-center text-red-500">
      <p>{{ error }}</p>
      <button 
        v-if="error === 'User not authenticated'"
        @click="supabase.auth.signIn()"
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Sign In
      </button>
      <button 
        v-else
        @click="window.location.reload()"
        class="mt-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
      >
        Retry
      </button>
    </div>
    
    <div v-else-if="likedPosts.length === 0" class="p-4 text-center text-gray-500">
      <p>You haven't replied to any posts yet.</p>
    </div>
    
    <div v-else class="space-y-4">
      <PostItem 
        v-for="post in likedPosts"
        :key="post.id" 
        :post="post"
        :initialLikeStatus="true"
        :session="session"
      />
    </div>
  </div>
</template>