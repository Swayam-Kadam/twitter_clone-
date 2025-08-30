<template>
  <div class="p-4 border-b border-gray-300 flex justify-between items-center">
    <h2 class="text-xl font-bold">Messages</h2>
  </div>
  <div class="overflow-y-auto h-[calc(100vh-60px)]">
    <div v-for="followedUser in following" :key="followedUser.id"
      @click="$emit('select-user', followedUser)"
      :class="{
        'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 relative group': true,
        'bg-blue-50': activeChat && (activeChat.user1_id === followedUser.id || activeChat.user2_id === followedUser.id)
      }"
    >
      <div class="flex items-center">
        <div class="relative">
          <img
            :src="followedUser.avatar_url || '/default-avatar.png'"
            :alt="followedUser.username"
            class="w-12 h-12 rounded-full object-cover"
          />
          <div v-if="onlineUsers.includes(followedUser.id)" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div class="ml-3 flex-1">
          <div class="flex justify-between items-start">
            <h3 class="font-semibold">{{ followedUser.full_name || followedUser.username }}</h3>
          </div>
          <p class="text-sm text-gray-500">
            {{ onlineUsers.includes(followedUser.id) ? 'Online' : 'Offline' }}
          </p>
        </div>
      </div>
    </div>
    <GroupList 
      :user="user" 
      :active-group="activeGroup"
      @select-group="$emit('select-group', $event)"
    />
  </div>
</template>

<script setup>
import GroupList from '../GroupList.vue';

defineProps({
  following: Array,
  onlineUsers: Array,
  user: Object,
  activeChat: Object,
  activeGroup: Object,
});

defineEmits(['select-user', 'select-group']);
</script>