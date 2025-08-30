<template>
  <Modal :model-value="modelValue" :title="`${group.name} Settings`" 
         @update:model-value="$emit('update:modelValue', $event)" 
         @close="$emit('close')">
    <div class="space-y-6">
      <!-- Avatar Image --> 
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Group Avatar</label>
        <div class="flex items-center space-x-4">
          <div class="relative">
            <img
              :src="avatarPreview || group.avatar_url || '/default-group-avatar.png'"
              alt="Group avatar"
              class="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
            />
            <button
              @click="triggerAvatarInput"
              class="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full"
            >
              <Icon icon="mdi:camera" class="w-4 h-4" />
            </button>
          </div>
          <div>
            <button
              @click="triggerAvatarInput"
              class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              Change Avatar
            </button>
            <button
              v-if="avatarPreview || group.avatar_url"
              @click="removeAvatar"
              class="ml-2 px-3 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
            >
              Remove
            </button>
          </div>
          <input
            type="file"
            ref="avatarInput"
            @change="handleAvatarSelect"
            accept="image/*"
            class="hidden"
          />
        </div>
      </div>

      <!-- Group Info -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">Group Name</label>
          <input
            v-model="editedGroup.name"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

       
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          v-model="editedGroup.description"
          rows="3"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Describe your group..."
        ></textarea>
      </div>

      <!-- Members Management -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <label class="block text-sm font-medium text-gray-700">Group Members</label>
          <button
            @click="showAddMember = true"
            class="text-blue-500 text-sm hover:text-blue-700"
          >
            <Icon icon="mdi:plus" class="w-4 h-4 inline" /> Add Members
          </button>
        </div>
        
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="member in members"
            :key="member.id"
            class="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
          >
            <div class="flex items-center">
              <img
                :src="member.avatar_url || '/default-avatar.png'"
                :alt="member.username"
                class="w-8 h-8 rounded-full mr-3"
              />
              <span class="text-sm">
                {{ member.full_name || member.username }}
                <span v-if="member.id === group.created_by" class="text-xs text-blue-500 ml-1">(Admin)</span>
              </span>
            </div>
            <button
              v-if="member.id !== group.created_by && user.id === group.created_by"
              @click="removeMember(member.id)"
              class="text-red-500 hover:text-red-700"
            >
              <Icon icon="mdi:trash" class="w-4 h-4" />
            </button>
            <span v-else class="w-4"></span> <!-- Spacer for alignment -->
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div v-if="user.id === group.created_by" class="border-t border-red-200 pt-4">
        <h3 class="text-sm font-medium text-red-700 mb-2">Danger Zone</h3>
        <button
          @click="deleteGroup"
          class="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
        >
          Delete Group
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="saveChanges"
          :disabled="!hasChanges || saving"
          class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
        >
          <template v-if="saving">
            <Icon icon="mdi:loading" class="animate-spin w-4 h-4 inline mr-1" />
            Saving...
          </template>
          <template v-else>
            Save Changes
          </template>
        </button>
      </div>
    </div>

    <!-- Add Member Modal -->
    <Modal :model-value="showAddMember" title="Add Members" 
           @update:model-value="showAddMember = $event" 
           @close="showAddMember = false">
            <div class="space-y-4">
                    <div class="max-h-60 overflow-y-auto">
                    <div v-if="availableUsers.length === 0" class="text-center py-4 text-gray-500">
                No users available to add
            </div>
            <div
                v-for="user in availableUsers"
                :key="user.id"
                class="flex items-center p-2 hover:bg-gray-50 rounded"
            >
            <input
              :id="`add-user-${user.id}`"
              v-model="usersToAdd"
              :value="user.id"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <label :for="`add-user-${user.id}`" class="ml-3 flex items-center">
              <img
                :src="user.avatar_url || '/default-avatar.png'"
                :alt="user.username"
                class="w-8 h-8 rounded-full mr-2"
              />
              <span class="text-sm text-gray-900">
                {{ user.full_name || user.username }}
              </span>
            </label>
          </div>
        </div>
        <div class="flex justify-end space-x-3">
          <button
            @click="showAddMember = false"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="addMembers"
            :disabled="usersToAdd.length === 0"
            class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Add Selected
          </button>
        </div>
      </div>
    </Modal>
  </Modal>
</template>

<script setup>
import { ref, computed, watch,onMounted } from 'vue';
import { supabase } from '../lib/supabaseClient';   
import { Icon } from '@iconify/vue';
import Modal from './Modal.vue';

const props = defineProps({
  modelValue: Boolean,
  group: Object,
  members: Array,
  user: Object
});

const emit = defineEmits(['update:modelValue', 'close', 'group-updated', 'group-deleted']);

const editedGroup = ref({});
const avatarPreview = ref(null);
const avatarFile = ref(null);
const avatarInput = ref(null);
const saving = ref(false);
const showAddMember = ref(false);
const usersToAdd = ref([]);
const availableUsers = ref([]);

// Computed property to check if there are changes
const hasChanges = computed(() => {
  return editedGroup.value.name !== props.group.name ||
         editedGroup.value.description !== props.group.description ||
         editedGroup.value.is_public !== props.group.is_public ||
         avatarFile.value !== null;
});

// Initialize edited group data
watch(() => props.group, (newGroup) => {
  editedGroup.value = { ...newGroup };
}, { immediate: true });

// Fetch available users to add
// const fetchAvailableUsers = async () => {
//   const { data: following, error } = await supabase
//     .from('follows')
//     .select('following:following_id(*)')
//     .eq('follower_id', props.user.id);

//   if (!error) {
//     // Filter out users who are already members
//     availableUsers.value = following
//       .map(item => item.following)
//       .filter(user => !props.members.some(member => member.id === user.id));
//   }
// };


// Fetch available users to add
const fetchAvailableUsers = async () => {
  try {
    console.log('Fetching available users for user:', props.user.id);
    
    const { data: following, error } = await supabase
      .from('follows')
      .select('following:following_id(*)')
      .eq('follower_id', props.user.id);

    if (error) {
      console.error('Error fetching follows:', error);
      return;
    }

    console.log('Raw following data:', following);

    if (following && following.length > 0) {
      // Extract the following users
      const followingUsers = following.map(item => item.following);
      console.log('Following users:', followingUsers);

      // Filter out users who are already members
      availableUsers.value = followingUsers.filter(user => 
        !props.members.some(member => member.id === user.id)
      );
      
      console.log('Available users after filtering:', availableUsers.value);
    } else {
      availableUsers.value = [];
      console.log('No following users found');
    }
  } catch (err) {
    console.error('Error in fetchAvailableUsers:', err);
  }
};

// File handling methods
const triggerAvatarInput = () => avatarInput.value?.click();

const handleAvatarSelect = (event) => {
  if (!event.target.files?.length) return;

  const file = event.target.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB');
    return;
  }

  avatarFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => avatarPreview.value = e.target.result;
  reader.readAsDataURL(file);
};

const removeAvatar = () => {
  avatarFile.value = null;
  avatarPreview.value = null;
  editedGroup.value.avatar_url = null;
};

// Save changes
const saveChanges = async () => {
  try {
    saving.value = true;

    // Upload new avatar if selected
    if (avatarFile.value) {
      const avatarUrl = await uploadFile(avatarFile.value, 'group-avatars');
      editedGroup.value.avatar_url = avatarUrl;
    }

    // Update group in database
    const { error } = await supabase
      .from('groups')
      .update({
        name: editedGroup.value.name,
        description: editedGroup.value.description,
        avatar_url: editedGroup.value.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', props.group.id);

    if (error) throw error;

    emit('group-updated', editedGroup.value);
    emit('close');
  } catch (err) {
    console.error('Error updating group:', err);
    alert('Error updating group!');
  } finally {
    saving.value = false;
  }
};

const uploadFile = async (file, bucket) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${bucket}/${props.group.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// Member management
const addMembers = async () => {
  try {
    const membersToAdd = usersToAdd.value.map(userId => ({
      group_id: props.group.id,
      user_id: userId
    }));

    const { error } = await supabase
      .from('group_members')
      .insert(membersToAdd);

    if (error) throw error;

    usersToAdd.value = [];
    showAddMember.value = false;
    emit('group-updated'); // Refresh members list
  } catch (err) {
    console.error('Error adding members:', err);
  }
};

const removeMember = async (userId) => {
  if (!confirm('Are you sure you want to remove this member?')) return;

  try {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', props.group.id)
      .eq('user_id', userId);

    if (error) throw error;

    emit('group-updated'); // Refresh members list
  } catch (err) {
    console.error('Error removing member:', err);
  }
};

const deleteGroup = async () => {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

  try {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', props.group.id);

    if (error) throw error;

    emit('group-deleted', props.group.id);
    emit('close');
  } catch (err) {
    console.error('Error deleting group:', err);
  }
};

// Fetch available users when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    fetchAvailableUsers();
  }
});

// Also call it when the component mounts if needed
onMounted(() => {
  if (props.modelValue) {
    fetchAvailableUsers();
  }
});

</script>