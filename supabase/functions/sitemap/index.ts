import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://discoveryinvestimentos.com";

const languages = ["pt", "en", "es"];

// Static pages with their change frequency and priority
const staticPages = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "terrenos", changefreq: "monthly", priority: "0.8" },
  { path: "casas", changefreq: "monthly", priority: "0.8" },
  { path: "imoveis", changefreq: "weekly", priority: "0.8" },
  { path: "sobre", changefreq: "monthly", priority: "0.6" },
  { path: "contato", changefreq: "monthly", priority: "0.6" },
  { path: "blog", changefreq: "daily", priority: "0.7" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, language, updated_at, published_at")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching blog posts:", error);
    }

    const today = new Date().toISOString().split("T")[0];

    let urls = "";

    // Static pages for each language
    for (const lang of languages) {
      for (const page of staticPages) {
        const loc = page.path
          ? `${SITE_URL}/${lang}/${page.path}`
          : `${SITE_URL}/${lang}`;

        // Build alternate links for hreflang
        const alternates = languages
          .map((altLang) => {
            const altLoc = page.path
              ? `${SITE_URL}/${altLang}/${page.path}`
              : `${SITE_URL}/${altLang}`;
            return `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altLoc}" />`;
          })
          .join("\n");

        urls += `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${alternates}
  </url>\n`;
      }
    }

    // Blog post pages
    if (posts && posts.length > 0) {
      // Group posts by slug base (to find alternates)
      for (const post of posts) {
        const loc = `${SITE_URL}/${post.language}/blog/${post.slug}`;
        const lastmod = (post.updated_at || post.published_at || today).split("T")[0];

        // Find alternate language versions (same category posts created around same time)
        const alternates = languages
          .map((altLang) => {
            const altPost = posts.find(
              (p) => p.language === altLang && p.slug !== post.slug
            );
            // For blog posts, each language has its own slug
            const matchingPost = posts.find((p) => p.language === altLang);
            if (matchingPost) {
              return `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${SITE_URL}/${altLang}/blog/${matchingPost.slug}" />`;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        urls += `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
${alternates}
  </url>\n`;
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: corsHeaders,
    });
  }
});
