import { useDark, useToggle } from '@vueuse/core'

export const isDark = useDark({
  storageKey: 'impulso-boutique-theme',
  initialValue: 'dark',
  valueDark: 'dark',
  valueLight: '',
})

export const toggleTheme = useToggle(isDark)
