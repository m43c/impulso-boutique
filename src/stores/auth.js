import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const profile = ref(null)
  const isLoadingAuth = ref(false)
  const isLoadingProfile = ref(false)

  let lastFetchedUserId = null

  const isAuthenticated = computed(() => !!session.value)
  const role = computed(() => profile.value?.role ?? null)
  const initials = computed(() => {
    const parts = profile.value?.full_name?.trim().split(/\s+/) ?? []

    if (!parts.length) {
      return '??'
    }

    const first = parts[0][0]
    const paternal = parts.length > 1 ? (parts.at(-2)?.[0] ?? parts.at(-1)[0]) : ''

    return (first + paternal).toUpperCase()
  })

  async function fetchProfile(userId) {
    if (userId === lastFetchedUserId) {
      return
    }

    lastFetchedUserId = userId
    isLoadingProfile.value = true

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, is_active, created_at, updated_at')
        .eq('id', userId)
        .single()

      if (error) {
        throw error
      }

      profile.value = data
    } catch (error) {
      console.error('Error al consultar el perfil:', error)
      profile.value = null
      lastFetchedUserId = null
    } finally {
      isLoadingProfile.value = false
    }
  }

  async function login(credentials) {
    isLoadingAuth.value = true

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

      await fetchProfile(data.user.id)

      return data
    } finally {
      isLoadingAuth.value = false
    }
  }

  async function logout() {
    isLoadingAuth.value = true

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }
    } finally {
      user.value = null
      session.value = null
      profile.value = null
      lastFetchedUserId = null
      isLoadingAuth.value = false
    }
  }

  function initialize() {
    supabase.auth.onAuthStateChange((event, newSession) => {
      user.value = newSession?.user ?? null
      session.value = newSession

      if (!newSession?.user) {
        profile.value = null
        lastFetchedUserId = null
        return
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        fetchProfile(newSession.user.id)
      }
    })
  }

  return {
    user,
    session,
    profile,
    isLoadingAuth,
    isLoadingProfile,
    isAuthenticated,
    role,
    initials,
    login,
    logout,
    initialize,
  }
})
