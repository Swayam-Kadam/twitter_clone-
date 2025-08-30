<template>
  <div
    class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
    :class="{
      'bg-blue-400 text-white': isOwnMessage,
      'bg-white border border-gray-200': !isOwnMessage
    }"
  >
    <div v-if="message.image_url" class="mb-2">
      <img 
        :src="message.image_url" 
        alt="Chat image" 
        class="max-w-full max-h-64 rounded-lg"
      />
    </div>
    <p v-if="message.content">{{ message.content }}</p>
  
    <p class="text-xs mt-1 flex"
      :class="{
        'text-blue-100': isOwnMessage,
        'text-gray-500': !isOwnMessage
      }"
    >
      {{ formatTime(message.created_at) }}
      <span v-if="isOwnMessage" class="ml-1">
        <Icon 
          v-if="!message.delivered_at" 
          icon="mdi:check" 
          class="w-3 h-3" 
        />
        <Icon 
          v-else-if="message.delivered_at && !message.read_at" 
          icon="mdi:check-all" 
          class="w-3 h-3" 
        />
        <Icon 
          v-else-if="message.read_at" 
          icon="mdi:check-all" 
          class="w-3 h-3 text-blue-800" 
        />
      </span>
      <button v-if="isOwnMessage"
        @click.stop="$emit('delete-message', message.id)"
        class="text-red-500 hover:text-red-700 ml-1 transition-opacity cursor-pointer z-[-1rem] hover:bg-white rounded"
      >
        <Icon icon="mdi:delete" width="15" height="15" />
      </button>
    </p>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  message: Object,
  isOwnMessage: Boolean
})

defineEmits(['delete-message'])

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>