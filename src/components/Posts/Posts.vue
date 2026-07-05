<template>
  <div class="min-h-screen chat-wallpaper">
    <div class="app-shell">
      <div class="app-content">
        <PostLists :session="session" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import PostLists from './PostsLists.vue'

defineProps({
  session: { type: Object, required: true }
})
</script>
