<template>
  <div class="flex h-screen bg-gray-100">

  
    <!-- Following List Sidebar -->
    <div class="w-1/3 border-r border-gray-300 bg-white transition-all duration-300 ease-in-out"
      :class="{
        'translate-x-0': sidebarVisible,
        '-translate-x-full absolute': !sidebarVisible
      }">
      <div class="p-4 border-b border-gray-300 flex justify-between items-center">
        <h2 class="text-sm sm:text-xl font-bold">Messages</h2>
         <!-- Toggle Button -->
    <button
    
        
      @click="toggleSidebar"
      class=" top-4 left-2 z-50 p-[2px]  bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300"
      :class="{ 'left-4': sidebarVisible, 'left-4': !sidebarVisible }"
    >
      <Icon 
        :icon="sidebarVisible ? 'mdi:chevron-left' : 'mdi:menu'" 
        class="w-5 h-5 text-gray-700" 
      />
    </button>
      </div>

      <div class="overflow-y-auto h-[calc(100vh-60px)]">
        <div v-for="followedUser in following" :key="followedUser.id"
          @click="handleSelectUser(followedUser)"
          :class="{
            'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 relative group': true,
            'bg-blue-50': activeChat && getOtherUser(activeChat) === followedUser.id
          }"
        >
          <div class="flex items-center">
            <div class="relative">
              <img
                :src="followedUser.avatar_url || '/default-avatar.png'"
                :alt="followedUser.username"
                class="sm:w-12 sm:h-12 w-8 h-8 rounded-full object-cover"
              />
              <div v-if="onlineUsers.includes(followedUser.id)" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div class="ml-3 flex-1">
              <div class="flex justify-between items-start">
                <h3 class="font-semibold sm:text-lg text-sm">{{ followedUser.full_name || followedUser.username }}</h3>
              </div>
              <p class="text-[0.6rem] sm:text-sm  text-gray-500">
                {{ onlineUsers.includes(followedUser.id) ? 'Online' : 'Offline' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Group chats -->
      <GroupList 
        :user="user" 
        :active-group="activeGroup"
        @select-group="handleSelectGroup"
      />
      </div>

      
    </div>

    <!-- Chat Window -->
    <div class="flex-1 flex flex-col transition-all duration-300"
      :class="{ 'md:ml-0': sidebarVisible, 'ml-0': !sidebarVisible }">
      <template v-if="activeChat">
        <div class="fixed w-full p-4 border-b border-gray-300 bg-white flex items-center justify-between">
          <div class="flex items-center">
            <button
            v-if="!sidebarVisible"
            @click="toggleSidebar"
            class=" top-4 mr-3 z-50 p-[2px]  bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300"
            >
            <Icon 
              :icon="sidebarVisible ? 'mdi:chevron-left' : 'mdi:menu'" 
              class="w-5 h-5 text-gray-700" 
            />
          </button>
            <div class="relative">
              <img
                :src="following.find(u => u.id === getOtherUser(activeChat))?.avatar_url || '/default-avatar.png'"
                :alt="following.find(u => u.id === getOtherUser(activeChat))?.username"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div v-if="onlineUsers.includes(getOtherUser(activeChat))" class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div class="ml-3">
              <h3 class="font-semibold">
                {{ following.find(u => u.id === getOtherUser(activeChat))?.full_name || 
                   following.find(u => u.id === getOtherUser(activeChat))?.username }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ onlineUsers.includes(getOtherUser(activeChat)) ? 'Online' : 'Offline' }}
                <span v-if="isTyping && typingUser === (getOtherUser(activeChat))" class="ml-2 text-blue-500">typing...</span>
              </p>
            </div>
          </div>
        </div>

        <div class="flex-1 p-4 mt-15 overflow-y-auto bg-gray-50" style="background-image: url('/bg.jpg')" @scroll="handleScroll">
          <div v-for="message in messages" :key="message.id"
            class="mb-4 flex"
            :class="{
              'justify-end': message.sender_id === user.id,
              'justify-start': message.sender_id !== user.id
            }"
          >
            <div
              class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
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
            
           
            <!-- In the One to One messages section -->
            <p class="text-xs mt-1 flex"
              :class="{
                'text-blue-100': message.sender_id === user.id,
                'text-gray-500': message.sender_id !== user.id
              }"
            >
              {{ formatTime(message.created_at) }}
              <span v-if="message.sender_id === user.id" class="ml-1">
                <Icon 
                  v-if="!message.delivered_at" 
                  icon="mdi:check" 
                  class="w-3 h-3" 
                />
                <Icon 
                  v-else-if="message.delivered_at && !message.read_at" 
                  icon="mdi:check-all" 
                  class="w-3 h-3" 
                />
                <Icon 
                  v-else-if="message.read_at" 
                  icon="mdi:check-all" 
                  class="w-3 h-3 text-blue-800" 
                />
              </span>
              <button v-if="message.sender_id === user.id"
                @click.stop="deleteChat(message.id)"
                class="text-red-500 hover:text-red-700 ml-1 transition-opacity cursor-pointer z-[-1rem] hover:bg-white rounded"
              >
                <Icon icon="mdi:delete" width="15" height="15" />
              </button>
            </p>
          </div>
          </div>

          <div v-if="isTyping && typingUser === (getOtherUser(activeChat))" class="flex justify-start mb-4 z-1">
            <div class="bg-white border border-gray-200 px-4 py-2 rounded-lg">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
          <div ref="messagesEndRef" />
        </div>

        <div class="p-4 border-t border-gray-300 bg-white relative">
          <div v-if="imagePreview" class="mb-2 relative">
            <img 
              :src="imagePreview" 
              alt="Preview" 
              class="max-w-full max-h-32 rounded-lg"
            />
            <button
              @click="clearImagePreview"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex">
            <div class="relative flex-1" ref="emojiPickerRef">
              <button
                @click.stop="toggleEmojiPicker"
                class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                <Icon icon="mdi:emoticon" class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  @click="removeLastCharacter"
                  class="absolute right-6 sm:right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  :disabled="!newMessage.length"
                >
                  <Icon icon="mdi:backspace-outline" class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

              <button
                @click="triggerFileInput"
                class="absolute right-2 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Icon icon="mdi:attachment" class="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input 
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept="image/*"
                
                class="hidden"
              />
              <div v-if="showEmojiPicker" class="absolute bottom-12 left-0 z-50">
                <Vue3EmojiPicker
                    native
                    disable-skin-tones
                    @select="onEmojiClick"
                />
                </div>
              <input
                type="text"
                v-model="newMessage"
                @input="handleTyping"
                @keypress.enter="sendMessage"
                placeholder="Type a message..."
                class="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              @click="sendMessage"
              :disabled="(!newMessage.trim() && !selectedFile) || uploading"
              class="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              <template v-if="uploading">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                
              </template>
              <template v-else>
                <Icon icon="ic:outline-send" width="24" height="24" />
              </template>
            </button>
          </div>
        </div>
      </template>






      <template v-else-if="activeGroup">
        <!-- Group chat header -->
        <div  :class="!sidebarVisible 
    ? 'fixed w-[100%] p-4 border-b border-gray-300 bg-white flex items-center justify-between z-1'
    : 'fixed w-[67%] p-4 border-b border-gray-300 bg-white flex items-center justify-between z-1'">
          <button
            v-if="!sidebarVisible"
            @click="toggleSidebar"
            class=" top-4 mr-3 z-50 p-[2px]  bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300"
            >
            <Icon 
              :icon="sidebarVisible ? 'mdi:chevron-left' : 'mdi:menu'" 
              class="w-5 h-5 text-gray-700" 
            />
          </button>
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <!-- <Icon icon="mdi:account-group" class="w-5 h-5 text-blue-500" /> -->
               <div v-if='activeGroup.avatar_url'>
                  <img
                    :src="activeGroup.avatar_url || '/default-group-avatar.png'"
                    :alt="activeGroup.name"
                    class="w-10 h-10 rounded-full object-cover"
                  />
               </div>
               <div v-else>
                  <Icon icon="mdi:account-group" class="w-5 h-5 text-blue-500" />
               </div>
            </div>
            
            <div class="ml-3">
              <h3 class="font-semibold">{{ activeGroup.name || "unknown"}}</h3>
              <p class="text-xs text-gray-500">
                {{ groupMembers.length }} members
              </p>
            </div>

            

          </div>

          <!-- edit icon  -->
            <div class="justify-end flex gap-2">
              <button
              @click="showGroupSettings = true"
              class="text-gray-500 hover:text-gray-700"
              >
              <Icon icon="mdi:cog" class="w-5 h-5" />
            </button>
            
            <button
              @click="showGroupInfo = true"
              class="text-gray-500 hover:text-gray-700"
            >
              <Icon icon="mdi:information-outline" class="w-5 h-5" />
            </button>
            </div>

          
            </div>

        
        <!-- Group messages -->
        <div class="flex-1 p-4 mt-15 overflow-y-auto bg-gray-50" style="background-image: url('/bg.jpg')" @scroll="handleScroll">
          <div v-for="message in groupMessages" :key="message.id" 
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
                <Icon 
                  v-if="!message.delivered_at" 
                  icon="mdi:check" 
                  class="w-3 h-3" 
                />
                <Icon 
                  v-else-if="message.delivered_at && !message.read_at" 
                  icon="mdi:check-all" 
                  class="w-3 h-3" 
                />
                <Icon 
                  v-else-if="message.read_at" 
                  icon="mdi:check-all" 
                  class="w-3 h-3 text-blue-800" 
                />
              </span>
              <button v-if="message.sender_id === user.id"
                @click.stop="deleteGroupMessage(message.id)"
                class="text-red-500 hover:text-red-700 ml-1 transition-opacity cursor-pointer z-[-1rem] hover:bg-white rounded"
              >
                <Icon icon="mdi:delete" width="15" height="15" />
              </button>
            </p>


            <!-- Reactions section -->
            <div v-if="messageReactions[message.id]?.length > 0" class="mt-2 flex flex-wrap gap-1">
              <div 
                v-for="reaction in groupedReactions(messageReactions[message.id])" 
                :key="reaction.emoji"
                @click="toggleReaction(message.id, reaction.emoji)"
                class="px-2 py-1 rounded-full flex items-center cursor-pointer transition-colors"
                :class="{
                  'bg-blue-100 border border-blue-300': hasUserReacted(message.id, reaction.emoji, user.id),
                  'bg-gray-100 hover:bg-gray-200': !hasUserReacted(message.id, reaction.emoji, user.id)
                }"
              >
                <span class="text-sm mr-1">{{ reaction.emoji }}</span>
                <span class="text-xs" :class="{
                  'text-blue-600': hasUserReacted(message.id, reaction.emoji, user.id),
                  'text-gray-600': !hasUserReacted(message.id, reaction.emoji, user.id)
                }">
                  {{ reaction.count }}
                </span>
              </div>
            </div>
            <!-- Reaction button (appears on hover) -->
            <div class="absolute -bottom-4 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity">
              <button 
                @click.stop="showReactionPicker(message.id)"
                class="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <Icon icon="mdi:emoticon-outline" class="w-4 h-4 text-gray-500" />
              </button>
            </div>

            

            </div>
          </div>
          <div ref="groupMessagesEndRef" />
        </div>

        <!-- Reaction picker modal -->
        <div v-if="showReactionPickerForMessage" class="fixed inset-0 bg-black-50  flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-4 w-80">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold">Add Reaction</h3>
              <button @click="closeReactionPicker" class="text-gray-500 hover:text-gray-700">
                <Icon icon="mdi:close" class="w-5 h-5" />
              </button>
            </div>
            
            <div class="grid grid-cols-6 gap-2">
              <button 
                v-for="emoji in commonEmojis" 
                :key="emoji"
                @click="addReaction(emoji)"
                class="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {{ emoji }}
              </button>
            </div>
            
            <div class="mt-4 flex justify-end">
             
              <button 
                @click="showReactionEmojiPicker = true" 
                class="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <Icon icon="mdi:emoticon" class="w-5 h-5 mr-1" />
                More emojis
              </button>
            </div>
          </div>
        </div>

        <!-- Full emoji picker for reactions (when "More emojis" is clicked) -->
<div v-if="showReactionEmojiPicker" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg p-4 w-96">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold">Select an emoji</h3>
      <button @click="showReactionEmojiPicker = false" class="text-gray-500 hover:text-gray-700">
        <Icon icon="mdi:close" class="w-5 h-5" />
      </button>
    </div>
    
    <Vue3EmojiPicker
      native
      disable-skin-tones
      @select="onEmojiSelectForReaction"
    />
  </div>
</div>


        <!-- Group message input -->
        <div class="p-4 border-t border-gray-300 bg-white relative">
          <div v-if="imagePreview" class="mb-2 relative">
            <img 
              :src="imagePreview" 
              alt="Preview" 
              class="max-w-full max-h-32 rounded-lg"
            />
            <button
              @click="clearImagePreview"
              class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
            </button>
          </div>
          <div class="flex">
            <div class="relative flex-1" ref="emojiPickerRef">
              <button
                @click.stop="toggleEmojiPicker"
                class="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                <Icon icon="mdi:emoticon" class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  @click="removeLastCharacter"
                  class="absolute right-6 sm:right-8 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  :disabled="!newMessage.length"
                >
                  <Icon icon="mdi:backspace-outline" class="w-3 h-3 sm:w-5 sm:h-5" />
                </button>

              <button
                @click="triggerFileInput"
                class="absolute right-2 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <Icon icon="mdi:attachment" class="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <input 
                type="file"
                ref="fileInput"
                @change="handleFileSelect"
                accept="image/*"
                
                class="hidden"
              />
              <div v-if="showEmojiPicker" :class="sidebarVisible ? 'absolute bottom-12 ml-[-5.4rem] sm:ml-0 left-[0rem] z-50' : 'absolute bottom-12 left-[0rem] z-50' ">
                <Vue3EmojiPicker
                    native
                    disable-skin-tones
                    @select="onEmojiClick"
                />
                </div>
              <input
                type="text"
                v-model="newMessage"
                @input="handleTyping"
                @keypress.enter="sendGroupMessage"
                placeholder="Type a message..."
                class="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              @click="sendGroupMessage"
              :disabled="(!newMessage.trim() && !selectedFile) || uploading"
              class="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              <template v-if="uploading">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </template>
              <template v-else>
                <Icon icon="ic:outline-send" width="24" height="24" />
              </template>
            </button>
          </div>
        </div>
      </template>






      <div v-else class="flex-1 flex items-center justify-center bg-gray-50" style="background-image: url('/bg.jpg')">
        <div class="text-center">
          <button
            v-if="!sidebarVisible"
            @click="toggleSidebar"
            class=" top-4 mr-3 z-50 p-[2px]  bg-white rounded-full shadow-md hover:bg-gray-100 transition-all duration-300 mb-4"
            >
              Open Slide Window
            </button>
          <h3 class="text-xl font-semibold text-blue-600 bg-gray-100 rounded p-1">Select a user to start chatting...</h3>
        </div>
      </div>
    </div>

    <GroupInfoModal 
  v-model="showGroupInfo"
  :group="activeGroup"
  :members="groupMembers"
   @close="showGroupInfo = false"
/>

    <!-- Group Settings Modal -->
  <GroupSettingsModal
    v-if="showGroupSettings"
    :model-value="showGroupSettings"
    :group="activeGroup"
    :members="groupMembers"
    :user="user"
    @close="showGroupSettings = false"
    @group-updated="handleGroupUpdated"
    @group-deleted="handleGroupDeleted"
  />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { Icon } from '@iconify/vue';
import Vue3EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { onClickOutside } from '@vueuse/core';
import GroupInfoModal from './GroupInfoModal.vue';
import GroupList from './GroupList.vue';
import GroupSettingsModal from './GroupSettingsModal.vue';
import { useToast } from 'vue-toast-notification'; // Add this import

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const $toast = useToast();
const user = computed(() => props.session.user);
const following = ref([]);
const activeChat = ref(null);
const messages = ref([]);
const newMessage = ref('');
const onlineUsers = ref([]);
const isTyping = ref(false);
const typingUser = ref(null);
const messagesEndRef = ref(null);
const typingTimeoutRef = ref(null);
const showEmojiPicker = ref(false);
const uploading = ref(false);
const imagePreview = ref(null);
const selectedFile = ref(null);
const fileInput = ref(null);
const emojiPickerRef = ref(null);
const emojiPickerContainer = ref(null);



// Add these with your other reactive variables
const notificationChannels = ref({});
const groupNotificationChannels = ref({});

// Add these new reactive variables
const messageReactions = ref({});
const showReactionPickerForMessage = ref(null);
const showReactionEmojiPicker = ref(false);
const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👎', '🎉', '🤔', '🔥'];

// Store channel references
const presenceChannel = ref(null);
const messagesChannel = ref(null);
const typingChannel = ref(null);
const currentViewedChat = ref(null);
const readReceiptChannel = ref(null)

// Add these variables
const showGroupSettings = ref(false);

// Track when group messages are delivered
const trackGroupMessageDelivery = async (messageId) => {
  try {
    const { error } = await supabase
      .from('group_messages')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking group message delivery:', err);
  }
};

// Track when group messages are read by members
const trackGroupMessageRead = async (messageIds) => {
  try {
    const { error } = await supabase
      .from('group_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking group message read status:', err);
  }
};

// Check if user is viewing the group chat
const isGroupChatVisible = () => {
  return document.visibilityState === 'visible' && 
         activeGroup.value && 
         activeGroup.value.id === currentViewedGroup.value;
        
        
};

// Mark group messages as read when they become visible
const markGroupMessagesAsRead = async () => {
  if (!activeGroup.value || !user.value) return;

  const unreadMessages = groupMessages.value.filter(
    msg => msg.sender_id !== user.value.id && !msg.read_at
  );

  if (unreadMessages.length > 0 && isGroupChatVisible()) {
    await trackGroupMessageRead(unreadMessages.map(msg => msg.id));
  }
};

// Add this function to your ChatPage.vue script
const fetchGroups = async () => {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('group:groups(*)')
      .eq('user_id', user.value.id);

    if (!error) {
      // Update your groups list if you have one
      // If you're storing groups in a separate ref, update it here
      // For example: groups.value = data.map(item => item.group);
    }
  } catch (err) {
    console.error('Error fetching groups:', err);
  }
};


// Add these methods
const handleGroupUpdated = (updatedGroup) => {
  // Update the active group with new data
  activeGroup.value = { ...activeGroup.value, ...updatedGroup };
  // Refresh groups list if needed
  fetchGroups();
};

const handleGroupDeleted = (deletedGroupId) => {
  if (activeGroup.value?.id === deletedGroupId) {
    activeGroup.value = null;
  }
  // Refresh groups list
  fetchGroups();
};

// Add sidebar visibility state
const sidebarVisible = ref(true);

// Toggle sidebar function
const toggleSidebar = () => {
  
  sidebarVisible.value = !sidebarVisible.value;
};

// Add these new methods
const fetchMessageReactions = async (messageIds) => {
  try {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds)
      .eq('group_id', activeGroup.value.id);

    if (!error) {
      // Group reactions by message_id
      const reactionsByMessage = {};
      data.forEach(reaction => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = [];
        }
        reactionsByMessage[reaction.message_id].push(reaction);
      });
      
      messageReactions.value = reactionsByMessage;
    }
  } catch (err) {
    console.error('Error fetching message reactions:', err);
  }
};

const groupedReactions = (reactions) => {
  const grouped = {};
  
  reactions.forEach(reaction => {
    if (!grouped[reaction.emoji]) {
      grouped[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: []
      };
    }
    grouped[reaction.emoji].count++;
    grouped[reaction.emoji].users.push(reaction.user_id);
  });
  
  return Object.values(grouped);
};


const hasUserReacted = (messageId, emoji, userId) => {
  const reactions = messageReactions.value[messageId] || [];
  const userReaction = reactions.find(reaction => reaction.user_id === userId);
  
  // Return true if user has reacted with this specific emoji
  return userReaction && userReaction.emoji === emoji;
};

const showReactionPicker = (messageId) => {
  showReactionPickerForMessage.value = messageId;
};

const closeReactionPicker = () => {
  showReactionPickerForMessage.value = null;
  showReactionEmojiPicker.value = false;
};


const addReaction = async (emoji) => {
  if (!showReactionPickerForMessage.value || !activeGroup.value) return;
  
  try {
    const messageId = showReactionPickerForMessage.value;
    
    // Check if user already has a reaction on this message
    const existingReaction = (messageReactions.value[messageId] || []).find(
      reaction => reaction.user_id === user.value.id
    );
    
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Same emoji - remove the reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
          
        if (!error) {
          // Update local state
          messageReactions.value[messageId] = messageReactions.value[messageId].filter(
            r => r.id !== existingReaction.id
          );
        }
      } else {
        // Different emoji - update the existing reaction
        const { data, error } = await supabase
          .from('message_reactions')
          .update({ 
            emoji: emoji,
            created_at: new Date().toISOString()
          })
          .eq('id', existingReaction.id)
          .select();
          
        if (!error) {
          // Update local state
          messageReactions.value[messageId] = messageReactions.value[messageId].map(
            r => r.id === existingReaction.id ? data[0] : r
          );
        }
      }
    } else {
      // Add new reaction
      const { data, error } = await supabase
        .from('message_reactions')
        .insert([{
          message_id: messageId,
          group_id: activeGroup.value.id,
          user_id: user.value.id,
          emoji: emoji
        }])
        .select();
        
      if (!error) {
        // Update local state
        if (!messageReactions.value[messageId]) {
          messageReactions.value[messageId] = [];
        }
        messageReactions.value[messageId].push(data[0]);
      }
    }
    
    closeReactionPicker();
  } catch (err) {
    console.error('Error adding reaction:', err);
  }
};

const toggleReaction = async (messageId, emoji) => {
  showReactionPickerForMessage.value = messageId;
  await addReaction(emoji);
};

const onEmojiSelectForReaction = (emojiData) => {
  const emoji = emojiData.emoji || emojiData.char || emojiData.i;
  if (emoji) {
    addReaction(emoji);
    showReactionEmojiPicker.value = false;
  }
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const removeLastCharacter = () => {
  if (newMessage.value.length > 0) {
    // Create an array from the string to properly handle emojis and other multi-byte characters
    const chars = [...newMessage.value];
    chars.pop(); // Remove the last character
    newMessage.value = chars.join('');
  }
};

const fetchFollowing = async () => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:following_id(*)
      `)
      .eq('follower_id', user.value.id);

    if (error) throw error;
    following.value = data.map(item => item.following);
  } catch (err) {
    console.error('Error fetching following:', err);
  }
};

const handleSelectUser = async (selectedUser) => {
  try {
    // Check if chat already exists
    const { data: existingChats, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user.value.id},user2_id.eq.${selectedUser.id}),and(user1_id.eq.${selectedUser.id},user2_id.eq.${user.value.id})`);

    if (chatError) throw chatError;

    if (existingChats.length > 0) {
      activeChat.value = existingChats[0];
    } else {
      // Create new chat
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert([{
          user1_id: user.value.id,
          user2_id: selectedUser.id,
        }])
        .select()
        .single();

      if (newChatError) throw newChatError;
      activeChat.value = newChat;
    }
  } catch (err) {
    console.error('Error handling chat:', err);
  }
};

// Track when messages are delivered (received by recipient's device)
const trackMessageDelivery = async (messageId) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking message delivery:', err);
  }
};

// Track when messages are read by recipient
const trackMessageRead = async (messageIds) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking message read status:', err);
  }
};

// Check if user is viewing the chat
const isChatVisible = () => {
  return document.visibilityState === 'visible' && 
         activeChat.value && 
         activeChat.value.id === currentViewedChat.value;
        
};

// Mark messages as read when they become visible
const markMessagesAsRead = async () => {
  if (!activeChat.value || !user.value) return;

  const unreadMessages = messages.value.filter(
    msg => msg.sender_id !== user.value.id && !msg.read_at
  );

  if (unreadMessages.length > 0 && isChatVisible()) {
    await trackMessageRead(unreadMessages.map(msg => msg.id));
  }
};

const deleteChat = async (messageId) => {
  try {

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting message:', err);
    // Revert optimistic update if error occurs
    
  }
};

const fetchMessages = async () => {
  if (!activeChat.value) return;

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(*)
    `)
    .eq('chat_id', activeChat.value.id)
    .order('created_at', { ascending: true });

  if (!error) {
    messages.value = data;
  }
};

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !selectedFile.value) || !activeChat.value) return;

  try {
    uploading.value = true;
    let imageUrl = null;

    // Upload image if one is selected
    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, selectedFile.value);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    // Send the message and get the returned data
    const { data: newMessageData, error } = await supabase
      .from('messages')
      .insert([{
        chat_id: activeChat.value.id,
        sender_id: user.value.id,
        content: newMessage.value,
        image_url: imageUrl
      }])
      .select()
      .single();

    if (error) throw error;

    newMessage.value = '';
    selectedFile.value = null;
    imagePreview.value = null;
    
    // SEND IMMEDIATE BROADCAST NOTIFICATION (ONLY if message was successfully inserted)
    try {
      const recipientId = getOtherUser(activeChat.value);
      const channel = supabase.channel(`notifications:${recipientId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          message: newMessageData, // Use the returned data
          sender: {
            id: user.value.id,
            username: user.value.user_metadata?.username || user.value.email,
            full_name: user.value.user_metadata?.full_name,
            avatar_url: user.value.user_metadata?.avatar_url
          }
        }
      });
    } catch (broadcastError) {
      console.error('Broadcast error (non-critical):', broadcastError);
      // Don't show alert for broadcast errors - they're not critical
    }

    // Update chat's last updated time
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeChat.value.id);

  } catch (err) {
    console.error('Error sending message:', err);
    alert('Error sending message!');
  } finally {
    uploading.value = false;
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const getOtherUser = (chat) => {
  return chat.user1_id === user.value.id ? chat.user2_id : chat.user1_id;
};

const handleTyping = () => {
  if (!activeChat.value) return;

  // Broadcast typing event
  supabase.channel(`typing:${activeChat.value.id}`)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.value.id }
    });

  // Reset typing indicator after delay if no more typing
  clearTimeout(typingTimeoutRef.value);
  typingTimeoutRef.value = setTimeout(() => {
    isTyping.value = false;
    typingUser.value = null;
  }, 2000);
};

// Emoji picker functions
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const closeEmojiPicker = () => {
  showEmojiPicker.value = false;
};

// Handle emoji selection for message input
const onEmojiClick = (emojiData) => {
  newMessage.value += emojiData.emoji || emojiData.char || emojiData.i;
  showEmojiPicker.value = false; // Close the message input emoji picker
};

// Close picker when clicking outside
onClickOutside(emojiPickerContainer, () => {
  showEmojiPicker.value = false;
});


// Add click outside handler
onClickOutside(emojiPickerRef, () => {
  if (showEmojiPicker.value) {
    closeEmojiPicker();
  }
});

// File upload functions
const triggerFileInput = () => {
  fileInput.value?.click();
};


const handleFileSelect = (event) => {
  if (!event.target.files || event.target.files.length === 0) {
    return;
  }

  const file = event.target.files[0];
  
  // Check if the selected item is a folder (has no extension and type is empty)
  if (file.name.lastIndexOf('.') === -1 && file.type === '') {
    event.target.value = ''; // Clear the input
    return; // Early return if folder is selected
  }

  selectedFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => imagePreview.value = e.target.result;
  reader.readAsDataURL(selectedFile.value);
};

const clearImagePreview = () => {
  imagePreview.value = null;
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const setupPresenceChannel = () => {
  // Clean up previous presence channel if exists
  if (presenceChannel.value) {
    supabase.removeChannel(presenceChannel.value);
  }

  presenceChannel.value = supabase.channel('online-users', {
    config: {
      presence: {
        key: user.value.id,
      },
    },
  });

  presenceChannel.value
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.value.presenceState();
      onlineUsers.value = Object.keys(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.value.track({
          user_id: user.value.id,
          online_at: new Date().toISOString(),
        });
      }
    });
};


// Function to send broadcast notification to receiver
const sendMessageNotification = async (message) => {
  try {
    // Get the recipient ID (other user in the chat)
    const recipientId = getOtherUser(activeChat.value);
    
    // Get sender info
    const sender = following.value.find(u => u.id === user.value.id) || user.value;
    
    // Send broadcast to recipient's notification channel
    const channel = supabase.channel(`notifications:${recipientId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: {
        message: message,
        sender: {
          id: sender.id,
          username: sender.username,
          full_name: sender.full_name,
          avatar_url: sender.avatar_url
        }
      }
    });
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};


// Function to show toast notification from broadcast
const showToastNotification = (message, sender) => {
  const senderName = sender.full_name || sender.username || 'Someone';
  
  let notificationText = `${senderName}: `;
  
  if (message.image_url) {
    notificationText += '📷 Sent an image';
  } else if (message.content) {
    notificationText += message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
  } else {
    notificationText += 'Sent a message';
  }

  // Show toast notification
  $toast.info(notificationText, {
    position: 'top-right',
    duration: 5000,
    dismissible: true, // Enable dismissible
    onClick: () => {
      // When clicked, focus on the chat
      const chatUser = following.value.find(u => u.id === sender.id);
      if (chatUser) {
        handleSelectUser(chatUser);
      }
    }
  });

  // Also show browser notification if allowed
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(senderName, {
      body: message.content || '📷 Image',
      icon: sender.avatar_url || '/default-avatar.png'
    });
  }
};


const setupChatChannels = (chatId) => {
  // Clean up previous channels
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);

  // Clean up previous notification channel for this chat
  if (notificationChannels.value[chatId]) {
    supabase.removeChannel(notificationChannels.value[chatId]);
  }

  // Messages channel
  messagesChannel.value = supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      async (payload) => {
        // Add new message
        if (!messages.value.some(msg => msg.id === payload.new.id)) {
          messages.value = [...messages.value, payload.new];
          
          // If it's a message sent TO the current user (not by them)
          if (payload.new.sender_id !== user.value.id) {
            // REMOVED: showMessageNotification(payload.new);
            // PostgreSQL changes will handle the notification for messages from others
          }

          // If it's our message, track delivery when received by server
          if (payload.new.sender_id === user.value.id) {
            await trackMessageDelivery(payload.new.id);
            
            // REMOVED: await sendMessageNotification(payload.new);
            // Broadcast is now handled in sendMessage function directly
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        // Update message status
        messages.value = messages.value.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        // Handle delete without chat_id filter
        messages.value = messages.value.filter(msg => msg.id !== payload.old.id);
      }
    )
    .subscribe();

  // Rest of your channel setup remains the same...
  readReceiptChannel.value = supabase
    .channel(`read_receipts:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        messages.value = messages.value.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        );
      }
    )
    .subscribe();

  // Typing indicator channel (existing)
  typingChannel.value = supabase.channel(`typing:${chatId}`, {
    config: {
      broadcast: { ack: true, self: false }
    }
  }).on('broadcast', { event: 'typing' }, (payload) => {
    if (payload.payload.user_id !== user.value.id) {
      isTyping.value = true;
      typingUser.value = payload.payload.user_id;
      clearTimeout(typingTimeoutRef.value);
      typingTimeoutRef.value = setTimeout(() => {
        isTyping.value = false;
        typingUser.value = null;
      }, 2000);
    }
  }).subscribe();

  // Create dedicated notification channel for THIS USER (for receiving broadcasts)
  const notificationChannel = supabase.channel(`notifications:${user.value.id}`, {
    config: {
      broadcast: { ack: true, self: false }
    }
  });

  notificationChannel
    .on('broadcast', { event: 'new_message' }, (payload) => {
      const { message, sender } = payload.payload;
      
      // Only show notification if not currently viewing the chat
      if (!activeChat.value || activeChat.value.id !== message.chat_id) {
        showToastNotification(message, sender);
      }
    })
    .subscribe();

  // Store the notification channel
  notificationChannels.value[chatId] = notificationChannel;
};

onMounted(() => {
  fetchFollowing();
  setupPresenceChannel();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Handle clicking outside emoji picker
  const handleClickOutside = (event) => {
    if (emojiPickerRef.value && !emojiPickerRef.value.contains(event.target)) {
      showEmojiPicker.value = false;
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', markMessagesAsRead);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', markMessagesAsRead);
  };
});

const handleVisibilityChange = () => {
  if (isChatVisible()) {
    markMessagesAsRead();
  }
};




// Watch for activeChat changes
watch(activeChat, (newChat) => {
  if (newChat) {
    currentViewedChat.value = newChat.id;
    fetchMessages();
    setupChatChannels(newChat.id);
    
    // Mark messages as read when switching to chat
    nextTick(() => {
      markMessagesAsRead();
    });
  }
}, { immediate: true });

// Scroll to bottom when messages change
watch(messages, () => {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
}, { deep: true });


const activeGroup = ref(null);
const groupMessages = ref([]);
const groupMembers = ref([]);
const showGroupInfo = ref(false);
const groupMessagesEndRef = ref(null);
const groupChannel = ref(null)

const handleSelectGroup = (group) => {
  activeGroup.value = group;
  activeChat.value = null;
  fetchGroupMembers();
  fetchGroupMessages();
  setupGroupChannels(group.id);
};

const fetchGroupMembers = async () => {
  if (!activeGroup.value) return;
  
  const { data, error } = await supabase
    .from('group_members')
    .select('user:profiles(*)')
    .eq('group_id', activeGroup.value.id);

  if (!error) {
    groupMembers.value = data.map(item => item.user);
  }
};

const fetchGroupMessages = async () => {
  if (!activeGroup.value) return;
  
  const { data, error } = await supabase
    .from('group_messages')
    .select('*, sender:profiles(*)')
    .eq('group_id', activeGroup.value.id)
    .order('created_at', { ascending: true });

  if (!error) {
    groupMessages.value = data;

    // Fetch reactions for these messages
    const messageIds = data.map(msg => msg.id);
    if (messageIds.length > 0) {
      await fetchMessageReactions(messageIds);
    }
  }
};

const deleteGroupMessage = async (messageId) => {
  try {
    const { error } = await supabase
      .from('group_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
  } catch (err) {
    console.error('Error deleting group message:', err);
  }
};


const sendGroupMessage = async () => {
  if ((!newMessage.value.trim() && !selectedFile.value) || !activeGroup.value) return;

  try {
    uploading.value = true;
    let imageUrl = null;

    // Upload image if one is selected (same as 1:1 chat)
    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, selectedFile.value);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from('group_messages')
      .insert([{
        group_id: activeGroup.value.id,
        sender_id: user.value.id,
        content: newMessage.value,
        image_url: imageUrl
      }]);

    if (!error) {
      newMessage.value = '';
      selectedFile.value = null;
      imagePreview.value = null;
      
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    }
  } catch (err) {
    console.error('Error sending group message:', err);
    alert('Error sending group message!');
  } finally {
    uploading.value = false;
  }
};

const setupGroupChannels = (groupId) => {
  // Clean up previous group channel if exists
  if (groupChannel.value) {
    supabase.removeChannel(groupChannel.value);
  }

  groupChannel.value = supabase
    .channel(`group:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      async (payload) => {
        if (!groupMessages.value.some(msg => msg.id === payload.new.id)) {
          groupMessages.value = [...groupMessages.value, payload.new];

          // If it's a message sent TO the current user (not by them)
          if (payload.new.sender_id !== user.value.id) {
            showGroupMessageNotification(payload.new);
          }
          
          // If it's our message, track delivery when received by server
          if (payload.new.sender_id === user.value.id) {
            await trackGroupMessageDelivery(payload.new.id);
          }
        }
        nextTick(() => {
          groupMessagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        groupMessages.value = groupMessages.value.map(msg => 
          msg.id === payload.new.id ? payload.new : msg
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'group_messages',
      },
      (payload) => {
        groupMessages.value = groupMessages.value.filter(msg => msg.id !== payload.old.id);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `group_id=eq.${groupId}`,
      },
      () => {
        fetchGroupMembers();
      }
    )
    .subscribe();


    // Add reactions channel
  // const reactionsChannel = supabase
  //   .channel(`group_reactions:${groupId}`)
  //   .on(
  //     'postgres_changes',
  //     {
  //       event: '*',
  //       schema: 'public',
  //       table: 'message_reactions',
  //       filter: `group_id=eq.${groupId}`,
  //     },
  //     (payload) => {
  //       if (payload.eventType === 'INSERT') {
  //         const reaction = payload.new;
  //         if (!messageReactions.value[reaction.message_id]) {
  //           messageReactions.value[reaction.message_id] = [];
  //         }
          
  //         // Check if reaction already exists
  //         if (!messageReactions.value[reaction.message_id].some(r => r.id === reaction.id)) {
  //           messageReactions.value[reaction.message_id].push(reaction);
  //         }
  //       } else if (payload.eventType === 'DELETE') {
  //         const reactionId = payload.old.id;
  //         const messageId = payload.old.message_id;
          
  //         if (messageReactions.value[messageId]) {
  //           messageReactions.value[messageId] = messageReactions.value[messageId].filter(
  //             r => r.id !== reactionId
  //           );
  //         }
  //       }
  //     }
  //   )
  //   .subscribe();

  // Add reactions channel

  const reactionsChannel = supabase
  .channel(`group_reactions:${groupId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'message_reactions',
      filter: `group_id=eq.${groupId}`,
    },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        const reaction = payload.new;
        if (!messageReactions.value[reaction.message_id]) {
          messageReactions.value[reaction.message_id] = [];
        }
        
        // Remove any existing reaction from this user for this message
        messageReactions.value[reaction.message_id] = messageReactions.value[reaction.message_id].filter(
          r => !(r.user_id === reaction.user_id && r.message_id === reaction.message_id)
        );
        
        // Add the new reaction
        messageReactions.value[reaction.message_id].push(reaction);
      } else if (payload.eventType === 'UPDATE') {
        const reaction = payload.new;
        if (messageReactions.value[reaction.message_id]) {
          // Update the existing reaction
          messageReactions.value[reaction.message_id] = messageReactions.value[reaction.message_id].map(
            r => r.id === reaction.id ? reaction : r
          );
        }
      } else if (payload.eventType === 'DELETE') {
        const reactionId = payload.old.id;
        const messageId = payload.old.message_id;
        
        if (messageReactions.value[messageId]) {
          messageReactions.value[messageId] = messageReactions.value[messageId].filter(
            r => r.id !== reactionId
          );
        }
      }
    }
  )
  .subscribe();

};

// Add group message notification function
const showGroupMessageNotification = (message) => {
  // Don't show notification if user is currently viewing this group
  if (activeGroup.value && activeGroup.value.id === message.group_id) {
    return;
  }

  // Find the sender's info
  const sender = groupMembers.value.find(u => u.id === message.sender_id);
  const senderName = sender?.full_name || sender?.username || 'Someone';
  
  let notificationText = `${senderName} in ${activeGroup.value?.name || 'Group'}: `;
  
  if (message.image_url) {
    notificationText += '📷 Sent an image';
  } else if (message.content) {
    // Trim long messages
    notificationText += message.content.length > 50 
      ? message.content.substring(0, 50) + '...' 
      : message.content;
  } else {
    notificationText += 'Sent a message';
  }

  // Show toast notification
  $toast.info(notificationText, {
    position: 'top-right',
    duration: 5000,
    dismissible:true,
    onClick: () => {
      // When clicked, focus on the group chat
      if (message.group_id !== activeGroup.value?.id) {
        // You'll need to implement logic to find and switch to this group
        // For now, we'll just show a message
        $toast.info('Switch to group to view message', {
          position: 'top-right',
          duration: 2000
        });
      }
    }
  });

  // Also show browser notification if allowed
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`${senderName} in ${activeGroup.value?.name || 'Group'}`, {
      body: message.content || '📷 Image',
      icon: sender?.avatar_url || '/default-avatar.png'
    });
  }
};

// Watch for activeGroup changes
const currentViewedGroup = ref(null);
watch(activeGroup, (newGroup) => {
  if (newGroup) {
    currentViewedGroup.value = newGroup.id;
    fetchGroupMembers();
    fetchGroupMessages();
    setupGroupChannels(newGroup.id);
    
    // Mark messages as read when switching to group
    nextTick(() => {
      markGroupMessagesAsRead();
    });
  }
}, { immediate: true });

// Scroll to bottom when group messages change
watch(groupMessages, () => {
  nextTick(() => {
    groupMessagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
}, { deep: true });


onUnmounted(() => {
  // Clean up all channels when component is unmounted
  if (presenceChannel.value) supabase.removeChannel(presenceChannel.value);
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);
  if (groupChannel.value) supabase.removeChannel(groupChannel.value);
  
  // Clean up notification channels
  Object.values(notificationChannels.value).forEach(channel => {
    supabase.removeChannel(channel);
  });
  Object.values(groupNotificationChannels.value).forEach(channel => {
    supabase.removeChannel(channel);
  });
  
  clearTimeout(typingTimeoutRef.value);
});
</script>

<style>
.absolute.bottom-12 {
  bottom: 3rem;
  left: 0;
}
.bg-black-50 {
  background-color: rgba(0, 0, 0, 0.9);
}
</style>

