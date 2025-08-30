<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-4 w-96">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Select an emoji</h3>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      
      <Vue3EmojiPicker
        native
        disable-skin-tones
        @select="$emit('emoji-selected', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import Vue3EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

defineProps({
  show: Boolean
})

defineEmits(['close', 'emoji-selected'])
</script>