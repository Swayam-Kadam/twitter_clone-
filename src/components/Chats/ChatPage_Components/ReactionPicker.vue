<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-4 w-80">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold">Add Reaction</h3>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-5 h-5" />
        </button>
      </div>
      <div class="grid grid-cols-6 gap-2">
        <button
          v-for="emoji in commonEmojis"
          :key="emoji"
          @click="$emit('select-emoji', emoji)"
          class="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {{ emoji }}
        </button>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          @click="$emit('show-more-emojis')"
          class="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <Icon icon="mdi:emoticon" class="w-5 h-5 mr-1" />
          More emojis
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  commonEmojis: Array,
});

defineEmits(['select-emoji', 'show-more-emojis', 'close']);
</script>