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
      return Response.json(
        {
          error: 'No tienes permisos para realizar esta acción',
        },
        { status: 403 },
      )
    }

    const { email, password, full_name, role } = await req.json()

    const { data: newUser, error: createUserError } = await ctx.supabaseAdmin.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true,
      },
    )

    if (createUserError) {
      console.error('Error al crear usuario:', createUserError)
      return Response.json(
        {
          error: createUserError.message,
        },
        { status: 400 },
      )
    }

    const { error: createProfileError } = await ctx.supabaseAdmin.from('profiles').insert({
      id: newUser.user.id,
      full_name,
      role,
    })

    if (createProfileError) {
      console.error('Error al crear el perfil:', createProfileError)

      const { error: deleteUserError } = await ctx.supabaseAdmin.auth.admin.deleteUser(
        newUser.user.id,
      )

      if (deleteUserError) {
        console.error('Error al revertir la creación del usuario:', deleteUserError)
      }

      return Response.json(
        {
          error: 'No se pudo completar la creación usuario',
        },
        { status: 500 },
      )
    }

    return Response.json(
      {
        message: 'Usuario creado correctamente',
        user: newUser.user,
      },
      { status: 201 },
    )
  }),
}
