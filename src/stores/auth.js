import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import router from '@/router'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)
  const profile = ref(null)
  const isLoadingAuth = ref(false)
  const isLoadingProfile = ref(false)

  let lastFetchedUserId = null
  let initializePromise = null
  let profileChannel = null

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

  function clear() {
    user.value = null
    session.value = null
    profile.value = null
    lastFetchedUserId = null
    unsubscribeFromProfileChanges()
  }

  async function forceLogoutInactive() {
    clear()

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error al cerrar la sesión:', error)
    }
  }

  function subscribeToProfileChanges(userId) {
    if (profileChannel) {
      return
    }

    profileChannel = supabase
      .channel(`profile-changes-${userId}`)
      .on(
        'postgres_changes',
        { event: 'update', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        async (payload) => {
          profile.value = payload.new

          if (!payload.new.is_active) {
            await forceLogoutInactive()
            toast.error('Tu cuenta fue desactivada. Contacta a un administrador')
            router.push({ name: 'login' })
          }
        },
      )
      .subscribe()
  }

  function unsubscribeFromProfileChanges() {
    if (profileChannel) {
      supabase.removeChannel(profileChannel)
      profileChannel = null
    }
  }

  async function fetchProfile(userId, { force = false } = {}) {
    if (!force && userId === lastFetchedUserId && profile.value) {
      return profile.value
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
      return data
    } catch (error) {
      console.error('Error al consultar el perfil:', error)

      profile.value = null
      lastFetchedUserId = null

      throw error
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

      const fetchedProfile = await fetchProfile(data.user.id)

      if (!fetchedProfile.is_active) {
        await forceLogoutInactive()

        const error = new Error('La cuenta está inactiva')
        error.code = 'ACCOUNT_INACTIVE'

        throw error
      } else {
        subscribeToProfileChanges(data.user.id)
      }

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
      clear()
      isLoadingAuth.value = false
    }
  }

  function initialize() {
    if (initializePromise) {
      return initializePromise
    }

    initializePromise = (async () => {
      isLoadingAuth.value = true

      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        user.value = data.session?.user ?? null
        session.value = data.session

        if (!data.session?.user) {
          return { status: 'unauthenticated' }
        }

        const userProfile = await fetchProfile(data.session.user.id)

        if (!userProfile.is_active) {
          await forceLogoutInactive()
          return { status: 'inactive' }
        } else {
          subscribeToProfileChanges(data.session.user.id)
        }

        return { status: 'authenticated' }
      } catch (error) {
        console.error('Error al inicializar la autenticación:', error)
        clear()
        return { status: 'error' }
      } finally {
        isLoadingAuth.value = false
      }
    })()

    supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUserId = newSession?.user?.id ?? null
      const currentUserId = user.value?.id ?? null

      if (!newSession?.user) {
        clear()
        return
      }

      if (newUserId !== currentUserId) {
        profile.value = null
        lastFetchedUserId = null
      }

      user.value = newSession.user
      session.value = newSession
    })

    return initializePromise
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
    clear,
    initialize,
    fetchProfile,
    forceLogoutInactive,
  }
})
