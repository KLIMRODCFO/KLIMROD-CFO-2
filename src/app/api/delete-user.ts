import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { userId } = await req.json();

  // Protege tu clave, usa variables de entorno en producción
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Elimina el usuario de Auth
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
