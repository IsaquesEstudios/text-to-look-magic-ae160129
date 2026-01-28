import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Calendar, Tag, Search } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageFromPath } from "@/i18n";
import { CTASection } from "@/components/sections/CTASection";
import cityscape from "@/assets/cityscape.jpg";

const Blog = () => {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.blog.posts.map((post, index) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden border border-discovery-green/10 shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={cityscape}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-discovery-green text-primary-foreground text-xs font-semibold rounded-full">
                      <Tag size={12} />
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-discovery-text/60 text-sm mb-3">
                    <Calendar size={14} />
                    <span>{post.date}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-discovery-dark mb-3 group-hover:text-discovery-green transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  
                  <p className="text-discovery-text text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <Link
                    to={`/${currentLang}/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-discovery-green font-medium text-sm hover:gap-3 transition-all"
                  >
                    {t.blog.readMore}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
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
