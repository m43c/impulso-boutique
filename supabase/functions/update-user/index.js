import { withSupabase } from 'npm:@supabase/server@^1'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const { data: profile, error: getProfileError } = await ctx.supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', ctx.userClaims.id)
      .single()

    if (getProfileError) {
      console.error('Error al consultar el perfil:', getProfileError)
      return Response.json({ error: 'No se pudo consultar el perfil' }, { status: 500 })
    }

    if (profile.role !== 'admin' || !profile.is_active) {
      return Response.json({ error: 'Usuario no autorizado' }, { status: 403 })
    }

    const { user_id, email, password, full_name, role, is_active } = await req.json()

    if (!user_id) {
      return Response.json({ error: 'El ID del usuario es requerido' }, { status: 400 })
    }

    const authUpdates = {}

    if (email !== undefined) {
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

        return Response.json({ error: authUpdateError.message }, { status: 400 })
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
      return Response.json({ error: 'No se pudo actualizar el perfil' }, { status: 500 })
    }

    return Response.json(
      {
        message: 'Usuario actualizado correctamente: ',
        user: updatedUser,
      },
      { status: 200 },
    )
  }),
}
