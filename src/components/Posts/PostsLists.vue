<template>
  <div v-if="isLoading">
    <LoadingSpinner />
  </div>

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

  <div v-else class="space-y-4 max-w-4xl mx-auto dark:bg-gray-800">
    <div v-if="posts.length === 0" class="p-4 text-center text-gray-500">
      <p>You haven't created any posts yet. Create your first post!</p>
    </div>
    <PostItem 
      v-for="post in posts" 
      :key="post.id"
      :post="post"
      :session="session"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../Profile/LoadingSpinner.vue';
import PostItem from '../Profile/PostItem.vue';

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const posts = ref([]);
const isLoading = ref(true);
const error = ref(null);
let postsSubscription = null;

const fetchPosts = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const { data, error: fetchError } = await supabase
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
      .order('created_at', { ascending: false });
    
    if (fetchError) throw fetchError;
    posts.value = data || [];
  } catch (err) {
    console.error('Error fetching posts:', err);
    error.value = err.message || 'Failed to load posts. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const setupRealtimeSubscription = () => {
  postsSubscription = supabase
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
            .single();
          
          if (data) {
            posts.value = [data, ...posts.value];
          }
        } else if (payload.eventType === 'DELETE') {
          posts.value = posts.value.filter(post => post.id !== payload.old.id);
        } else if (payload.eventType === 'UPDATE') {
          posts.value = posts.value.map(post => 
            post.id === payload.new.id ? { ...post, ...payload.new } : post
          );
        }
      }
    )
    .subscribe();
};

const handleDelete = async (postId) => {
  try {
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (deleteError) throw deleteError;
  } catch (err) {
    console.error('Error deleting post:', err);
    error.value = 'Failed to delete post. Please try again.';
  }
};

onMounted(async () => {
  await fetchPosts();
  setupRealtimeSubscription();
});

onUnmounted(() => {
  if (postsSubscription) {
    supabase.removeChannel(postsSubscription);
  }
});
</script>