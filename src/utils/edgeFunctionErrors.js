import { FunctionsFetchError } from '@supabase/supabase-js'

export async function getEdgeFunctionErrorMessage(error, fallback) {
  if (error instanceof FunctionsFetchError) {
    return 'Sin conexión a internet. Inténtalo de nuevo'
  }

  if (error?.context instanceof Response) {
    try {
      const body = await error.context.clone().json()

      if (body?.error) {
        return body.error
      }
    } catch {
      // Responde body is not valid JSON, continue to fallback message
    }
  }

  return fallback
}
