import { supabase as supabaseSSR } from "@/integrations/supabase/client";
import { Language } from "@/i18n";

// Type definition for blog post from database
export interface BlogPost {
  id: string;
  slug: string;
  language: Language;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  image_url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all published posts for a specific language
export async function fetchBlogPosts(language: Language): Promise<BlogPost[]> {
  const { data, error } = await supabaseSSR
    .from("blog_posts")
    .select("*")
    .eq("language", language)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }

  return (data as unknown as BlogPost[]) || [];
}

// Fetch a single post by slug and language
export async function fetchBlogPostBySlug(
  slug: string,
  language: Language
): Promise<BlogPost | null> {
  const { data, error } = await supabaseSSR
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("language", language)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }

  return data as unknown as BlogPost | null;
}

// Fetch latest N posts for a specific language
export async function fetchLatestBlogPosts(
  language: Language,
  limit: number = 3
): Promise<BlogPost[]> {
  const { data, error } = await supabaseSSR
    .from("blog_posts")
    .select("*")
    .eq("language", language)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching latest blog posts:", error);
    return [];
  }

  return (data as unknown as BlogPost[]) || [];
}

// Fetch all slugs for SSG (used during build time)
export async function fetchAllBlogSlugs(): Promise<
  { slug: string; language: Language }[]
> {
  const { data, error } = await supabaseSSR
    .from("blog_posts")
    .select("slug, language")
    .not("published_at", "is", null);

  if (error) {
    console.error("Error fetching blog slugs:", error);
    return [];
  }

  return (data as unknown as { slug: string; language: Language }[]) || [];
}

// Helper to format date based on language
export function formatPostDate(
  dateString: string | null,
  language: Language
): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  const localeMap: Record<Language, string> = {
    pt: "pt-BR",
    en: "en-US",
    es: "es-ES",
  };

  return date.toLocaleDateString(localeMap[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper to calculate read time
export function calculateReadTime(
  content: string | null,
  language: Language
): string {
  if (!content) return "";

  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  const readTimeMap: Record<Language, string> = {
    pt: `${minutes} min de leitura`,
    en: `${minutes} min read`,
    es: `${minutes} min de lectura`,
  };

  return readTimeMap[language];
}
