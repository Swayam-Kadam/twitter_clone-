<template>
  <div class="min-h-screen bg-gray-900" style="background-image: url('/bg.jpg')">
    <div class="max-w-4xl mx-auto border-x bg-gray-900 border-gray-800 min-h-screen">
      <!-- Profile Header -->
      <div class="sticky top-15 z-2 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-4 border-b border-gray-800 flex items-center">
        <router-link to="/" class="mr-6 p-1 rounded-full hover:bg-gray-800">
          
          <Icon icon="ion:arrow-back" class="text-xl text-white"/>
        </router-link>
        <div>
          <h1 class="font-bold text-xl text-white">{{ profile?.full_name || profile?.username }}</h1>
          <p class="text-gray-400 text-sm">{{ posts.length }} posts</p>
        </div>
      </div>

      <!-- Cover Photo -->
      <div class="h-48 bg-blue-500 relative">
        <!-- Cover photo placeholder -->
      </div>

      <!-- Profile Info -->
      <div class="px-4">
        <div class="flex justify-between items-end relative">
          <div class="absolute -top-16 border-4 border-white dark:border-gray-900 rounded-full">
            <img v-if="profile?.avatar_url" 
              :src="profile.avatar_url" 
              :alt="profile.username"
              class="w-32 h-32 rounded-full object-cover"
              @error="handleAvatarError"
            />
            <div v-else class="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-bold text-white">
              {{ profile?.username.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="ml-auto pt-4 flex space-x-2">
            <button v-if="session.user?.id !== userId"
              @click="handleFollow"
              :class="{
                'mt-4 px-4 py-2 rounded-full font-medium text-sm': true,
                'bg-white text-red-700 border border-gray-300 hover:bg-gray-100 cursor-pointer': isFollowing,
                'bg-white text-black cursor-pointer': !isFollowing
              }"
            >
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
          </div>
        </div>

        <div class="pt-20 pb-4">
          <h1 class="text-xl font-bold text-white">{{ profile?.full_name || profile?.username }}</h1>
          <p class="text-gray-400">@{{ profile?.username }}</p>
          
          <p v-if="profile?.bio" class="mt-3 text-white">{{ profile?.bio }}</p>
          
          <div class="flex flex-wrap gap-y-1 mt-3 text-gray-400 text-sm">
            <div v-if="profile?.website" class="flex items-center mr-4">
              <!-- <IoLinkOutline class="mr-1" /> -->
               <Icon icon="ion:link-outline" class="mr-1"/>
              <a 
                :href="profile.website.startsWith('http') ? profile.website : `https://${profile.website}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-400 hover:underline"
              >
                {{ profile.website.replace(/(^\w+:|^)\/\//, '') }}
              </a>
            </div>
            
            <div class="flex items-center">
              
              <Icon icon="ion:calendar-outline" class="mr-1"/>
              <span>Joined {{ formatDate(profile?.created_at) }}</span>
            </div>
          </div>

          <div class="flex mt-4 space-x-5"> 
            <div class="hover:underline cursor-pointer" @click="openFollowModal('following')">
              <span class="font-bold text-white">{{ profile?.following_count || 0 }}</span> 
              <span class="text-gray-400"> Following</span>
            </div>
            <div class="hover:underline cursor-pointer" @click="openFollowModal('followers')">
              <span class="font-bold text-white">{{ followersCount }}</span> 
              <span class="text-gray-400"> Followers</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Posts -->
      <div class="border-t border-gray-800 mt-2">
        <div v-if="loading" class="min-h-screen bg-gray-900">
          <div class="max-w-2xl mx-auto p-4 flex justify-center py-20">
            <div class="animate-pulse flex flex-col items-center">
              <div class="rounded-full h-24 w-24 bg-gray-700 mb-4"></div>
              <div class="h-6 bg-gray-700 rounded w-48 mb-2"></div>
              <div class="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>

        <div v-else-if="error" class="min-h-screen bg-gray-900">
          <div class="max-w-2xl mx-auto p-4 text-red-500">{{ error }}</div>
        </div>

        <div v-else-if="!profile" class="min-h-screen bg-gray-900">
          <div class="max-w-2xl mx-auto p-4 text-white">User not found</div>
        </div>

        <div v-else>
          <div v-if="posts.length === 0" class="p-8 text-center text-gray-400">
            <p class="text-xl font-bold">No posts yet</p>
            <p>When @{{ profile?.username }} posts, you'll see them here.</p>
          </div>

          <div v-else>
            <div v-for="post in posts" :key="post.id" class="p-4 border-b border-gray-800 hover:bg-gray-800/50 transition">
              <div class="flex space-x-3">
                <router-link :to="`/profile/${post.user_id}`" class="flex-shrink-0">
                  <img v-if="post.profiles.avatar_url"
                    :src="post.profiles.avatar_url" 
                    :alt="post.profiles.username"
                    class="w-12 h-12 rounded-full object-cover"
                    @error="handlePostAvatarError(post.profiles.username)"
                  />
                  <div v-else class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                    {{ post.profiles.username.charAt(0).toUpperCase() }}
                  </div>
                </router-link>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-1">
                    <router-link 
                      :to="`/profile/${post.user_id}`"
                      class="font-bold hover:underline truncate text-white"
                    >
                      {{ post.profiles.full_name || post.profiles.username }}
                    </router-link>
                    <span class="text-gray-400 truncate">@{{ post.profiles.username }}</span>
                    <span class="text-gray-400">·</span>
                    <span class="text-gray-400">
                      {{ formatDate(post.created_at) }}
                    </span>
                  </div>
                  
                  <p class="mt-1 mb-2 whitespace-pre-line text-white">{{ post.content }}</p>
                  
                  <img v-if="post.image_url"
                    :src="post.image_url" 
                    alt="Post content" 
                    class="mt-2 rounded-xl border border-gray-700 overflow-hidden w-full h-auto max-h-96 object-contain"
                  />
                  
                  <div class="flex gap-5 mt-3 text-gray-400 max-w-md">
                    <button 
                      @click="handleLike(post.id, post.isLiked)"
                      :class="{
                        'flex items-center space-x-1': true,
                        'text-red-500': post.isLiked,
                        'hover:text-red-500': !post.isLiked
                      }"
                    >
                      <Icon icon="ion:heart" v-if="post.isLiked" class="text-red-500"/>
                       <Icon icon="ion:heart-outline" v-else/>
                      <span>{{ post.like_count || 0 }}</span>
                    </button>

                    <button 
                      @click="toggleComments(post.id)"
                      class="flex items-center space-x-1 hover:text-blue-400"
                    >
                      
                      <Icon icon="ion:chatbubble-outline" />
                      <span>{{ post.reply_count || 0 }}</span>
                    </button>
                  </div>

                  <!-- Comment section under the post -->
                  <div v-if="post.showComments" class="mt-4 space-y-3">
                    <!-- Add comment form -->
                    <form v-if="session"
                      @submit.prevent="handleAddReplySubmit(post.id)"
                      class="flex gap-2"
                    >
                      <input
                        type="text"
                        v-model="replyText"
                        :name="`reply-${post.id}`"
                        placeholder="Write a reply..."
                        class="flex-1 p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 "
                      />
                      <button
                        type="submit"
                        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Reply
                      </button>
                    </form>

                    <!-- Replies list -->
                    <div class="space-y-3">
                      <div v-for="reply in post.replies" :key="reply.id" class="flex items-start space-x-3 p-3 bg-gray-800 rounded-md ">
                        <router-link 
                          :to="`/profile/${reply.user_id}`"
                          class="flex-shrink-0"
                        >
                          <img v-if="reply.profiles.avatar_url"
                            :src="reply.profiles.avatar_url" 
                            :alt="reply.profiles.username"
                            class="w-10 h-10 rounded-full object-cover"
                            @error="handleReplyAvatarError(reply.profiles.username)"
                          />
                          <div v-else class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                            {{ reply.profiles.username.charAt(0).toUpperCase() }}
                          </div>
                        </router-link>
                        
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center space-x-1">
                            <router-link 
                              :to="`/profile/${reply.user_id}`"
                              class="font-bold hover:underline truncate text-white"
                            >
                              {{ reply.profiles.full_name || reply.profiles.username }}
                            </router-link>
                            <span class="text-gray-400 truncate">@{{ reply.profiles.username }}</span>
                            <span class="text-gray-400">·</span>
                            <span class="text-gray-400">
                              {{ formatDate(reply.created_at) }}
                            </span>
                          </div>
                          <p class="mt-1 text-white">{{ reply.content }}</p>
                        </div>
                        <button v-if="reply.user_id === session?.user?.id"
                          @click="handleDeleteReply(post.id, reply.id)"
                          class="ml-auto text-red-500 hover:text-red-700"
                          title="Delete comment"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Add the FollowModal component at the end -->
    <FollowModal 
      :isOpen="isFollowModalOpen"
      :type="followModalType"
      :userId="profile?.id"
      @onClose="isFollowModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../components/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { Icon } from '@iconify/vue';
import FollowModal from './Profile/FollowModal.vue';

const route = useRoute();
const router = useRouter();
const userId = route.params.user_id;

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const profile = ref(null);
const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const isFollowing = ref(false);
const followersCount = ref(0);
// const replyInput = ref(null);
const replyText = ref('');

// Add these new reactive variables
const isFollowModalOpen = ref(false)
const followModalType = ref('followers') // 'followers' or 'following'

// Add this function to open the follow modal
const openFollowModal = (type) => {
  followModalType.value = type
  isFollowModalOpen.value = true
}

const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Unknown date';
    // Parse the date string first to ensure it's a valid date
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return format(date, 'MMMM yyyy');
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Invalid date';
  }
};

const handleAvatarError = (e) => {
  e.target.onerror = null;
  e.target.src = `https://ui-avatars.com/api/?name=${profile.value.username}&background=random`;
};

const handlePostAvatarError = (username) => {
  return (e) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${username}&background=random`;
  };
};

const handleReplyAvatarError = (username) => {
  return (e) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${username}&background=random`;
  };
};

const fetchProfileData = async () => {
  try {
    loading.value = true;
    
    // Fetch user profile with follower count
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        followers:follows!follows_following_id_fkey(count),
        following:follows!follows_follower_id_fkey(count)
      `)
      .eq('id', userId)
      .single();
      console.log(profileData)

    if (profileError) throw profileError;

    // Check if current user follows this profile
    if (props.session?.user?.id) {
      const { data: followData, error: followError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', props.session.user.id)
        .eq('following_id', userId)
        .single();

      if (!followError) {
        isFollowing.value = !!followData;
      }
    }

    // Set followers count from the query
    followersCount.value = profileData.followers?.[0]?.count || 0;
    const followingCount = profileData.following?.[0]?.count || 0;


    // Fetch user posts with author details and like status
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        ),
        likes!left(
          user_id
        ),
        replies:replies!left(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Enhance posts data with like status
    const enhancedPosts = postsData.map(post => ({
      ...post,
      isLiked: post.likes.some(like => like.user_id === props.session?.user?.id),
      like_count: post.likes?.length || 0,
      reply_count: post.replies?.[0]?.count || 0,
      showComments: false,
      replies: []
    }));

    // profile.value = profileData;
    // Add counts to profile data
    profile.value = {
      ...profileData,
      following_count: followingCount,
      followers_count: followersCount.value
    };
    posts.value = enhancedPosts;
    loading.value = false;
  } catch (err) {
    error.value = err.message;
    loading.value = false;
  }
};

const handleFollow = async () => {
  if (!props.session) {
    router.push('/login');
    return;
  }

  try {
    if (isFollowing.value) {
      // Unfollow
      const { error: followError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', props.session.user.id)
        .eq('following_id', userId);

      if (!followError) {
        isFollowing.value = false;
        followersCount.value--;
      }
    } else {
      // Follow
      const { error: followError } = await supabase
        .from('follows')
        .insert([
          { 
            follower_id: props.session.user.id, 
            following_id: userId 
          }
        ]);

      if (!followError) {
        isFollowing.value = true;
        followersCount.value++;
      }
    }
  } catch (err) {
    console.error('Error updating follow status:', err);
    error.value = err.message;
  }
};

const handleLike = async (postId, isCurrentlyLiked) => {
  if (!props.session) {
    router.push('/');
    return;
  }

  try {
    if (isCurrentlyLiked) {
      // Unlike the post
      const { error: likeError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', props.session.user.id)
        .eq('post_id', postId);

      if (likeError) throw likeError;
    } else {
      // Like the post
      const { error: likeError } = await supabase
        .from('likes')
        .insert([{
          user_id: props.session.user.id,
          post_id: postId
        }]);

      if (likeError) throw likeError;
    }

    // Update the UI
    posts.value = posts.value.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !isCurrentlyLiked,
          like_count: isCurrentlyLiked ? post.like_count - 1 : post.like_count + 1
        };
      }
      return post;
    });
  } catch (err) {
    console.error('Error toggling like:', err.message);
  }
};

const fetchReplies = async (postId) => {
  try {
    const { data, error: fetchError } = await supabase
      .from('replies')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    return data;
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    return [];
  }
};

const toggleComments = async (postId) => {
  const postIndex = posts.value.findIndex(p => p.id === postId);
  const post = posts.value[postIndex];
  const shouldShow = !post.showComments;

  // Create new array with updated post
  const updatedPosts = [...posts.value];
  updatedPosts[postIndex] = {
    ...post,
    showComments: shouldShow
  };

  // If showing and no replies loaded yet, fetch them
  if (shouldShow && post.replies.length === 0) {
    try {
      const replies = await fetchReplies(postId);
      updatedPosts[postIndex] = {
        ...updatedPosts[postIndex],
        replies
      };
      posts.value = updatedPosts;
    } catch (err) {
      console.error('Error loading replies:', err);
      updatedPosts[postIndex] = {
        ...updatedPosts[postIndex]
      };
      posts.value = updatedPosts;
    }
  } else {
    posts.value = updatedPosts;
  }
};

const handleAddReplySubmit = async (postId) => {
  if (!replyText.value.trim()) return;

  try {
    const { data, error: replyError } = await supabase
      .from('replies')
      .insert([{
        user_id: props.session.user.id,
        post_id: postId,
        content: replyText.value.trim() // Use the reactive value
      }])
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `);

    if (replyError) throw replyError;

    // Update the UI
    posts.value = posts.value.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: [data[0], ...post.replies],
          reply_count: (post.reply_count || 0) + 1
        };
      }
      return post;
    });

    // Clear the input
    replyText.value = '';
  } catch (err) {
    console.error('Error adding reply:', err.message);
    // You might want to show this error to the user
    error.value = 'Failed to add reply. Please try again.';
  }
};

const handleDeleteReply = async (postId, replyId) => {
  try {
    // Check if the reply belongs to the current user
    const { data: reply, error: fetchError } = await supabase
      .from('replies')
      .select('user_id')
      .eq('id', replyId)
      .single();

    if (fetchError) throw fetchError;
    if (reply.user_id !== props.session.user.id) {
      throw new Error("You can only delete your own comments");
    }

    // Delete the reply
    const { error: deleteError } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId);

    if (deleteError) throw deleteError;

    // Update the UI
    posts.value = posts.value.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: post.replies.filter(reply => reply.id !== replyId),
          reply_count: post.reply_count - 1
        };
      }
      return post;
    });
  } catch (err) {
    console.error('Error deleting reply:', err.message);
  }
};

onMounted(() => {
  fetchProfileData();
});
</script>