<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="w-1/3 border-r border-gray-300 bg-white">
      <div class="p-4 border-b border-gray-300 flex justify-between items-center">
        <h2 class="text-xl font-bold">Messages</h2>
      </div>

      <FollowingList 
        :following="following"
        :online-users="onlineUsers"
        :active-chat="activeChat"
        :get-other-user="getOtherUser"
        @select-user="handleSelectUser"
      />

      <GroupList 
        :user="user" 
        :active-group="activeGroup"
        @select-group="handleSelectGroup"
      />
    </div>

    <!-- Chat Window -->
    <div class="flex-1 flex flex-col">
      <!-- 1:1 Chat -->
      <template v-if="activeChat">
        <ChatHeader 
          :other-user="following.find(u => u.id === getOtherUser(activeChat))"
          :online-users="onlineUsers"
          :is-typing="isTyping"
          :typing-user="typingUser"
          @delete-chat="deleteChat(activeChat.id)"
        />

        <div class="flex-1 p-4 mt-15 overflow-y-auto bg-gray-50" style="background-image: url('/bg.jpg')" @scroll="handleScroll">
          <div v-for="message in messages" :key="message.id"
            class="mb-4 flex"
            :class="{
              'justify-end': message.sender_id === user.id,
              'justify-start': message.sender_id !== user.id
            }"
          >
            <MessageBubble 
              :message="message"
              :is-own-message="message.sender_id === user.id"
              @delete-message="deleteChat"
            />
          </div>

          <TypingIndicator :is-typing="isTyping && typingUser === getOtherUser(activeChat)" />
          <div ref="messagesEndRef" />
        </div>

        <MessageInput 
          v-model:message="newMessage"
          :uploading="uploading"
          :has-file="!!selectedFile"
          :image-preview="imagePreview"
          :show-emoji-picker="showEmojiPicker"
          @send-message="sendMessage"
          @update:message="handleTyping"
          @toggle-emoji-picker="toggleEmojiPicker"
          @emoji-selected="onEmojiClick"
          @remove-last-character="removeLastCharacter"
          @trigger-file-input="triggerFileInput"
          @clear-image-preview="clearImagePreview"
        />
      </template>

      <!-- Group Chat -->
      <template v-else-if="activeGroup">
        <GroupChatHeader 
          :group="activeGroup"
          :members="groupMembers"
          @show-settings="showGroupSettings = true"
          @show-info="showGroupInfo = true"
        />

        <div class="flex-1 p-4 mt-15 overflow-y-auto bg-gray-50" style="background-image: url('/bg.jpg')" @scroll="handleScroll">
          <div v-for="message in groupMessages" :key="message.id" 
            class="mb-4 flex group/message relative"
            :class="{
              'justify-end': message.sender_id === user.id,
              'justify-start': message.sender_id !== user.id
            }"
          >
            <GroupMessageBubble 
              :message="message"
              :is-own-message="message.sender_id === user.id"
              :message-reactions="messageReactions"
              :current-user-id="user.id"
              @delete-message="deleteGroupMessage"
              @toggle-reaction="toggleReaction"
              @show-reaction-picker="showReactionPicker"
            />
          </div>
          <div ref="groupMessagesEndRef" />
        </div>

        <ReactionPicker 
          :show="!!showReactionPickerForMessage"
          @close="closeReactionPicker"
          @add-reaction="addReaction"
          @show-more-emojis="showReactionEmojiPicker = true"
        />

        <FullEmojiPicker 
          :show="showReactionEmojiPicker"
          @close="showReactionEmojiPicker = false"
          @emoji-selected="onEmojiSelectForReaction"
        />

        <MessageInput 
          v-model:message="newMessage"
          :uploading="uploading"
          :has-file="!!selectedFile"
          :image-preview="imagePreview"
          :show-emoji-picker="showEmojiPicker"
          @send-message="sendGroupMessage"
          @update:message="handleTyping"
          @toggle-emoji-picker="toggleEmojiPicker"
          @emoji-selected="onEmojiClick"
          @remove-last-character="removeLastCharacter"
          @trigger-file-input="triggerFileInput"
          @clear-image-preview="clearImagePreview"
        />
      </template>

      <EmptyChatState v-else />
    </div>

    <!-- Modals -->
    <GroupInfoModal 
      v-if="showGroupInfo" 
      :group="activeGroup"
      :members="groupMembers"
      @close="showGroupInfo = false"
    />

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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { supabase } from '../../lib/supabaseClient'
import { onClickOutside } from '@vueuse/core'

// Components
import FollowingList from './FollowingList.vue'
import GroupList from '../GroupList.vue'
import ChatHeader from './ChatHeader.vue'
import GroupChatHeader from './GroupChatHeader.vue'
import MessageBubble from './MessageBubble.vue'
import GroupMessageBubble from './GroupMessageBubble.vue'
import MessageInput from './MessageInput.vue'
import ReactionPicker from './ReactionPicker.vue'
import FullEmojiPicker from './FullEmojiPicker.vue'
import TypingIndicator from './TypingIndicator.vue'
import EmptyChatState from './EmptyChatState.vue'
import GroupInfoModal from '../GroupInfoModal.vue'
import GroupSettingsModal from '../GroupSettingsModal.vue'

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

const user = computed(() => props.session.user)
const following = ref([])
const activeChat = ref(null)
const messages = ref([])
const newMessage = ref('')
const onlineUsers = ref([])
const isTyping = ref(false)
const typingUser = ref(null)
const messagesEndRef = ref(null)
const typingTimeoutRef = ref(null)
const showEmojiPicker = ref(false)
const uploading = ref(false)
const imagePreview = ref(null)
const selectedFile = ref(null)
const fileInput = ref(null)

// Group chat state
const activeGroup = ref(null)
const groupMessages = ref([])
const groupMembers = ref([])
const showGroupInfo = ref(false)
const showGroupSettings = ref(false)
const groupMessagesEndRef = ref(null)

// Reactions
const messageReactions = ref({})
const showReactionPickerForMessage = ref(null)
const showReactionEmojiPicker = ref(false)

// Channels
const presenceChannel = ref(null)
const messagesChannel = ref(null)
const typingChannel = ref(null)
const readReceiptChannel = ref(null)
const groupChannel = ref(null)

// ... (all the existing methods and logic remain the same, just organized)

// Methods (keep all your existing methods exactly as they were)
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


const getOtherUser = (chat) => {
  return chat.user1_id === user.value.id ? chat.user2_id : chat.user1_id;
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

    // Send the message
    const { error } = await supabase
      .from('messages')
      .insert([{
        chat_id: activeChat.value.id,
        sender_id: user.value.id,
        content: newMessage.value,
        image_url: imageUrl
      }]);

    if (!error) {
      newMessage.value = '';
      selectedFile.value = null;
      imagePreview.value = null;
      // Update chat's last updated time
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChat.value.id);
    }
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


const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};


const onEmojiClick = (emojiData) => {
  newMessage.value += emojiData.emoji || emojiData.char || emojiData.i;
  showEmojiPicker.value = false; // Close the message input emoji picker
};


const removeLastCharacter = () => {
  if (newMessage.value.length > 0) {
    // Create an array from the string to properly handle emojis and other multi-byte characters
    const chars = [...newMessage.value];
    chars.pop(); // Remove the last character
    newMessage.value = chars.join('');
  }
};


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


const setupChatChannels = (chatId) => {
  // Clean up previous channels
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);

  // Messages channel - modified to handle delete differently
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
          
          // If it's our message, track delivery when received by server
          if (payload.new.sender_id === user.value.id) {
            await trackMessageDelivery(payload.new.id);
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
}};

// Group methods
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

// Reaction methods
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

// Delivery tracking methods
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
const trackGroupMessageRead = async (messageIds) => { /* ... */ }

const markMessagesAsRead = async () => {
  if (!activeChat.value || !user.value) return;

  const unreadMessages = messages.value.filter(
    msg => msg.sender_id !== user.value.id && !msg.read_at
  );

  if (unreadMessages.length > 0 && isChatVisible()) {
    await trackMessageRead(unreadMessages.map(msg => msg.id));
  }
};

const markGroupMessagesAsRead = async () => { /* ... */ }


const isChatVisible = () => {
  return document.visibilityState === 'visible' && 
         activeChat.value && 
         activeChat.value.id === currentViewedChat.value;
};


const isGroupChatVisible = () => { /* ... */ }

const handleVisibilityChange = () => {
  if (isChatVisible()) {
    markMessagesAsRead();
  }
};


const handleScroll = () => {
  if (isChatVisible()) {
    markMessagesAsRead();
  }
};


// Group event handlers
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

// Lifecycle hooks (keep as is)
onMounted(() => {
  fetchFollowing();
  setupPresenceChannel();

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

onUnmounted(() => {
  // Clean up all channels when component is unmounted
  if (presenceChannel.value) supabase.removeChannel(presenceChannel.value);
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);
  if (groupChannel.value) supabase.removeChannel(groupChannel.value);
  clearTimeout(typingTimeoutRef.value);
});

// Watchers (keep as is)
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

watch(groupMessages, () => {
  nextTick(() => {
    groupMessagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });
}, { deep: true });

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