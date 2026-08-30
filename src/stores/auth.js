import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!session.value)

  async function login(credentials) {
    isLoading.value = true

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw error
      }

      user.value = data.user
      session.value = data.session

      return data
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    } finally {
      user.value = null
      session.value = null
      isLoading.value = false
    }
  }

  function initialize() {
    supabase.auth.getSession().then(({ data }) => {
      user.value = data.session?.user ?? null
      session.value = data.session
    })

    supabase.auth.onAuthStateChange((_event, newSession) => {
      user.value = newSession?.user ?? null
      session.value = newSession
    })
  }

  return { user, session, isLoading, isAuthenticated, login, logout, initialize }
})
