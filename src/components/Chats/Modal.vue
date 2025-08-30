<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" aria-hidden="true"></div>

        <!-- Modal container - centered with flex -->
        <div class="flex items-center justify-center min-h-screen p-4">
          <div
            class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg mx-auto"
          >
            <!-- Modal header -->
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="flex justify-between items-start">
                <h3 class="text-lg leading-6 font-medium text-gray-900">{{ title }}</h3>
                <button 
                  @click="$emit('update:modelValue', false)"
                  class="text-gray-400 hover:text-gray-500"
                >
                  <Icon icon="mdi:close" class="h-6 w-6" />
                </button>
              </div>
            </div>

            <!-- Modal content -->
            <div class="px-4 py-3 sm:px-6">
              <slot></slot>
            </div>

            <!-- Modal footer (optional) -->
            <div
              v-if="$slots.footer"
              class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue']);
</script>

<style>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>