import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUsersStore = defineStore('users', () => {
  const isCreating = ref(false)
  const isFetching = ref(false)

  const users = ref([])

  async function createUser(userData) {
    isCreating.value = true

    try {
      const { data, error } = await supabase.functions.invoke('create-user', { body: userData })

      if (error) {
        throw error
      }

      return data
    } finally {
      isCreating.value = false
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

  return { isCreating, isFetching, users, createUser, fetchUsers, clear }
})
