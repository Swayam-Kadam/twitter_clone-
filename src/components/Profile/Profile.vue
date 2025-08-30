<script setup>
import ProfilePage from './ProfilePage.vue'

defineProps({
  session: Object
})
</script>

<template>
  <div class="min-h-screen bg-center" style="background-image: url('/bg.jpg')">
    <ProfilePage :session="session" />
  </div>
</template>