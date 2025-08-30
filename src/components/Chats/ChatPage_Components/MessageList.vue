<template>
  <div
    class="flex-1 p-4 mt-15 overflow-y-auto bg-gray-50"
    style="background-image: url('/bg.jpg')"
    @scroll="$emit('scroll')"
  >
    <MessageItem
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :user="user"
      :is-group="isGroup"
      :reactions="reactions[message.id] || []"
      @show-reaction-picker="$emit('show-reaction-picker', message.id)"
      @delete-message="$emit('delete-message', $event)"
    />
    <div ref="messagesEndRef" />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import MessageItem from './MessageItem.vue';

const props = defineProps({
  messages: Array,
  user: Object,
  isGroup: {
    type: Boolean,
    default: false,
  },
  reactions: Object,
});

const messagesEndRef = ref(null);

watch(() => props.messages, () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
}, { deep: true });

defineEmits(['scroll', 'show-reaction-picker', 'delete-message']);
</script>