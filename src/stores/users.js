import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUsersStore = defineStore('users', () => {
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isFetching = ref(false)

  const users = ref([])

  async function createUser(payload) {
    isCreating.value = true

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: payload,
      })

      if (error) {
        throw error
      }

      return data
    } finally {
      isCreating.value = false
    }
  }

  async function updateUser(payload) {
    isUpdating.value = true

    try {
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: payload,
      })

      if (error) {
        throw error
      }

      return data
    } finally {
      isUpdating.value = false
    }
  }

  async function fetchUsers() {
    isFetching.value = true

    try {
      const { data, error } = await supabase.functions.invoke('list-users')

      if (error) {
        throw error
      }

      users.value = data.users
      return data
    } catch (error) {
      users.value = []
      throw error
    } finally {
      isFetching.value = false
    }
  }

  function clear() {
    users.value = []
  }

  return {
    isCreating,
    isUpdating,
    isFetching,
    users,
    createUser,
    updateUser,
    fetchUsers,
    clear,
  }
})
