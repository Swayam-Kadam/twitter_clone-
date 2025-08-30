<template>
  <div class="p-4 border-t border-gray-300 bg-white relative">
    <div v-if="imagePreview" class="mb-2 relative">
      <img 
        :src="imagePreview" 
        alt="Preview" 
        class="max-w-full max-h-32 rounded-lg"
      />
      <button
        @click="$emit('clear-image-preview')"
        class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
      >
        <Icon icon="mdi:close" class="w-4 h-4" />
      </button>
    </div>
    <div class="flex">
      <div class="relative flex-1" ref="emojiPickerRef">
        <button
          @click.stop="$emit('toggle-emoji-picker')"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <Icon icon="mdi:emoticon" class="w-5 h-5" />
        </button>

        <button
          @click="$emit('remove-last-character')"
          class="absolute right-24 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          :disabled="!message.length"
        >
          <Icon icon="mdi:backspace-outline" class="w-5 h-5" />
        </button>

        <button
          @click="$emit('trigger-file-input')"
          class="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <Icon icon="mdi:attachment" class="w-5 h-5" />
        </button>

        <div v-if="showEmojiPicker" class="absolute bottom-12 left-0 z-50">
          <Vue3EmojiPicker
            native
            disable-skin-tones
            @select="$emit('emoji-selected', $event)"
          />
        </div>

        <input
          type="text"
          :value="message"
          @input="$emit('update:message', $event.target.value)"
          @keypress.enter="$emit('send-message')"
          :placeholder="placeholder"
          class="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        @click="$emit('send-message')"
        :disabled="(!message.trim() && !hasFile) || uploading"
        class="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
      >
        <template v-if="uploading">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Sending...
        </template>
        <template v-else>
          Send
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import Vue3EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

defineProps({
  message: String,
  uploading: Boolean,
  hasFile: Boolean,
  imagePreview: String,
  showEmojiPicker: Boolean,
  placeholder: {
    type: String,
    default: 'Type a message...'
  }
})

defineEmits([
  'update:message',
  'send-message',
  'toggle-emoji-picker',
  'emoji-selected',
  'remove-last-character',
  'trigger-file-input',
  'clear-image-preview'
])
</script>