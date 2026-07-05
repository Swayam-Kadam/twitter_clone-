<script setup>
import ProfilePage from './ProfilePage.vue'

defineProps({
  session: Object
})
</script>

<template>
  <div class="min-h-screen chat-wallpaper">
    <div class="max-w-4xl mx-auto">
      <ProfilePage :session="session" />
    </div>
  </div>
</template>