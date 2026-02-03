import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageFromPath } from "@/i18n";
import { CTASection } from "@/components/sections/CTASection";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogPosts, formatPostDate, BlogPost } from "@/lib/blog";
import { Skeleton } from "@/components/ui/skeleton";
import cityscape from "@/assets/cityscape.jpg";

const Blog = () => {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blogPosts", currentLang],
    queryFn: () => fetchBlogPosts(currentLang),
  });

  // Fallback to translation posts if no database posts
  const displayPosts: (BlogPost | typeof t.blog.posts[0])[] =
    posts.length > 0 ? posts : t.blog.posts;

  const isDbPost = (post: BlogPost | typeof t.blog.posts[0]): post is BlogPost => {
    return "id" in post && "published_at" in post;
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="section-graphite pt-32 pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              {t.blog.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.blog.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="section-light py-24">
        <div className="container mx-auto px-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-discovery-green/10 shadow-sm">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-6 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayPosts.map((post, index) => {
                const postSlug = post.slug;
                const postTitle = post.title;
                const postCategory = post.category || "";
                const postExcerpt = post.excerpt || "";
                const postDate = isDbPost(post)
                  ? formatPostDate(post.published_at, currentLang)
                  : post.date;
                const postImage = isDbPost(post) && post.image_url ? post.image_url : cityscape;

                return (
                  <motion.article
                    key={postSlug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl overflow-hidden border border-discovery-green/10 shadow-sm hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={postImage}
                        alt={postTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-discovery-green text-primary-foreground text-xs font-semibold rounded-full">
                          <Tag size={12} />
                          {postCategory}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-discovery-text/60 text-sm mb-3">
                        <Calendar size={14} />
                        <span>{postDate}</span>
                      </div>

                      <h2 className="text-xl font-semibold text-discovery-dark mb-3 group-hover:text-discovery-green transition-colors line-clamp-2">
                        {postTitle}
                      </h2>

                      <p className="text-discovery-text text-sm mb-4 line-clamp-3">
                        {postExcerpt}
                      </p>

                      <Link
                        to={`/${currentLang}/blog/${postSlug}`}
                        className="inline-flex items-center gap-2 text-discovery-green font-medium text-sm hover:gap-3 transition-all"
                      >
                        {t.blog.readMore}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CTASection
        title={t.home.cta.title}
        description={t.home.cta.description}
        ctaText={t.home.cta.button}
      />
    </Layout>
  );
};

export default Blog;
