import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageFromPath } from "@/i18n";
import cityscape from "@/assets/cityscape.jpg";

export function BlogPostsSection() {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const currentLang = getLanguageFromPath(location.pathname);

  return (
    <section className="section-light py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-discovery-dark mb-4">
            {t.blog.latestPosts}
          </h2>
          <p className="text-lg text-discovery-text max-w-2xl mx-auto">
            {t.blog.latestPostsSubtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.blog.posts.slice(0, 3).map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden border border-discovery-green/10 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div className="relative h-48 overflow-hidden">
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
                
                <h3 className="text-lg font-semibold text-discovery-dark mb-3 group-hover:text-discovery-green transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to={`/${currentLang}/blog`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-discovery-green text-primary-foreground font-medium rounded-full hover:bg-discovery-green/90 transition-colors"
          >
            {t.common.readMore}
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
