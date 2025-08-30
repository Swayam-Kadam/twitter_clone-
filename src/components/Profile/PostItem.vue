<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
  post: Object,
  onDelete: Function,
  initialLikeStatus: {
    type: Boolean,
    default: false
  },
  session: Object
})

const isDeleting = ref(false)
const error = ref(null)
const isLiked = ref(props.initialLikeStatus)
const likeCount = ref(props.post.likes?.[0]?.count || 0)
const showComments = ref(false)
const comments = ref([])
const newComment = ref('')
const isCommenting = ref(false)

const checkLikeStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('post_id', props.post.id)
      .single()
    
    if (!error && data) {
      isLiked.value = true
    }
  } catch (error) {
    console.error('Error checking like status:', error)
  }
}

const fetchComments = async () => {
  try {
    const { data, error } = await supabase
      .from('replies')
      .select(`
        id,
        content,
        created_at,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', props.post.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    comments.value = data || []
  } catch (error) {
    console.error('Error fetching comments:', error)
    error.value = 'Failed to load comments'
  }
}

const handleCommentSubmit = async (e) => {
  e.preventDefault()
  if (!newComment.value.trim()) return
  
  try {
    isCommenting.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please sign in to comment')

    const { error } = await supabase
      .from('replies')
      .insert([{
        user_id: user.id,
        post_id: props.post.id,
        content: newComment.value
      }])
    
    if (error) throw error
    
    newComment.value = ''
    fetchComments()
  } catch (err) {
    console.error('Error adding comment:', err)
    error.value = err.message
  } finally {
    isCommenting.value = false
  }
}

const handleLike = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please sign in to like posts')

    if (isLiked.value) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', props.post.id)
      
      if (!error) {
        isLiked.value = false
        likeCount.value--
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert([{ 
          user_id: user.id, 
          post_id: props.post.id 
        }])
      
      if (!error) {
        isLiked.value = true
        likeCount.value++
      }
    }
  } catch (err) {
    console.error('Error updating like:', err)
    error.value = err.message
  }
}

const toggleComments = async () => {
  if (!showComments.value) {
    await fetchComments()
  }
  showComments.value = !showComments.value
}

// const handleDeleteClick = async () => {
//   if (window.confirm('Are you sure you want to delete this post?')) {
//     isDeleting.value = true
//     error.value = null
//     try {
//       await props.onDelete(props.post.id)
//     } catch (err) {
//       error.value = 'Failed to delete post'
//     } finally {
//       isDeleting.value = false
//     }
//   }
// }

const handleDeleteComment = async (commentId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please sign in to delete comments')

    const { data: comment, error: fetchError } = await supabase
      .from('replies')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (fetchError) throw fetchError
    if (comment.user_id !== user.id) {
      throw new Error("You can only delete your own comments")
    }

    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (err) {
    console.error('Error deleting comment:', err)
    error.value = err.message
  }
}

onMounted(() => {
  checkLikeStatus()
  fetchComments()
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex items-start space-x-3">
      <img 
        :src="post.profiles.avatar_url || '/default-avatar.png'" 
        :alt="post.profiles.username"
        class="w-10 h-10 rounded-full object-cover"
      />
      <div class="flex-1">
        <div class="flex items-center space-x-2">
          <span class="font-bold dark:text-white">
            {{ post.profiles.full_name || post.profiles.username }}
          </span>
          <span class="text-gray-500 text-sm">
            @{{ post.profiles.username }}
          </span>
          <span class="text-gray-400 text-sm">
             {{ formatDistanceToNow(new Date(post.created_at)), { addSuffix: true } }}
          </span>
        </div>
        
        <p class="mt-1 dark:text-gray-200">{{ post.content }}</p>
        
        <div v-if="post.image_url" class="mt-2">
          <img 
            :src="post.image_url" 
            alt="Post content" 
            class="max-h-80 rounded-md object-contain"
          />
        </div>
        
        <div class="mt-3 flex items-center space-x-4 text-gray-500">
          <button 
            @click="handleLike"
            :class="`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5" 
              :fill="isLiked ? 'currentColor' : 'none'" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
            <span>{{ likeCount }}</span>
          </button>
          
          <button 
            @click="toggleComments"
            class="flex items-center space-x-1 hover:text-blue-500"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            <span>{{ comments.length }}</span>
          </button>
          
          <!-- <button 
            v-if="post.profiles.id === session?.user?.id"
            @click="handleDeleteClick"
            :disabled="isDeleting"
            class="text-red-500 hover:text-red-700 ml-auto"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button> -->
        </div>
        
        <!-- Comment section -->
        <div v-if="showComments" class="mt-4 space-y-3">
          <form @submit="handleCommentSubmit" class="flex gap-2">
            <input
              type="text"
              v-model="newComment"
              @input="e => newComment = e.target.value"
              placeholder="Write a comment..."
              class="flex-1 p-2 w-1  border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              :disabled="isCommenting"
            />
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              :disabled="isCommenting || !newComment.trim()"
            >
              {{ isCommenting ? 'Posting...' : 'Post' }}
            </button>
          </form>
          
          <div class="space-y-3">
            <div v-for="comment in comments" :key="comment.id" class="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <img 
                :src="comment.profiles.avatar_url || '/default-avatar.png'" 
                :alt="comment.profiles.username"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-sm dark:text-white">
                    {{ comment.profiles.full_name || comment.profiles.username }}
                  </span>
                  <span class="text-gray-500 text-xs">
                    @{{ comment.profiles.username }}
                  </span>
                  <span class="text-gray-400 text-xs">
                    {{ formatDistanceToNow(new Date(comment.created_at)), { addSuffix: true } }}
                  </span>
                </div>
                <p class="text-sm mt-1 dark:text-gray-200">{{ comment.content }}</p>
              </div>
              <button 
                v-if="comment.profiles.id === session?.user?.id"
                @click="() => handleDeleteComment(comment.id)"
                class="text-red-500 hover:text-red-700 text-sm"
                title="Delete comment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="error" class="mt-2 text-red-500 text-sm">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>