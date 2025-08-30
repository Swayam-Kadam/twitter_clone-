<template>
  <Modal v-model="show" title="Group Info" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">{{ group.name }}</h3>
        <p class="text-sm text-gray-500">{{ group.description }}</p>
      </div>
      
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">Members</h4>
        <div class="space-y-2">
          <div 
            v-for="member in members" 
            :key="member.id"
            class="flex items-center p-2 hover:bg-gray-50 rounded"
          >
            <img 
              :src="member.avatar_url || '/default-avatar.png'" 
              class="w-8 h-8 rounded-full mr-2"
            >
            <span>{{ member.full_name || member.username }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue';

defineProps({
  group: Object,
  members: Array
});

defineEmits(['close']);
</script>