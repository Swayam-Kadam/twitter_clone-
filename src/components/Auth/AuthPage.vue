<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as Yup from 'yup'
import { supabase } from '../lib/supabaseClient'
import GoogleAuth from './GoogleAuth.vue'

const isSignUp = ref(false)
const showReset = ref(false)
const loading = ref(false)
const error = ref(null)
const message = ref(null)
const router = useRouter()

// Form state with touched tracking
const form = reactive({
  values: {
    email: "",
    password: "",
  },
  touched: {
    email: false,
    password: false,
  },
  errors: {
    email: "",
    password: "",
  }
})

// Validation schemas
const signInSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const signUpSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const resetSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
})

// Get current validation schema
const getValidationSchema = () => {
  if (showReset.value) return resetSchema
  return isSignUp.value ? signUpSchema : signInSchema
}

// Validate form
const validateField = async (field) => {
  try {
    const schema = getValidationSchema()
    await schema.validateAt(field, form.values)
    form.errors[field] = ""
  } catch (err) {
    form.errors[field] = err.message
  }
}

// Handle input change
const handleChange = (e) => {
  const { name, value } = e.target
  form.values[name] = value
  
  // Validate field if it's been touched
  if (form.touched[name]) {
    validateField(name)
  }
}

// Handle blur (touch)
const handleBlur = (e) => {
  const { name } = e.target
  form.touched[name] = true
  validateField(name)
}

// Check if form is valid
const isValid = async () => {
  try {
    const schema = getValidationSchema()
    await schema.validate(form.values, { abortEarly: false })
    return true
  } catch (err) {
    // Set all errors
    err.inner.forEach(error => {
      form.errors[error.path] = error.message
    })
    return false
  }
}

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Mark all fields as touched
  Object.keys(form.touched).forEach(key => {
    form.touched[key] = true
  })
  
  // Validate entire form
  const valid = await isValid()
  if (!valid) return
  
  loading.value = true
  error.value = null
  message.value = null

  try {
    if (showReset.value) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        form.values.email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      )

      if (resetError) throw resetError
      
      message.value = 'Password reset link sent to your email!'
      return
    }

    if (isSignUp.value) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.values.email,
        password: form.values.password,
      })
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: profileError} = await supabase
      .from('profiles')
      .insert([
        {
          id: session.user.id,
          username: `unknown${session.user.id.slice(0, 5)}`
        }
      ])
      .select()
      .single()
      if(profileError) throw profileError
      if (signUpError) throw signUpError
      message.value = 'Check your email for confirmation!'
      router.push('/')
      window.location.reload()
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.values.email,
        password: form.values.password,
      })
      if (signInError) throw signInError
      message.value = 'Successfully signed in!'
      router.push('/')
      window.location.reload()
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const toggleAuthMode = () => {
  isSignUp.value = !isSignUp.value
  showReset.value = false
  error.value = null
  message.value = null
  // Reset form
  form.values.email = ""
  form.values.password = ""
  form.touched.email = false
  form.touched.password = false
  form.errors.email = ""
  form.errors.password = ""
}

const toggleResetPassword = () => {
  showReset.value = !showReset.value
  error.value = null
  message.value = null
  // Reset form
  form.values.email = ""
  form.values.password = ""
  form.touched.email = false
  form.touched.password = false
  form.errors.email = ""
  form.errors.password = ""
}
</script>

<template>
  <div className='min-h-screen bg-center flex justify-center items-center' style="background-image: url('/bg.jpg')">
    <div class="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">
        {{ showReset ? 'Reset Password' : isSignUp ? 'Sign Up' : 'Sign In' }}
      </h2>

      <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
        {{ error }}
      </div>

      <div v-if="message" class="mb-4 p-3 bg-green-100 text-green-700 rounded">
        {{ message }}
      </div>

      <form @submit="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block mb-1 font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            :value="form.values.email"
            @input="handleChange"
            @blur="handleBlur"
            :class="`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              form.touched.email && form.errors.email
                ? 'border-red-500'
                : 'border-gray-300'
            }`"
          />
          <div v-if="form.touched.email && form.errors.email" class="text-red-500 text-sm mt-1">
            {{ form.errors.email }}
          </div>
        </div>

        <div v-if="!showReset">
          <label for="password" class="block mb-1 font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            :value="form.values.password"
            @input="handleChange"
            @blur="handleBlur"
            :class="`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              form.touched.password && form.errors.password
                ? 'border-red-500'
                : 'border-gray-300'
            }`"
          />
          <div v-if="form.touched.password && form.errors.password" class="text-red-500 text-sm mt-1">
            {{ form.errors.password }}
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          :class="`w-full py-2 px-4 rounded text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } transition-colors`"
        >
          {{ loading ? 'Processing...' : showReset ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-4 text-center space-y-2">
        <button
          v-if="!showReset"
          @click="toggleResetPassword"
          class="text-blue-500 hover:text-blue-700 focus:outline-none block w-full"
        >
          Forgot password?
        </button>
        
        <button
          v-if="!showReset"
          @click="toggleAuthMode"
          class="text-blue-500 hover:text-blue-700 focus:outline-none block w-full"
        >
          {{ isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up" }}
        </button>

        <button
          v-if="showReset"
          @click="toggleResetPassword"
          class="text-blue-500 hover:text-blue-700 focus:outline-none block w-full"
        >
          Back to {{ isSignUp ? 'Sign Up' : 'Sign In' }}
        </button>
      </div>
      <GoogleAuth />
    </div>
  </div>
</template>