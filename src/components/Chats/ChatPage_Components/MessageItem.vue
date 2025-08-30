<template>
  <div
    class="mb-4 flex group/message relative"
    :class="{
      'justify-end': message.sender_id === user.id,
      'justify-start': message.sender_id !== user.id
    }"
  >
    <div
      class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative"
      :class="{
        'bg-blue-400 text-white': message.sender_id === user.id,
        'bg-white border border-gray-200': message.sender_id !== user.id
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
          'text-blue-100': message.sender_id === user.id,
          'text-gray-500': message.sender_id !== user.id
        }"
      >
        {{ formatTime(message.created_at) }}
        <span v-if="message.sender_id === user.id" class="ml-1">
          <Icon v-if="!message.delivered_at" icon="mdi:check" class="w-3 h-3" />
          <Icon v-else-if="message.delivered_at && !message.read_at" icon="mdi:check-all" class="w-3 h-3" />
          <Icon v-else-if="message.read_at" icon="mdi:check-all" class="w-3 h-3 text-blue-800" />
        </span>
        <button
          v-if="message.sender_id === user.id"
          @click.stop="$emit('delete-message', message.id)"
          class="text-red-500 hover:text-red-700 ml-1 transition-opacity cursor-pointer z-[-1rem] hover:bg-white rounded"
        >
          <Icon icon="mdi:delete" width="15" height="15" />
        </button>
      </p>

      <div v-if="isGroup && groupedReactions.length > 0" class="mt-2 flex flex-wrap gap-1">
        <div
          v-for="reaction in groupedReactions"
          :key="reaction.emoji"
          @click="$emit('toggle-reaction', message.id, reaction.emoji)"
          class="px-2 py-1 rounded-full flex items-center cursor-pointer transition-colors"
          :class="{
            'bg-blue-100 border border-blue-300': hasUserReacted(reaction.emoji),
            'bg-gray-100 hover:bg-gray-200': !hasUserReacted(reaction.emoji)
          }"
        >
          <span class="text-sm mr-1">{{ reaction.emoji }}</span>
          <span class="text-xs" :class="{
            'text-blue-600': hasUserReacted(reaction.emoji),
            'text-gray-600': !hasUserReacted(reaction.emoji)
          }">
            {{ reaction.count }}
          </span>
        </div>
      </div>

      <div v-if="isGroup" class="absolute -bottom-4 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity">
        <button
          @click.stop="$emit('show-reaction-picker', message.id)"
          class="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
        >
          <Icon icon="mdi:emoticon-outline" class="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  message: Object,
  user: Object,
  isGroup: Boolean,
  reactions: Array,
});

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const groupedReactions = computed(() => {
  const grouped = {};
  props.reactions.forEach(reaction => {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [] };
    }
    grouped[reaction.emoji].count++;
    grouped[reaction.emoji].users.push(reaction.user_id);
  });
  return Object.values(grouped);
});

const hasUserReacted = (emoji) => {
  return props.reactions.some(reaction => reaction.user_id === props.user.id && reaction.emoji === emoji);
};

defineEmits(['delete-message', 'show-reaction-picker', 'toggle-reaction']);
</script>