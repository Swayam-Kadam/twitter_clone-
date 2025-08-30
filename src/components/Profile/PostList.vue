<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import LoadingSpinner from './LoadingSpinner.vue'
import PostItem from './PostItem.vue'

const props = defineProps({
  session: Object
})

const posts = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchPosts = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error: queryError } = await supabase
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (queryError) throw queryError
    posts.value = data || []
  } catch (err) {
    console.error('Error fetching posts:', err)
    error.value = err.message || 'Failed to load posts. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleDelete = async (postId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    if (error) throw error
  } catch (err) {
    console.error('Error deleting post:', err)
    error.value = 'Failed to delete post. Please try again.'
  }
}

onMounted(() => {
  fetchPosts()
  
  const postsSubscription = supabase
    .channel('user_posts_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `user_id=eq.${supabase.auth.user?.id}`
      },
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
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
            .eq('id', payload.new.id)
            .single()
          
          if (data) posts.value = [data, ...posts.value]
        } 
        else if (payload.eventType === 'DELETE') {
          posts.value = posts.value.filter(post => post.id !== payload.old.id)
        } 
        else if (payload.eventType === 'UPDATE') {
          posts.value = posts.value.map(post => 
            post.id === payload.new.id ? { ...post, ...payload.new } : post
          )
        }
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(postsSubscription)
  }
})
</script>

<template>
  <div class="space-y-4">
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
    
    <div v-else-if="posts.length === 0" class="p-4 text-center text-gray-500">
      <p>You haven't created any posts yet. Create your first post!</p>
    </div>
    
    <PostItem 
      v-else
      v-for="post in posts"
      :key="post.id" 
      :post="post"
      @onDelete="handleDelete"
      :session="session"
    />
  </div>
</template>