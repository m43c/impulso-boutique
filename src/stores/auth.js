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

      session.value = data.session
      user.value = data.user

      return data
    } finally {
      isLoading.value = false
    }
  }

  function initialize() {
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session
      user.value = data.session?.user ?? null
    })

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  return { user, session, isLoading, isAuthenticated, login, initialize }
})
