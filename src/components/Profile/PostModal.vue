<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps({
  isOpen: Boolean,
  onClose: Function,
  onPostCreated: Function
})

const emit = defineEmits(['onClose', 'onPostCreated'])

const content = ref('')
const imageFile = ref(null)
const imagePreview = ref(null)
const isUploading = ref(false)
const error = ref(null)

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB'
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  error.value = null
}

const uploadImage = async (file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath)

  return publicUrl
}

const handleSubmit = async (e) => {
  e.preventDefault()
  isUploading.value = true
  error.value = null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('User not authenticated')
    }

    let imageUrl = null
    
    if (imageFile.value) {
      imageUrl = await uploadImage(imageFile.value)
    }

    const { data, error: postError } = await supabase
      .from('posts')
      .insert([
        {
          user_id: session.user.id,
          content: content.value,
          image_url: imageUrl
        }
      ])
      .select()
      .single()

    if (postError) throw postError

    content.value = ''
    imageFile.value = null
    imagePreview.value = null
    emit('onClose')
    
    if (props.onPostCreated) {
      emit('onPostCreated', data)
    }
    location.reload()
  } catch (err) {
    console.error('Error creating post:', err)
    error.value = err.message || 'Failed to create post'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold dark:text-white">Create New Post</h2>
        <button 
          @click="emit('onClose')"
          class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          :disabled="isUploading"
        >
          &times;
        </button>
      </div>
      
      <form @submit="handleSubmit">
        <div class="mb-4">
          <textarea
            v-model="content"
            @input="e => content = e.target.value"
            placeholder="What's on your mind?"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            rows="4"
            maxlength="280"
            required
          />
          <div class="text-right text-sm text-gray-500">
            {{ content.length }}/280
          </div>
        </div>
        
        <div class="mb-4">
          <label class="block text-gray-700 dark:text-gray-300 mb-2">Add Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            @change="handleFileChange"
            class="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            :disabled="isUploading"
          />
          <div v-if="imagePreview" class="mt-2">
            <img 
              :src="imagePreview" 
              alt="Preview" 
              class="max-h-40 rounded-md"
            />
            <button
              type="button"
              @click="() => {
                imageFile = null
                imagePreview = null
              }"
              class="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Remove Image
            </button>
          </div>
        </div>
        
        <div v-if="error" class="mb-4 text-red-500 text-sm">
          {{ error }}
        </div>
        
        <div class="flex justify-end space-x-2">
          <button
            type="button"
            @click="emit('onClose')"
            class="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            :disabled="isUploading"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isUploading || !content"
            class="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {{ isUploading ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>