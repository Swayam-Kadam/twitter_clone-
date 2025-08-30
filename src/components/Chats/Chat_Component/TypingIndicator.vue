<template>
  <div v-if="isTyping" class="flex justify-start mb-4 z-1">
    <div class="bg-white border border-gray-200 px-4 py-2 rounded-lg">
      <div class="flex space-x-1">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isTyping: Boolean
})
</script>