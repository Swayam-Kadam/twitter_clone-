<template>
  <div class=" p-4 border-b border-gray-300  justify-between items-center flex-row sm:flex">
    <h2 class="text-sm sm:text-xl font-bold ">Group Chats</h2>
   
    <button 
      @click="showCreateGroupModal = true"
      class="bg-blue-500 text-white px-3 py-1 text-sm sm:text-xl rounded-lg hover:bg-blue-600"
    >
      New Group
    </button>
  </div>
  
  <div class="overflow-y-auto">
    <div 
      v-for="group in groups" 
      :key="group.id"
      @click="selectGroup(group)"
      class="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
      :class="{ 'bg-blue-50': activeGroup?.id === group.id }"
    >
      <div class="flex items-center">
        <div class="relative">
          <div class="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <div v-if="group.avatar_url">
                <img
                :src="group.avatar_url || '/default-group-avatar.png'"
                :alt="group.name"
                class="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover"
              />
            </div>
            <div v-else>
            <Icon icon="mdi:account-group" class="w-6 h-6 text-blue-500" />  
            </div>
            
          </div>
        </div>
        <div class="ml-3">
          <h3 class="font-semibold sm:text-lg text-sm">{{ group.name || "unknown" }}</h3>
          <!-- <p class="text-sm text-gray-500 truncate">{{ group.description || 'No description' }}</p> -->
        </div>
      </div>
    </div>
  </div>

  <!-- Create Group Modal -->
  <!-- <Modal v-model="showCreateGroupModal" title="Create New Group">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Group Name</label>
        <input 
          v-model="newGroup.name" 
          type="text" 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <textarea 
          v-model="newGroup.description" 
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        ></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Add Members</label>
        <div class="mt-2 space-y-2">
          <div 
            v-for="user in availableUsers" 
            :key="user.id"
            class="flex items-center"
          >
            <input 
              :id="`user-${user.id}`" 
              v-model="selectedUsers" 
              :value="user.id" 
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <label :for="`user-${user.id}`" class="ml-2 block text-sm text-gray-900">
              {{ user.full_name || user.username }}
            </label>
          </div>
        </div>
      </div>
      <div class="flex justify-end space-x-3">
        <button 
          @click="showCreateGroupModal = false"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          @click="createGroup"
          class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600"
        >
          Create Group
        </button>
      </div>
    </div>
  </Modal> -->

  <Modal v-model="showCreateGroupModal" title="Create New Group">
  <div class="space-y-4">
    <!-- Group Profile Picture -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Group Profile Picture</label>
      <div class="flex items-center space-x-4">
        <div class="relative">
          <img
            :src="groupAvatarPreview || '/default-group-avatar.png'"
            alt="Group avatar preview"
            class="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
          />
          <button
            v-if="groupAvatarPreview"
            @click="removeGroupAvatar"
            class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
          >
            <Icon icon="mdi:close" class="w-3 h-3" />
          </button>
        </div>
        <div>
          <input
            type="file"
            ref="groupAvatarInput"
            @change="handleGroupAvatarSelect"
            accept="image/*"
            class="hidden"
          />
          <button
            @click="triggerGroupAvatarInput"
            class="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            {{ groupAvatarPreview ? 'Change' : 'Upload' }} Image
          </button>
          <p class="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 5MB)</p>
        </div>
      </div>
    </div>

    <!-- Group Name -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Group Name</label>
      <input 
        v-model="newGroup.name" 
        type="text" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="Enter group name"
      >
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Description</label>
      <textarea 
        v-model="newGroup.description" 
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="Optional group description"
        rows="3"
      ></textarea>
    </div>

    <!-- Add Members -->
    <div>
      <label class="block text-sm font-medium text-gray-700">Add Members</label>
      <div class="mt-2 space-y-2 max-h-40 overflow-y-auto">
        <div 
          v-for="user in availableUsers" 
          :key="user.id"
          class="flex items-center p-2 hover:bg-gray-50 rounded"
        >
          <input 
            :id="`user-${user.id}`" 
            v-model="selectedUsers" 
            :value="user.id" 
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          >
          <label :for="`user-${user.id}`" class="ml-3 flex items-center">
            <img
              :src="user.avatar_url || '/default-avatar.png'"
              :alt="user.username"
              class="w-8 h-8 rounded-full object-cover mr-2"
            />
            <span class="text-sm text-gray-900">
              {{ user.full_name || user.username }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex justify-end space-x-3 pt-4">
      <button 
        @click="showCreateGroupModal = false"
        class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button 
        @click="createGroup"
        :disabled="!newGroup.name.trim() || uploadingAvatar"
        class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <template v-if="uploadingAvatar">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating...
        </template>
        <template v-else>
          Create Group
        </template>
      </button>
    </div>
  </div>
 </Modal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { Icon } from '@iconify/vue';
import Modal from './Modal.vue';

const props = defineProps({
  activeGroup: Object,
  user: Object
});

const emit = defineEmits(['select-group']);

const groups = ref([]);
const showCreateGroupModal = ref(false);
const newGroup = ref({
  name: '',
  description: ''
});
const selectedUsers = ref([]);
const availableUsers = ref([]);
const groupAvatarPreview = ref(null);
const groupAvatarFile = ref(null);
const groupAvatarInput = ref(null);
const uploadingAvatar = ref(false);

// Add these methods
const triggerGroupAvatarInput = () => {
  groupAvatarInput.value?.click();
};

const handleGroupAvatarSelect = (event) => {
  if (!event.target.files || event.target.files.length === 0) {
    return;
  }

  const file = event.target.files[0];
  
  // Validate file type and size
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    alert('Image size must be less than 5MB');
    return;
  }

  groupAvatarFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => groupAvatarPreview.value = e.target.result;
  reader.readAsDataURL(file);
};

const removeGroupAvatar = () => {
  groupAvatarPreview.value = null;
  groupAvatarFile.value = null;
  if (groupAvatarInput.value) {
    groupAvatarInput.value.value = '';
  }
};

const fetchGroups = async () => {
  const { data, error } = await supabase
    .from('group_members')
    .select('group:groups(*)')
    .eq('user_id', props.user.id);

  if (!error) {
    groups.value = data.map(item => item.group);
  }
};

const fetchAvailableUsers = async () => {
  const { data, error } = await supabase
    .from('follows')
    .select('following:following_id(*)')
    .eq('follower_id', props.user.id);

  if (!error) {
    availableUsers.value = data.map(item => item.following);
  }
};

const selectGroup = (group) => {
  emit('select-group', group);
};

// const createGroup = async () => {
//   try {
//     // Create the group
//     const { data: group, error: groupError } = await supabase
//       .from('groups')
//       .insert([{
//         name: newGroup.value.name,
//         description: newGroup.value.description,
//         created_by: props.user.id
//       }])
//       .select()
//       .single();

//     if (groupError) throw groupError;

//     // Add members (creator + selected users)
//     const members = [
//       { group_id: group.id, user_id: props.user.id },
//       ...selectedUsers.value.map(userId => ({ group_id: group.id, user_id: userId }))
//     ];

//     const { error: membersError } = await supabase
//       .from('group_members')
//       .insert(members);

//     if (membersError) throw membersError;

//     // Reset form and refresh
//     newGroup.value = { name: '', description: '' };
//     selectedUsers.value = [];
//     showCreateGroupModal.value = false;
//     fetchGroups();
//     selectGroup(group);
//   } catch (err) {
//     console.error('Error creating group:', err);
//   }
// };


// Update your createGroup method to handle avatar upload
const createGroup = async () => {
  try {
    uploadingAvatar.value = true;
    let avatarUrl = null;

    // Upload group avatar if selected
    if (groupAvatarFile.value) {
      const fileExt = groupAvatarFile.value.name.split('.').pop();
      const fileName = `group-avatars/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(fileName, groupAvatarFile.value);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-avatars')
        .getPublicUrl(fileName);

      avatarUrl = publicUrl;
    }

    // Create the group with avatar
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert([{
        name: newGroup.value.name,
        description: newGroup.value.description,
        created_by: props.user.id,
        avatar_url: avatarUrl // Add avatar URL here
      }])
      .select()
      .single();

    if (groupError) throw groupError;

    // Add members (creator + selected users)
    const members = [
      { group_id: group.id, user_id: props.user.id },
      ...selectedUsers.value.map(userId => ({ group_id: group.id, user_id: userId }))
    ];

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(members);

    if (membersError) throw membersError;

    // Reset form
    newGroup.value = { name: '', description: '' };
    selectedUsers.value = [];
    removeGroupAvatar();
    showCreateGroupModal.value = false;
    
    // Refresh groups list
    fetchGroups();
    selectGroup(group);
  } catch (err) {
    console.error('Error creating group:', err);
    alert('Error creating group!');
  } finally {
    uploadingAvatar.value = false;
  }
};

onMounted(() => {
  fetchGroups();
  fetchAvailableUsers();
});
</script>