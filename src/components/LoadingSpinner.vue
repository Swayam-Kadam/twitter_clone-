<template>
  <div class="flex flex-col items-center justify-center h-screen chat-wallpaper">
    <div class="flex flex-col items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      <div class="animate-spin rounded-full h-8 w-8 border-[3px] border-brand/20 border-t-brand"></div>
      <p class="text-brand-dark text-sm font-medium">Loading ChatFlow...</p>
    </div>
  </div>
</template>

<script setup></script>
