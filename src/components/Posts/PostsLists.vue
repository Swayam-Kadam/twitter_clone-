<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>

  <div v-else-if="error" class="app-card p-6 text-center">
    <Icon icon="mdi:alert-circle-outline" class="text-4xl text-red-400 mx-auto mb-3" />
    <p class="text-red-600 mb-4">{{ error }}</p>
    <button
      v-if="error === 'User not authenticated'"
      @click="supabase.auth.signIn()"
      class="btn-brand px-6 py-2 text-sm"
    >
      Sign In
    </button>
    <button
      v-else
      @click="window.location.reload()"
      class="btn-brand-outline px-6 py-2 text-sm"
    >
      Retry
    </button>
  </div>

  <div v-else>
    <div class="app-page-header flex items-center gap-3">
      <Icon icon="mdi:home-outline" class="text-2xl text-brand" />
      <div>
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Feed</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Latest posts from your network</p>
      </div>
    </div>

    <div v-if="posts.length === 0" class="app-card p-10 text-center">
      <Icon icon="mdi:post-outline" class="text-5xl text-brand/30 mx-auto mb-4" />
      <p class="text-gray-800 dark:text-gray-200 font-medium">No posts yet</p>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Visit your profile to create your first post!</p>
    </div>

    <div v-else class="space-y-3">
      <PostItem
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :session="session"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from '../Profile/LoadingSpinner.vue'
import PostItem from '../Profile/PostItem.vue'

const props = defineProps({
  session: { type: Object, required: true }
})

const posts = ref([])
const isLoading = ref(true)
const error = ref(null)
let postsSubscription = null

const fetchPosts = async () => {
  try {
    isLoading.value = true
    error.value = null
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select(`
        id, content, image_url, created_at,
        profiles (id, username, full_name, avatar_url),
        likes:likes(count)
      `)
      .order('created_at', { ascending: false })
    if (fetchError) throw fetchError
    posts.value = data || []
  } catch (err) {
    console.error('Error fetching posts:', err)
    error.value = err.message || 'Failed to load posts. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const setupRealtimeSubscription = () => {
  postsSubscription = supabase
    .channel('user_posts_changes')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'posts',
      filter: `user_id=eq.${supabase.auth.user?.id}`
    }, async (payload) => {
      if (payload.eventType === 'INSERT') {
        const { data } = await supabase.from('posts').select(`
          id, content, image_url, created_at,
          profiles (id, username, full_name, avatar_url),
          likes:likes(count)
        `).eq('id', payload.new.id).single()
        if (data) posts.value = [data, ...posts.value]
      } else if (payload.eventType === 'DELETE') {
        posts.value = posts.value.filter(post => post.id !== payload.old.id)
      } else if (payload.eventType === 'UPDATE') {
        posts.value = posts.value.map(post =>
          post.id === payload.new.id ? { ...post, ...payload.new } : post
        )
      }
    })
    .subscribe()
}

const handleDelete = async (postId) => {
  try {
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
    if (deleteError) throw deleteError
  } catch (err) {
    console.error('Error deleting post:', err)
    error.value = 'Failed to delete post. Please try again.'
  }
}

onMounted(async () => {
  await fetchPosts()
  setupRealtimeSubscription()
})

onUnmounted(() => {
  if (postsSubscription) supabase.removeChannel(postsSubscription)
})
</script>
