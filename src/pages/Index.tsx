import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { ProfitabilitySection } from "@/components/sections/ProfitabilitySection";
import { ModalitiesSection } from "@/components/sections/ModalitiesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { InstitutionalSection } from "@/components/sections/InstitutionalSection";
import { PropertiesSection } from "@/components/sections/PropertiesSection";
import { BlogPostsSection } from "@/components/sections/BlogPostsSection";
import { CTASection } from "@/components/sections/CTASection";
import { useTranslation } from "@/hooks/useTranslation";
import heroCover from "@/assets/hero-cover.webp";

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <HeroSection
        title={t.home.hero.title}
        description={t.home.hero.description}
        ctaText={t.home.hero.cta}
        backgroundImage={heroCover}
      />
      <ComparisonSection />
      <ProfitabilitySection />
      <ModalitiesSection />
      <ProcessSection />
      <InstitutionalSection />
      <PropertiesSection />
      <BlogPostsSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
