import { createRouter, createWebHistory } from 'vue-router'
import Posts from '../Posts/Posts.vue'
import Profile from '../Profile/Profile.vue'
import AuthPage from '../Auth/AuthPage.vue'
import UserProfile from '../UserProfile.vue'
 import ChatPage from '../Chats/ChatPage.vue'
//import ChatPage from '../Chats/ChatPage_Components/ChatPage.vue'
// import ChatPage from '../Chats/Chat_Component/ChatPage.vue'
import { supabase } from '../lib/supabaseClient'

const routes = [
  {
    path: '/',
    component: Posts,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/profile',
    component: Profile,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/profile/:user_id',
    component: UserProfile,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/auth',
    component: AuthPage,
    meta: { requiresGuest: true },
    props: true
  },
  {
    path: '/chat',
    component: ChatPage,
    meta: { requiresAuth: true },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/auth')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router