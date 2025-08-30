<template>
  <div class="overflow-y-auto h-[calc(100vh-60px)]">
    <div v-for="followedUser in following" :key="followedUser.id"
      @click="$emit('select-user', followedUser)"
      :class="{
        'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 relative group': true,
        'bg-blue-50': activeChat && getOtherUser(activeChat) === followedUser.id
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
  </div>
</template>

<script setup>
defineProps({
  following: Array,
  onlineUsers: Array,
  activeChat: Object,
  getOtherUser: Function
})

defineEmits(['select-user'])
</script>