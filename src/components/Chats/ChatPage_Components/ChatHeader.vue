<template>
  <div class="fixed w-full p-4 border-b border-gray-300 bg-white flex items-center justify-between">
    <div class="flex items-center">
      <div class="relative">
        <img
          :src="otherUser?.avatar_url || '/default-avatar.png'"
          :alt="otherUser?.username"
          class="w-10 h-10 rounded-full object-cover"
        />
        <div v-if="onlineUsers.includes(otherUserId)" class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      <div class="ml-3">
        <h3 class="font-semibold">
          {{ otherUser?.full_name || otherUser?.username }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ onlineUsers.includes(otherUserId) ? 'Online' : 'Offline' }}
          <span v-if="isTyping && typingUser === otherUserId" class="ml-2 text-blue-500">typing...</span>
        </p>
      </div>
    </div>
    <button
      @click="$emit('delete-chat', activeChat.id)"
      class="text-red-500 hover:text-red-700"
    >
      Delete Chat
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  user: Object,
  activeChat: Object,
  following: Array,
  onlineUsers: Array,
  isTyping: Boolean,
  typingUser: String,
});

const otherUserId = computed(() => props.activeChat.user1_id === props.user.id ? props.activeChat.user2_id : props.activeChat.user1_id);
const otherUser = computed(() => props.following.find(u => u.id === otherUserId.value));

defineEmits(['delete-chat']);
</script>