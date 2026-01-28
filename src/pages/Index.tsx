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
  return (
    <Layout>
      <HeroSection
        title="Discovery Investments: O Caminho Seguro para Dolarizar seu Patrimônio."
        description="Proteja seu capital contra a inflação investindo na moeda mais forte do mundo através do mercado imobiliário dos EUA. A Discovery Investments, estabelecida em agosto de 2025, oferece um sistema completo de house flipping para brasileiros que buscam rentabilidade real e segurança jurídica."
        ctaText="Dolarize seu Capital Agora"
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
