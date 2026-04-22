import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller || !caller.email) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { password } = await req.json();
    if (!password || typeof password !== "string") {
      return new Response(JSON.stringify({ error: "Senha é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify password by attempting sign-in with a fresh client (no shared session)
    const verifyClient = createClient(supabaseUrl, anonKey);
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: caller.email,
      password,
    });
    if (signInError) {
      return new Response(JSON.stringify({ error: "Senha incorreta" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const user_id = caller.id;

    // Block deletion if user has active investments (shares) — require admin to unlink first
    const { data: activeShares } = await adminClient
      .from("shares")
      .select("id")
      .eq("user_id", user_id)
      .limit(1);
    if (activeShares && activeShares.length > 0) {
      return new Response(JSON.stringify({
        error: "Você possui investimentos ativos. Entre em contato com o suporte antes de excluir sua conta.",
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up related data (order matters for FK constraints)
    await adminClient.from("auction_deposits").delete().eq("user_id", user_id);
    await adminClient.from("credit_transactions").delete().eq("user_id", user_id);
    await adminClient.from("contracts").delete().eq("user_id", user_id);
    await adminClient.from("user_payment_images").delete().eq("user_id", user_id);
    await adminClient.from("property_messages").delete().eq("user_id", user_id);
    await adminClient.from("property_message_reads").delete().eq("user_id", user_id);
    await adminClient.from("property_expense_reads").delete().eq("user_id", user_id);
    await adminClient.from("auction_reads").delete().eq("user_id", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Delete from auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
