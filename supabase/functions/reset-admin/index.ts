import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // List and delete all existing users
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  for (const user of users) {
    await supabaseAdmin.auth.admin.deleteUser(user.id);
  }

  // Create new admin
  const password = "Dsc@2026#xK9m";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@discoveryinvestimentos.com",
    password,
    email_confirm: true,
    user_metadata: { full_name: "Admin Discovery", preferred_language: "pt" },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ success: true, user_id: data.user.id, email: data.user.email, password }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
