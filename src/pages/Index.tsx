import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/sections/HeroSection";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { ProfitabilitySection } from "@/components/sections/ProfitabilitySection";
import { ModalitiesSection } from "@/components/sections/ModalitiesSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { InstitutionalSection } from "@/components/sections/InstitutionalSection";
import { CTASection } from "@/components/sections/CTASection";
import heroHouse from "@/assets/hero-house.jpg";

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <HeroSection
        title={t('hero.index.title')}
        description={t('hero.index.description')}
        ctaText={t('cta.dollarizeNow')}
        backgroundImage={heroHouse}
      />
      <ComparisonSection />
      <ProfitabilitySection />
      <ModalitiesSection />
      <ProcessSection />
      <InstitutionalSection />
      <CTASection />
    </Layout>
  );
};

export default Index;
