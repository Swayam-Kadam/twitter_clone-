<template>
  <div class="flex h-screen bg-gray-100">
    <div class="w-1/3 border-r border-gray-300 bg-white">
      <Sidebar
        :following="following"
        :online-users="onlineUsers"
        :user="user"
        :active-chat="activeChat"
        :active-group="activeGroup"
        @select-user="handleSelectUser"
        @select-group="handleSelectGroup"
      />
    </div>

    <div class="flex-1 flex flex-col">
      <template v-if="activeChat">
        <ChatHeader
          :user="user"
          :active-chat="activeChat"
          :following="following"
          :online-users="onlineUsers"
          :is-typing="isTyping"
          :typing-user="typingUser"
          @delete-chat="deleteChat"
        />
        <MessageList
          :messages="messages"
          :user="user"
          @scroll="handleScroll"
        />
        <MessageInput
          :new-message="newMessage"
          :uploading="uploading"
          :image-preview="imagePreview"
          @update:message="newMessage = $event"
          @send-message="sendMessage"
          @typing="handleTyping"
          @file-select="handleFileSelect"
          @clear-preview="clearImagePreview"
        />
      </template>

      <template v-else-if="activeGroup">
        <GroupHeader
          :group="activeGroup"
          :members="groupMembers"
          @show-group-settings="showGroupSettings = true"
          @show-group-info="showGroupInfo = true"
        />
        <MessageList
          :messages="groupMessages"
          :user="user"
          :is-group="true"
          :reactions="messageReactions"
          @scroll="handleScroll"
          @show-reaction-picker="showReactionPicker"
        />
        <MessageInput
          :new-message="newMessage"
          :uploading="uploading"
          :image-preview="imagePreview"
          @update:message="newMessage = $event"
          @send-message="sendGroupMessage"
          @typing="handleTyping"
          @file-select="handleFileSelect"
          @clear-preview="clearImagePreview"
        />
      </template>

      <div v-else class="flex-1 flex items-center justify-center bg-gray-50" style="background-image: url('/bg.jpg')">
        <div class="text-center">
          <h3 class="text-xl font-semibold text-blue-600 bg-gray-100 rounded p-1">Select a user to start chatting...</h3>
        </div>
      </div>
    </div>
  </div>

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

  <ReactionPicker
    v-if="showReactionPickerForMessage"
    :message-id="showReactionPickerForMessage"
    :common-emojis="commonEmojis"
    @select-emoji="addReaction"
    @show-more-emojis="showReactionEmojiPicker = true"
    @close="closeReactionPicker"
  />

  <FullEmojiPicker
    v-if="showReactionEmojiPicker"
    @select-emoji="onEmojiSelectForReaction"
    @close="showReactionEmojiPicker = false"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { supabase } from '../../lib/supabaseClient';
import { Icon } from '@iconify/vue';
import { onClickOutside } from '@vueuse/core';
import Sidebar from './Sidebar.vue';
import ChatHeader from './ChatHeader.vue';
import GroupHeader from './GroupHeader.vue';
import MessageList from './MessageList.vue';
import MessageInput from './MessageInput.vue';
import GroupInfoModal from '../GroupInfoModal.vue';
import GroupSettingsModal from '../GroupSettingsModal.vue';
import ReactionPicker from './ReactionPicker.vue';
import FullEmojiPicker from './FullEmojiPicker.vue';

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
});

const user = computed(() => props.session.user);
const following = ref([]);
const activeChat = ref(null);
const messages = ref([]);
const newMessage = ref('');
const onlineUsers = ref([]);
const isTyping = ref(false);
const typingUser = ref(null);
const typingTimeoutRef = ref(null);
const uploading = ref(false);
const imagePreview = ref(null);
const selectedFile = ref(null);

const activeGroup = ref(null);
const groupMessages = ref([]);
const groupMembers = ref([]);
const showGroupInfo = ref(false);
const showGroupSettings = ref(false);

const messageReactions = ref({});
const showReactionPickerForMessage = ref(null);
const showReactionEmojiPicker = ref(false);
const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '👎', '🎉', '🤔', '🔥'];

const presenceChannel = ref(null);
const messagesChannel = ref(null);
const typingChannel = ref(null);
const readReceiptChannel = ref(null);
const groupChannel = ref(null);
const currentViewedChat = ref(null);
const currentViewedGroup = ref(null);

const fetchFollowing = async () => {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`following:following_id(*)`)
      .eq('follower_id', user.value.id);
    if (error) throw error;
    following.value = data.map(item => item.following);
  } catch (err) {
    console.error('Error fetching following:', err);
  }
};

const handleSelectUser = async (selectedUser) => {
  // Defensive check for the specific case where selectedUser or its ID is not a valid UUID
  if (!selectedUser || !selectedUser.id || selectedUser.id === 'undefined') {
    console.error("Error: selectedUser or its ID is undefined or invalid.");
    return;
  }
  activeGroup.value = null;
  try {
    const { data: existingChats, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user1_id.eq.${user.value.id},user2_id.eq.${selectedUser.id}),and(user1_id.eq.${selectedUser.id},user2_id.eq.${user.value.id})`);
    if (chatError) throw chatError;
    if (existingChats.length > 0) {
      activeChat.value = existingChats[0];
    } else {
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert([{ user1_id: user.value.id, user2_id: selectedUser.id }])
        .select()
        .single();
      if (newChatError) throw newChatError;
      activeChat.value = newChat;
    }
  } catch (err) {
    console.error('Error handling chat:', err);
  }
};

const deleteChat = async (messageId) => {
  try {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting message:', err);
  }
};

const fetchMessages = async () => {
  if (!activeChat.value) return;
  const { data, error } = await supabase
    .from('messages')
    .select(`*, sender:profiles(*)`)
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
    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, selectedFile.value);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath);
      imageUrl = publicUrl;
    }
    const { data, error } = await supabase.from('messages').insert([{ chat_id: activeChat.value.id, sender_id: user.value.id, content: newMessage.value, image_url: imageUrl }]).select('*, sender:profiles(*)').single();
    if (error) throw error;
    if (data) {
      messages.value = [...messages.value, data];
      await supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', activeChat.value.id);
    }
    newMessage.value = '';
    selectedFile.value = null;
    imagePreview.value = null;
  } catch (err) {
    console.error('Error sending message:', err);
    alert('Error sending message!');
  } finally {
    uploading.value = false;
  }
};

const handleTyping = () => {
  if (!activeChat.value && !activeGroup.value) return;
  const channel = activeChat.value ? `typing:${activeChat.value.id}` : `typing-group:${activeGroup.value.id}`;
  supabase.channel(channel)
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.value.id }
    });
  clearTimeout(typingTimeoutRef.value);
  typingTimeoutRef.value = setTimeout(() => {
    isTyping.value = false;
    typingUser.value = null;
  }, 2000);
};

const handleFileSelect = (file) => {
  selectedFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => imagePreview.value = e.target.result;
  reader.readAsDataURL(selectedFile.value);
};

const clearImagePreview = () => {
  imagePreview.value = null;
  selectedFile.value = null;
};

const setupPresenceChannel = () => {
  if (presenceChannel.value) supabase.removeChannel(presenceChannel.value);
  presenceChannel.value = supabase.channel('online-users', { config: { presence: { key: user.value.id } } });
  presenceChannel.value
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.value.presenceState();
      onlineUsers.value = Object.keys(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.value.track({ user_id: user.value.id, online_at: new Date().toISOString() });
      }
    });
};

const setupChatChannels = (chatId) => {
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);

  messagesChannel.value = supabase
    .channel(`messages:${chatId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, async (payload) => {
      if (!messages.value.some(msg => msg.id === payload.new.id)) {
        const { data: newMessage, error } = await supabase.from('messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single();
        if (error) console.error('Error fetching new message:', error);
        if (newMessage) {
          messages.value = [...messages.value, newMessage];
          if (payload.new.sender_id === user.value.id) {
            await trackMessageDelivery(payload.new.id);
          }
        }
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, async (payload) => {
      const { data: updatedMessage, error } = await supabase.from('messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single();
      if (error) console.error('Error fetching updated message:', error);
      if (updatedMessage) {
        messages.value = messages.value.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg);
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
      messages.value = messages.value.filter(msg => msg.id !== payload.old.id);
    })
    .subscribe();

  typingChannel.value = supabase.channel(`typing:${chatId}`, { config: { broadcast: { ack: true, self: false } } }).on('broadcast', { event: 'typing' }, (payload) => {
    if (payload.payload.user_id !== user.value.id) {
      isTyping.value = true;
      typingUser.value = payload.payload.user_id;
      clearTimeout(typingTimeoutRef.value);
      typingTimeoutRef.value = setTimeout(() => { isTyping.value = false; typingUser.value = null; }, 2000);
    }
  }).subscribe();
};

const trackMessageDelivery = async (messageId) => {
  try {
    await supabase.from('messages').update({ delivered_at: new Date().toISOString() }).eq('id', messageId);
  } catch (err) {
    console.error('Error tracking message delivery:', err);
  }
};

const isChatVisible = () => document.visibilityState === 'visible' && activeChat.value && activeChat.value.id === currentViewedChat.value;
const isGroupChatVisible = () => document.visibilityState === 'visible' && activeGroup.value && activeGroup.value.id === currentViewedGroup.value;

const trackMessageRead = async (messageIds) => {
  try {
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', messageIds);
  } catch (err) {
    console.error('Error tracking message read status:', err);
  }
};

const markMessagesAsRead = async () => {
  if (!activeChat.value || !user.value) return;
  const unreadMessages = messages.value.filter(msg => msg.sender_id !== user.value.id && !msg.read_at);
  if (unreadMessages.length > 0 && isChatVisible()) {
    await trackMessageRead(unreadMessages.map(msg => msg.id));
  }
};

const handleSelectGroup = async (group) => {
  activeGroup.value = group;
  activeChat.value = null;
  fetchGroupMembers();
  fetchGroupMessages();
  setupGroupChannels(group.id);
};

const fetchGroupMembers = async () => {
  if (!activeGroup.value) return;
  const { data, error } = await supabase.from('group_members').select('user:profiles(*)').eq('group_id', activeGroup.value.id);
  if (!error) {
    groupMembers.value = data.map(item => item.user);
  }
};

const fetchGroupMessages = async () => {
  if (!activeGroup.value) return;
  const { data, error } = await supabase.from('group_messages').select('*, sender:profiles(*)').eq('group_id', activeGroup.value.id).order('created_at', { ascending: true });
  if (!error) {
    groupMessages.value = data;
    const messageIds = data.map(msg => msg.id);
    if (messageIds.length > 0) {
      await fetchMessageReactions(messageIds);
    }
  }
};

const sendGroupMessage = async () => {
  if ((!newMessage.value.trim() && !selectedFile.value) || !activeGroup.value) return;
  try {
    uploading.value = true;
    let imageUrl = null;
    if (selectedFile.value) {
      const fileExt = selectedFile.value.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, selectedFile.value);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath);
      imageUrl = publicUrl;
    }
    const { data, error } = await supabase.from('group_messages').insert([{ group_id: activeGroup.value.id, sender_id: user.value.id, content: newMessage.value, image_url: imageUrl }]).select('*, sender:profiles(*)').single();
    if (error) throw error;
    if (data) {
      groupMessages.value = [...groupMessages.value, data];
    }
    newMessage.value = '';
    selectedFile.value = null;
    imagePreview.value = null;
  } catch (err) {
    console.error('Error sending group message:', err);
    alert('Error sending group message!');
  } finally {
    uploading.value = false;
  }
};

const setupGroupChannels = (groupId) => {
  if (groupChannel.value) supabase.removeChannel(groupChannel.value);
  groupChannel.value = supabase
    .channel(`group:${groupId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
      if (!groupMessages.value.some(msg => msg.id === payload.new.id)) {
        const { data: newGroupMessage, error } = await supabase.from('group_messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single();
        if (error) console.error('Error fetching new group message:', error);
        if (newGroupMessage) {
          groupMessages.value = [...groupMessages.value, newGroupMessage];
          if (payload.new.sender_id === user.value.id) {
            await trackGroupMessageDelivery(payload.new.id);
          }
        }
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
      const { data: updatedGroupMessage, error } = await supabase.from('group_messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single();
      if (error) console.error('Error fetching updated group message:', error);
      if (updatedGroupMessage) {
        groupMessages.value = groupMessages.value.map(msg => msg.id === updatedGroupMessage.id ? updatedGroupMessage : msg);
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' }, (payload) => {
      groupMessages.value = groupMessages.value.filter(msg => msg.id !== payload.old.id);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, () => {
      fetchGroupMembers();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions', filter: `group_id=eq.${groupId}` }, (payload) => {
      if (payload.eventType === 'INSERT') {
        const reaction = payload.new;
        if (!messageReactions.value[reaction.message_id]) {
          messageReactions.value[reaction.message_id] = [];
        }
        messageReactions.value[reaction.message_id] = messageReactions.value[reaction.message_id].filter(r => !(r.user_id === reaction.user_id && r.message_id === reaction.message_id));
        messageReactions.value[reaction.message_id].push(reaction);
      } else if (payload.eventType === 'UPDATE') {
        const reaction = payload.new;
        if (messageReactions.value[reaction.message_id]) {
          messageReactions.value[reaction.message_id] = messageReactions.value[reaction.message_id].map(r => r.id === reaction.id ? reaction : r);
        }
      } else if (payload.eventType === 'DELETE') {
        const reactionId = payload.old.id;
        const messageId = payload.old.message_id;
        if (messageReactions.value[messageId]) {
          messageReactions.value[messageId] = messageReactions.value[messageId].filter(r => r.id !== reactionId);
        }
      }
    })
    .subscribe();
};

const fetchMessageReactions = async (messageIds) => {
  try {
    const { data, error } = await supabase.from('message_reactions').select('*').in('message_id', messageIds).eq('group_id', activeGroup.value.id);
    if (!error) {
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

const addReaction = async (emoji) => {
  if (!showReactionPickerForMessage.value || !activeGroup.value) return;
  try {
    const messageId = showReactionPickerForMessage.value;
    const existingReaction = (messageReactions.value[messageId] || []).find(reaction => reaction.user_id === user.value.id);
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        await supabase.from('message_reactions').delete().eq('id', existingReaction.id);
      } else {
        await supabase.from('message_reactions').update({ emoji: emoji, created_at: new Date().toISOString() }).eq('id', existingReaction.id);
      }
    } else {
      await supabase.from('message_reactions').insert([{ message_id: messageId, group_id: activeGroup.value.id, user_id: user.value.id, emoji: emoji }]);
    }
    closeReactionPicker();
  } catch (err) {
    console.error('Error adding reaction:', err);
  }
};

const showReactionPicker = (messageId) => {
  showReactionPickerForMessage.value = messageId;
};

const closeReactionPicker = () => {
  showReactionPickerForMessage.value = null;
  showReactionEmojiPicker.value = false;
};

const onEmojiSelectForReaction = (emojiData) => {
  const emoji = emojiData.emoji || emojiData.char || emojiData.i;
  if (emoji) {
    addReaction(emoji);
    showReactionEmojiPicker.value = false;
  }
};

const markGroupMessagesAsRead = async () => {
  if (!activeGroup.value || !user.value) return;
  const unreadMessages = groupMessages.value.filter(msg => msg.sender_id !== user.value.id && !msg.read_at);
  if (unreadMessages.length > 0 && isGroupChatVisible()) {
    await trackMessageRead(unreadMessages.map(msg => msg.id));
  }
};

const trackGroupMessageDelivery = async (messageId) => {
  try {
    await supabase.from('group_messages').update({ delivered_at: new Date().toISOString() }).eq('id', messageId);
  } catch (err) {
    console.error('Error tracking group message delivery:', err);
  }
};

onMounted(() => {
  fetchFollowing();
  setupPresenceChannel();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
});

onUnmounted(() => {
  if (presenceChannel.value) supabase.removeChannel(presenceChannel.value);
  if (messagesChannel.value) supabase.removeChannel(messagesChannel.value);
  if (typingChannel.value) supabase.removeChannel(typingChannel.value);
  if (readReceiptChannel.value) supabase.removeChannel(readReceiptChannel.value);
  if (groupChannel.value) supabase.removeChannel(groupChannel.value);
  clearTimeout(typingTimeoutRef.value);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleFocus);
});

const handleVisibilityChange = () => {
  if (isChatVisible()) markMessagesAsRead();
  if (isGroupChatVisible()) markGroupMessagesAsRead();
};

const handleFocus = () => {
  if (isChatVisible()) markMessagesAsRead();
  if (isGroupChatVisible()) markGroupMessagesAsRead();
};

const handleScroll = () => {
  // This is a placeholder for potential future functionality, like lazy loading messages.
};

watch(activeChat, (newChat) => {
  if (newChat) {
    currentViewedChat.value = newChat.id;
    fetchMessages();
    setupChatChannels(newChat.id);
    nextTick(() => markMessagesAsRead());
  }
});

watch(activeGroup, (newGroup) => {
  if (newGroup) {
    currentViewedGroup.value = newGroup.id;
    fetchGroupMembers();
    fetchGroupMessages();
    setupGroupChannels(newGroup.id);
    nextTick(() => markGroupMessagesAsRead());
  }
});

const handleGroupUpdated = (updatedGroup) => {
  activeGroup.value = { ...activeGroup.value, ...updatedGroup };
};

const handleGroupDeleted = (deletedGroupId) => {
  if (activeGroup.value?.id === deletedGroupId) {
    activeGroup.value = null;
  }
};
</script>