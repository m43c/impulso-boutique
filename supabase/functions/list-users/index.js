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

    const { data: profiles, error: listProfilesError } = await ctx.supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (listProfilesError) {
      console.error('Error al listar perfiles:', listProfilesError)
      return Response.json(
        {
          error: 'No se pudo obtener la lista de usuarios',
        },
        { status: 500 },
      )
    }

    try {
      const users = await Promise.all(
        profiles.map(async (p) => {
          const { data: authUser, error: getUserError } =
            await ctx.supabaseAdmin.auth.admin.getUserById(p.id)

          if (getUserError) {
            throw getUserError
          }

          return {
            id: p.id,
            full_name: p.full_name,
            role: p.role,
            is_active: p.is_active,
            created_at: p.created_at,
            updated_at: p.updated_at,
            email: authUser.user.email,
          }
        }),
      )

      return Response.json(
        {
          users,
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error al obtener los correos de los usuarios:', error)
      return Response.json(
        {
          error: 'No se pudo completar la lista de usuarios',
        },
        { status: 500 },
      )
    }
  }),
}
