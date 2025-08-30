<template>
  <div 
    class="min-h-screen bg-center"
    style="background-image: url('/bg.jpg')"
  >
    <PostLists :session="session" />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import PostLists from './PostsLists.vue';

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});
</script>