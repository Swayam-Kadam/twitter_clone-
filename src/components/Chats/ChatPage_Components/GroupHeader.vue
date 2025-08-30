<template>
  <div class="fixed w-full p-4 border-b border-gray-300 bg-white flex items-center justify-between z-1">
    <div class="flex items-center">
      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
        <img
          v-if="group.avatar_url"
          :src="group.avatar_url || '/default-group-avatar.png'"
          :alt="group.name"
          class="w-10 h-10 rounded-full object-cover"
        />
        <Icon v-else icon="mdi:account-group" class="w-5 h-5 text-blue-500" />
      </div>
      <div class="ml-3">
        <h3 class="font-semibold">{{ group.name || "unknown"}}</h3>
        <p class="text-xs text-gray-500">
          {{ members.length }} members
        </p>
      </div>
    </div>
    <div class="justify-end flex">
      <button
        @click="$emit('show-group-settings')"
        class="text-gray-500 hover:text-gray-700 mr-2"
      >
        <Icon icon="mdi:cog" class="w-5 h-5" />
      </button>
      <button
        @click="$emit('show-group-info')"
        class="text-gray-500 hover:text-gray-700"
      >
        <Icon icon="mdi:information-outline" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  group: Object,
  members: Array,
});

defineEmits(['show-group-settings', 'show-group-info']);
</script>