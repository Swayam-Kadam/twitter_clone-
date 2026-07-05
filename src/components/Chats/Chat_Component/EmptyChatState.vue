<template>
  <div class="flex-1 flex items-center justify-center chat-wallpaper-panel">
    <div class="text-center px-6">
      <div class="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
        <Icon icon="mdi:message-text-outline" class="text-4xl text-brand" />
      </div>
      <h3 class="text-xl font-semibold text-gray-700">ChatFlow Web</h3>
      <p class="text-gray-400 text-sm mt-2">Select a conversation to start messaging</p>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
</script>
