import { withSupabase } from 'npm:@supabase/server@^1'
import { isAuthApiError } from 'npm:@supabase/supabase-js@^2'

const authErrorMessages = {
  weak_password: 'La contraseña debe tener al menos 6 caracteres',
  validation_failed: 'Los datos ingresados no son válidos',
}
const fallbackMessage = 'No se pudo completar la operación'

function getAdminAuthErrorMessage(error) {
  if (!error || !isAuthApiError(error)) {
    return fallbackMessage
  }

  return authErrorMessages[error.code] ?? fallbackMessage
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { data: profile, error: getProfileError } = await ctx.supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', ctx.userClaims.id)
      .single()

    if (getProfileError) {
      console.error('Error al consultar el perfil:', getProfileError)
      return Response.json(
        {
          error: 'No se pudo consultar el perfil',
        },
        { status: 500 },
      )
    }

    if (profile.role !== 'admin' || !profile.is_active) {
      return Response.json(
        {
          error: 'No tienes permisos para realizar esta acción',
        },
        { status: 403 },
      )
    }

    const { user_id, email, password, full_name, role, is_active } = await req.json()

    if (!user_id) {
      return Response.json(
        {
          error: 'El ID del usuario es requerido',
        },
        { status: 400 },
      )
    }

    const authUpdates = {}

    if (email !== undefined) {
      const { data: existingUsers, error: listUsersError } =
        await ctx.supabaseAdmin.auth.admin.listUsers()

      if (listUsersError) {
        console.error('Error al verificar el correo electrónico:', listUsersError)
        return Response.json(
          {
            error: 'No se pudo verificar el correo electrónico',
          },
          { status: 500 },
        )
      }

      const emailTaken = existingUsers.users.some(
        (u) => u.id !== user_id && u.email?.toLowerCase() === email.toLowerCase(),
      )

      if (emailTaken) {
        return Response.json(
          { error: 'Ya existe una cuenta con este correo electrónico' },
          { status: 400 },
        )
      }

      authUpdates.email = email
    }

    if (password) {
      authUpdates.password = password
    }

    let updatedUser = null

    if (Object.keys(authUpdates).length > 0) {
      const { data, error: authUpdateError } = await ctx.supabaseAdmin.auth.admin.updateUserById(
        user_id,
        authUpdates,
      )

      if (authUpdateError) {
        console.error('Error al actualizar usuario:', authUpdateError)

        return Response.json(
          {
            error: getAdminAuthErrorMessage(authUpdateError),
          },
          { status: 400 },
        )
      }

      updatedUser = data.user
    }

    const { error: updateProfileError } = await ctx.supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        role,
        is_active,
      })
      .eq('id', user_id)

    if (updateProfileError) {
      console.error('Error al actualizar el perfil:', updateProfileError)
      return Response.json(
        {
          error: 'No se pudo actualizar el perfil',
        },
        { status: 500 },
      )
    }

    return Response.json(
      {
        message: 'Usuario actualizado correctamente:',
        user: updatedUser,
      },
      { status: 200 },
    )
  }),
}
