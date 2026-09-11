import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUsersStore = defineStore('users', () => {
  const isCreating = ref(false)

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

  return { isCreating, createUser }
})
