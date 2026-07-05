<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import * as Yup from 'yup'
import { supabase } from '../lib/supabaseClient'
import { ensureUserProfile } from '../lib/ensureUserProfile'
import GoogleAuth from './GoogleAuth.vue'

const isSignUp = ref(false)
const showReset = ref(false)
const loading = ref(false)
const error = ref(null)
const message = ref(null)
const router = useRouter()

const form = reactive({
  values: { email: '', password: '' },
  touched: { email: false, password: false },
  errors: { email: '', password: '' },
})

const pageTitle = computed(() => {
  if (showReset.value) return 'Reset Password'
  return isSignUp.value ? 'Create Account' : 'Welcome Back'
})

const pageSubtitle = computed(() => {
  if (showReset.value) return 'Enter your email and we\'ll send you a reset link'
  return isSignUp.value
    ? 'Join the conversation — sign up in seconds'
    : 'Sign in to continue chatting with friends'
})

const submitLabel = computed(() => {
  if (loading.value) return 'Processing...'
  if (showReset.value) return 'Send Reset Link'
  return isSignUp.value ? 'Create Account' : 'Sign In'
})

const signInSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

const signUpSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

const resetSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
})

const getValidationSchema = () => {
  if (showReset.value) return resetSchema
  return isSignUp.value ? signUpSchema : signInSchema
}

const validateField = async (field) => {
  try {
    await getValidationSchema().validateAt(field, form.values)
    form.errors[field] = ''
  } catch (err) {
    form.errors[field] = err.message
  }
}

const handleChange = (e) => {
  const { name, value } = e.target
  form.values[name] = value
  if (form.touched[name]) validateField(name)
}

const handleBlur = (e) => {
  form.touched[e.target.name] = true
  validateField(e.target.name)
}

const isValid = async () => {
  try {
    await getValidationSchema().validate(form.values, { abortEarly: false })
    return true
  } catch (err) {
    err.inner.forEach((e) => { form.errors[e.path] = e.message })
    return false
  }
}

const resetForm = () => {
  form.values.email = ''
  form.values.password = ''
  form.touched.email = false
  form.touched.password = false
  form.errors.email = ''
  form.errors.password = ''
}

const handleSubmit = async (e) => {
  e.preventDefault()
  Object.keys(form.touched).forEach((key) => { form.touched[key] = true })
  if (!(await isValid())) return

  loading.value = true
  error.value = null
  message.value = null

  try {
    if (showReset.value) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        form.values.email,
        { redirectTo: `${window.location.origin}/update-password` }
      )
      if (resetError) throw resetError
      message.value = 'Password reset link sent! Check your inbox.'
      return
    }

    if (isSignUp.value) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.values.email,
        password: form.values.password,
      })
      if (signUpError) throw signUpError

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setTimeout(() => ensureUserProfile(session.user).catch(console.error), 0)
      }

      message.value = 'Account created! Check your email to confirm.'
      router.push('/')
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.values.email,
        password: form.values.password,
      })
      if (signInError) throw signInError
      message.value = 'Welcome back!'
      router.push('/')
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
  resetForm()
}

const toggleResetPassword = () => {
  showReset.value = !showReset.value
  error.value = null
  message.value = null
  resetForm()
}
</script>

<template>
  <div class="chat-auth-screen min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl">

      <!-- Brand panel -->
      <div class="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 bg-[#075e54]/40 backdrop-blur-sm border-r border-white/10">
        <div>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Icon icon="mdi:chat-processing" class="text-3xl text-white" />
            </div>
            <span class="text-2xl font-bold text-white tracking-tight">ChatFlow</span>
          </div>
          <h1 class="text-3xl font-bold text-white leading-tight mb-4">
            Connect.<br />Chat.<br />Share.
          </h1>
          <p class="text-white/70 text-sm leading-relaxed">
            Real-time messaging, group chats, and media sharing — all in one place.
          </p>
        </div>

        <!-- Decorative chat bubbles -->
        <div class="space-y-3 mt-8">
          <div class="flex justify-start">
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
              <p class="text-white/90 text-sm">Hey! Are you joining the group chat? 👋</p>
              <p class="text-white/40 text-xs mt-1 text-right">10:24 AM</p>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="bg-[#dcf8c6]/90 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm">
              <p class="text-gray-800 text-sm">Yes! Just signed up 🎉</p>
              <p class="text-gray-500 text-xs mt-1 text-right flex items-center justify-end gap-1">
                10:25 AM
                <Icon icon="mdi:check-all" class="text-sm text-[#34b7f1]" />
              </p>
            </div>
          </div>
          <div class="flex justify-start">
            <div class="bg-white/15 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[70%]">
              <p class="text-white/90 text-sm">Awesome, see you there! 🚀</p>
              <p class="text-white/40 text-xs mt-1 text-right">10:25 AM</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="flex-1 bg-white p-8 sm:p-10 flex flex-col justify-center">
        <div class="lg:hidden flex items-center gap-2 mb-6">
          <div class="w-9 h-9 rounded-full bg-[#128c7e] flex items-center justify-center">
            <Icon icon="mdi:chat-processing" class="text-xl text-white" />
          </div>
          <span class="text-xl font-bold text-[#128c7e]">ChatFlow</span>
        </div>

        <div class="mb-7">
          <h2 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ pageSubtitle }}</p>
        </div>

        <!-- Alerts -->
        <div v-if="error" class="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <Icon icon="mdi:alert-circle" class="text-red-500 text-lg shrink-0 mt-0.5" />
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>

        <div v-if="message" class="mb-5 flex items-start gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
          <Icon icon="mdi:check-circle" class="text-green-500 text-lg shrink-0 mt-0.5" />
          <p class="text-green-700 text-sm">{{ message }}</p>
        </div>

        <form @submit="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <div class="relative">
              <Icon icon="mdi:email-outline" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                :value="form.values.email"
                @input="handleChange"
                @blur="handleBlur"
                :class="[
                  'w-full pl-11 pr-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-[#128c7e]/30 focus:border-[#128c7e] transition-colors',
                  form.touched.email && form.errors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-gray-50/50',
                ]"
              />
            </div>
            <p v-if="form.touched.email && form.errors.email" class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <Icon icon="mdi:alert-circle-outline" class="text-sm" />
              {{ form.errors.email }}
            </p>
          </div>

          <!-- Password -->
          <div v-if="!showReset">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div class="relative">
              <Icon icon="mdi:lock-outline" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                :value="form.values.password"
                @input="handleChange"
                @blur="handleBlur"
                :class="[
                  'w-full pl-11 pr-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-[#128c7e]/30 focus:border-[#128c7e] transition-colors',
                  form.touched.password && form.errors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200 bg-gray-50/50',
                ]"
              />
            </div>
            <p v-if="form.touched.password && form.errors.password" class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <Icon icon="mdi:alert-circle-outline" class="text-sm" />
              {{ form.errors.password }}
            </p>
          </div>

          <!-- Forgot password link -->
          <div v-if="!showReset && !isSignUp" class="flex justify-end -mt-1">
            <button
              type="button"
              @click="toggleResetPassword"
              class="text-sm text-[#128c7e] hover:text-[#075e54] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            :class="[
              'w-full py-3 px-4 rounded-xl text-white font-semibold text-sm tracking-wide transition-all',
              'flex items-center justify-center gap-2',
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#128c7e] hover:bg-[#075e54] active:scale-[0.98] shadow-md shadow-[#128c7e]/25',
            ]"
          >
            <Icon v-if="loading" icon="mdi:loading" class="animate-spin text-lg" />
            {{ submitLabel }}
          </button>
        </form>

        <!-- Divider + Google -->
        <template v-if="!showReset">
          <div class="flex items-center gap-3 my-5">
            <div class="flex-1 h-px bg-gray-200" />
            <span class="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
            <div class="flex-1 h-px bg-gray-200" />
          </div>
          <GoogleAuth />
        </template>

        <!-- Toggle links -->
        <div class="mt-6 text-center">
          <button
            v-if="showReset"
            type="button"
            @click="toggleResetPassword"
            class="text-sm text-[#128c7e] hover:text-[#075e54] font-medium transition-colors inline-flex items-center gap-1"
          >
            <Icon icon="mdi:arrow-left" class="text-base" />
            Back to {{ isSignUp ? 'Sign Up' : 'Sign In' }}
          </button>

          <p v-else class="text-sm text-gray-500">
            {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
            <button
              type="button"
              @click="toggleAuthMode"
              class="text-[#128c7e] hover:text-[#075e54] font-semibold ml-1 transition-colors"
            >
              {{ isSignUp ? 'Sign In' : 'Sign Up' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
