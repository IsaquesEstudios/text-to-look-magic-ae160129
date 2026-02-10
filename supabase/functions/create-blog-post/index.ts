import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { title, excerpt, content, category, image_url, author, publish_now } = await req.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "title and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate PT slug
    const ptSlug = slugify(title);

    // Translate to EN and ES using Lovable AI
    const translationPrompt = `You are a professional translator. Translate the following blog post from Portuguese (Brazil) to English and Spanish.

Return a JSON object with this exact structure (no markdown, no code blocks, just pure JSON):
{
  "en": {
    "title": "translated title in English",
    "slug": "seo-friendly-url-slug-in-english",
    "excerpt": "translated excerpt in English",
    "content": "translated content in English (preserve all HTML tags exactly)",
    "category": "translated category in English"
  },
  "es": {
    "title": "translated title in Spanish",
    "slug": "seo-friendly-url-slug-in-spanish",
    "excerpt": "translated excerpt in Spanish",
    "content": "translated content in Spanish (preserve all HTML tags exactly)",
    "category": "translated category in Spanish"
  }
}

IMPORTANT:
- The slug must be URL-friendly: lowercase, no accents, words separated by hyphens, no special characters
- Preserve ALL HTML tags and structure in the content
- Translate naturally, not literally

Here is the post to translate:

Title: ${title}
Excerpt: ${excerpt || ""}
Category: ${category || ""}
Content: ${content}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a professional translator. Return only valid JSON, no markdown formatting." },
          { role: "user", content: translationPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI translation error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON, handling potential markdown code blocks
    let translations;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      translations = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("Failed to parse translation response");
    }

    const publishedAt = publish_now ? new Date().toISOString() : null;

    // Insert all 3 language versions
    const posts = [
      {
        slug: ptSlug,
        language: "pt",
        title,
        excerpt: excerpt || null,
        content,
        category: category || null,
        image_url: image_url || null,
        author: author || null,
        published_at: publishedAt,
      },
      {
        slug: translations.en.slug || slugify(translations.en.title),
        language: "en",
        title: translations.en.title,
        excerpt: translations.en.excerpt || null,
        content: translations.en.content,
        category: translations.en.category || category || null,
        image_url: image_url || null,
        author: author || null,
        published_at: publishedAt,
      },
      {
        slug: translations.es.slug || slugify(translations.es.title),
        language: "es",
        title: translations.es.title,
        excerpt: translations.es.excerpt || null,
        content: translations.es.content,
        category: translations.es.category || category || null,
        image_url: image_url || null,
        author: author || null,
        published_at: publishedAt,
      },
    ];

    const { data, error } = await supabase.from("blog_posts").insert(posts).select();

    if (error) {
      console.error("DB insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, posts: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("create-blog-post error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
